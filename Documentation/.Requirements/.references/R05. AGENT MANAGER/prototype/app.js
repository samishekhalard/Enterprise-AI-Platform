/**
 * ThinkPLUS Agent Platform — Prototype
 * Vanilla JS interactions for the static HTML prototype.
 * Matches Angular codebase patterns: dock navigation, persona switching,
 * state tabs, chatbot island, hamburger drawer.
 */
document.addEventListener('DOMContentLoaded', function () {
  initLogin();
  initDockNavigation();
  initStateTabs();
  initSectionTabs();
  initLicenseViewToggle();
  initToggleSwitches();
  initFilterChips();
  initPersona();
  initChatbot();
  initHamburger();
  initSignOut();
  initPasswordToggle();
  initAgentManagerMenu();
  initNotifications();
  initFactsheetBackButtons();
});

// ────────────────────────────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────────────────────────────
var DOCK_SECTIONS = [
  { id: 'tenant-manager',   label: 'Tenant Manager',   icon: 'cog',   roles: ['platform-admin'] },
  { id: 'agent-manager',    label: 'Agent Manager',     icon: 'robot', roles: ['platform-admin', 'tenant-admin', 'agent-designer', 'viewer'] },
  { id: 'license-manager',  label: 'License Manager',   icon: 'key',   roles: ['platform-admin'] }
];

var ROLE_DEFAULTS = {
  'platform-admin':  'tenant-manager',
  'tenant-admin':    'agent-manager',
  'agent-designer':  'agent-manager',
  'user':            null,
  'viewer':          'agent-manager'
};

var ROLE_LABELS = {
  'platform-admin':  'Platform Admin',
  'tenant-admin':    'Tenant Admin',
  'agent-designer':  'Agent Designer',
  'user':            'Regular User',
  'viewer':          'Viewer'
};

var ROLE_BADGES = {
  'platform-admin':  'PA',
  'tenant-admin':    'TA',
  'agent-designer':  'AD',
  'user':            'U',
  'viewer':          'V'
};

var currentRole    = 'platform-admin';
var currentSection = 'tenant-manager';
var dockOpen       = false;

// ────────────────────────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────────────────────────
function initLogin() {
  var signinBtn      = document.getElementById('signin-btn');
  var signinSection  = document.getElementById('signin-section');
  var cardStage      = document.getElementById('signin-card-stage');
  var loginForm      = document.getElementById('login-form');
  var backBtn        = document.getElementById('back-btn');

  if (signinBtn) {
    signinBtn.addEventListener('click', function () {
      signinSection.style.display = 'none';
      cardStage.style.display = 'grid';
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      cardStage.style.display = 'none';
      signinSection.style.display = 'flex';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var personaSelect = document.getElementById('persona-select');
      currentRole = personaSelect ? personaSelect.value : 'platform-admin';
      localStorage.setItem('emsist-persona', currentRole);

      document.getElementById('login-view').style.display = 'none';
      var shell = document.getElementById('app-shell');
      shell.style.display = 'block';

      applyPersona(currentRole);
    });
  }

  // Auto-login if persona stored
  var stored = localStorage.getItem('emsist-persona');
  if (stored && ROLE_LABELS[stored]) {
    currentRole = stored;
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('app-shell').style.display = 'block';
    applyPersona(currentRole);
  }
}

// ────────────────────────────────────────────────────────────────────
// PASSWORD TOGGLE
// ────────────────────────────────────────────────────────────────────
function initPasswordToggle() {
  var toggle    = document.getElementById('password-toggle');
  var pwInput   = document.getElementById('password');
  var eyeOpen   = document.getElementById('eye-open');
  var eyeClosed = document.getElementById('eye-closed');

  if (toggle && pwInput) {
    toggle.addEventListener('click', function () {
      var isPassword = pwInput.type === 'password';
      pwInput.type = isPassword ? 'text' : 'password';
      eyeOpen.style.display   = isPassword ? 'none' : 'block';
      eyeClosed.style.display = isPassword ? 'block' : 'none';
      toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      toggle.setAttribute('title',      isPassword ? 'Hide password' : 'Show password');
    });
  }
}

// ────────────────────────────────────────────────────────────────────
// DOCK NAVIGATION
// ────────────────────────────────────────────────────────────────────
function initDockNavigation() {
  var dockItems = document.querySelectorAll('.dock-item');
  dockItems.forEach(function (item) {
    var link = item.querySelector('.dock-link');
    if (link) {
      link.addEventListener('click', function () {
        var section = item.dataset.section;
        switchSection(section);
        if (window.innerWidth < 1024) closeDock();
      });
    }
  });
}

