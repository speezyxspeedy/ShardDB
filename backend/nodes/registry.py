"""
Node Registry for NodeFlow.
Defines metadata, ports, configuration schemas, validation, and execution logic for all node types.
All nodes run locally with zero paid APIs, zero external dependencies, and ZERO eval()/exec().
"""

import ast
import base64
from datetime import datetime, timezone
import json
import math
import operator as py_operator
import re
import time
from typing import Any, Dict, List, Optional, Tuple


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# Pre-packaged mock datasets for mock_api node
MOCK_DATASETS = {
    "users": [
        {"id": 101, "name": "Elena Rostova", "email": "elena@acme.corp", "role": "Lead Architect", "tier": "Enterprise", "score": 92},
        {"id": 102, "name": "Marcus Chen", "email": "mchen@startup.io", "role": "DevOps Engineer", "tier": "Pro", "score": 78},
        {"id": 103, "name": "Amina Diallo", "email": "amina@fintech.net", "role": "Product Manager", "tier": "Enterprise", "score": 95},
        {"id": 104, "name": "Lucas Silva", "email": "lsilva@edu.br", "role": "Student", "tier": "Free", "score": 45},
    ],
    "orders": [
        {"order_id": "ORD-94821", "customer": "Elena Rostova", "amount": 1490.00, "status": "paid", "currency": "USD", "items": 3},
        {"order_id": "ORD-94822", "customer": "Marcus Chen", "amount": 290.00, "status": "pending", "currency": "USD", "items": 1},
        {"order_id": "ORD-94823", "customer": "Amina Diallo", "amount": 4200.00, "status": "paid", "currency": "USD", "items": 8},
        {"order_id": "ORD-94824", "customer": "Lucas Silva", "amount": 49.00, "status": "refunded", "currency": "USD", "items": 1},
    ],
    "weather": {
        "city": "San Francisco",
        "temperature_c": 18.5,
        "temperature_f": 65.3,
        "condition": "Partly Cloudy",
        "humidity": 68,
        "wind_kmh": 14.2
    },
    "stock_quotes": [
        {"symbol": "NVDA", "price": 142.50, "change_pct": 3.8, "volume": 42000000},
        {"symbol": "GOOGL", "price": 182.20, "change_pct": 1.4, "volume": 18500000},
        {"symbol": "AAPL", "price": 234.10, "change_pct": -0.6, "volume": 25000000},
        {"symbol": "MSFT", "price": 448.90, "change_pct": 2.1, "volume": 16000000},
    ]
}

# Lexicon for local zero-dependency sentiment analysis
SENTIMENT_LEXICON = {
    "good": 1.5, "great": 2.5, "excellent": 3.0, "amazing": 3.0, "awesome": 3.0,
    "love": 3.0, "best": 2.5, "happy": 2.0, "helpful": 2.0, "fast": 1.5,
    "perfect": 3.0, "success": 2.0, "successful": 2.5, "win": 2.0, "winner": 2.0,
    "clean": 1.0, "neat": 1.0, "reliable": 2.0, "brilliant": 2.5, "fantastic": 3.0,
    "positive": 2.0, "glad": 1.5, "enjoy": 2.0, "wonderful": 3.0, "smooth": 1.5,
    "superb": 3.0, "flawless": 3.0, "outstanding": 3.0, "delight": 2.5, "delighted": 2.5,
    "liked": 1.5, "likes": 1.5, "friendly": 2.0, "easy": 1.5, "valuable": 2.0,
    "solved": 2.0, "improved": 1.5, "impressive": 2.5, "thank": 1.5, "thanks": 1.5,
    "bad": -1.5, "terrible": -3.0, "awful": -3.0, "horrible": -3.0, "worst": -3.0,
    "hate": -3.0, "poor": -1.5, "slow": -1.5, "broken": -2.5, "bug": -2.0,
    "bugs": -2.0, "error": -2.0, "failed": -2.5, "failure": -2.5, "crash": -2.5,
    "problem": -1.5, "issues": -1.5, "ugly": -2.0, "hard": -1.0, "difficult": -1.5,
    "disappointed": -2.5, "disaster": -3.0, "frustrated": -2.5, "unhappy": -2.0,
    "annoying": -2.0, "useless": -3.0, "worthless": -3.0, "negative": -2.0,
    "delay": -1.0, "cancel": -1.5, "cancelled": -1.5, "stuck": -1.5, "confusing": -1.5,
    "loss": -2.0, "lost": -2.0, "garbage": -3.0, "trash": -3.0, "wrong": -1.5,
}


