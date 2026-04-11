/* ============================================================
   AI Agent Platform — Prototype Navigation & Interactivity
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initStateTabs();
  initViewToggle();
  initFilterChips();
  initBuilderTabs();
  initSkillEditorTabs();
  initToggleSwitches();
  // New interactions
  initHamburger();
  initChatInteractions();
  initAgentInteractions();
  initGalleryInteractions();
  initBuilderInteractions();
  initTrainingInteractions();
  initAnalyticsInteractions();
  initEvalInteractions();
  initSettingsInteractions();
  initNotificationNav();
  initPersonaSwitcher();
  initBuilderRoleSelector();
  // Super Agent page interactions
  initWorkspaceInteractions();
  initApprovalInteractions();
  initMaturityInteractions();
  initTriggerInteractions();
  initEmbeddedInteractions();
  initBenchmarkingInteractions();
});

/* ---- Navigation ---- */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.dataset.page;
      switchPage(pageId);
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
}

/* ---- State Tabs (Empty / Loading / Populated) ---- */
function initStateTabs() {
  document.querySelectorAll('.state-tabs').forEach(group => {
    const tabs = group.querySelectorAll('.state-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const state = tab.dataset.state;
        const page = group.closest('.page');
        if (!page) return;

        page.querySelectorAll('[data-view-state]').forEach(el => {
          el.style.display = el.dataset.viewState === state ? '' : 'none';
        });
      });
    });
  });
}

/* ---- Agent View Toggle (Grid / Table) ---- */
function initViewToggle() {
  const toggleBtns = document.querySelectorAll('.view-toggle button');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.view-toggle');
      parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const view = btn.dataset.view;
      const agentPage = btn.closest('.page');
      if (!agentPage) return;

      const grid = agentPage.querySelector('.agents-grid');
      const table = agentPage.querySelector('.agents-table-wrap');
      if (grid) grid.style.display = view === 'grid' ? '' : 'none';
      if (table) table.style.display = view === 'table' ? '' : 'none';
    });
  });
}

/* ---- Filter Chips ---- */
function initFilterChips() {
  document.querySelectorAll('.filter-chips').forEach(group => {
    const chips = group.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Single-select behavior
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  });
}

/* ---- Builder Left Panel Tabs ---- */
function initBuilderTabs() {
  const tabGroups = document.querySelectorAll('.builder-left-tabs');
  tabGroups.forEach(group => {
    const tabs = group.querySelectorAll('button');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  });
}

/* ---- Skill Editor Tabs ---- */
function initSkillEditorTabs() {
  const tabGroups = document.querySelectorAll('.skill-editor-tabs');
  tabGroups.forEach(group => {
    const tabs = group.querySelectorAll('button');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  });
}

/* ---- Toggle Switches ---- */
function initToggleSwitches() {
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('on');
    });
  });
}

/* ============================================================
   NEW INTERACTIONS
   ============================================================ */

/* ---- 1. Hamburger Menu (mobile responsive) ---- */
function initHamburger() {
  const hamburger = document.querySelector('.hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (!hamburger) return;

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('visible');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });
}

/* ---- 2. Toast Notification System ---- */
function showToast(message, type, duration) {
  if (type === undefined) type = 'success';
  if (duration === undefined) duration = 3000;

  const container = document.querySelector('.toast-container');
  if (!container) return;

  var icons = { success: '\u2713', error: '\u2717', warning: '\u26A0', info: '\u2139' };
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML =
    '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
    '<span class="toast-message">' + message + '</span>' +
    '<button class="toast-close" aria-label="Dismiss">\u00D7</button>';

  container.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', function() { removeToast(toast); });
  setTimeout(function() { removeToast(toast); }, duration);
}

function removeToast(toast) {
  if (!toast || toast.classList.contains('removing')) return;
  toast.classList.add('removing');
  setTimeout(function() { toast.remove(); }, 300);
}