function switchSection(sectionId) {
  currentSection = sectionId;

  // Update dock active state
  document.querySelectorAll('.dock-item').forEach(function (item) {
    var isActive = item.dataset.section === sectionId;
    item.classList.toggle('active', isActive);
    var link = item.querySelector('.dock-link');
    if (link) link.classList.toggle('active', isActive);
  });

  // Show / hide section panels
  document.querySelectorAll('.section-panel').forEach(function (panel) {
    panel.style.display = 'none';
  });
  var target = document.getElementById('section-' + sectionId);
  if (target) target.style.display = 'block';

  // Update breadcrumb + header indicator
  var section = DOCK_SECTIONS.find(function (s) { return s.id === sectionId; });
  if (section) {
    var breadcrumb = document.getElementById('breadcrumb-section');
    var indicator  = document.getElementById('section-name');
    if (breadcrumb) breadcrumb.textContent = section.label;
    if (indicator)  indicator.textContent  = section.label;
  }

  // Ensure admin content visible, user landing hidden
  var adminContent = document.getElementById('admin-content');
  var userLanding  = document.getElementById('user-landing');
  var breadcrumbEl = document.querySelector('.admin-breadcrumb');
  if (adminContent) adminContent.style.display = 'block';
  if (userLanding)  userLanding.style.display  = 'none';
  if (breadcrumbEl) breadcrumbEl.style.display = '';

  // Hide full-page chat when switching
  var fullChat = document.getElementById('section-fullpage-chat');
  if (fullChat && sectionId !== 'fullpage-chat') fullChat.style.display = 'none';
}

// ────────────────────────────────────────────────────────────────────
// PERSONA SWITCHING
// ────────────────────────────────────────────────────────────────────
function initPersona() {
  var badge = document.getElementById('persona-badge');
  if (badge) {
    badge.addEventListener('click', function () {
      var roles = Object.keys(ROLE_LABELS);
      var idx   = roles.indexOf(currentRole);
      var next  = roles[(idx + 1) % roles.length];
      currentRole = next;
      localStorage.setItem('emsist-persona', next);
      applyPersona(next);
      showToast('Switched to ' + ROLE_LABELS[next]);
    });
  }
}

function applyPersona(role) {
  currentRole = role;

  // Badge
  var badge      = document.getElementById('persona-badge');
  var badgeLabel = document.getElementById('persona-badge-label');
  if (badgeLabel) badgeLabel.textContent = ROLE_BADGES[role] || 'PA';
  if (badge) {
    badge.className = 'persona-badge role-' + role;
    badge.title     = ROLE_LABELS[role];
  }

  // Show / hide dock items by role
  document.querySelectorAll('.dock-item').forEach(function (item) {
    var allowed = (item.dataset.roles || '').split(',');
    item.style.display = allowed.indexOf(role) !== -1 ? '' : 'none';
  });

  // Handle "user" role (no admin dock, show landing page)
  var dock         = document.getElementById('admin-dock');
  var adminContent = document.getElementById('admin-content');
  var userLanding  = document.getElementById('user-landing');
  var breadcrumbEl = document.querySelector('.admin-breadcrumb');

  if (role === 'user') {
    if (dock)         dock.style.display         = 'none';
    if (adminContent) adminContent.style.display = 'none';
    if (userLanding)  userLanding.style.display  = 'block';
    if (breadcrumbEl) breadcrumbEl.style.display = 'none';
    return;
  }

  if (dock)         dock.style.display         = '';
  if (adminContent) adminContent.style.display = 'block';
  if (userLanding)  userLanding.style.display  = 'none';
  if (breadcrumbEl) breadcrumbEl.style.display = '';

  // Navigate to default section for role
  var defaultSection = ROLE_DEFAULTS[role];
  if (defaultSection) switchSection(defaultSection);
}

// ────────────────────────────────────────────────────────────────────
// HAMBURGER / DRAWER
// ────────────────────────────────────────────────────────────────────
function initHamburger() {
  var btn      = document.getElementById('hamburger-btn');
  var backdrop = document.getElementById('drawer-backdrop');

  if (btn)      btn.addEventListener('click', toggleDock);
  if (backdrop) backdrop.addEventListener('click', closeDock);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dockOpen) closeDock();
  });
}

function toggleDock() {
  dockOpen = !dockOpen;
  var shell = document.getElementById('app-shell');
  var hamOpen  = document.getElementById('hamburger-open');
  var hamClose = document.getElementById('hamburger-close');

  if (dockOpen) {
    shell.classList.add('drawer-open');
    if (hamOpen)  hamOpen.style.display  = 'none';
    if (hamClose) hamClose.style.display = 'block';
  } else {
    shell.classList.remove('drawer-open');
    if (hamOpen)  hamOpen.style.display  = 'block';
    if (hamClose) hamClose.style.display = 'none';
  }
}

