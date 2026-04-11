/**
 * Definition Management — Prototype
 * Vanilla JS interactions for the static HTML prototype.
 * Matches Angular codebase patterns: dock navigation, persona switching,
 * state tabs, wizard, detail panel, confirm dialogs.
 */
document.addEventListener('DOMContentLoaded', function () {
  initData();
  initDockNavigation();
  initStateTabs();
  initSectionTabs();
  initViewToggle();
  initFilterChips();
  initPersona();
  initHamburger();
  initWizard();
  initDetailPanel();
  initConfirmDialogs();
  initAccordions();
  initToggles();
  initSearch();
  initSort();
  initFab();
  initReleaseCards();
  initBulkActions();
  renderObjectTypes();
});

// ────────────────────────────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────────────────────────────
var OBJECT_TYPES = [];
var DOCK_SECTIONS = [
  { id: 'def-manager', label: 'Definition Manager', roles: ['super-admin', 'architect', 'tenant-admin'] },
  { id: 'release-dashboard', label: 'Release Dashboard', roles: ['super-admin', 'architect', 'tenant-admin'] }
];

var PERSONAS = {
  'super-admin': { label: 'Super Admin (Sam)', badge: 'SM', color: 'role-super-admin' },
  'architect':   { label: 'Architect (Nicole)', badge: 'NR', color: 'role-architect' },
  'tenant-admin': { label: 'Tenant Admin (Fiona)', badge: 'FS', color: 'role-tenant-admin' }
};

var currentRole = 'architect';
var currentSection = 'def-manager';
var dockOpen = false;
var wizardStep = 1;
var selectedOT = null;
var sortField = 'name-asc';