/* ---- 3. Confirmation Dialog System ---- */
function showConfirmDialog(options) {
  var title = options.title || 'Confirm';
  var message = options.message || '';
  var confirmText = options.confirmText || 'Confirm';
  var cancelText = options.cancelText || 'Cancel';
  var type = options.type || 'primary';
  var onConfirm = options.onConfirm;

  var overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;

  var titleEl = overlay.querySelector('.modal-title');
  var bodyEl = overlay.querySelector('.modal-body');
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.textContent = message;

  var confirmBtn = overlay.querySelector('.btn-confirm');
  if (confirmBtn) {
    confirmBtn.textContent = confirmText;
    confirmBtn.className = 'btn-confirm ' + type;
  }

  var cancelBtn = overlay.querySelector('.btn-cancel');
  if (cancelBtn) cancelBtn.textContent = cancelText;

  // Remove old listeners by cloning
  if (confirmBtn) {
    var newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    newConfirm.addEventListener('click', function() {
      overlay.classList.remove('visible');
      if (onConfirm) onConfirm();
    });
  }

  if (cancelBtn) {
    var newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    newCancel.addEventListener('click', function() {
      overlay.classList.remove('visible');
    });
  }

  overlay.classList.add('visible');
}

/* ---- 4. Chat Interactions ---- */
function initChatInteractions() {
  // +New Chat button
  var newChatBtn = document.querySelector('#page-chat .btn-primary');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', function() {
      var list = document.querySelector('.chat-sidebar-list');
      if (!list) return;
      var newItem = document.createElement('div');
      newItem.className = 'conversation-item active';
      newItem.innerHTML =
        '<div class="avatar avatar-sm" style="background:var(--tp-primary)">NC</div>' +
        '<div class="conversation-meta">' +
          '<div class="conversation-title">New Conversation</div>' +
          '<div class="conversation-time">Just now</div>' +
        '</div>';
      // Deselect all others
      list.querySelectorAll('.conversation-item').forEach(function(i) { i.classList.remove('active'); });
      list.prepend(newItem);
      // Add click handler to the new item
      newItem.addEventListener('click', function() {
        list.querySelectorAll('.conversation-item').forEach(function(i) { i.classList.remove('active'); });
        newItem.classList.add('active');
      });
      showToast('New conversation created', 'success');
    });
  }

  // Search conversations
  var searchInput = document.querySelector('#page-chat .chat-sidebar-header input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      var query = e.target.value.toLowerCase();
      document.querySelectorAll('.conversation-item').forEach(function(item) {
        var titleEl = item.querySelector('.conversation-title');
        var title = titleEl ? titleEl.textContent.toLowerCase() : '';
        item.style.display = title.includes(query) ? '' : 'none';
      });
    });
  }

  // Conversation click -> switch active
  document.querySelectorAll('.conversation-item').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.conversation-item').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });

  // Send message
  var sendBtn = document.querySelector('.chat-send-btn');
  var chatInput = document.querySelector('.chat-input-area textarea') ||
                  document.querySelector('.chat-input-area input[type="text"]');

  if (sendBtn && chatInput) {
    var sendMessage = function() {
      var text = chatInput.value.trim();
      if (!text) {
        showToast('Cannot send empty message', 'warning');
        return;
      }
      var chatArea = document.querySelector('.chat-messages');
      if (chatArea) {
        var msgDiv = document.createElement('div');
        msgDiv.className = 'message message-user';
        // XSS prevention: escape HTML entities
        var escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        var now = new Date();
        var timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        msgDiv.innerHTML =
          '<div class="message-bubble user-bubble">' +
            '<div class="message-content">' + escaped + '</div>' +
            '<div class="message-meta"><span class="message-time">' + timeStr + '</span></div>' +
          '</div>';
        chatArea.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
      }
      chatInput.value = '';
      updateCharCounter(chatInput);
    };

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Character counter
  if (chatInput) {
    // Create counter element if not exists
    var counter = chatInput.parentElement ? chatInput.parentElement.querySelector('.char-counter') : null;
    if (!counter && chatInput.parentElement) {
      counter = document.createElement('div');
      counter.className = 'char-counter';
      chatInput.parentElement.appendChild(counter);
    }
    chatInput.addEventListener('input', function() { updateCharCounter(chatInput); });
  }

  // Attach button
  var attachBtn = document.querySelector('.chat-input-area .btn-ghost') ||
                  document.querySelector('.chat-input-area button[title="Attach"]');
  if (attachBtn) {
    attachBtn.addEventListener('click', function() {
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.accept = '.pdf,.csv,.json,.txt,.xlsx,.doc,.docx';
      fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
          showToast(e.target.files.length + ' file(s) attached', 'info');
        }
      });
      fileInput.click();
    });
  }

  // Feedback buttons (thumbs up/down/copy)
  document.querySelectorAll('.message-actions button, .feedback-actions button').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var text = btn.textContent.trim();
      if (text.indexOf('\uD83D\uDC4D') !== -1) {
        showToast('Marked as helpful', 'success');
        btn.style.opacity = '0.5';
      } else if (text.indexOf('\uD83D\uDC4E') !== -1) {
        showToast('Marked as unhelpful', 'info');
        btn.style.opacity = '0.5';
      } else if (text.indexOf('\uD83D\uDCCB') !== -1) {
        var msgEl = btn.closest('.message') || btn.closest('.agent-message');
        var msgContent = msgEl ? msgEl.querySelector('.message-content') : null;
        if (msgContent && navigator.clipboard) {
          navigator.clipboard.writeText(msgContent.textContent).then(function() {
            showToast('Copied to clipboard', 'success');
          });
        }
      }
    });
  });
}