function closeDock() {
  dockOpen = false;
  var shell = document.getElementById('app-shell');
  shell.classList.remove('drawer-open');
  var hamOpen  = document.getElementById('hamburger-open');
  var hamClose = document.getElementById('hamburger-close');
  if (hamOpen)  hamOpen.style.display  = 'block';
  if (hamClose) hamClose.style.display = 'none';
}

// ────────────────────────────────────────────────────────────────────
// STATE TABS (Populated / Loading / Empty)
// ────────────────────────────────────────────────────────────────────
function initStateTabs() {
  document.querySelectorAll('.state-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var panel = tab.closest('.section-panel') || tab.closest('.tab-panel');
      if (!panel) return;

      // Toggle active tab
      tab.parentElement.querySelectorAll('.state-tab').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');

      // Show matching view state
      var state = tab.dataset.state;
      panel.querySelectorAll('[data-view-state]').forEach(function (el) {
        el.style.display = el.dataset.viewState === state ? '' : 'none';
      });
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// CHATBOT ISLAND (FAB + mini panel + full page)
// ────────────────────────────────────────────────────────────────────
function initChatbot() {
  var fab      = document.getElementById('chatbot-fab');
  var panel    = document.getElementById('chatbot-panel');
  var minimize = document.getElementById('chatbot-minimize');
  var close    = document.getElementById('chatbot-close');
  var popout   = document.getElementById('chatbot-popout');

  if (fab) {
    fab.addEventListener('click', function () {
      fab.style.display   = 'none';
      panel.style.display = 'flex';
    });
  }

  if (minimize) {
    minimize.addEventListener('click', function () {
      panel.style.display = 'none';
      fab.style.display   = 'flex';
    });
  }

  if (close) {
    close.addEventListener('click', function () {
      panel.style.display = 'none';
      fab.style.display   = 'flex';
    });
  }

  if (popout) {
    popout.addEventListener('click', function () {
      panel.style.display = 'none';
      fab.style.display   = 'none';
      // Show full-page chat section
      document.querySelectorAll('.section-panel').forEach(function (p) {
        p.style.display = 'none';
      });
      document.getElementById('section-fullpage-chat').style.display = 'block';
      var bc = document.getElementById('breadcrumb-section');
      var sn = document.getElementById('section-name');
      if (bc) bc.textContent = 'Chat';
      if (sn) sn.textContent = 'Chat';
    });
  }

  var backBtn = document.getElementById('back-to-admin');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      fab.style.display = 'flex';
      switchSection(currentSection);
    });
  }

  // Landing card chat shortcut
  var landingChat = document.getElementById('landing-chat-card');
  if (landingChat) {
    landingChat.addEventListener('click', function () {
      openChatbot();
    });
  }
}

function openChatbot() {
  var fab   = document.getElementById('chatbot-fab');
  var panel = document.getElementById('chatbot-panel');
  if (fab)   fab.style.display   = 'none';
  if (panel) panel.style.display = 'flex';
}

// ────────────────────────────────────────────────────────────────────
// SIGN OUT
// ────────────────────────────────────────────────────────────────────
function initSignOut() {
  var signoutBtn     = document.getElementById('signout-btn');
  var dockSignoutBtn = document.getElementById('dock-signout-btn');

  function doSignOut() {
    localStorage.removeItem('emsist-persona');
    document.getElementById('app-shell').style.display  = 'none';
    document.getElementById('login-view').style.display = 'block';
    // Reset form visibility
    var signinSection = document.getElementById('signin-section');
    var cardStage     = document.getElementById('signin-card-stage');
    if (signinSection) signinSection.style.display = 'flex';
    if (cardStage)     cardStage.style.display     = 'none';
    closeDock();
    // Close chatbot
    var fab   = document.getElementById('chatbot-fab');
    var panel = document.getElementById('chatbot-panel');
    if (fab)   fab.style.display   = 'flex';
    if (panel) panel.style.display = 'none';
  }

  if (signoutBtn)     signoutBtn.addEventListener('click', doSignOut);
  if (dockSignoutBtn) dockSignoutBtn.addEventListener('click', doSignOut);
}