function initData() {
  OBJECT_TYPES = [
    {
      id: 'ot-1', name: 'Employee', typeKey: 'employee', category: 'Core',
      status: 'Published', icon: 'person', description: 'Represents an employee within the organization',
      attrCount: 12, connCount: 4, modified: '2026-03-09',
      attributes: [
        { name: 'name', type: 'String', required: true, lifecycle: 'active', isDefault: true },
        { name: 'description', type: 'Text', required: false, lifecycle: 'active', isDefault: true },
        { name: 'status', type: 'Enum', required: true, lifecycle: 'active', isDefault: true },
        { name: 'owner', type: 'Reference', required: true, lifecycle: 'active', isDefault: true },
        { name: 'email', type: 'String', required: true, lifecycle: 'active', isDefault: false },
        { name: 'department', type: 'Reference', required: true, lifecycle: 'active', isDefault: false },
        { name: 'hire_date', type: 'Date', required: true, lifecycle: 'active', isDefault: false },
        { name: 'job_title', type: 'String', required: false, lifecycle: 'active', isDefault: false },
        { name: 'phone', type: 'String', required: false, lifecycle: 'planned', isDefault: false },
        { name: 'location', type: 'String', required: false, lifecycle: 'active', isDefault: false },
        { name: 'manager', type: 'Reference', required: false, lifecycle: 'active', isDefault: false },
        { name: 'legacy_id', type: 'String', required: false, lifecycle: 'retired', isDefault: false }
      ],
      connections: [
        { rel: 'BELONGS_TO', target: 'Department', cardinality: 'M:1', lifecycle: 'active' },
        { rel: 'WORKS_ON', target: 'Project', cardinality: 'M:N', lifecycle: 'active' },
        { rel: 'MANAGES', target: 'Asset', cardinality: '1:N', lifecycle: 'active' },
        { rel: 'BOUND_BY', target: 'Contract', cardinality: 'M:N', lifecycle: 'planned' }
      ],
      governance: { mandated: true, locked: true, overridable: false }
    },
    {
      id: 'ot-2', name: 'Project', typeKey: 'project', category: 'Core',
      status: 'Published', icon: 'folder', description: 'A business project with milestones and deliverables',
      attrCount: 9, connCount: 3, modified: '2026-03-08',
      attributes: [
        { name: 'name', type: 'String', required: true, lifecycle: 'active', isDefault: true },
        { name: 'description', type: 'Text', required: false, lifecycle: 'active', isDefault: true },
        { name: 'status', type: 'Enum', required: true, lifecycle: 'active', isDefault: true },
        { name: 'owner', type: 'Reference', required: true, lifecycle: 'active', isDefault: true },
        { name: 'start_date', type: 'Date', required: true, lifecycle: 'active', isDefault: false },
        { name: 'end_date', type: 'Date', required: false, lifecycle: 'active', isDefault: false },
        { name: 'budget', type: 'Number', required: false, lifecycle: 'active', isDefault: false },
        { name: 'priority', type: 'Enum', required: true, lifecycle: 'active', isDefault: false },
        { name: 'tags', type: 'Array', required: false, lifecycle: 'planned', isDefault: false }
      ],
      connections: [
        { rel: 'ASSIGNED_TO', target: 'Department', cardinality: 'M:1', lifecycle: 'active' },
        { rel: 'HAS_MEMBER', target: 'Employee', cardinality: 'M:N', lifecycle: 'active' },
        { rel: 'USES', target: 'Asset', cardinality: 'M:N', lifecycle: 'active' }
      ],
      governance: { mandated: true, locked: false, overridable: true }
    },
    {
      id: 'ot-3', name: 'Department', typeKey: 'department', category: 'Core',
      status: 'Published', icon: 'building', description: 'Organizational unit or department',
      attrCount: 7, connCount: 2, modified: '2026-03-05',
      attributes: [
        { name: 'name', type: 'String', required: true, lifecycle: 'active', isDefault: true },
        { name: 'description', type: 'Text', required: false, lifecycle: 'active', isDefault: true },
        { name: 'status', type: 'Enum', required: true, lifecycle: 'active', isDefault: true },
        { name: 'owner', type: 'Reference', required: true, lifecycle: 'active', isDefault: true },
        { name: 'code', type: 'String', required: true, lifecycle: 'active', isDefault: false },
        { name: 'parent', type: 'Reference', required: false, lifecycle: 'active', isDefault: false },
        { name: 'headcount', type: 'Number', required: false, lifecycle: 'active', isDefault: false }
      ],
      connections: [
        { rel: 'HAS_EMPLOYEE', target: 'Employee', cardinality: '1:N', lifecycle: 'active' },
        { rel: 'OWNS_PROJECT', target: 'Project', cardinality: '1:N', lifecycle: 'active' }
      ],
      governance: { mandated: true, locked: true, overridable: false }
    },
    {
      id: 'ot-4', name: 'Asset', typeKey: 'asset', category: 'Supporting',
      status: 'Published', icon: 'briefcase', description: 'Physical or digital asset tracked by the organization',
      attrCount: 8, connCount: 2, modified: '2026-03-07',
      attributes: [
        { name: 'name', type: 'String', required: true, lifecycle: 'active', isDefault: true },
        { name: 'description', type: 'Text', required: false, lifecycle: 'active', isDefault: true },
        { name: 'status', type: 'Enum', required: true, lifecycle: 'active', isDefault: true },
        { name: 'owner', type: 'Reference', required: true, lifecycle: 'active', isDefault: true },
        { name: 'asset_tag', type: 'String', required: true, lifecycle: 'active', isDefault: false },
        { name: 'purchase_date', type: 'Date', required: false, lifecycle: 'active', isDefault: false },
        { name: 'value', type: 'Number', required: false, lifecycle: 'active', isDefault: false },
        { name: 'expiry_date', type: 'Date', required: false, lifecycle: 'planned', isDefault: false }
      ],
      connections: [
        { rel: 'ASSIGNED_TO', target: 'Employee', cardinality: 'M:1', lifecycle: 'active' },
        { rel: 'USED_IN', target: 'Project', cardinality: 'M:N', lifecycle: 'active' }
      ],
      governance: { mandated: false, locked: false, overridable: true }
    },
    {
      id: 'ot-5', name: 'Contract', typeKey: 'contract', category: 'Supporting',
      status: 'Draft', icon: 'cube', description: 'Legal or business contract between parties',
      attrCount: 6, connCount: 1, modified: '2026-03-10',
      attributes: [
        { name: 'name', type: 'String', required: true, lifecycle: 'active', isDefault: true },
        { name: 'description', type: 'Text', required: false, lifecycle: 'active', isDefault: true },
        { name: 'status', type: 'Enum', required: true, lifecycle: 'active', isDefault: true },
        { name: 'owner', type: 'Reference', required: true, lifecycle: 'active', isDefault: true },
        { name: 'effective_date', type: 'Date', required: true, lifecycle: 'active', isDefault: false },
        { name: 'contract_value', type: 'Number', required: false, lifecycle: 'planned', isDefault: false }
      ],
      connections: [
        { rel: 'INVOLVES', target: 'Employee', cardinality: 'M:N', lifecycle: 'planned' }
      ],
      governance: { mandated: false, locked: false, overridable: true }
    },
    {
      id: 'ot-6', name: 'Process', typeKey: 'process', category: 'Custom',
      status: 'Draft', icon: 'gear', description: 'A business process or workflow definition',
      attrCount: 5, connCount: 0, modified: '2026-03-10',
      attributes: [
        { name: 'name', type: 'String', required: true, lifecycle: 'active', isDefault: true },
        { name: 'description', type: 'Text', required: false, lifecycle: 'active', isDefault: true },
        { name: 'status', type: 'Enum', required: true, lifecycle: 'active', isDefault: true },
        { name: 'owner', type: 'Reference', required: true, lifecycle: 'active', isDefault: true },
        { name: 'bpmn_ref', type: 'String', required: false, lifecycle: 'planned', isDefault: false }
      ],
      connections: [],
      governance: { mandated: false, locked: false, overridable: true }
    }
  ];
}