function updateCharCounter(input) {
  if (!input || !input.parentElement) return;
  var counter = input.parentElement.querySelector('.char-counter');
  if (!counter) return;
  var len = input.value.length;
  var max = 4000;
  counter.textContent = len + ' / ' + max;
  if (len > max * 0.8) {
    counter.classList.add('near-limit');
  } else {
    counter.classList.remove('near-limit');
  }
  if (len >= max) {
    counter.classList.add('at-limit');
  } else {
    counter.classList.remove('at-limit');
  }
}

/* ---- 5. Agent Card Interactions ---- */
function initAgentInteractions() {
  // Context menu toggle
  document.querySelectorAll('.context-menu-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Close all other menus
      document.querySelectorAll('.context-menu.visible').forEach(function(m) { m.classList.remove('visible'); });
      var menu = btn.nextElementSibling;
      if (menu && menu.classList.contains('context-menu')) {
        menu.classList.toggle('visible');
      }
    });
  });

  // Close context menus on click outside
  document.addEventListener('click', function() {
    document.querySelectorAll('.context-menu.visible').forEach(function(m) { m.classList.remove('visible'); });
  });

  // Delete agent action
  document.querySelectorAll('.context-menu-item.danger, .context-menu-item[data-action="delete"]').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      var card = item.closest('.agent-card');
      var nameEl = card ? (card.querySelector('.agent-card-name') || card.querySelector('.card-title')) : null;
      var name = nameEl ? nameEl.textContent : 'this agent';
      showConfirmDialog({
        title: 'Delete Agent',
        message: 'Are you sure you want to delete "' + name + '"? This action cannot be undone.',
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: function() {
          if (card) card.remove();
          showToast('Agent "' + name + '" deleted', 'success');
        }
      });
    });
  });

  // Sorting
  var sortSelect = document.querySelector('#page-agents .sort-dropdown select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      showToast('Sorted by ' + sortSelect.value, 'info');
    });
  }
}

