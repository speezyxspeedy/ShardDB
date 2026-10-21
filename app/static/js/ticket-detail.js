/**
 * HelpDeskX — Ticket Detail Drawer, Conversation Timeline, Internal Notes, and Audit Trail
 */

const TicketDetailModal = {
  activeTicket: null,
  activeMessageType: 'public', // 'public' or 'internal_note'

  async open(ticketId) {
    const backdrop = document.getElementById('ticket-drawer-backdrop');
    if (!backdrop) return;

    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show loading skeleton in drawer
    this.renderLoading();

    try {
      const ticket = await api.getTicket(ticketId);
      this.activeTicket = ticket;
      this.render();
    } catch (err) {
      showToast('Error opening ticket: ' + err.message, 'error');
      this.close();
    }
  },

  close() {
    const backdrop = document.getElementById('ticket-drawer-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
    this.activeTicket = null;
  },

  renderLoading() {
    const panel = document.getElementById('drawer-main-content');
    if (panel) {
      panel.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--text-muted);">
          <div style="display:inline-block; width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <div style="margin-top: 12px; font-size: 13px;">Loading ticket details...</div>
        </div>
      `;
    }
  },

  async render() {
    const ticket = this.activeTicket;
    if (!ticket) return;

    // Header info
    const numEl = document.getElementById('drawer-ticket-number');
    if (numEl) numEl.textContent = ticket.ticket_number;

    const statusBadgeEl = document.getElementById('drawer-ticket-status-badge');
    if (statusBadgeEl) statusBadgeEl.innerHTML = renderStatusBadge(ticket.status);

    const priorityBadgeEl = document.getElementById('drawer-ticket-priority-badge');
    if (priorityBadgeEl) priorityBadgeEl.innerHTML = renderPriorityBadge(ticket.priority);

    // Main Content
    const mainEl = document.getElementById('drawer-main-content');
    if (mainEl) {
      mainEl.innerHTML = `
        <div style="border-bottom: 1px solid var(--border); padding-bottom: 16px;">
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;">
            ${escapeHtml(ticket.title)}
          </h2>
          <div style="background-color: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; font-size: 13px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap;">
            ${escapeHtml(ticket.description)}
          </div>
        </div>

        <!-- Conversation Timeline -->
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); display:flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Conversation History (${ticket.messages ? ticket.messages.length : 0})
            </h3>
          </div>
          
          <div class="timeline-list" id="drawer-messages-list">
            ${this.renderMessages(ticket.messages)}
          </div>
        </div>

        <!-- Composer Box -->
        <div class="message-composer">
          <div class="composer-tabs">
            <button type="button" class="composer-tab-btn ${this.activeMessageType === 'public' ? 'active' : ''}" onclick="TicketDetailModal.setMessageType('public')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              Public Reply
            </button>
            <button type="button" class="composer-tab-btn internal ${this.activeMessageType === 'internal_note' ? 'active' : ''}" onclick="TicketDetailModal.setMessageType('internal_note')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Internal Note (Team only)
            </button>
          </div>

          <div style="position:relative;">
            <textarea
              id="drawer-reply-content"
              class="form-textarea"
              style="min-height: 100px; ${this.activeMessageType === 'internal_note' ? 'border-color: var(--warning); background-color: var(--note-bg);' : ''}"
              placeholder="${this.activeMessageType === 'internal_note' ? 'Add a private note visible only to support agents...' : 'Type a response to the customer...'}"
            ></textarea>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="font-size: 11px; color: var(--text-muted);">
              ${this.activeMessageType === 'internal_note'
                ? '<span style="color:var(--warning); font-weight:600;">⚠ Internal note will not be shown to customer</span>'
                : '<span>Customer will see this reply in their portal</span>'}
            </div>
            <button type="button" class="btn ${this.activeMessageType === 'internal_note' ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="TicketDetailModal.submitMessage()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              ${this.activeMessageType === 'internal_note' ? 'Add Note' : 'Send Reply'}
            </button>
          </div>
        </div>

        <!-- Audit Activity Trail -->
        <div style="border-top: 1px solid var(--border); padding-top: 16px;">
          <h3 style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; display:flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>
            Activity Audit Trail
          </h3>
          <div class="activity-list" style="max-height: 240px;">
            ${this.renderActivities(ticket.activities)}
          </div>
        </div>
      `;
    }

    // Sidebar Info & Actions
    const sidebarEl = document.getElementById('drawer-sidebar-content');
    if (sidebarEl) {
      const agents = await api.getAgents().catch(() => []);
      
      sidebarEl.innerHTML = `
        <!-- Actions Card -->
        <div style="background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
            Manage Ticket
          </div>

          <!-- Status Dropdown -->
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="drawer-change-status" onchange="TicketDetailModal.updateStatus(this.value)">
              <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
              <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Waiting for Customer" ${ticket.status === 'Waiting for Customer' ? 'selected' : ''}>Waiting for Customer</option>
              <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
              <option value="Closed" ${ticket.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>

          <!-- Priority Dropdown -->
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select" id="drawer-change-priority" onchange="TicketDetailModal.updatePriority(this.value)">
              <option value="Low" ${ticket.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Medium" ${ticket.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="High" ${ticket.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Urgent" ${ticket.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>

          <!-- Assignee Dropdown -->
          <div class="form-group">
            <label class="form-label">Assignee</label>
            <select class="form-select" id="drawer-change-assignee" onchange="TicketDetailModal.assignAgent(this.value)">
              <option value="0">Unassigned</option>
              ${agents.map(a => `<option value="${a.id}" ${ticket.assigned_agent_id === a.id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
            </select>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
            ${ticket.status !== 'Resolved' ? `
              <button class="btn btn-success btn-sm" onclick="TicketDetailModal.quickResolve()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Mark as Resolved
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" onclick="TicketDetailModal.quickReopen()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                Reopen Ticket
              </button>
            `}
            
            ${ticket.status !== 'Closed' ? `
              <button class="btn btn-outline btn-sm" onclick="TicketDetailModal.quickClose()">
                Close Ticket
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Customer & Ticket Meta -->
        <div style="background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
            Customer Details
          </div>
          <div>
            <div style="color:var(--text-muted); font-size:11px;">Customer Name</div>
            <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(ticket.customer_name)}</div>
          </div>
          <div>
            <div style="color:var(--text-muted); font-size:11px;">Email Address</div>
            <div style="color:var(--primary); word-break:break-all;">${escapeHtml(ticket.customer_email)}</div>
          </div>
          <div style="border-top:1px solid var(--border); padding-top:8px;">
            <div style="color:var(--text-muted); font-size:11px;">Category</div>
            <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(ticket.category)}</div>
          </div>
          <div>
            <div style="color:var(--text-muted); font-size:11px;">Created</div>
            <div>${formatDate(ticket.created_at)}</div>
          </div>
          <div>
            <div style="color:var(--text-muted); font-size:11px;">Last Updated</div>
            <div>${formatDate(ticket.updated_at)}</div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div style="margin-top:auto; padding-top:12px;">
          <button class="btn btn-danger btn-sm" style="width:100%;" onclick="TicketDetailModal.confirmDelete()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete Ticket
          </button>
        </div>
      `;
    }
  },

  renderMessages(messages) {
    if (!messages || messages.length === 0) {
      return `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
          No messages in this ticket thread yet.
        </div>
      `;
    }

    return messages.map(msg => {
      const isInternal = msg.message_type === 'internal_note';
      const isAgent = msg.author_role === 'agent';
      const roleColor = isInternal ? '#f59e0b' : isAgent ? '#3b82f6' : '#10b981';

      return `
        <div class="timeline-message ${isInternal ? 'internal-note' : ''}">
          <div class="message-header">
            <div class="message-author-info">
              <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${roleColor}; color: white; display:flex; align-items:center; justify-content:center; font-size: 11px; font-weight: 700;">
                ${escapeHtml(msg.author_name.charAt(0))}
              </div>
              <div>
                <span class="message-author-name">${escapeHtml(msg.author_name)}</span>
                <span style="font-size: 11px; color: var(--text-muted); margin-left: 4px;">
                  (${escapeHtml(msg.author_role)})
                </span>
              </div>
              ${isInternal ? '<span class="internal-note-badge">Internal Note</span>' : ''}
            </div>
            <div class="message-time">${formatDate(msg.created_at)}</div>
          </div>
          <div class="message-body">${escapeHtml(msg.content)}</div>
        </div>
      `;
    }).join('');
  },

  renderActivities(activities) {
    if (!activities || activities.length === 0) {
      return `<div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">No activity recorded yet.</div>`;
    }

    return activities.map(act => `
      <div class="activity-item">
        <div class="activity-dot ${act.action_type}"></div>
        <div class="activity-content">
          <div class="activity-details">${escapeHtml(act.details)}</div>
          <div class="activity-meta">
            <span><strong>${escapeHtml(act.actor_name)}</strong></span>
            <span>•</span>
            <span>${timeAgo(act.created_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  setMessageType(type) {
    this.activeMessageType = type;
    this.render();
  },

  async submitMessage() {
    if (!this.activeTicket) return;
    const textarea = document.getElementById('drawer-reply-content');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
      showToast('Please type a message before submitting.', 'error');
      return;
    }

    const currentAgent = DemoAgentManager.getCurrent();
    const payload = {
      author_name: currentAgent.name,
      author_email: currentAgent.email,
      author_role: 'agent',
      message_type: this.activeMessageType,
      content,
    };

    try {
      await api.addMessage(this.activeTicket.id, payload);
      showToast(this.activeMessageType === 'internal_note' ? 'Internal note added' : 'Reply sent', 'success');
      textarea.value = '';
      
      // Refresh ticket data
      const updatedTicket = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updatedTicket;
      this.render();

      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Failed to send message: ' + err.message, 'error');
    }
  },

  async updateStatus(newStatus) {
    if (!this.activeTicket) return;
    const agent = DemoAgentManager.getCurrent();
    try {
      await api.updateStatus(this.activeTicket.id, newStatus, agent);
      showToast(`Status updated to ${newStatus}`, 'success');
      const updated = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updated;
      this.render();
      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error');
    }
  },

  async updatePriority(newPriority) {
    if (!this.activeTicket) return;
    const agent = DemoAgentManager.getCurrent();
    try {
      await api.updatePriority(this.activeTicket.id, newPriority, agent);
      showToast(`Priority changed to ${newPriority}`, 'success');
      const updated = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updated;
      this.render();
      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Error updating priority: ' + err.message, 'error');
    }
  },

  async assignAgent(agentId) {
    if (!this.activeTicket) return;
    const agent = DemoAgentManager.getCurrent();
    const parsedId = agentId === '0' || !agentId ? null : parseInt(agentId, 10);
    try {
      await api.assignTicket(this.activeTicket.id, parsedId, agent);
      showToast(parsedId ? 'Ticket assigned' : 'Ticket unassigned', 'success');
      const updated = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updated;
      this.render();
      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Error assigning ticket: ' + err.message, 'error');
    }
  },

  async quickResolve() {
    if (!this.activeTicket) return;
    const agent = DemoAgentManager.getCurrent();
    try {
      await api.resolveTicket(this.activeTicket.id, agent);
      showToast('Ticket marked as Resolved', 'success');
      const updated = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updated;
      this.render();
      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Error resolving ticket: ' + err.message, 'error');
    }
  },

  async quickReopen() {
    if (!this.activeTicket) return;
    const agent = DemoAgentManager.getCurrent();
    try {
      await api.reopenTicket(this.activeTicket.id, agent);
      showToast('Ticket reopened', 'info');
      const updated = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updated;
      this.render();
      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Error reopening ticket: ' + err.message, 'error');
    }
  },

  async quickClose() {
    if (!this.activeTicket) return;
    const agent = DemoAgentManager.getCurrent();
    try {
      await api.closeTicket(this.activeTicket.id, agent);
      showToast('Ticket closed', 'info');
      const updated = await api.getTicket(this.activeTicket.id);
      this.activeTicket = updated;
      this.render();
      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Error closing ticket: ' + err.message, 'error');
    }
  },

  confirmDelete() {
    if (!this.activeTicket) return;
    if (confirm(`Are you sure you want to permanently delete ticket ${this.activeTicket.ticket_number}? This action cannot be undone.`)) {
      this.executeDelete();
    }
  },

  async executeDelete() {
    try {
      await api.deleteTicket(this.activeTicket.id);
      showToast(`Ticket ${this.activeTicket.ticket_number} deleted`, 'info');
      this.close();
      TicketManager.loadTickets();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
      showToast('Failed to delete ticket: ' + err.message, 'error');
    }
  }
};