// ────────────────────────────────────────────────────────────────────
// RENDERING
// ────────────────────────────────────────────────────────────────────
function renderObjectTypes() {
  var filtered = getFilteredSortedTypes();
  renderTable(filtered);
  renderCards(filtered);
}

function getFilteredSortedTypes() {
  var search = (document.getElementById('search-input') || {}).value || '';
  search = search.toLowerCase();

  var activeFilter = 'all';
  var chips = document.querySelectorAll('.filter-chip.active');
  if (chips.length) activeFilter = chips[0].dataset.filter;

  var types = OBJECT_TYPES.filter(function (ot) {
    var matchSearch = !search || ot.name.toLowerCase().indexOf(search) !== -1 || ot.typeKey.toLowerCase().indexOf(search) !== -1;
    var matchFilter = activeFilter === 'all' || ot.category.toLowerCase() === activeFilter;
    return matchSearch && matchFilter;
  });

  var sf = sortField;
  types.sort(function (a, b) {
    if (sf === 'name-asc') return a.name.localeCompare(b.name);
    if (sf === 'name-desc') return b.name.localeCompare(a.name);
    if (sf === 'modified') return b.modified.localeCompare(a.modified);
    if (sf === 'attrs') return b.attrCount - a.attrCount;
    return 0;
  });
  return types;
}

function renderTable(types) {
  var tbody = document.getElementById('ot-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  types.forEach(function (ot) {
    var tr = document.createElement('tr');
    tr.dataset.otId = ot.id;
    if (selectedOT && selectedOT.id === ot.id) tr.classList.add('selected');
    tr.innerHTML =
      '<td style="font-weight:700">' + esc(ot.name) + '</td>' +
      '<td>' + esc(ot.category) + '</td>' +
      '<td><span class="demo-status-badge ' + ot.status.toLowerCase() + '">' + esc(ot.status) + '</span></td>' +
      '<td>' + ot.attrCount + '</td>' +
      '<td>' + ot.connCount + '</td>' +
      '<td>' + esc(ot.modified) + '</td>';
    tr.addEventListener('click', function () { openDetail(ot); });
    tbody.appendChild(tr);
  });
}

function renderCards(types) {
  var grid = document.getElementById('ot-card-grid');
  if (!grid) return;
  grid.innerHTML = '';
  types.forEach(function (ot) {
    var card = document.createElement('div');
    card.className = 'demo-card';
    card.dataset.otId = ot.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', ot.name);
    card.innerHTML =
      '<div class="demo-card-header">' +
        '<span class="demo-card-badge" style="background:' + (ot.status === 'Published' ? 'rgba(66,129,119,0.15);color:#054239' : 'rgba(185,167,121,0.2);color:#3d3a3b') + '">' + esc(ot.status) + '</span>' +
      '</div>' +
      '<div class="demo-card-title">' + esc(ot.name) + '</div>' +
      '<div class="demo-card-meta">Category: ' + esc(ot.category) + '</div>' +
      '<div class="demo-card-meta">Attributes: ' + ot.attrCount + ' &middot; Connections: ' + ot.connCount + '</div>' +
      '<div class="demo-card-meta">Modified: ' + esc(ot.modified) + '</div>' +
      '<div class="demo-card-actions">' +
        '<button class="nm-btn nm-btn-sm nm-btn-primary">Configure</button>' +
      '</div>';
    card.addEventListener('click', function () { openDetail(ot); });
    grid.appendChild(card);
  });
}

