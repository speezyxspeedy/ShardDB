/**
 * HelpDeskX — Customer Support Portal Client Logic
 */

const CustomerPortal = {
  activeTicket: null,
  searchQuery: '',
  statusFilter: '',
  searchTimeout: null,

  init() {
    DemoCustomerManager.init('demo-customer-select');
    this.bindEvents();
    this.loadCustomerTickets();
  },

  bindEvents() {
    // When customer identity changes, refresh tickets
    window.addEventListener('customerIdentityChanged', (e) => {
      this.updateCustomerHeader(e.detail);
      this.loadCustomerTickets();
    });

    // Search input
    const searchInput = document.getElementById('customer-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.loadCustomerTickets();
        }, 300);
      });
    }

    // Status filter
    const statusSelect = document.getElementById('customer-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.loadCustomerTickets();
      });
    }

    // Submit Ticket Form
    const newForm = document.getElementById('customer-new-ticket-form');
    if (newForm) {
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleCreateTicket(newForm);
      });
    }
  },

  updateCustomerHeader(customer) {
    const nameEl = document.getElementById('customer-display-name');
    const compEl = document.getElementById('customer-display-company');
    if (nameEl) nameEl.textContent = customer.name;
    if (compEl) compEl.textContent = customer.company || customer.email;
  },

  async loadCustomerTickets() {
    const listContainer = document.getElementById('customer-tickets-list');
    if (!listContainer) return;

    const currentCustomer = DemoCustomerManager.getCurrent();
    this.updateCustomerHeader(currentCustomer);

    listContainer.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-muted);">
        <div style="display:inline-block; width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <div style="margin-top: 8px; font-size: 13px;">Loading your tickets...</div>
      </div>
    `;

    try {
      const params = {
        customer_email: currentCustomer.email,
        page_size: 50,
      };

      if (this.searchQuery) params.search = this.searchQuery;
      if (this.statusFilter) params.status = this.statusFilter;

      const data = await api.getTickets(params);
      this.renderTickets(data.items, currentCustomer);
    } catch (err) {
      console.error('Failed to load customer tickets:', err);
      listContainer.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--danger);">
          Error loading tickets: ${escapeHtml(err.message)}
        </div>
      `;
    }
  },

  renderTickets(tickets, customer) {
    const listContainer = document.getElementById('customer-tickets-list');
    if (!listContainer) return;

    if (!tickets || tickets.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <div class="empty-state-title">No support tickets found</div>
          <div class="empty-state-desc">You don't have any tickets matching your current search or filters.</div>
          <button class="btn btn-primary" style="margin-top: 16px;" onclick="CustomerPortal.openNewTicketModal()">
            Create New Ticket
          </button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = tickets.map(ticket => `
      <div class="stat-card" style="cursor:pointer;" onclick="CustomerPortal.openTicketDetail(${ticket.id})">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px;">
          <div style="display:flex; align-items:center; gap: 8px;">
            <span class="ticket-number-cell" style="font-size: 13px;">${escapeHtml(ticket.ticket_number)}</span>
            <span class="badge badge-category">${escapeHtml(ticket.category)}</span>
          </div>
          <div>${renderStatusBadge(ticket.status)}</div>
        </div>

        <h3 style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
          ${escapeHtml(ticket.title)}
        </h3>

        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
          ${escapeHtml(ticket.description)}
        </p>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-muted);">
          <div style="display:flex; align-items:center; gap: 12px;">
            <span>Priority: ${renderPriorityBadge(ticket.priority)}</span>
            <span>•</span>
            <span>${ticket.message_count || 0} ${(ticket.message_count === 1) ? 'reply' : 'replies'}</span>
          </div>
          <div>Updated ${timeAgo(ticket.updated_at)}</div>
        </div>
      </div>
    `).join('');
  },

  openNewTicketModal() {
    const modal = document.getElementById('customer-create-modal');
    if (!modal) return;

    const currentCustomer = DemoCustomerManager.getCurrent();
    const nameInput = document.getElementById('new-ticket-customer-name');
    const emailInput = document.getElementById('new-ticket-customer-email');

    if (nameInput) nameInput.value = currentCustomer.name;
    if (emailInput) emailInput.value = currentCustomer.email;

    modal.classList.add('active');
  },

  closeNewTicketModal() {
    const modal = document.getElementById('customer-create-modal');
    if (modal) modal.classList.remove('active');
  },

  async handleCreateTicket(form) {
    const title = form.querySelector('[name="title"]').value.trim();
    const description = form.querySelector('[name="description"]').value.trim();
    const category = form.querySelector('[name="category"]').value;
    const priority = form.querySelector('[name="priority"]').value;
    const customer = DemoCustomerManager.getCurrent();

    if (!title || !description) {
      showToast('Please provide a title and detailed description', 'error');
      return;
    }

    try {
      const payload = {
        title,
        description,
        category,
        priority,
        customer_name: customer.name,
        customer_email: customer.email,
      };

      const newTicket = await api.createTicket(payload);
      showToast(`Ticket ${newTicket.ticket_number} submitted successfully!`, 'success');
      form.reset();
      this.closeNewTicketModal();
      this.loadCustomerTickets();
    } catch (err) {
      showToast('Error creating ticket: ' + err.message, 'error');
    }
  },

  async openTicketDetail(ticketId) {
    const backdrop = document.getElementById('customer-ticket-modal');
    if (!backdrop) return;

    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    const container = document.getElementById('customer-ticket-modal-body');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="display:inline-block; width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <div style="margin-top: 8px;">Loading ticket details...</div>
        </div>
      `;
    }

    try {
      const ticket = await api.getTicket(ticketId);
      this.activeTicket = ticket;
      this.renderDetail();
    } catch (err) {
      showToast('Failed to load ticket details: ' + err.message, 'error');
      this.closeTicketDetail();
    }
  },

  closeTicketDetail() {
    const backdrop = document.getElementById('customer-ticket-modal');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
    this.activeTicket = null;
  },

  renderDetail() {
    const ticket = this.activeTicket;
    if (!ticket) return;

    const titleEl = document.getElementById('customer-modal-title');
    if (titleEl) {
      titleEl.innerHTML = `
        <span style="font-family: monospace; color: var(--primary);">${escapeHtml(ticket.ticket_number)}</span>
        <span style="margin: 0 8px; color: var(--text-muted);">•</span>
        <span>${escapeHtml(ticket.title)}</span>
      `;
    }

    const container = document.getElementById('customer-ticket-modal-body');
    if (!container) return;

    // Filter messages: only show public replies (safety: internal notes are never shown in customer portal)
    const publicMessages = (ticket.messages || []).filter(m => m.message_type === 'public');

    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom: 16px;">
        ${renderStatusBadge(ticket.status)}
        ${renderPriorityBadge(ticket.priority)}
        <span class="badge badge-category">${escapeHtml(ticket.category)}</span>
        <span style="font-size: 12px; color: var(--text-muted); margin-left: auto;">
          Submitted ${formatDate(ticket.created_at)}
        </span>
      </div>

      <div style="background-color: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 24px; line-height: 1.6; white-space: pre-wrap;">
        ${escapeHtml(ticket.description)}
      </div>

      <!-- Messages Timeline -->
      <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">
        Conversation History (${publicMessages.length})
      </h3>

      <div class="timeline-list" style="margin-bottom: 24px;">
        ${publicMessages.length === 0 ? `
          <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
            No responses yet. A support agent will respond soon!
          </div>
        ` : publicMessages.map(msg => `
          <div class="timeline-message">
            <div class="message-header">
              <div class="message-author-info">
                <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${msg.author_role === 'agent' ? '#3b82f6' : '#10b981'}; color: white; display:flex; align-items:center; justify-content:center; font-size: 11px; font-weight: 700;">
                  ${escapeHtml(msg.author_name.charAt(0))}
                </div>
                <div>
                  <span class="message-author-name">${escapeHtml(msg.author_name)}</span>
                  <span style="font-size: 11px; color: var(--text-muted); margin-left: 4px;">
                    ${msg.author_role === 'agent' ? '(Support Agent)' : '(You)'}
                  </span>
                </div>
              </div>
              <div class="message-time">${formatDate(msg.created_at)}</div>
            </div>
            <div class="message-body">${escapeHtml(msg.content)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Customer Reply Box -->
      ${ticket.status === 'Closed' ? `
        <div style="padding: 14px; background-color: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); text-align: center; color: var(--text-muted); font-size: 13px;">
          This ticket has been closed. Please create a new support ticket if you have further inquiries.
        </div>
      ` : `
        <div class="message-composer">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">Add a Reply</div>
          <textarea id="customer-reply-content" class="form-textarea" placeholder="Type your response here..."></textarea>
          <div style="display:flex; justify-content:flex-end;">
            <button class="btn btn-primary btn-sm" onclick="CustomerPortal.submitReply()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Submit Reply
            </button>
          </div>
        </div>
      `}
    `;
  },

  async submitReply() {
    if (!this.activeTicket) return;
    const textarea = document.getElementById('customer-reply-content');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
      showToast('Please type a response before submitting.', 'error');
      return;
    }

    const customer = DemoCustomerManager.getCurrent();
    const payload = {
      author_name: customer.name,
      author_email: customer.email,
      author_role: 'customer',
      message_type: 'public',
      content,
    };

    try {
      await api.addMessage(this.activeTicket.id, payload);
      showToast('Reply submitted successfully!', 'success');
      textarea.value = '';

      // Re-fetch ticket details
      const updated = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updated;
      this.renderDetail();
      this.loadCustomerTickets();
    } catch (err) {
      showToast('Failed to post reply: ' + err.message, 'error');
    }
  }
};