/* ---- 6. Gallery Interactions ---- */
function initGalleryInteractions() {
  // Category filter chips
  var galleryChips = document.querySelectorAll('#page-gallery .filter-chips .chip, #page-gallery .category-chip');
  galleryChips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      galleryChips.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');

      var category = chip.dataset.category || chip.textContent.trim().toLowerCase();
      var cards = document.querySelectorAll('#page-gallery .template-card, #page-gallery .gallery-card');
      cards.forEach(function(card) {
        if (category === 'all') {
          card.style.display = '';
        } else {
          var catEl = card.querySelector('.template-category') || card.querySelector('.card-category');
          var cardCat = card.dataset.category || (catEl ? catEl.textContent.trim().toLowerCase() : '');
          card.style.display = cardCat.includes(category) ? '' : 'none';
        }
      });
    });
  });

  // Gallery search
  var gallerySearch = document.querySelector('#page-gallery input[type="text"]');
  if (gallerySearch) {
    gallerySearch.addEventListener('input', function(e) {
      var query = e.target.value.toLowerCase();
      document.querySelectorAll('#page-gallery .template-card, #page-gallery .gallery-card').forEach(function(card) {
        var text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // "Build from Scratch" button
  var buildFromScratchBtn = document.querySelector('#page-gallery .btn-build-scratch') ||
                            document.querySelector('#page-gallery button[data-action="build-scratch"]');
  if (buildFromScratchBtn) {
    buildFromScratchBtn.addEventListener('click', function() {
      switchPage('page-builder');
      document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
      var builderNav = document.querySelector('.nav-item[data-page="page-builder"]');
      if (builderNav) builderNav.classList.add('active');
      showToast('Starting new agent from scratch', 'success');
    });
  }

  // "Use Template" buttons
  document.querySelectorAll('#page-gallery .btn-use-template, #page-gallery button[data-action="use-template"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var card = btn.closest('.template-card') || btn.closest('.gallery-card');
      var nameEl = card ? (card.querySelector('.template-name') || card.querySelector('.card-title')) : null;
      var name = nameEl ? nameEl.textContent : 'Template';
      switchPage('page-builder');
      document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
      var builderNav = document.querySelector('.nav-item[data-page="page-builder"]');
      if (builderNav) builderNav.classList.add('active');
      showToast('Loading template: ' + name, 'info');
    });
  });
}

/* ---- 7. Builder Interactions ---- */
function initBuilderInteractions() {
  var hasUnsavedChanges = false;

  document.querySelectorAll('#page-builder button').forEach(function(btn) {
    var text = btn.textContent.trim();
    if (text === 'Save Draft') {
      btn.addEventListener('click', function() {
        hasUnsavedChanges = false;
        showToast('Draft saved successfully', 'success');
      });
    }
    if (text === 'Publish') {
      btn.addEventListener('click', function() {
        showConfirmDialog({
          title: 'Publish Agent',
          message: 'This will make the agent available to your team. Continue?',
          confirmText: 'Publish',
          type: 'primary',
          onConfirm: function() {
            hasUnsavedChanges = false;
            showToast('Agent published to gallery', 'success');
          }
        });
      });
    }
    if (text === 'Test') {
      btn.addEventListener('click', function() {
        showToast('Running test...', 'info');
      });
    }
    if (text === 'Fork') {
      btn.addEventListener('click', function() {
        showToast('Agent forked — editing your copy', 'success');
      });
    }
  });

  // Unsaved changes warning
  document.querySelectorAll('#page-builder textarea, #page-builder input').forEach(function(input) {
    input.addEventListener('input', function() { hasUnsavedChanges = true; });
  });
  window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Keyboard DnD alternative: "Add" buttons on capability items
  document.querySelectorAll('.capability-add-btn, .library-item .btn-add').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.closest('.library-item') || btn.closest('.capability-item');
      var nameEl = item ? item.querySelector('.item-name') : null;
      var name = nameEl ? nameEl.textContent : 'Item';
      showToast('Added "' + name + '" to agent', 'success');
    });
  });
}

/* ---- 8. Training Interactions ---- */
function initTrainingInteractions() {
  document.querySelectorAll('#page-training button').forEach(function(btn) {
    var text = btn.textContent.trim();
    if (text.includes('Stop') || text.includes('Cancel')) {
      btn.addEventListener('click', function() {
        showConfirmDialog({
          title: 'Stop Training',
          message: 'Are you sure you want to stop this training job? Progress will be lost.',
          confirmText: 'Stop Training',
          type: 'danger',
          onConfirm: function() {
            showToast('Training job stopped', 'warning');
          }
        });
      });
    }
    if (text.includes('Retry')) {
      btn.addEventListener('click', function() {
        showToast('Retrying training job...', 'info');
      });
    }
  });
}

/* ---- 9. Analytics Interactions ---- */
function initAnalyticsInteractions() {
  // Date range picker
  document.querySelectorAll('#page-analytics .date-range-picker button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var picker = btn.closest('.date-range-picker');
      if (picker) {
        picker.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
      }
      btn.classList.add('active');
      showToast('Date range: ' + btn.textContent.trim(), 'info');
    });
  });

  // Refresh
  document.querySelectorAll('#page-analytics .btn-refresh').forEach(function(btn) {
    btn.addEventListener('click', function() {
      showToast('Dashboard refreshed', 'success');
    });
  });

  // Export
  document.querySelectorAll('#page-analytics button').forEach(function(btn) {
    if (btn.textContent.trim().includes('Export')) {
      btn.addEventListener('click', function() {
        showToast('Exporting analytics data...', 'info');
      });
    }
  });
}