def _resolve_template_string(template: str, context: Dict[str, Any]) -> str:
    """Replaces {{variable}} or {{node.field}} deterministically from context."""
    if not isinstance(template, str):
        return str(template)

    def replacer(match):
        raw_key = match.group(1).strip()
        
        # 1. Direct key match in context
        if raw_key in context:
            val = context[raw_key]
            return json.dumps(val) if isinstance(val, (dict, list)) else str(val)
        
        # 2. Nested dot notation (e.g. data.name)
        parts = raw_key.split(".")
        cur = context
        found = True
        for p in parts:
            if isinstance(cur, dict) and p in cur:
                cur = cur[p]
            elif isinstance(cur, list) and p.isdigit():
                idx = int(p)
                cur = cur[idx] if idx < len(cur) else None
            else:
                found = False
                break
        if found and cur is not None:
            return json.dumps(cur) if isinstance(cur, (dict, list)) else str(cur)

        # 3. Search in node_results if context has it
        if "node_results" in context and isinstance(context["node_results"], dict):
            for nid, nres in context["node_results"].items():
                out = nres.get("output")
                if isinstance(out, dict) and raw_key in out:
                    val = out[raw_key]
                    return json.dumps(val) if isinstance(val, (dict, list)) else str(val)

        return match.group(0)

    pattern = re.compile(r"\{\{([^}]+)\}\}")
    return pattern.sub(replacer, template)