function esc(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// ────────────────────────────────────────────────────────────────────
// DOCK NAVIGATION
// ────────────────────────────────────────────────────────────────────
function initDockNavigation() {
  document.querySelectorAll('.dock-item').forEach(function (item) {
    var link = item.querySelector('.dock-link');
    if (link) {
      link.addEventListener('click', function () {
        switchSection(item.dataset.section);
        if (window.innerWidth < 1024) closeDock();
      });
    }
  });
}

function switchSection(sectionId) {
  currentSection = sectionId;
  document.querySelectorAll('.dock-item').forEach(function (item) {
    var isActive = item.dataset.section === sectionId;
    item.classList.toggle('active', isActive);
    var link = item.querySelector('.dock-link');
    if (link) link.classList.toggle('active', isActive);
  });
  document.querySelectorAll('.section-panel').forEach(function (p) { p.style.display = 'none'; });
  var target = document.getElementById('section-' + sectionId);
  if (target) target.style.display = 'block';

  var section = DOCK_SECTIONS.find(function (s) { return s.id === sectionId; });
  if (section) {
    var bc = document.getElementById('breadcrumb-section');
    var sn = document.getElementById('section-name');
    if (bc) bc.textContent = section.label;
    if (sn) sn.textContent = section.label;
  }

  closeDetail();
}

// ────────────────────────────────────────────────────────────────────
// PERSONA SWITCHING
// ────────────────────────────────────────────────────────────────────
function initPersona() {
  var badge = document.getElementById('persona-badge');
  if (badge) {
    badge.addEventListener('click', function () {
      var roles = Object.keys(PERSONAS);
      var idx = roles.indexOf(currentRole);
      var next = roles[(idx + 1) % roles.length];
      currentRole = next;
      applyPersona(next);
      showToast('Switched to ' + PERSONAS[next].label);
    });
  }
}

function applyPersona(role) {
  currentRole = role;
  var p = PERSONAS[role];
  var badge = document.getElementById('persona-badge');
  var badgeLabel = document.getElementById('persona-badge-label');
  if (badgeLabel) badgeLabel.textContent = p.badge;
  if (badge) { badge.className = 'persona-badge ' + p.color; badge.title = p.label; }

  // Show/hide role-gated elements
  document.querySelectorAll('[data-role-gate]').forEach(function (el) {
    var allowed = el.dataset.roleGate.split(',');
    el.style.display = allowed.indexOf(role) !== -1 ? '' : 'none';
  });

  // Show/hide dock items
  document.querySelectorAll('.dock-item').forEach(function (item) {
    var allowed = (item.dataset.roles || '').split(',');
    item.style.display = allowed.indexOf(role) !== -1 ? '' : 'none';
  });
}

// ────────────────────────────────────────────────────────────────────
// HAMBURGER / DRAWER
// ────────────────────────────────────────────────────────────────────
function initHamburger() {
  var btn = document.getElementById('hamburger-btn');
  var backdrop = document.getElementById('drawer-backdrop');
  if (btn) btn.addEventListener('click', toggleDock);
  if (backdrop) backdrop.addEventListener('click', closeDock);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dockOpen) closeDock(); });
}

function toggleDock() {
  dockOpen = !dockOpen;
  var shell = document.getElementById('app-shell');
  var ho = document.getElementById('hamburger-open');
  var hc = document.getElementById('hamburger-close');
  if (dockOpen) {
    shell.classList.add('drawer-open');
    if (ho) ho.style.display = 'none';
    if (hc) hc.style.display = 'block';
  } else {
    shell.classList.remove('drawer-open');
    if (ho) ho.style.display = 'block';
    if (hc) hc.style.display = 'none';
  }
}

function closeDock() {
  dockOpen = false;
  var shell = document.getElementById('app-shell');
  shell.classList.remove('drawer-open');
  var ho = document.getElementById('hamburger-open');
  var hc = document.getElementById('hamburger-close');
  if (ho) ho.style.display = 'block';
  if (hc) hc.style.display = 'none';
}