/* ---- 10. Eval Interactions ---- */
function initEvalInteractions() {
  document.querySelectorAll('#page-eval button').forEach(function(btn) {
    var text = btn.textContent.trim();
    if (text.includes('Run Eval')) {
      btn.addEventListener('click', function() {
        showToast('Evaluation started — this may take a few minutes', 'info');
      });
    }
    if (text.includes('Add Test') || text.includes('New Test')) {
      btn.addEventListener('click', function() {
        showToast('Opening test case editor...', 'info');
      });
    }
  });

  // Category filter tabs
  document.querySelectorAll('#page-eval .eval-tabs .chip, #page-eval .filter-chips .chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var category = chip.textContent.trim().toLowerCase();
      document.querySelectorAll('#page-eval table tbody tr').forEach(function(row) {
        if (category === 'all') {
          row.style.display = '';
        } else {
          var cell = row.querySelector('td:nth-child(2)');
          var rowCat = cell ? cell.textContent.trim().toLowerCase() : '';
          row.style.display = rowCat.includes(category) ? '' : 'none';
        }
      });
    });
  });
}

/* ---- 11. Settings Interactions ---- */
function initSettingsInteractions() {
  // Save settings
  document.querySelectorAll('#page-settings button').forEach(function(btn) {
    var text = btn.textContent.trim();
    if (text.includes('Save') || text.includes('Apply')) {
      btn.addEventListener('click', function() {
        showToast('Settings saved', 'success');
      });
    }
    if (text.includes('Reset')) {
      btn.addEventListener('click', function() {
        showConfirmDialog({
          title: 'Reset to Defaults',
          message: 'This will reset all settings in this section to their default values. Continue?',
          confirmText: 'Reset',
          type: 'danger',
          onConfirm: function() {
            showToast('Settings reset to defaults', 'warning');
          }
        });
      });
    }
  });

  // Settings navigation
  document.querySelectorAll('#page-settings .settings-nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var sectionId = item.dataset.section;
      var section = document.querySelector('#page-settings .settings-section[data-section="' + sectionId + '"]');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      document.querySelectorAll('.settings-nav-item').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });
}

/* ---- 12. Notification Navigation ---- */
function initNotificationNav() {
  // If notification bell in header, toggle notification dropdown
  var bellBtn = document.querySelector('.notification-bell');
  if (bellBtn) {
    bellBtn.addEventListener('click', function() {
      switchPage('page-notifications');
      document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
      var notifNav = document.querySelector('.nav-item[data-page="page-notifications"]');
      if (notifNav) notifNav.classList.add('active');
    });
  }
}

/* ---- 13. Persona Switcher ---- */

// Role-based navigation visibility
var ROLE_NAV = {
  'platform-admin': ['page-chat','page-agents','page-gallery','page-builder','page-skills','page-training','page-analytics','page-eval','page-audit','page-pipeline','page-notifications','page-knowledge','page-comparison','page-settings','page-workspace','page-approval','page-maturity','page-triggers','page-benchmarking','page-embedded'],
  'tenant-admin': ['page-chat','page-agents','page-gallery','page-builder','page-skills','page-training','page-analytics','page-audit','page-pipeline','page-notifications','page-knowledge','page-comparison','page-settings','page-workspace','page-approval','page-maturity','page-triggers'],
  'agent-designer': ['page-chat','page-agents','page-gallery','page-builder','page-skills','page-training','page-analytics','page-pipeline','page-notifications','page-knowledge','page-comparison','page-workspace','page-approval','page-maturity','page-triggers'],
  'user': ['page-chat','page-agents','page-gallery','page-notifications','page-workspace','page-embedded'],
  'viewer': ['page-agents','page-gallery','page-audit','page-pipeline','page-notifications','page-analytics','page-comparison','page-maturity']
};

// Role-based action button visibility
var ROLE_ACTIONS = {
  'platform-admin': ['btn-new-agent','btn-build-scratch','btn-delete','btn-publish','btn-fork','btn-approve','btn-reject'],
  'tenant-admin': ['btn-new-agent','btn-build-scratch','btn-delete','btn-publish','btn-fork','btn-approve','btn-reject'],
  'agent-designer': ['btn-new-agent','btn-build-scratch','btn-fork','btn-publish'],
  'user': ['btn-fork'],
  'viewer': []
};

var ROLE_LABELS = {
  'platform-admin': 'Platform Admin',
  'tenant-admin': 'Tenant Admin',
  'agent-designer': 'Agent Designer',
  'user': 'Regular User',
  'viewer': 'Viewer'
};

function initPersonaSwitcher() {
  var select = document.getElementById('persona-select');
  if (!select) return;

  // Restore from localStorage
  var stored = localStorage.getItem('emsist-persona');
  if (stored && ROLE_LABELS[stored]) {
    select.value = stored;
    applyPersona(stored);
  }

  select.addEventListener('change', function() {
    var role = select.value;
    applyPersona(role);
    localStorage.setItem('emsist-persona', role);
    showToast('Switched to ' + ROLE_LABELS[role] + ' view', 'info');
  });
}