// ────────────────────────────────────────────────────────────────────
// SECTION TABS (PrimeNG-style internal tabs within each section)
// ────────────────────────────────────────────────────────────────────
function initSectionTabs() {
  document.querySelectorAll('.section-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var panel = tab.closest('[data-view-state]') || tab.closest('.section-panel');
      if (!panel) return;

      // Deactivate sibling tabs
      tab.parentElement.querySelectorAll('.section-tab').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');

      // Show matching tab panel
      var target = tab.dataset.tab;
      panel.querySelectorAll('.tab-panel').forEach(function (p) {
        p.style.display = p.dataset.tabPanel === target ? '' : 'none';
        p.classList.toggle('active', p.dataset.tabPanel === target);
      });
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// LICENSE VIEW TOGGLE (Grid / Table)
// ────────────────────────────────────────────────────────────────────
function initLicenseViewToggle() {
  document.querySelectorAll('.view-toggle').forEach(function (toggle) {
    toggle.querySelectorAll('.view-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Deactivate siblings
        toggle.querySelectorAll('.view-toggle-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        var view = btn.dataset.view;
        var container = toggle.closest('[data-view-state]') || toggle.closest('.section-panel');
        if (!container) return;

        container.querySelectorAll('.license-view').forEach(function (v) {
          v.style.display = v.dataset.licenseView === view ? '' : 'none';
        });
      });
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// TOGGLE SWITCHES (CSS-only toggle interaction)
// ────────────────────────────────────────────────────────────────────
function initToggleSwitches() {
  document.querySelectorAll('.toggle-switch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      sw.classList.toggle('on');
      var isOn = sw.classList.contains('on');
      sw.setAttribute('aria-checked', isOn ? 'true' : 'false');
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// FILTER CHIPS (toggle active state)
// ────────────────────────────────────────────────────────────────────
function initFilterChips() {
  document.querySelectorAll('.filter-chips').forEach(function (group) {
    group.querySelectorAll('.filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        group.querySelectorAll('.filter-chip').forEach(function (c) {
          c.classList.remove('active');
        });
        chip.classList.add('active');
      });
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// AGENT MANAGER SIDE MENU
// ────────────────────────────────────────────────────────────────────
function initAgentManagerMenu() {
  document.querySelectorAll('.am-sidemenu-item').forEach(function (item) {
    item.addEventListener('click', function () {
      // Deactivate siblings
      item.parentElement.querySelectorAll('.am-sidemenu-item').forEach(function (i) {
        i.classList.remove('active');
      });
      item.classList.add('active');

      // Show matching panel
      var target = item.dataset.amSection;
      document.querySelectorAll('.am-panel').forEach(function (p) {
        p.style.display = 'none';
        p.classList.remove('active');
      });
      var targetPanel = document.getElementById(target);
      if (targetPanel) {
        targetPanel.style.display = 'block';
        targetPanel.classList.add('active');
      }
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// FACTSHEET DNA (generic open/close for any list → factsheet)
// ────────────────────────────────────────────────────────────────────
function openFactsheet(listId, factsheetId) {
  var list = document.getElementById(listId);
  var sheet = document.getElementById(factsheetId);
  if (list) list.style.display = 'none';
  if (sheet) { sheet.style.display = 'block'; sheet.classList.add('active'); }
}

function closeFactsheet(listId, factsheetId) {
  var list = document.getElementById(listId);
  var sheet = document.getElementById(factsheetId);
  if (sheet) { sheet.style.display = 'none'; sheet.classList.remove('active'); }
  if (list) list.style.display = '';
}

function initFactsheetBackButtons() {
  document.querySelectorAll('.factsheet-back-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var listId = btn.dataset.listId;
      var sheetId = btn.dataset.sheetId;
      if (listId && sheetId) closeFactsheet(listId, sheetId);
    });
  });

  // Wire up all View buttons that open factsheets
  document.querySelectorAll('[data-open-factsheet]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var listId = btn.dataset.listId;
      var sheetId = btn.dataset.openFactsheet;
      if (listId && sheetId) openFactsheet(listId, sheetId);
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// NOTIFICATION CENTER
// ────────────────────────────────────────────────────────────────────
function initNotifications() {
  var bellBtn = document.getElementById('notification-bell');
  var dropdown = document.getElementById('notification-dropdown');
  if (!bellBtn || !dropdown) return;

  bellBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== bellBtn) {
      dropdown.classList.remove('active');
    }
  });

  var markAll = document.getElementById('notif-mark-all');
  if (markAll) {
    markAll.addEventListener('click', function () {
      dropdown.querySelectorAll('.notification-item.unread').forEach(function (item) {
        item.classList.remove('unread');
      });
      var badge = document.getElementById('notif-badge-count');
      if (badge) badge.style.display = 'none';
    });
  }
}

// ────────────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────────────
function showToast(message) {
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function () {
    toast.classList.add('show');
  });
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { toast.remove(); }, 300);
  }, 2500);
}