// ────────────────────────────────────────────────────────────────────
// STATE TABS (Populated / Loading / Empty)
// ────────────────────────────────────────────────────────────────────
function initStateTabs() {
  document.querySelectorAll('.state-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var panel = tab.closest('.section-panel');
      if (!panel) return;
      tab.parentElement.querySelectorAll('.state-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var state = tab.dataset.state;
      panel.querySelectorAll('[data-view-state]').forEach(function (el) {
        el.style.display = el.dataset.viewState === state ? '' : 'none';
      });
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// SECTION TABS (7-tab detail panel)
// ────────────────────────────────────────────────────────────────────
function initSectionTabs() {
  document.querySelectorAll('.section-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var container = tab.closest('#ot-detail-panel') || tab.closest('.section-panel');
      if (!container) return;
      var tabGroup = tab.parentElement;
      tabGroup.querySelectorAll('.section-tab').forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var target = tab.dataset.tab;
      container.querySelectorAll('.tab-panel').forEach(function (p) {
        var match = p.dataset.tabPanel === target;
        p.style.display = match ? '' : 'none';
        p.classList.toggle('active', match);
      });
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// VIEW TOGGLE (Table / Card)
// ────────────────────────────────────────────────────────────────────
function initViewToggle() {
  document.querySelectorAll('.view-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var toggle = btn.closest('.view-toggle');
      toggle.querySelectorAll('.view-toggle-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var view = btn.dataset.view;
      var tableView = document.getElementById('table-view');
      var cardView = document.getElementById('card-view');
      if (tableView) tableView.style.display = view === 'table' ? '' : 'none';
      if (cardView) cardView.style.display = view === 'card' ? '' : 'none';
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// FILTER CHIPS
// ────────────────────────────────────────────────────────────────────
function initFilterChips() {
  document.querySelectorAll('.filter-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.closest('.filter-chips').querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      renderObjectTypes();
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// SEARCH
// ────────────────────────────────────────────────────────────────────
function initSearch() {
  var input = document.getElementById('search-input');
  if (input) {
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(renderObjectTypes, 200);
    });
  }
}

// ────────────────────────────────────────────────────────────────────
// SORT
// ────────────────────────────────────────────────────────────────────
function initSort() {
  var select = document.getElementById('sort-select');
  if (select) {
    select.addEventListener('change', function () {
      sortField = select.value;
      renderObjectTypes();
    });
  }

  // Column header sort
  document.querySelectorAll('#ot-table th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var field = th.dataset.sort;
      if (field === 'name') sortField = sortField === 'name-asc' ? 'name-desc' : 'name-asc';
      else if (field === 'modified') sortField = 'modified';
      else if (field === 'attrs') sortField = 'attrs';
      renderObjectTypes();
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// DETAIL PANEL
// ────────────────────────────────────────────────────────────────────
function initDetailPanel() {
  var closeBtn = document.getElementById('detail-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeDetail);
}

function openDetail(ot) {
  selectedOT = ot;
  var overlay = document.getElementById('detail-overlay');
  var title = document.getElementById('detail-title');
  if (overlay) overlay.style.display = 'block';
  if (title) title.textContent = ot.name;

  // Reset to General tab
  var tabs = document.querySelectorAll('#detail-tabs .section-tab');
  tabs.forEach(function (t, i) {
    t.classList.toggle('active', i === 0);
    t.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  });
  document.querySelectorAll('#ot-detail-panel .tab-panel').forEach(function (p, i) {
    p.style.display = i === 0 ? '' : 'none';
    p.classList.toggle('active', i === 0);
  });

  // Populate General tab
  var info = document.getElementById('detail-general-info');
  if (info) {
    info.innerHTML =
      '<div class="info-row"><span class="info-label">Name</span><span class="info-value">' + esc(ot.name) + '</span></div>' +
      '<div class="info-row"><span class="info-label">Type Key</span><span class="info-value"><code>' + esc(ot.typeKey) + '</code></span></div>' +
      '<div class="info-row"><span class="info-label">Category</span><span class="info-value">' + esc(ot.category) + '</span></div>' +
      '<div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="demo-status-badge ' + ot.status.toLowerCase() + '">' + esc(ot.status) + '</span></span></div>' +
      '<div class="info-row"><span class="info-label">Description</span><span class="info-value">' + esc(ot.description) + '</span></div>' +
      '<div class="info-row"><span class="info-label">Attributes</span><span class="info-value">' + ot.attrCount + '</span></div>' +
      '<div class="info-row"><span class="info-label">Connections</span><span class="info-value">' + ot.connCount + '</span></div>' +
      '<div class="info-row"><span class="info-label">Last Modified</span><span class="info-value">' + esc(ot.modified) + '</span></div>';
  }

  // Populate Attributes tab
  var attrTbody = document.getElementById('attr-tbody');
  if (attrTbody) {
    attrTbody.innerHTML = '';
    ot.attributes.forEach(function (attr) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><input type="checkbox" class="attr-checkbox" aria-label="Select ' + esc(attr.name) + '"' + (attr.isDefault ? ' disabled' : '') + '></td>' +
        '<td style="font-weight:600">' + esc(attr.name) + (attr.isDefault ? ' <span style="opacity:0.5;font-size:0.72rem" title="System default attribute">&#128737;</span>' : '') + '</td>' +
        '<td>' + esc(attr.type) + '</td>' +
        '<td>' + (attr.required ? 'Yes' : 'No') + '</td>' +
        '<td><span class="demo-status-badge ' + attr.lifecycle + '">' + esc(attr.lifecycle) + '</span></td>' +
        '<td>' + (attr.isDefault ? 'System' : '--') + '</td>' +
        '<td>' + (attr.isDefault ? '' : '<button class="nm-btn nm-btn-sm attr-lifecycle-btn" data-attr="' + esc(attr.name) + '">&#8230;</button>') + '</td>';
      attrTbody.appendChild(tr);
    });
    initAttrLifecycleButtons();
  }

  // Populate Connections tab
  var connTbody = document.getElementById('conn-tbody');
  if (connTbody) {
    connTbody.innerHTML = '';
    if (ot.connections.length === 0) {
      connTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:2rem">No connections defined</td></tr>';
    } else {
      ot.connections.forEach(function (conn) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td style="font-weight:600">' + esc(conn.rel) + '</td>' +
          '<td>' + esc(conn.target) + '</td>' +
          '<td><span class="demo-card-badge" style="background:rgba(66,129,119,0.1);color:#054239">' + esc(conn.cardinality) + '</span></td>' +
          '<td><span class="demo-status-badge ' + conn.lifecycle + '">' + esc(conn.lifecycle) + '</span></td>' +
          '<td><button class="nm-btn nm-btn-sm nm-btn-danger">Remove</button></td>';
        connTbody.appendChild(tr);
      });
    }
  }

  // Populate Governance tab
  var govFlags = document.getElementById('gov-flags');
  if (govFlags) {
    govFlags.innerHTML =
      '<div class="gov-row"><span class="gov-label"><span class="gov-lock" aria-hidden="true">&#128274;</span> Mandated Definition</span><div class="toggle-switch' + (ot.governance.mandated ? ' on' : '') + '" role="switch" aria-checked="' + ot.governance.mandated + '" aria-label="Mandated" tabindex="0"></div></div>' +
      '<div class="gov-row"><span class="gov-label"><span class="gov-lock" aria-hidden="true">&#128274;</span> Structure Locked</span><div class="toggle-switch' + (ot.governance.locked ? ' on' : '') + '" role="switch" aria-checked="' + ot.governance.locked + '" aria-label="Locked" tabindex="0"></div></div>' +
      '<div class="gov-row"><span class="gov-label"><span class="gov-lock" aria-hidden="true">&#128275;</span> Tenant Override Allowed</span><div class="toggle-switch' + (ot.governance.overridable ? ' on' : '') + '" role="switch" aria-checked="' + ot.governance.overridable + '" aria-label="Overridable" tabindex="0"></div></div>';
    initToggles();
  }

  // Highlight selected row in table
  document.querySelectorAll('#ot-tbody tr').forEach(function (tr) {
    tr.classList.toggle('selected', tr.dataset.otId === ot.id);
  });
}

function closeDetail() {
  selectedOT = null;
  var overlay = document.getElementById('detail-overlay');
  if (overlay) overlay.style.display = 'none';
  document.querySelectorAll('#ot-tbody tr').forEach(function (tr) { tr.classList.remove('selected'); });
}

function initAttrLifecycleButtons() {
  document.querySelectorAll('.attr-lifecycle-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var attrName = btn.dataset.attr;
      // Find the lifecycle badge in same row
      var row = btn.closest('tr');
      var badge = row.querySelector('.demo-status-badge');
      if (!badge) return;
      var current = badge.textContent.trim();
      if (current === 'active') {
        showConfirmDialog('confirm-retire');
        pendingRetireBtn = btn;
      } else if (current === 'planned') {
        badge.className = 'demo-status-badge active';
        badge.textContent = 'active';
        showToast(attrName + ' activated', 'success');
      } else if (current === 'retired') {
        badge.className = 'demo-status-badge planned';
        badge.textContent = 'planned';
        showToast(attrName + ' set to planned', 'success');
      }
    });
  });
}

var pendingRetireBtn = null;

// ────────────────────────────────────────────────────────────────────
// BULK ACTIONS
// ────────────────────────────────────────────────────────────────────
function initBulkActions() {
  var selectAll = document.getElementById('attr-select-all');
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      document.querySelectorAll('.attr-checkbox:not(:disabled)').forEach(function (cb) {
        cb.checked = selectAll.checked;
      });
      updateBulkToolbar();
    });
  }

  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('attr-checkbox')) updateBulkToolbar();
  });

  var bulkRetireBtn = document.getElementById('bulk-retire-btn');
  if (bulkRetireBtn) {
    bulkRetireBtn.addEventListener('click', function () {
      var count = document.querySelectorAll('.attr-checkbox:checked').length;
      document.getElementById('bulk-retire-count').textContent = count;
      showConfirmDialog('confirm-bulk-retire');
    });
  }

  var bulkActivateBtn = document.getElementById('bulk-activate-btn');
  if (bulkActivateBtn) {
    bulkActivateBtn.addEventListener('click', function () {
      document.querySelectorAll('.attr-checkbox:checked').forEach(function (cb) {
        var row = cb.closest('tr');
        var badge = row.querySelector('.demo-status-badge');
        if (badge) { badge.className = 'demo-status-badge active'; badge.textContent = 'active'; }
        cb.checked = false;
      });
      updateBulkToolbar();
      showToast('Attributes activated', 'success');
    });
  }
}