function applyPersona(role) {
  var badge = document.getElementById('role-badge');
  if (badge) {
    badge.textContent = ROLE_LABELS[role];
    // Remove old role-* class
    var classes = badge.className.split(' ');
    var filtered = [];
    for (var i = 0; i < classes.length; i++) {
      if (classes[i].indexOf('role-') !== 0) {
        filtered.push(classes[i]);
      }
    }
    filtered.push('role-badge');
    filtered.push('role-' + role);
    badge.className = filtered.join(' ');
  }

  var allowedPages = ROLE_NAV[role] || [];
  var allowedActions = ROLE_ACTIONS[role] || [];

  // Toggle nav items
  var navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(function(item) {
    var page = item.dataset.page;
    if (allowedPages.indexOf(page) === -1) {
      item.setAttribute('data-role-hidden', 'true');
    } else {
      item.removeAttribute('data-role-hidden');
    }
  });

  // Toggle action buttons by class
  var allActionClasses = ['btn-new-agent','btn-build-scratch','btn-delete','btn-publish','btn-fork','btn-approve','btn-reject'];
  allActionClasses.forEach(function(cls) {
    var buttons = document.querySelectorAll('.' + cls);
    buttons.forEach(function(btn) {
      if (allowedActions.indexOf(cls) === -1) {
        btn.setAttribute('data-role-hidden', 'true');
      } else {
        btn.removeAttribute('data-role-hidden');
      }
    });
  });

  // If current active page is hidden, switch to first visible page
  var activeNav = document.querySelector('.nav-item.active[data-page]');
  if (activeNav && activeNav.getAttribute('data-role-hidden') === 'true') {
    var firstVisible = document.querySelector('.nav-item[data-page]:not([data-role-hidden])');
    if (firstVisible) {
      firstVisible.click();
    }
  }
}

/* ---- Builder Role Selector ---- */
function initBuilderRoleSelector() {
  var roleSelect = document.getElementById('builder-role-select');
  var domainAssign = document.getElementById('builder-domain-assign');
  if (!roleSelect || !domainAssign) return;

  roleSelect.addEventListener('change', function() {
    // Show domain assignment only for Sub-Orchestrator
    domainAssign.style.display = (roleSelect.value === 'sub-orchestrator') ? 'block' : 'none';
    showToast('Agent role set to: ' + roleSelect.options[roleSelect.selectedIndex].text, 'info');
  });
}

/* ============================================================
   SUPER AGENT PAGE INTERACTIONS
   ============================================================ */

/* ---- 14. Workspace Interactions ---- */
function initWorkspaceInteractions() {
  // Domain selector changes routing indicator
  var domainSelect = document.getElementById('workspace-domain');
  var routingBadge = document.querySelector('.workspace-routing-badge');
  if (domainSelect && routingBadge) {
    domainSelect.addEventListener('change', function() {
      var labels = {
        'ea': 'EA Domain',
        'performance': 'Performance',
        'grc': 'GRC',
        'km': 'Knowledge Management',
        'service-design': 'Service Design'
      };
      routingBadge.textContent = 'Routing: ' + (labels[domainSelect.value] || domainSelect.value);
      showToast('Switched to ' + (labels[domainSelect.value] || domainSelect.value) + ' domain', 'info');
    });
  }

  // Knowledge panel toggle
  var knowledgeToggle = document.querySelector('.workspace-knowledge-toggle');
  if (knowledgeToggle) {
    knowledgeToggle.addEventListener('click', function() {
      var content = knowledgeToggle.nextElementSibling;
      var chevron = knowledgeToggle.querySelector('.workspace-knowledge-chevron');
      var isExpanded = knowledgeToggle.getAttribute('aria-expanded') === 'true';
      if (content) {
        content.style.display = isExpanded ? 'none' : '';
      }
      if (chevron) {
        chevron.style.transform = isExpanded ? 'rotate(-90deg)' : '';
      }
      knowledgeToggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    });
    knowledgeToggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        knowledgeToggle.click();
      }
    });
  }
}

