/**
 * HelpDeskX — Support Agent Dashboard & Analytics
 */

let statusChart = null;
let priorityChart = null;
let trendChart = null;

async function loadDashboard() {
  try {
    const stats = await api.getDashboardStats();
    renderStatsCards(stats);
    renderCharts(stats);
    renderWorkload(stats.agent_ticket_counts);
    renderRecentActivities(stats.recent_activities);
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    showToast('Failed to load dashboard metrics: ' + err.message, 'error');
  }
}

function renderStatsCards(stats) {
  // Update count values with animation/formatting
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val.toLocaleString();
  };

  setEl('stat-total', stats.total_tickets);
  setEl('stat-open', stats.open_tickets);
  setEl('stat-in-progress', stats.in_progress_tickets);
  setEl('stat-waiting', stats.waiting_tickets);
  setEl('stat-resolved', stats.resolved_tickets);
  setEl('stat-urgent-high', stats.urgent_priority + stats.high_priority);

  // Update sidebar count badge if present
  const sidebarCount = document.getElementById('sidebar-open-count');
  if (sidebarCount) sidebarCount.textContent = stats.open_tickets;
}

function getChartColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    textColor: isLight ? '#475569' : '#94a3b8',
    gridColor: isLight ? '#e2e8f0' : '#1e2c4a',
    cardBg: isLight ? '#ffffff' : '#131c31',
  };
}

function renderCharts(stats) {
  if (typeof Chart === 'undefined') return;

  const colors = getChartColors();

  // 1. Status Distribution (Doughnut)
  const statusCtx = document.getElementById('statusDoughnutChart')?.getContext('2d');
  if (statusCtx) {
    if (statusChart) statusChart.destroy();

    const statusLabels = Object.keys(stats.status_distribution);
    const statusData = Object.values(stats.status_distribution);
    const isEmpty = statusData.every(v => v === 0);

    statusChart = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: isEmpty ? ['No Tickets'] : statusLabels,
        datasets: [{
          data: isEmpty ? [1] : statusData,
          backgroundColor: isEmpty
            ? [colors.gridColor]
            : ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#64748b'],
          borderColor: colors.cardBg,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: { size: 11, family: 'Inter' },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            enabled: !isEmpty,
          },
        },
        cutout: '70%',
      },
    });
  }

  // 2. 7-Day Ticket Creation Trend (Line)
  const trendCtx = document.getElementById('ticketTrendChart')?.getContext('2d');
  if (trendCtx) {
    if (trendChart) trendChart.destroy();

    const trendLabels = stats.created_over_time.map(d => {
      const parts = d.date.split('-');
      return `${parts[1]}/${parts[2]}`;
    });
    const trendValues = stats.created_over_time.map(d => d.count);

    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [{
          label: 'New Tickets',
          data: trendValues,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.cardBg,
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            borderColor: colors.gridColor,
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: 'transparent' },
            ticks: { color: colors.textColor, font: { size: 11, family: 'Inter' } },
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { size: 11, family: 'Inter' },
              stepSize: 1,
              precision: 0,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  // 3. Priority Breakdown (Bar)
  const priorityCtx = document.getElementById('priorityBarChart')?.getContext('2d');
  if (priorityCtx) {
    if (priorityChart) priorityChart.destroy();

    const priorityOrder = ['Urgent', 'High', 'Medium', 'Low'];
    const priorityValues = priorityOrder.map(p => stats.priority_distribution[p] || 0);

    priorityChart = new Chart(priorityCtx, {
      type: 'bar',
      data: {
        labels: priorityOrder,
        datasets: [{
          data: priorityValues,
          backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#64748b'],
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { size: 11, family: 'Inter' } },
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { size: 11, family: 'Inter' },
              stepSize: 1,
              precision: 0,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}

function renderWorkload(agentCounts) {
  const container = document.getElementById('agent-workload-container');
  if (!container) return;

  if (!agentCounts || agentCounts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No agents currently registered.</div></div>`;
    return;
  }

  container.innerHTML = agentCounts.map(item => {
    const initials = item.agent_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const isUnassigned = !item.agent_id;
    const bgCol = isUnassigned ? '#64748b' : '#2563eb';

    return `
      <div class="agent-workload-row">
        <div class="agent-workload-info">
          <div class="agent-avatar" style="background-color: ${bgCol};">${initials}</div>
          <div>
            <div class="agent-workload-name">${escapeHtml(item.agent_name)}</div>
          </div>
        </div>
        <div class="agent-workload-count">${item.ticket_count} ${item.ticket_count === 1 ? 'ticket' : 'tickets'}</div>
      </div>
    `;
  }).join('');
}

function renderRecentActivities(activities) {
  const container = document.getElementById('recent-activity-container');
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No recent activities recorded.</div></div>`;
    return;
  }

  container.innerHTML = activities.map(act => {
    const actionClass = act.action_type || 'created';
    return `
      <div class="activity-item">
        <div class="activity-dot ${actionClass}"></div>
        <div class="activity-content">
          <div class="activity-details">${escapeHtml(act.details)}</div>
          <div class="activity-meta">
            <span><strong>${escapeHtml(act.actor_name)}</strong> (${escapeHtml(act.actor_role)})</span>
            <span>•</span>
            <span>${timeAgo(act.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Listen to theme changes to redraw charts with matched colors
window.addEventListener('themeChanged', () => {
  api.getDashboardStats().then(stats => renderCharts(stats)).catch(() => {});
});