function updateBulkToolbar() {
  var checked = document.querySelectorAll('.attr-checkbox:checked').length;
  var toolbar = document.getElementById('bulk-toolbar');
  var countEl = document.getElementById('bulk-count-num');
  if (toolbar) toolbar.style.display = checked > 0 ? 'flex' : 'none';
  if (countEl) countEl.textContent = checked;
}

// ────────────────────────────────────────────────────────────────────
// WIZARD
// ────────────────────────────────────────────────────────────────────
function initWizard() {
  var closeBtn = document.getElementById('wizard-close');
  var cancelBtn = document.getElementById('wiz-cancel-btn');
  var nextBtn = document.getElementById('wiz-next-btn');
  var backBtn = document.getElementById('wiz-back-btn');

  if (closeBtn) closeBtn.addEventListener('click', closeWizard);
  if (cancelBtn) cancelBtn.addEventListener('click', closeWizard);
  if (nextBtn) nextBtn.addEventListener('click', wizardNext);
  if (backBtn) backBtn.addEventListener('click', wizardBack);

  // Step click navigation
  document.querySelectorAll('.wizard-step').forEach(function (step) {
    step.addEventListener('click', function () {
      var targetStep = parseInt(step.dataset.wizStep);
      if (targetStep <= wizardStep) goToWizardStep(targetStep);
    });
  });
}

