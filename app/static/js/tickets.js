/**
 * HelpDeskX — Ticket Management Table, Filtering, Search, and Pagination
 */

const TicketManager = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 1,
  searchQuery: '',
  statusFilter: '',
  priorityFilter: '',
  categoryFilter: '',
  agentFilter: '',
  sortBy: 'newest',
  searchTimeout: null,

  init() {
    this.bindEvents();
    this.loadTickets();
  },

  bindEvents() {
    // Search input with debouncing
    const searchInput = document.getElementById('ticket-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.currentPage = 1;
          this.loadTickets();
        }, 300);
      });
    }

    // Filters
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.currentPage = 1;
        this.loadTickets();
      });
    }

    const prioritySelect = document.getElementById('filter-priority');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        this.priorityFilter = e.target.value;
        this.currentPage = 1;
        this.loadTickets();
      });
    }

    const categorySelect = document.getElementById('filter-category');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.currentPage = 1;
        this.loadTickets();
      });
    }

    const agentSelect = document.getElementById('filter-agent');
    if (agentSelect) {
      agentSelect.addEventListener('change', (e) => {
        this.agentFilter = e.target.value;
        this.currentPage = 1;
        this.loadTickets();
      });
    }

    const sortSelect = document.getElementById('filter-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.currentPage = 1;
        this.loadTickets();
      });
    }

    // Reset filters button
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-tickets-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadTickets();
        if (typeof loadDashboard === 'function') loadDashboard();
        showToast('Tickets refreshed', 'info');
      });
    }

    // Pagination controls
    const prevBtn = document.getElementById('pagination-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.loadTickets();
        }
      });
    }

    const nextBtn = document.getElementById('pagination-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.loadTickets();
        }
      });
    }

    // New Ticket Modal submit
    const createForm = document.getElementById('create-ticket-form');
    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleCreateTicket(createForm);
      });
    }

    // Re-populate agent filter options when agents are loaded
    window.addEventListener('agentIdentityChanged', () => {
      this.populateAgentDropdowns();
    });
  },

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.priorityFilter = '';
    this.categoryFilter = '';
    this.agentFilter = '';
    this.sortBy = 'newest';
    this.currentPage = 1;

    const ids = ['ticket-search-input', 'filter-status', 'filter-priority', 'filter-category', 'filter-agent'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const sortEl = document.getElementById('filter-sort');
    if (sortEl) sortEl.value = 'newest';

    this.loadTickets();
  },

  async populateAgentDropdowns() {
    try {
      const agents = await api.getAgents();
      // Table filter
      const filterAgent = document.getElementById('filter-agent');
      if (filterAgent) {
        filterAgent.innerHTML = `
          <option value="">All Assignees</option>
          <option value="-1">Unassigned</option>
          ${agents.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}
        `;
      }
      // Create modal agent select
      const modalAgent = document.getElementById('new-ticket-agent');
      if (modalAgent) {
        modalAgent.innerHTML = `
          <option value="">Unassigned</option>
          ${agents.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}
        `;
      }
    } catch (e) {
      console.warn('Could not populate agent dropdowns:', e);
    }
  },

  async loadTickets() {
    const tbody = document.getElementById('tickets-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 32px;">
          <div style="display:inline-block; width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <div style="margin-top: 8px; color: var(--text-muted); font-size: 12px;">Loading tickets...</div>
        </td>
      </tr>
    `;

    try {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        sort_by: this.sortBy,
      };

      if (this.searchQuery) params.search = this.searchQuery;
      if (this.statusFilter) params.status = this.statusFilter;
      if (this.priorityFilter) params.priority = this.priorityFilter;
      if (this.categoryFilter) params.category = this.categoryFilter;
      if (this.agentFilter) params.agent_id = this.agentFilter;

      const data = await api.getTickets(params);
      this.totalPages = data.total_pages;

      this.renderTable(data.items, data.total);
      this.renderPagination(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 32px; color: var(--danger);">
            Failed to load tickets: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
    }
  },

  renderTable(tickets, total) {
    const tbody = document.getElementById('tickets-table-body');
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="17" x2="11" y2="17"/>
              </svg>
              <div class="empty-state-title">No tickets found</div>
              <div class="empty-state-desc">Try adjusting your search terms or filter selections.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tickets.map(ticket => {
      const agentDisplay = ticket.assigned_agent
        ? `<div style="display:flex; align-items:center; gap:6px;">
            <div style="width:20px; height:20px; border-radius:50%; background-color:${ticket.assigned_agent.avatar_color || '#3b82f6'}; color:white; font-size:10px; display:flex; align-items:center; justify-content:center; font-weight:600;">
              ${ticket.assigned_agent.name.charAt(0)}
            </div>
            <span>${escapeHtml(ticket.assigned_agent.name)}</span>
           </div>`
        : `<span style="color:var(--text-muted); font-style:italic;">Unassigned</span>`;

      return `
        <tr onclick="TicketDetailModal.open(${ticket.id})">
          <td class="ticket-number-cell">${escapeHtml(ticket.ticket_number)}</td>
          <td class="ticket-title-cell">
            <div class="ticket-title-text">${escapeHtml(ticket.title)}</div>
            <div class="ticket-desc-snippet">${escapeHtml(ticket.description)}</div>
          </td>
          <td>${renderStatusBadge(ticket.status)}</td>
          <td>${renderPriorityBadge(ticket.priority)}</td>
          <td><span class="badge badge-category">${escapeHtml(ticket.category)}</span></td>
          <td>${agentDisplay}</td>
          <td style="color:var(--text-muted); font-size:12px; white-space:nowrap;">
            ${timeAgo(ticket.created_at)}
          </td>
        </tr>
      `;
    }).join('');
  },

  renderPagination(data) {
    const pageInfo = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');

    const start = data.total === 0 ? 0 : (data.page - 1) * data.page_size + 1;
    const end = Math.min(data.page * data.page_size, data.total);

    if (pageInfo) {
      pageInfo.textContent = `Showing ${start}–${end} of ${data.total} tickets (Page ${data.page} of ${data.total_pages})`;
    }

    if (prevBtn) prevBtn.disabled = data.page <= 1;
    if (nextBtn) nextBtn.disabled = data.page >= data.total_pages;
  },

  async handleCreateTicket(form) {
    const title = form.querySelector('[name="title"]').value.trim();
    const description = form.querySelector('[name="description"]').value.trim();
    const category = form.querySelector('[name="category"]').value;
    const priority = form.querySelector('[name="priority"]').value;
    const customer_name = form.querySelector('[name="customer_name"]').value.trim();
    const customer_email = form.querySelector('[name="customer_email"]').value.trim();
    const agentVal = form.querySelector('[name="assigned_agent_id"]')?.value;
    const assigned_agent_id = agentVal ? parseInt(agentVal, 10) : null;

    if (!title || !description || !customer_name || !customer_email) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      const payload = {
        title,
        description,
        category,
        priority,
        customer_name,
        customer_email,
        assigned_agent_id,
      };

      const newTicket = await api.createTicket(payload);
      showToast(`Ticket ${newTicket.ticket_number} created successfully!`, 'success');
      form.reset();

      // Close modal
      const modal = document.getElementById('create-ticket-modal');
      if (modal) modal.classList.remove('active');

      this.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Error creating ticket: ' + err.message, 'error');
    }
  }
};
