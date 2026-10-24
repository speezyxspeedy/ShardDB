"""
Pre-built workflow templates for NodeFlow.
Includes all required starter workflows:
A. Text Processor: Manual Trigger -> Text Input -> Text Transform -> Output
B. Conditional Router: Manual Trigger -> Text Input -> Condition -> Output
C. Message Generator: Manual Trigger -> Text Input -> Text Transform -> Notification Simulator -> Output
Plus bonus real-world pipelines.
"""

from typing import Any, Dict, List

TEMPLATES: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # Template A: Text Processor
    # Manual Trigger -> Text Input -> Text Transform -> Output
    # -------------------------------------------------------------
    {
        "id": "text-processor",
        "name": "Text Processor",
        "description": "Standard sequential pipeline: Ingests raw input text, transforms it using configured text operations (e.g., uppercase/slugify), and renders the final structured output.",
        "category": "Transform",
        "tags": ["Sequential", "Text", "Starter", "Standard"],
        "nodes": [
            {
                "id": "tp-node-1",
                "type": "manual_trigger",
                "position": {"x": 80, "y": 200},
                "data": {"label": "Manual Trigger", "payload": '{"source": "editor_run"}'}
            },
            {
                "id": "tp-node-2",
                "type": "text_input",
                "position": {"x": 380, "y": 200},
                "data": {
                    "label": "Text Input",
                    "text": "NodeFlow Visual Automation Platform - Industrial Blueprint Edition",
                    "variable_name": "raw_content",
                    "required": True
                }
            },
            {
                "id": "tp-node-3",
                "type": "text_transform",
                "position": {"x": 700, "y": 200},
                "data": {
                    "label": "Text Transform",
                    "operation": "uppercase"
                }
            },
            {
                "id": "tp-node-4",
                "type": "output",
                "position": {"x": 1020, "y": 200},
                "data": {
                    "label": "Final Output"
                }
            }
        ],
        "edges": [
            {"id": "tp-e1-2", "source": "tp-node-1", "target": "tp-node-2", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "tp-e2-3", "source": "tp-node-2", "target": "tp-node-3", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "tp-e3-4", "source": "tp-node-3", "target": "tp-node-4", "sourceHandle": "output", "targetHandle": "input"}
        ]
    },

    # -------------------------------------------------------------
    # Template B: Conditional Router
    # Manual Trigger -> Text Input -> Condition -> Output
    # -------------------------------------------------------------
    {
        "id": "conditional-router",
        "name": "Conditional Router",
        "description": "Evaluates dynamic text rules (e.g. keyword contains check) and routes execution cleanly through designated True and False output branches.",
        "category": "Logic",
        "tags": ["Branching", "Condition", "Logic", "Routing"],
        "nodes": [
            {
                "id": "cr-node-1",
                "type": "manual_trigger",
                "position": {"x": 80, "y": 220},
                "data": {"label": "Manual Trigger", "payload": '{"priority": "high"}'}
            },
            {
                "id": "cr-node-2",
                "type": "text_input",
                "position": {"x": 380, "y": 220},
                "data": {
                    "label": "Subject Line",
                    "text": "URGENT: Server latency spikes detected on cluster A",
                    "variable_name": "alert_subject",
                    "required": True
                }
            },
            {
                "id": "cr-node-3",
                "type": "condition",
                "position": {"x": 700, "y": 200},
                "data": {
                    "label": "Contains 'URGENT'?",
                    "field_path": "text",
                    "operator": "contains",
                    "target_value": "URGENT",
                    "data_type": "string"
                }
            },
            {
                "id": "cr-node-4-true",
                "type": "output",
                "position": {"x": 1040, "y": 120},
                "data": {
                    "label": "High Priority Output (True Branch)"
                }
            },
            {
                "id": "cr-node-4-false",
                "type": "output",
                "position": {"x": 1040, "y": 320},
                "data": {
                    "label": "Standard Queue Output (False Branch)"
                }
            }
        ],
        "edges": [
            {"id": "cr-e1-2", "source": "cr-node-1", "target": "cr-node-2", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "cr-e2-3", "source": "cr-node-2", "target": "cr-node-3", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "cr-e3-4t", "source": "cr-node-3", "target": "cr-node-4-true", "sourceHandle": "true", "targetHandle": "input", "label": "Matched (True)"},
            {"id": "cr-e3-4f", "source": "cr-node-3", "target": "cr-node-4-false", "sourceHandle": "false", "targetHandle": "input", "label": "Fallback (False)"}
        ]
    },

    # -------------------------------------------------------------
    # Template C: Message Generator
    # Manual Trigger -> Text Input -> Text Transform -> Notification Simulator -> Output
    # -------------------------------------------------------------
    {
        "id": "message-generator",
        "name": "Message Generator",
        "description": "Constructs rich dynamic notification payloads: inputs raw announcement text, converts to clean uppercase format, generates simulated alert dispatch receipt, and renders output.",
        "category": "Notifications",
        "tags": ["Simulator", "Template", "Notification", "Pipeline"],
        "nodes": [
            {
                "id": "mg-node-1",
                "type": "manual_trigger",
                "position": {"x": 60, "y": 200},
                "data": {"label": "Manual Trigger", "payload": '{"environment": "production"}'}
            },
            {
                "id": "mg-node-2",
                "type": "text_input",
                "position": {"x": 340, "y": 200},
                "data": {
                    "label": "Announcement Body",
                    "text": "Deployment release v2.4.0 verified and stable across all regions.",
                    "variable_name": "release_notes",
                    "required": True
                }
            },
            {
                "id": "mg-node-3",
                "type": "text_transform",
                "position": {"x": 640, "y": 200},
                "data": {
                    "label": "Trim & Clean Text",
                    "operation": "trim"
                }
            },
            {
                "id": "mg-node-4",
                "type": "notification_simulator",
                "position": {"x": 940, "y": 200},
                "data": {
                    "label": "Notification Simulator",
                    "channel": "Simulated-Slack",
                    "title": "Production Release Notice",
                    "recipient": "#engineering-announcements",
                    "message_template": "BROADCAST ALERT: '{{text}}' at {{timestamp}}"
                }
            },
            {
                "id": "mg-node-5",
                "type": "output",
                "position": {"x": 1280, "y": 200},
                "data": {
                    "label": "Audit Output"
                }
            }
        ],
        "edges": [
            {"id": "mg-e1-2", "source": "mg-node-1", "target": "mg-node-2", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "mg-e2-3", "source": "mg-node-2", "target": "mg-node-3", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "mg-e3-4", "source": "mg-node-3", "target": "mg-node-4", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "mg-e4-5", "source": "mg-node-4", "target": "mg-node-5", "sourceHandle": "output", "targetHandle": "input"}
        ]
    },

    # -------------------------------------------------------------
    # Bonus Pipeline: Sentiment Analysis & Branching
    # -------------------------------------------------------------
    {
        "id": "sentiment-feedback-pipeline",
        "name": "Customer Feedback Sentiment Pipeline",
        "description": "Analyzes incoming customer feedback, evaluates sentiment score locally, and branches to VIP Praise or Support Escalation alerts.",
        "category": "Customer Ops",
        "tags": ["Sentiment", "Branching", "Notifications"],
        "nodes": [
            {
                "id": "node-1",
                "type": "manual_trigger",
                "position": {"x": 60, "y": 180},
                "data": {"label": "Feedback Ingestion", "payload": '{"source": "In-App Feedback", "user": "Dr. Sarah Lin"}'}
            },
            {
                "id": "node-2",
                "type": "text_input",
                "position": {"x": 340, "y": 180},
                "data": {"label": "User Review Text", "text": "NodeFlow is an amazing, clean, and reliable workflow automation platform!"}
            },
            {
                "id": "node-3",
                "type": "sentiment_analyzer",
                "position": {"x": 630, "y": 180},
                "data": {"label": "Sentiment Classifier"}
            },
            {
                "id": "node-4",
                "type": "condition",
                "position": {"x": 930, "y": 160},
                "data": {
                    "label": "Is Positive Sentiment?",
                    "field_path": "sentiment",
                    "operator": "equals",
                    "target_value": "POSITIVE",
                    "data_type": "string"
                }
            },
            {
                "id": "node-5",
                "type": "notification_simulator",
                "position": {"x": 1260, "y": 80},
                "data": {
                    "label": "Slack Praise Alert",
                    "channel": "Simulated-Slack",
                    "title": "Positive Customer Review",
                    "recipient": "#customer-love"
                }
            },
            {
                "id": "node-6",
                "type": "output",
                "position": {"x": 1260, "y": 300},
                "data": {
                    "label": "Support Escalation Queue"
                }
            }
        ],
        "edges": [
            {"id": "e1-2", "source": "node-1", "target": "node-2", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "e2-3", "source": "node-2", "target": "node-3", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "e3-4", "source": "node-3", "target": "node-4", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "e4-5", "source": "node-4", "target": "node-5", "sourceHandle": "true", "targetHandle": "input", "label": "Positive (True)"},
            {"id": "e4-6", "source": "node-4", "target": "node-6", "sourceHandle": "false", "targetHandle": "input", "label": "Neutral/Negative (False)"}
        ]
    }
]


def get_templates() -> List[Dict[str, Any]]:
    return TEMPLATES


def get_template_by_id(template_id: str) -> Optional[Dict[str, Any]]:
    for tpl in TEMPLATES:
        if tpl["id"] == template_id:
            return tpl
    return None