function openWizard() {
  wizardStep = 1;
  goToWizardStep(1);
  var overlay = document.getElementById('wizard-overlay');
  if (overlay) overlay.classList.add('active');
  // Reset form
  ['wiz-name', 'wiz-typekey', 'wiz-desc', 'wiz-category'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('.wiz-field').forEach(function (f) { f.classList.remove('has-error'); });
}

function closeWizard() {
  var overlay = document.getElementById('wizard-overlay');
  if (overlay) overlay.classList.remove('active');
}

function wizardNext() {
  if (wizardStep === 1 && !validateStep1()) return;
  if (wizardStep === 4) {
    // Create
    closeWizard();
    showToast('Object type created successfully', 'success');
    return;
  }
  wizardStep++;
  goToWizardStep(wizardStep);
  if (wizardStep === 4) populateReview();
}

function wizardBack() {
  if (wizardStep > 1) {
    wizardStep--;
    goToWizardStep(wizardStep);
  }
}

function goToWizardStep(step) {
  wizardStep = step;
  // Update step indicators
  document.querySelectorAll('.wizard-step').forEach(function (s) {
    var num = parseInt(s.dataset.wizStep);
    s.classList.toggle('active', num === step);
    s.classList.toggle('completed', num < step);
  });
  // Update panels
  document.querySelectorAll('.wizard-panel').forEach(function (p) {
    var pStep = parseInt(p.dataset.wizPanel);
    p.classList.toggle('active', pStep === step);
    p.style.display = pStep === step ? 'block' : 'none';
  });
  // Update buttons
  var backBtn = document.getElementById('wiz-back-btn');
  var nextBtn = document.getElementById('wiz-next-btn');
  if (backBtn) backBtn.disabled = step === 1;
  if (nextBtn) nextBtn.textContent = step === 4 ? 'Create' : 'Next';
}

function validateStep1() {
  var valid = true;
  var nameField = document.getElementById('field-name');
  var typekeyField = document.getElementById('field-typekey');
  var nameInput = document.getElementById('wiz-name');
  var typekeyInput = document.getElementById('wiz-typekey');

  if (!nameInput.value.trim()) { nameField.classList.add('has-error'); valid = false; }
  else { nameField.classList.remove('has-error'); }

  if (!typekeyInput.value.trim()) { typekeyField.classList.add('has-error'); valid = false; }
  else { typekeyField.classList.remove('has-error'); }

  return valid;
}

function populateReview() {
  var el;
  el = document.getElementById('review-name'); if (el) el.textContent = document.getElementById('wiz-name').value || '--';
  el = document.getElementById('review-typekey'); if (el) el.textContent = document.getElementById('wiz-typekey').value || '--';
  var catSelect = document.getElementById('wiz-category');
  el = document.getElementById('review-category'); if (el) el.textContent = catSelect.options[catSelect.selectedIndex].text || '--';
}

// ────────────────────────────────────────────────────────────────────
// CONFIRM DIALOGS
// ────────────────────────────────────────────────────────────────────
function initConfirmDialogs() {
  // Retire single
  var retireCancel = document.getElementById('confirm-retire-cancel');
  var retireOk = document.getElementById('confirm-retire-ok');
  if (retireCancel) retireCancel.addEventListener('click', function () { hideConfirmDialog('confirm-retire'); });
  if (retireOk) retireOk.addEventListener('click', function () {
    hideConfirmDialog('confirm-retire');
    if (pendingRetireBtn) {
      var row = pendingRetireBtn.closest('tr');
      var badge = row.querySelector('.demo-status-badge');
      if (badge) { badge.className = 'demo-status-badge retired'; badge.textContent = 'retired'; }
      var attrName = pendingRetireBtn.dataset.attr;
      showToast(attrName + ' retired', 'warning');
      pendingRetireBtn = null;
    }
  });

  // Bulk retire
  var bulkCancel = document.getElementById('confirm-bulk-cancel');
  var bulkOk = document.getElementById('confirm-bulk-ok');
  if (bulkCancel) bulkCancel.addEventListener('click', function () { hideConfirmDialog('confirm-bulk-retire'); });
  if (bulkOk) bulkOk.addEventListener('click', function () {
    hideConfirmDialog('confirm-bulk-retire');
    document.querySelectorAll('.attr-checkbox:checked').forEach(function (cb) {
      var row = cb.closest('tr');
      var badge = row.querySelector('.demo-status-badge');
      if (badge) { badge.className = 'demo-status-badge retired'; badge.textContent = 'retired'; }
      cb.checked = false;
    });
    updateBulkToolbar();
    showToast('Attributes retired', 'warning');
  });

  // Delete
  var deleteCancel = document.getElementById('confirm-delete-cancel');
  var deleteOk = document.getElementById('confirm-delete-ok');
  if (deleteCancel) deleteCancel.addEventListener('click', function () { hideConfirmDialog('confirm-delete'); });
  if (deleteOk) deleteOk.addEventListener('click', function () {
    hideConfirmDialog('confirm-delete');
    showToast('Object type deleted', 'error');
    closeDetail();
  });

  // Release approve/reject
  var approveBtn = document.getElementById('btn-approve-release');
  var rejectBtn = document.getElementById('btn-reject-release');
  var publishBtn = document.getElementById('btn-publish-release');
  if (approveBtn) approveBtn.addEventListener('click', function () {
    showToast('Release approved', 'success');
    approveBtn.disabled = true;
    if (publishBtn) publishBtn.disabled = false;
    var badge = document.querySelector('#release-detail .demo-status-badge');
    if (badge) { badge.className = 'demo-status-badge approved'; badge.textContent = 'Approved'; }
  });
  if (rejectBtn) rejectBtn.addEventListener('click', function () {
    showToast('Release rejected', 'error');
    var badge = document.querySelector('#release-detail .demo-status-badge');
    if (badge) { badge.className = 'demo-status-badge rejected'; badge.textContent = 'Rejected'; }
  });
  if (publishBtn) publishBtn.addEventListener('click', function () {
    showToast('Release published to all tenants', 'success');
    var badge = document.querySelector('#release-detail .demo-status-badge');
    if (badge) { badge.className = 'demo-status-badge published'; badge.textContent = 'Published'; }
    publishBtn.disabled = true;
  });

  // Escape key closes dialogs
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.confirm-overlay.active').forEach(function (d) {
        d.classList.remove('active');
      });
      var wiz = document.getElementById('wizard-overlay');
      if (wiz && wiz.classList.contains('active')) closeWizard();
    }
  });
}