/* ---- 15. Approval Queue Interactions ---- */
function initApprovalInteractions() {
  // Filter chips toggle with card filtering
  var filterChips = document.querySelectorAll('#page-approval .filter-chips .chip');
  filterChips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      filterChips.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      var filter = chip.dataset.filter;
      document.querySelectorAll('#page-approval .approval-card').forEach(function(card) {
        if (filter === 'all') {
          card.style.display = '';
        } else {
          card.style.display = card.dataset.type === filter ? '' : 'none';
        }
      });
    });
  });

  // Card expand/collapse on click
  document.querySelectorAll('.approval-card-expand').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var card = btn.closest('.approval-card');
      var preview = card ? card.querySelector('.approval-card-preview') : null;
      if (preview) {
        var isOpen = preview.style.display !== 'none';
        preview.style.display = isOpen ? 'none' : '';
        btn.textContent = isOpen ? '\u25BC' : '\u25B2';
      }
    });
  });

  // Approve/Reject/Revise buttons
  document.querySelectorAll('#page-approval .btn-approve').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var card = btn.closest('.approval-card');
      showToast('Approved successfully', 'success');
      if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
      }
    });
  });
  document.querySelectorAll('#page-approval .btn-reject').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      showToast('Rejected and returned to agent', 'warning');
      var card = btn.closest('.approval-card');
      if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
      }
    });
  });
}

/* ---- 16. Maturity Dashboard Interactions ---- */
function initMaturityInteractions() {
  // Maturity tabs switching
  var maturityTabs = document.querySelectorAll('.maturity-tabs .state-tab');
  maturityTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      maturityTabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      showToast('Switched to ' + tab.textContent.trim() + ' view', 'info');
    });
  });

  // Agent card click shows detail
  document.querySelectorAll('.maturity-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var nameEl = card.querySelector('div[style*="font-weight:700"]');
      var name = nameEl ? nameEl.textContent : 'Agent';
      showToast('Viewing details for ' + name, 'info');
    });
  });
}

/* ---- 17. Event Triggers Interactions ---- */
function initTriggerInteractions() {
  // "+ New Trigger" button
  var newTriggerBtn = document.querySelector('[data-testid="trigger-new-btn"]');
  if (newTriggerBtn) {
    newTriggerBtn.addEventListener('click', function() {
      showToast('Opening trigger editor...', 'info');
    });
  }

  // Row click expands detail / highlights active
  document.querySelectorAll('#page-triggers .trigger-row').forEach(function(row) {
    row.addEventListener('click', function(e) {
      // Don't trigger on toggle clicks
      if (e.target.closest('.toggle')) return;
      document.querySelectorAll('#page-triggers .trigger-row').forEach(function(r) { r.classList.remove('active'); });
      row.classList.add('active');
      var nameEl = row.querySelector('.trigger-row-name');
      var detailHeader = document.querySelector('.trigger-detail-header h3');
      if (nameEl && detailHeader) {
        detailHeader.textContent = nameEl.textContent;
      }
    });
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });
  });

  // Search triggers
  var triggerSearch = document.querySelector('[data-testid="trigger-search"]');
  if (triggerSearch) {
    triggerSearch.addEventListener('input', function(e) {
      var query = e.target.value.toLowerCase();
      document.querySelectorAll('#page-triggers .trigger-row').forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

/* ---- 18. Embedded Panel Demo Interactions ---- */
function initEmbeddedInteractions() {
  var fab = document.querySelector('.embedded-fab');
  var panel = document.querySelector('.embedded-panel');
  var closeBtn = document.querySelector('.embedded-panel-close');
  var minimizeBtn = document.querySelector('.embedded-panel-minimize');

  if (fab && panel) {
    fab.addEventListener('click', function() {
      var isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'flex';
      fab.style.display = isVisible ? '' : 'none';
    });
  }

  if (closeBtn && panel && fab) {
    closeBtn.addEventListener('click', function() {
      panel.style.display = 'none';
      fab.style.display = '';
    });
  }

  if (minimizeBtn && panel && fab) {
    minimizeBtn.addEventListener('click', function() {
      panel.style.display = 'none';
      fab.style.display = '';
      showToast('Panel minimized', 'info');
    });
  }
}

/* ---- 19. Benchmarking Interactions ---- */
function initBenchmarkingInteractions() {
  // Opt-in button from empty state
  var optinBtn = document.querySelector('[data-testid="benchmark-optin-btn"]');
  if (optinBtn) {
    optinBtn.addEventListener('click', function() {
      showToast('Benchmarking enabled. Anonymized metrics will be shared.', 'success');
    });
  }
}