# -------------------------------------------------------------
# 1. MANUAL TRIGGER NODE
# Starts workflow when Run clicked. Generates runtime ISO-8601 timestamp.
# -------------------------------------------------------------
def execute_manual_trigger(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    raw_payload = node_data.get("payload", "{}")
    if isinstance(raw_payload, str):
        try:
            payload = json.loads(raw_payload) if raw_payload.strip() else {}
        except Exception:
            payload = {"raw_text": raw_payload}
    else:
        payload = raw_payload or {}

    if "trigger_payload" in context and isinstance(context["trigger_payload"], dict):
        payload.update(context["trigger_payload"])

    now_iso = utc_now_iso()
    return {
        "trigger": "manual",
        "timestamp": now_iso,
        "event": "manual_trigger",
        "payload": payload
    }, None


# -------------------------------------------------------------
# 2. TEXT INPUT NODE
# Configuration: text field, optional variable name, required-field validation.
# -------------------------------------------------------------
def execute_text_input(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    text = node_data.get("text", "")
    var_name = node_data.get("variable_name", "text").strip() or "text"
    is_required = node_data.get("required", False)

    # Upstream data chaining if available
    if "input" in inputs and inputs["input"] is not None:
        upstream = inputs["input"]
        upstream_text = ""
        if isinstance(upstream, dict):
            if "text" in upstream:
                upstream_text = str(upstream["text"])
            elif "transformed_text" in upstream:
                upstream_text = str(upstream["transformed_text"])
            elif "value" in upstream and isinstance(upstream["value"], str):
                upstream_text = str(upstream["value"])
        elif isinstance(upstream, str):
            upstream_text = upstream

        if "{{input}}" in text:
            text = text.replace("{{input}}", upstream_text)
        elif upstream_text and not text.strip():
            text = upstream_text

    # Required validation
    if is_required and not text.strip():
        raise ValueError("Text Input validation error: Configured field is marked as required, but contains no text.")

    return {
        "text": text,
        "variable_name": var_name,
        "value": text,
        "length": len(text)
    }, None


# -------------------------------------------------------------
# 3. CONDITION NODE
# Configuration: input variable or value, operator: equals, not equals, contains,
# greater than, less than, is empty (plus is_not_empty, greater_equal, less_equal).
# Routes execution through matching true or false output.
# Unsupported comparisons return a clear validation error.
# -------------------------------------------------------------
SUPPORTED_OPERATORS = {
    "equals", "not_equals", "greater_than", "greater_equal",
    "less_than", "less_equal", "contains", "not_contains",
    "is_empty", "is_not_empty", "regex_match"
}

def execute_condition(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    operator = node_data.get("operator", "equals")
    if operator not in SUPPORTED_OPERATORS:
        raise ValueError(
            f"Unsupported condition operator '{operator}'. "
            f"Supported operators are: {', '.join(sorted(SUPPORTED_OPERATORS))}."
        )

    target_value = node_data.get("target_value", "")
    data_type = node_data.get("data_type", "string")

    # Resolve value to check
    val = None
    if "input" in inputs and inputs["input"] is not None:
        upstream = inputs["input"]
        field_path = node_data.get("field_path", "").strip()
        if field_path and isinstance(upstream, dict):
            cur = upstream
            for part in field_path.split("."):
                if isinstance(cur, dict) and part in cur:
                    cur = cur[part]
                else:
                    cur = None
                    break
            val = cur
        elif isinstance(upstream, dict):
            if "value" in upstream:
                val = upstream["value"]
            elif "text" in upstream:
                val = upstream["text"]
            elif "transformed_text" in upstream:
                val = upstream["transformed_text"]
            elif "output" in upstream:
                val = upstream["output"]
            else:
                val = upstream
        else:
            val = upstream
    else:
        val = node_data.get("source_value", "")

    # Type casting
    def cast_val(v, t):
        if v is None:
            return "" if t == "string" else 0
        if t == "number":
            try:
                return float(v)
            except Exception:
                raise ValueError(f"Condition comparison error: Cannot convert '{v}' to number.")
        elif t == "boolean":
            return str(v).lower() in ("true", "1", "yes")
        return str(v)

    if operator in ("greater_than", "greater_equal", "less_than", "less_equal"):
        # Numeric comparison preferred
        try:
            left = float(val) if val is not None and str(val).strip() != "" else 0.0
            right = float(target_value) if target_value is not None and str(target_value).strip() != "" else 0.0
        except ValueError:
            left = str(val or "")
            right = str(target_value or "")
    elif operator in ("is_empty", "is_not_empty"):
        left = val
        right = None
    else:
        left = cast_val(val, data_type)
        right = cast_val(target_value, data_type)

    result = False
    if operator == "equals":
        result = (left == right)
    elif operator == "not_equals":
        result = (left != right)
    elif operator == "greater_than":
        result = (left > right)
    elif operator == "greater_equal":
        result = (left >= right)
    elif operator == "less_than":
        result = (left < right)
    elif operator == "less_equal":
        result = (left <= right)
    elif operator == "contains":
        result = str(right).lower() in str(left).lower()
    elif operator == "not_contains":
        result = str(right).lower() not in str(left).lower()
    elif operator == "is_empty":
        result = left in ("", [], {}, None, 0)
    elif operator == "is_not_empty":
        result = left not in ("", [], {}, None, 0)
    elif operator == "regex_match":
        try:
            result = bool(re.search(str(right), str(left)))
        except Exception as e:
            raise ValueError(f"Invalid regex pattern '{right}': {str(e)}")

    branch = "true" if result else "false"
    return {
        "condition_met": result,
        "branch": branch,
        "evaluated_value": left,
        "compared_against": right,
        "operator": operator,
        "passthrough": inputs.get("input")
    }, branch


# -------------------------------------------------------------
# 4. TEXT TRANSFORM NODE
# Operations: Uppercase, Lowercase, Trim whitespace, Replace substring, Split into lines
# Validates configuration before execution.
# -------------------------------------------------------------
VALID_TEXT_OPERATIONS = {
    "uppercase", "lowercase", "trim", "replace", "split_lines",
    "capitalize", "reverse", "slugify", "base64_encode", "base64_decode", "word_count"
}

def execute_text_transform(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    operation = node_data.get("operation", "uppercase").strip().lower()
    if operation not in VALID_TEXT_OPERATIONS:
        raise ValueError(
            f"Invalid text transform operation '{operation}'. "
            f"Valid operations are: {', '.join(sorted(VALID_TEXT_OPERATIONS))}."
        )

    # Extract source text
    text = ""
    if "input" in inputs and inputs["input"] is not None:
        upstream = inputs["input"]
        if isinstance(upstream, dict):
            text = str(
                upstream.get("text") or upstream.get("transformed_text") or
                upstream.get("value") or upstream.get("output") or
                upstream.get("data") or json.dumps(upstream)
            )
        else:
            text = str(upstream)
    else:
        text = str(node_data.get("fallback_text", node_data.get("text", "")))

    result: Any = text

    if operation == "uppercase":
        result = text.upper()
    elif operation == "lowercase":
        result = text.lower()
    elif operation == "trim":
        result = text.strip()
    elif operation == "replace":
        find_text = node_data.get("find_text", "")
        replace_with = node_data.get("replace_with", "")
        if find_text is None:
            raise ValueError("Replace operation requires 'find_text' configuration.")
        result = text.replace(find_text, replace_with)
    elif operation == "split_lines":
        lines = text.splitlines()
        return {
            "transformed_text": "\n".join(lines),
            "lines": lines,
            "line_count": len(lines),
            "operation": "split_lines",
            "original_text": text
        }, None
    elif operation == "capitalize":
        result = text.title()
    elif operation == "reverse":
        result = text[::-1]
    elif operation == "slugify":
        s = re.sub(r"[^\w\s-]", "", text.lower()).strip()
        result = re.sub(r"[-\s]+", "-", s)
    elif operation == "base64_encode":
        result = base64.b64encode(text.encode("utf-8")).decode("utf-8")
    elif operation == "base64_decode":
        try:
            result = base64.b64decode(text.encode("utf-8")).decode("utf-8")
        except Exception:
            raise ValueError("Invalid Base64 input string for decoding.")
    elif operation == "word_count":
        words = text.split()
        return {
            "transformed_text": str(len(words)),
            "word_count": len(words),
            "char_count": len(text),
            "original_text": text
        }, None

    return {
        "transformed_text": result,
        "operation": operation,
        "original_text": text,
        "length": len(result) if isinstance(result, str) else 0
    }, None


# -------------------------------------------------------------
# 5. DELAY NODE
# Configurable delay within safe maximum: capped strictly at 5.0 seconds (5000ms).
# -------------------------------------------------------------
MAX_SAFE_DELAY_SECONDS = 5.0

def execute_delay(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    raw_delay = node_data.get("delay_seconds")
    if raw_delay is None:
        raw_delay = float(node_data.get("delay_ms", 300)) / 1000.0
    else:
        raw_delay = float(raw_delay)

    if raw_delay < 0:
        raw_delay = 0.0

    # Strict safe limit enforcement (5 seconds max)
    if raw_delay > MAX_SAFE_DELAY_SECONDS:
        capped_delay = MAX_SAFE_DELAY_SECONDS
    else:
        capped_delay = raw_delay

    # Execution sleep
    if capped_delay > 0:
        time.sleep(capped_delay)

    passthrough = inputs.get("input")
    return {
        "delay_applied_seconds": capped_delay,
        "delay_applied_ms": int(capped_delay * 1000),
        "data": passthrough
    }, None


# -------------------------------------------------------------
# 6. OUTPUT NODE
# Displays final structured result, allows copying JSON, visible in inspector.
# -------------------------------------------------------------
def execute_output(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    raw_data = inputs.get("input")
    label = node_data.get("label", "Workflow Final Output")

    return {
        "status": "COMPLETED",
        "output_label": label,
        "final_result": raw_data,
        "timestamp": utc_now_iso(),
        "summary": "Workflow reached terminal output node."
    }, None


# -------------------------------------------------------------
# 7. NOTIFICATION SIMULATOR NODE
# Clearly labeled simulator. Resolves variables, records generated message.
# Never pretends to send real email/sms.
# -------------------------------------------------------------
def execute_notification_simulator(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    channel = node_data.get("channel", "Simulated-Slack")  # Simulated-Slack, Simulated-Email, Simulated-Webhook, In-App
    title = node_data.get("title", "NodeFlow System Alert")
    recipient = node_data.get("recipient", "demo-operator@nodeflow.local")
    template = node_data.get("message_template", node_data.get("message", "Workflow notice: {{text}} at {{timestamp}}"))

    # Build variable resolution context
    lookup = {
        "timestamp": utc_now_iso(),
        "channel": channel,
        "recipient": recipient
    }

    if "input" in inputs and inputs["input"] is not None:
        inp = inputs["input"]
        if isinstance(inp, dict):
            lookup.update(inp)
            if "text" not in lookup and "transformed_text" in inp:
                lookup["text"] = inp["transformed_text"]
            elif "text" not in lookup and "final_result" in inp:
                lookup["text"] = str(inp["final_result"])
        else:
            lookup["text"] = str(inp)
            lookup["input"] = str(inp)

    # Include execution-level context
    if "node_results" in context:
        for nid, nres in context["node_results"].items():
            out = nres.get("output")
            if isinstance(out, dict):
                for k, v in out.items():
                    lookup[f"{nid}_{k}"] = v

    rendered_message = _resolve_template_string(template, lookup)

    return {
        "is_simulation": True,
        "simulation_disclaimer": "SIMULATOR: No external network request or real message was dispatched.",
        "channel": channel,
        "title": title,
        "recipient": recipient,
        "message": rendered_message,
        "generated_at": utc_now_iso(),
        "status": "SIMULATED_DISPATCHED"
    }, None


# -------------------------------------------------------------
# 8. SAFE FORMULA EVALUATOR (Zero eval(), AST math parser only)
# -------------------------------------------------------------
SAFE_MATH_OPERATORS = {
    ast.Add: py_operator.add,
    ast.Sub: py_operator.sub,
    ast.Mult: py_operator.mul,
    ast.Div: py_operator.truediv,
    ast.Mod: py_operator.mod,
    ast.Pow: py_operator.pow,
    ast.USub: py_operator.neg,
    ast.UAdd: py_operator.pos,
}

def safe_math_eval(expression: str, variables: Dict[str, float]) -> float:
    """Evaluates mathematical expressions safely using Python's AST without eval()."""
    tree = ast.parse(expression, mode='eval')

    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        elif isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        elif isinstance(node, ast.Name):
            if node.id in variables:
                return float(variables[node.id])
            elif node.id == "pi":
                return math.pi
            elif node.id == "e":
                return math.e
            raise ValueError(f"Unknown variable in formula: '{node.id}'")
        elif isinstance(node, ast.BinOp):
            left = _eval(node.left)
            right = _eval(node.right)
            op_type = type(node.op)
            if op_type in SAFE_MATH_OPERATORS:
                if op_type == ast.Div and right == 0:
                    raise ZeroDivisionError("Division by zero in formula.")
                return SAFE_MATH_OPERATORS[op_type](left, right)
            raise ValueError(f"Unsupported operator: {op_type.__name__}")
        elif isinstance(node, ast.UnaryOp):
            operand = _eval(node.operand)
            op_type = type(node.op)
            if op_type in SAFE_MATH_OPERATORS:
                return SAFE_MATH_OPERATORS[op_type](operand)
            raise ValueError(f"Unsupported unary operator: {op_type.__name__}")
        else:
            raise ValueError(f"Unsupported AST node type: {type(node).__name__}")

    return _eval(tree)


def execute_math_op(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    op = node_data.get("operation", "add")
    param = float(node_data.get("param_value", 0))

    val = 0.0
    if "input" in inputs and inputs["input"] is not None:
        inp = inputs["input"]
        if isinstance(inp, dict):
            val = float(inp.get("value") or inp.get("amount") or inp.get("number") or inp.get("result") or 0.0)
        else:
            try:
                val = float(inp)
            except Exception:
                val = 0.0
    else:
        val = float(node_data.get("base_value", 0.0))

    result = 0.0
    if op == "add":
        result = val + param
    elif op == "subtract":
        result = val - param
    elif op == "multiply":
        result = val * param
    elif op == "divide":
        result = val / param if param != 0 else 0.0
    elif op == "modulo":
        result = val % param if param != 0 else 0.0
    elif op == "power":
        result = math.pow(val, param)
    elif op == "round":
        decimals = int(param)
        result = round(val, decimals)
    elif op == "percentage":
        result = (val * param) / 100.0

    return {
        "result": result,
        "original_value": val,
        "operation": op,
        "parameter": param
    }, None


def execute_formula_evaluator(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    expression = node_data.get("expression", "a * 1.15 + 10")
    variables = {"a": 0.0, "b": 0.0, "x": 0.0, "y": 0.0}

    if "input" in inputs and inputs["input"] is not None:
        inp = inputs["input"]
        if isinstance(inp, dict):
            for k in ("a", "b", "x", "y", "value", "result", "score"):
                if k in inp:
                    try:
                        variables[k] = float(inp[k])
                    except Exception:
                        pass
        elif isinstance(inp, (int, float)):
            variables["a"] = float(inp)
            variables["x"] = float(inp)

    try:
        variables["param_a"] = float(node_data.get("param_a", 10))
        variables["param_b"] = float(node_data.get("param_b", 20))
    except Exception:
        pass

    calculated = safe_math_eval(expression, variables)
    return {
        "result": calculated,
        "expression": expression,
        "variables_used": variables
    }, None


# Additional helper nodes for rich workflows
def execute_mock_api(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    endpoint = node_data.get("resource", "users")
    limit = int(node_data.get("limit", 4))
    data = MOCK_DATASETS.get(endpoint, {"message": f"Resource {endpoint} not found"})
    filtered = data[:limit] if isinstance(data, list) else data
    return {
        "status_code": 200,
        "endpoint": f"/api/v1/{endpoint}",
        "data": filtered,
        "count": len(filtered) if isinstance(filtered, list) else 1
    }, None


def execute_sentiment_analyzer(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    text = ""
    if "input" in inputs and inputs["input"] is not None:
        inp = inputs["input"]
        if isinstance(inp, dict):
            text = str(inp.get("transformed_text") or inp.get("text") or inp.get("value") or "")
        else:
            text = str(inp)
    else:
        text = str(node_data.get("sample_text", "NodeFlow is a fantastic and reliable tool!"))

    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    total_score = 0.0
    matched_words = []

    for word in words:
        if word in SENTIMENT_LEXICON:
            score = SENTIMENT_LEXICON[word]
            total_score += score
            matched_words.append({"word": word, "score": score})

    normalized = round(max(-1.0, min(1.0, total_score / max(len(words), 1) * 3)), 2)
    classification = "POSITIVE" if normalized > 0.15 else ("NEGATIVE" if normalized < -0.15 else "NEUTRAL")

    return {
        "text": text,
        "sentiment": classification,
        "score": normalized,
        "word_count": len(words),
        "highlighted_words": matched_words
    }, None


def execute_logger_output(node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    severity = node_data.get("severity", "INFO")
    label = node_data.get("label", "Workflow Log")
    data = inputs.get("input")
    return {
        "logged": True,
        "label": label,
        "severity": severity,
        "timestamp": utc_now_iso(),
        "payload": data
    }, None


# -------------------------------------------------------------
# MASTER NODE DEFINITIONS REGISTRY
# -------------------------------------------------------------
NODE_REGISTRY = {
    # 1. Manual Trigger
    "manual_trigger": {
        "type": "manual_trigger",
        "label": "Manual Trigger",
        "category": "Trigger",
        "description": "Starts workflow execution on demand when Run is clicked. Generates ISO-8601 runtime timestamp.",
        "icon": "Play",
        "color": "#FF5A1F",  # Electric Orange
        "inputs": [],
        "outputs": [{"id": "output", "label": "Trigger Event", "type": "json"}],
        "default_data": {"label": "Manual Trigger", "payload": '{"manual_run": true}'},
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Manual Trigger"},
            {"name": "payload", "label": "Initial Test Payload (JSON)", "type": "json", "default": '{"manual_run": true}'}
        ],
        "execute_fn": execute_manual_trigger
    },

    # 2. Text Input
    "text_input": {
        "type": "text_input",
        "label": "Text Input",
        "category": "Input",
        "description": "Configurable editable text source with variable naming and required-field validation.",
        "icon": "FileText",
        "color": "#315BDB",  # Cobalt Blue
        "inputs": [{"id": "input", "label": "Upstream Input (Optional)", "type": "any", "required": False}],
        "outputs": [{"id": "output", "label": "Structured Text", "type": "json"}],
        "default_data": {
            "label": "Text Input",
            "text": "NodeFlow brings industrial blueprint precision to workflow automation.",
            "variable_name": "prompt_text",
            "required": True
        },
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Text Input"},
            {"name": "text", "label": "Text Content", "type": "textarea", "default": "NodeFlow brings industrial blueprint precision to workflow automation.", "required": True},
            {"name": "variable_name", "label": "Variable Identifier", "type": "text", "default": "prompt_text"},
            {"name": "required", "label": "Required Field", "type": "boolean", "default": True}
        ],
        "execute_fn": execute_text_input
    },

    # 3. Condition
    "condition": {
        "type": "condition",
        "label": "Condition Router",
        "category": "Logic",
        "description": "Evaluates rules (equals, contains, greater than, is empty) and routes down True or False handles.",
        "icon": "GitBranch",
        "color": "#D97706",  # Technical Amber
        "inputs": [{"id": "input", "label": "Data Input", "type": "any", "required": True}],
        "outputs": [
            {"id": "true", "label": "True", "type": "any"},
            {"id": "false", "label": "False", "type": "any"}
        ],
        "default_data": {
            "label": "Condition",
            "field_path": "text",
            "operator": "contains",
            "target_value": "NodeFlow",
            "data_type": "string"
        },
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Condition"},
            {"name": "field_path", "label": "Variable / Field Path (e.g. text or score)", "type": "text", "default": "text"},
            {"name": "operator", "label": "Operator", "type": "select", "default": "contains",
             "options": [
                 {"value": "contains", "label": "Contains Substring"},
                 {"value": "equals", "label": "Equals (==)"},
                 {"value": "not_equals", "label": "Not Equals (!=)"},
                 {"value": "greater_than", "label": "Greater Than (>)"},
                 {"value": "less_than", "label": "Less Than (<)"},
                 {"value": "greater_equal", "label": "Greater or Equal (>=)"},
                 {"value": "less_equal", "label": "Less or Equal (<=)"},
                 {"value": "is_empty", "label": "Is Empty"},
                 {"value": "is_not_empty", "label": "Is Not Empty"}
             ]},
            {"name": "target_value", "label": "Comparison Value", "type": "text", "default": "NodeFlow"},
            {"name": "data_type", "label": "Type Coercion", "type": "select", "default": "string",
             "options": [
                 {"value": "string", "label": "String"},
                 {"value": "number", "label": "Number"},
                 {"value": "boolean", "label": "Boolean"}
             ]}
        ],
        "execute_fn": execute_condition
    },

    # 4. Text Transform
    "text_transform": {
        "type": "text_transform",
        "label": "Text Transform",
        "category": "Transform",
        "description": "Applies text modifications: Uppercase, Lowercase, Trim, Replace substring, Split into lines.",
        "icon": "Sparkles",
        "color": "#FF5A1F",  # Electric Orange
        "inputs": [{"id": "input", "label": "Raw Text", "type": "any", "required": True}],
        "outputs": [{"id": "output", "label": "Transformed Text", "type": "json"}],
        "default_data": {
            "label": "Text Transform",
            "operation": "uppercase",
            "find_text": "",
            "replace_with": ""
        },
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Text Transform"},
            {"name": "operation", "label": "Transform Operation", "type": "select", "default": "uppercase",
             "options": [
                 {"value": "uppercase", "label": "Uppercase (ALL CAPS)"},
                 {"value": "lowercase", "label": "Lowercase (all small)"},
                 {"value": "trim", "label": "Trim Whitespace"},
                 {"value": "replace", "label": "Replace Substring"},
                 {"value": "split_lines", "label": "Split into Lines"},
                 {"value": "slugify", "label": "URL Slugify"},
                 {"value": "capitalize", "label": "Capitalize Title Case"}
             ]},
            {"name": "find_text", "label": "Find Substring (for replace)", "type": "text", "default": ""},
            {"name": "replace_with", "label": "Replace With (for replace)", "type": "text", "default": ""}
        ],
        "execute_fn": execute_text_transform
    },

    # 5. Delay
    "delay": {
        "type": "delay",
        "label": "Delay / Pause",
        "category": "Logic",
        "description": "Safe configurable delay between operations (enforces 5.0 seconds maximum limit).",
        "icon": "Clock",
        "color": "#777970",  # Muted grey / Blueprint
        "inputs": [{"id": "input", "label": "Input Data", "type": "any", "required": False}],
        "outputs": [{"id": "output", "label": "Passthrough Data", "type": "any"}],
        "default_data": {"label": "Delay", "delay_seconds": 0.5},
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Delay"},
            {"name": "delay_seconds", "label": "Duration in Seconds (Max: 5.0)", "type": "number", "default": 0.5}
        ],
        "execute_fn": execute_delay
    },

    # 6. Output
    "output": {
        "type": "output",
        "label": "Terminal Output",
        "category": "Output",
        "description": "Terminal node displaying structured execution outcomes, ready for inspection and JSON copy.",
        "icon": "Download",
        "color": "#1B7F48",  # Forest Green
        "inputs": [{"id": "input", "label": "Final Result", "type": "any", "required": True}],
        "outputs": [{"id": "output", "label": "Terminal Data", "type": "json"}],
        "default_data": {"label": "Terminal Output"},
        "config_fields": [
            {"name": "label", "label": "Output Label", "type": "text", "default": "Terminal Output"}
        ],
        "execute_fn": execute_output
    },

    # 7. Notification Simulator
    "notification_simulator": {
        "type": "notification_simulator",
        "label": "Notification Simulator",
        "category": "Output",
        "description": "Simulates dispatching alert messages with dynamic variable interpolation. Clearly labeled simulator.",
        "icon": "Bell",
        "color": "#315BDB",  # Cobalt Blue
        "inputs": [{"id": "input", "label": "Context Payload", "type": "any", "required": True}],
        "outputs": [{"id": "output", "label": "Simulation Receipt", "type": "json"}],
        "default_data": {
            "label": "Notification Simulator",
            "channel": "Simulated-Slack",
            "title": "System Alert: NodeFlow Workflow Finished",
            "recipient": "#ops-channel",
            "message_template": "Workflow notification: '{{text}}' processed successfully at {{timestamp}}."
        },
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Notification Simulator"},
            {"name": "channel", "label": "Simulated Channel", "type": "select", "default": "Simulated-Slack",
             "options": [
                 {"value": "Simulated-Slack", "label": "Slack Channel (Simulated)"},
                 {"value": "Simulated-Email", "label": "Email Alert (Simulated)"},
                 {"value": "Simulated-Webhook", "label": "Webhook Ping (Simulated)"},
                 {"value": "In-App-Banner", "label": "In-App Toast Banner"}
             ]},
            {"name": "title", "label": "Alert Title / Subject", "type": "text", "default": "NodeFlow Alert"},
            {"name": "recipient", "label": "Target Recipient", "type": "text", "default": "#ops-channel"},
            {"name": "message_template", "label": "Message Template (supports {{variable}})", "type": "textarea",
             "default": "Workflow notification: '{{text}}' processed successfully at {{timestamp}}."}
        ],
        "execute_fn": execute_notification_simulator
    },

    # Additional utility nodes
    "math_op": {
        "type": "math_op",
        "label": "Math Operation",
        "category": "Transform",
        "description": "Calculates arithmetic, percentages, and rounding.",
        "icon": "Calculator",
        "color": "#1B7F48",
        "inputs": [{"id": "input", "label": "Numeric Input", "type": "number", "required": True}],
        "outputs": [{"id": "output", "label": "Calculation Result", "type": "number"}],
        "default_data": {"label": "Math Operation", "operation": "multiply", "param_value": 1.20},
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Math Operation"},
            {"name": "operation", "label": "Operation", "type": "select", "default": "multiply",
             "options": [
                 {"value": "add", "label": "Add (+)"},
                 {"value": "subtract", "label": "Subtract (-)"},
                 {"value": "multiply", "label": "Multiply (*)"},
                 {"value": "divide", "label": "Divide (/)"},
                 {"value": "percentage", "label": "Percentage (%)"},
                 {"value": "round", "label": "Round to Decimals"}
             ]},
            {"name": "param_value", "label": "Operand Value", "type": "number", "default": 1.20}
        ],
        "execute_fn": execute_math_op
    },
    "mock_api": {
        "type": "mock_api",
        "label": "Mock API Dataset",
        "category": "Input",
        "description": "Simulates external REST API endpoints locally without external network dependencies.",
        "icon": "Globe",
        "color": "#315BDB",
        "inputs": [],
        "outputs": [{"id": "output", "label": "Mock Dataset", "type": "json"}],
        "default_data": {"label": "Mock API", "resource": "users", "limit": 4},
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Mock API"},
            {"name": "resource", "label": "Mock Dataset", "type": "select", "default": "users",
             "options": [
                 {"value": "users", "label": "Users Directory"},
                 {"value": "orders", "label": "E-Commerce Orders"},
                 {"value": "weather", "label": "Weather Data"},
                 {"value": "stock_quotes", "label": "Stock Quotes"}
             ]},
            {"name": "limit", "label": "Limit items", "type": "number", "default": 4}
        ],
        "execute_fn": execute_mock_api
    },
    "sentiment_analyzer": {
        "type": "sentiment_analyzer",
        "label": "Sentiment Analyzer",
        "category": "Transform",
        "description": "Evaluates positive/negative sentiment using a local built-in lexicon.",
        "icon": "Smile",
        "color": "#FF5A1F",
        "inputs": [{"id": "input", "label": "Text Input", "type": "any", "required": True}],
        "outputs": [{"id": "output", "label": "Sentiment Analysis", "type": "json"}],
        "default_data": {"label": "Sentiment Analyzer"},
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Sentiment Analyzer"}
        ],
        "execute_fn": execute_sentiment_analyzer
    },
    "logger_output": {
        "type": "logger_output",
        "label": "Console Logger",
        "category": "Output",
        "description": "Emits inspected workflow data into execution log with severity tags.",
        "icon": "ScrollText",
        "color": "#777970",
        "inputs": [{"id": "input", "label": "Data to Log", "type": "any", "required": True}],
        "outputs": [{"id": "output", "label": "Logged Payload", "type": "any"}],
        "default_data": {"label": "Console Logger", "severity": "INFO"},
        "config_fields": [
            {"name": "label", "label": "Node Label", "type": "text", "default": "Console Logger"},
            {"name": "severity", "label": "Severity", "type": "select", "default": "INFO",
             "options": [
                 {"value": "INFO", "label": "INFO"},
                 {"value": "SUCCESS", "label": "SUCCESS"},
                 {"value": "WARNING", "label": "WARNING"},
                 {"value": "ERROR", "label": "ERROR"}
             ]}
        ],
        "execute_fn": execute_logger_output
    }
}

# Compatibility aliases
NODE_REGISTRY["transform_text"] = NODE_REGISTRY["text_transform"]
NODE_REGISTRY["notification_mock"] = NODE_REGISTRY["notification_simulator"]


def get_node_definition(node_type: str) -> Optional[Dict[str, Any]]:
    return NODE_REGISTRY.get(node_type)


def get_all_node_definitions() -> List[Dict[str, Any]]:
    # Filter out duplicate alias keys for catalog display
    seen_types = set()
    defs = []
    for k, v in NODE_REGISTRY.items():
        canonical_type = v.get("type", k)
        if canonical_type in seen_types:
            continue
        seen_types.add(canonical_type)
        item = dict(v)
        if "execute_fn" in item:
            del item["execute_fn"]
        defs.append(item)
    return defs


def execute_node(node_type: str, node_data: Dict[str, Any], inputs: Dict[str, Any], context: Dict[str, Any]) -> Tuple[Any, Optional[str]]:
    definition = NODE_REGISTRY.get(node_type)
    if not definition or "execute_fn" not in definition:
        raise ValueError(f"Unknown node type or missing executor for: '{node_type}'")
    return definition["execute_fn"](node_data, inputs, context)
