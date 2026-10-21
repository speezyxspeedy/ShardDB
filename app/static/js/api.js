/**
 * HelpDeskX — API Client, State Management, and Shared Utilities
 */

const API_BASE = '/api';

// Safe HTML escaping
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Toast notification helper
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSvg = type === 'success' 
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>'
    : type === 'error'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';

  toast.innerHTML = `
    <div style="flex-shrink:0; display:flex; align-items:center;">${iconSvg}</div>
    <div style="flex-grow:1; line-height:1.4;">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// Format Dates nicely
function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return isoString;
  }
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const past = new Date(isoString);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatDate(isoString);
}

// API methods
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMsg = 'An unexpected error occurred';
        if (data && data.detail) {
          if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join('; ');
          } else {
            errorMsg = data.detail;
          }
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Health
  getHealth() {
    return this.request('/health');
  },

  // Tickets
  getTickets(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    return this.request(`/tickets?${query.toString()}`);
  },

  getTicket(id) {
    return this.request(`/tickets/${id}`);
  },

  getTicketByNumber(number) {
    return this.request(`/tickets/number/${encodeURIComponent(number)}`);
  },

  createTicket(payload) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTicket(id, payload, actor = { name: 'Agent', role: 'agent' }) {
    const query = new URLSearchParams({ actor_name: actor.name, actor_role: actor.role });
    return this.request(`/tickets/${id}?${query.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  updateStatus(id, status, actor = { name: 'Agent', role: 'agent' }) {
    return this.request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actor_name: actor.name, actor_role: actor.role }),
    });
  },

  updatePriority(id, priority, actor = { name: 'Agent', role: 'agent' }) {
    return this.request(`/tickets/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority, actor_name: actor.name, actor_role: actor.role }),
    });
  },

  assignTicket(id, agentId, actor = { name: 'Agent', role: 'agent' }) {
    return this.request(`/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_agent_id: agentId, actor_name: actor.name, actor_role: actor.role }),
    });
  },

  resolveTicket(id, actor = { name: 'Agent', role: 'agent' }) {
    const query = new URLSearchParams({ actor_name: actor.name, actor_role: actor.role });
    return this.request(`/tickets/${id}/resolve?${query.toString()}`, {
      method: 'POST',
    });
  },

  reopenTicket(id, actor = { name: 'Agent', role: 'agent' }) {
    const query = new URLSearchParams({ actor_name: actor.name, actor_role: actor.role });
    return this.request(`/tickets/${id}/reopen?${query.toString()}`, {
      method: 'POST',
    });
  },

  closeTicket(id, actor = { name: 'Agent', role: 'agent' }) {
    const query = new URLSearchParams({ actor_name: actor.name, actor_role: actor.role });
    return this.request(`/tickets/${id}/close?${query.toString()}`, {
      method: 'POST',
    });
  },

  deleteTicket(id) {
    return this.request(`/tickets/${id}`, {
      method: 'DELETE',
    });
  },

  // Messages
  addMessage(ticketId, payload) {
    return this.request(`/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMessages(ticketId) {
    return this.request(`/tickets/${ticketId}/messages`);
  },

  // Dashboard
  getDashboardStats() {
    return this.request('/dashboard/stats');
  },

  getRecentActivity(limit = 10) {
    return this.request(`/dashboard/recent-activity?limit=${limit}`);
  },

  // Agents
  getAgents() {
    return this.request('/agents');
  },
};

// Global Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('helpdeskx_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('helpdeskx_theme', next);
  updateThemeIcon(next);
  // Notify charts if any to re-render
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: next } }));
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  if (theme === 'light') {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.setAttribute('title', 'Switch to Dark Mode');
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    btn.setAttribute('title', 'Switch to Light Mode');
  }
}

// Demo Agent Identity Management (Dashboard)
const DemoAgentManager = {
  agents: [],
  currentAgent: null,

  async init(selectElementId = 'demo-agent-select') {
    try {
      this.agents = await api.getAgents();
      const select = document.getElementById(selectElementId);
      if (!select) return;

      select.innerHTML = '';
      this.agents.forEach(agent => {
        const opt = document.createElement('option');
        opt.value = agent.id;
        opt.textContent = `${agent.name} (${agent.role})`;
        select.appendChild(opt);
      });

      const savedId = localStorage.getItem('helpdeskx_demo_agent_id');
      if (savedId && this.agents.some(a => a.id == savedId)) {
        select.value = savedId;
        this.currentAgent = this.agents.find(a => a.id == savedId);
      } else if (this.agents.length > 0) {
        this.currentAgent = this.agents[0];
        select.value = this.currentAgent.id;
      }

      select.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        this.currentAgent = this.agents.find(a => a.id == selectedId);
        localStorage.setItem('helpdeskx_demo_agent_id', selectedId);
        showToast(`Active Demo Agent: ${this.currentAgent.name}`, 'info');
        window.dispatchEvent(new CustomEvent('agentIdentityChanged', { detail: this.currentAgent }));
      });
    } catch (e) {
      console.warn('Could not load agents for selector:', e);
    }
  },

  getCurrent() {
    return this.currentAgent || { name: 'Support Specialist', role: 'agent', email: 'agent@helpdeskx.io', id: 1 };
  }
};

// Demo Customer Identity Management (Customer Portal)
const DemoCustomerManager = {
  customers: [
    { name: 'Jane Doe', email: 'jane@acme.com', company: 'Acme Corp' },
    { name: 'John Smith', email: 'john@globallogistics.org', company: 'Global Logistics' },
    { name: 'Emily Watson', email: 'emily@nexusmedia.co', company: 'Nexus Media' },
  ],
  currentCustomer: null,

  init(selectElementId = 'demo-customer-select') {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    select.innerHTML = '';
    this.customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.email;
      opt.textContent = `${c.name} (${c.company})`;
      select.appendChild(opt);
    });

    const savedEmail = localStorage.getItem('helpdeskx_demo_customer_email');
    if (savedEmail && this.customers.some(c => c.email === savedEmail)) {
      select.value = savedEmail;
      this.currentCustomer = this.customers.find(c => c.email === savedEmail);
    } else {
      this.currentCustomer = this.customers[0];
      select.value = this.currentCustomer.email;
    }

    select.addEventListener('change', (e) => {
      const email = e.target.value;
      this.currentCustomer = this.customers.find(c => c.email === email);
      localStorage.setItem('helpdeskx_demo_customer_email', email);
      showToast(`Viewing as: ${this.currentCustomer.name} (${this.currentCustomer.company})`, 'info');
      window.dispatchEvent(new CustomEvent('customerIdentityChanged', { detail: this.currentCustomer }));
    });
  },

  getCurrent() {
    return this.currentCustomer || this.customers[0];
  }
};

// Status and Priority Badge Generator
function renderStatusBadge(status) {
  const slug = (status || 'Open').toLowerCase().replace(/\s+/g, '-');
  return `<span class="badge badge-status-${slug}"><span class="badge-dot"></span>${escapeHtml(status)}</span>`;
}

function renderPriorityBadge(priority) {
  const slug = (priority || 'Medium').toLowerCase();
  return `<span class="badge badge-priority-${slug}">${escapeHtml(priority)}</span>`;
}