function showConfirmDialog(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function hideConfirmDialog(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// ────────────────────────────────────────────────────────────────────
// ACCORDION
// ────────────────────────────────────────────────────────────────────
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var item = header.closest('.accordion-item');
      var wasOpen = item.classList.contains('open');
      item.classList.toggle('open', !wasOpen);
      header.setAttribute('aria-expanded', !wasOpen ? 'true' : 'false');
    });
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); header.click(); }
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// TOGGLE SWITCHES
// ────────────────────────────────────────────────────────────────────
function initToggles() {
  document.querySelectorAll('.toggle-switch').forEach(function (sw) {
    if (sw._bound) return;
    sw._bound = true;
    sw.addEventListener('click', function () {
      sw.classList.toggle('on');
      var isOn = sw.classList.contains('on');
      sw.setAttribute('aria-checked', isOn ? 'true' : 'false');
    });
    sw.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sw.click(); }
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// FAB (Create New)
// ────────────────────────────────────────────────────────────────────
function initFab() {
  var fab = document.getElementById('fab-create');
  var emptyBtn = document.getElementById('empty-create-btn');
  if (fab) fab.addEventListener('click', openWizard);
  if (emptyBtn) emptyBtn.addEventListener('click', openWizard);
}

// ────────────────────────────────────────────────────────────────────
// RELEASE CARDS
// ────────────────────────────────────────────────────────────────────
function initReleaseCards() {
  document.querySelectorAll('.release-card').forEach(function (card) {
    card.addEventListener('click', function () {
      document.querySelectorAll('.release-card').forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────────────
function showToast(message, type) {
  var toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  requestAnimationFrame(function () { toast.classList.add('show'); });
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { toast.remove(); }, 300);
  }, 2500);
}
