import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { MasterDefinitionsSectionComponent } from './master-definitions-section.component';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import { ObjectType } from '../../models/administration.models';

// PrimeNG components require ResizeObserver in JSDOM
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {
      return;
    }
    unobserve(): void {
      return;
    }
    disconnect(): void {
      return;
    }
  } as unknown as typeof ResizeObserver;
}

/**
 * Unit tests for MasterDefinitionsSectionComponent.
 *
 * Angular 21's @angular/build:unit-test does NOT support vi.mock().
 * Tests use TestBed with ApiGatewayService stub (useValue) and vi.fn() for verification.
 *
 * Covers:
 * 1.  ngOnInit loads object types and updates signals
 * 2.  ngOnInit error sets error signal
 * 3.  filteredTypes filters by search (name, typeKey, code)
 * 4.  filteredTypes filters by status
 * 5.  filteredTypes returns all when no filters applied
 * 6.  openWizard resets state and shows wizard
 * 7.  closeWizard hides wizard and resets state
 * 8.  nextStep increments up to max 3
 * 9.  prevStep decrements down to min 0
 * 10. addDraftConnection adds connection when valid
 * 11. addDraftConnection is a no-op when target is empty
 * 12. addDraftConnection is a no-op when active name is empty
 * 13. removeConnection removes by index
 * 14. toggleAttributeId adds attribute when not selected
 * 15. toggleAttributeId removes attribute when already selected
 * 16. isAttributeSelected returns correct boolean
 * 17. selectObjectType sets selectedObjectType signal
 * 18. setViewMode changes view mode
 * 19. saveObjectType is a no-op when name is empty
 * 20. saveObjectType calls API, prepends to list, closes wizard
 * 21. saveObjectType also fires attribute and connection API calls
 * 22. saveObjectType sets error on API failure
 * 23. confirmDelete + executeDelete removes item from list and decrements count
 * 24. confirmDelete + executeDelete clears selectedObjectType when it was the deleted item
 * 25. executeDelete sets error on API failure
 * 26. getStatusSeverity returns correct PrimeNG severity
 * 27. getStatusLabel returns correct label strings
 * 28. getStateLabel returns correct label strings
 */

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const MOCK_OBJECT_TYPES: ObjectType[] = [
  {
    id: 'ot-1',
    tenantId: 'tenant-a',
    name: 'Server',
    typeKey: 'server',
    code: 'OBJ_001',
    description: 'A physical server',
    iconName: 'server',
    iconColor: '#428177',
    status: 'active',
    state: 'user_defined',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    attributes: [],
    connections: [],
  },
  {
    id: 'ot-2',
    tenantId: 'tenant-a',
    name: 'Application',
    typeKey: 'application',
    code: 'OBJ_002',
    description: 'A software application',
    iconName: 'desktop',
    iconColor: '#b9a779',
    status: 'planned',
    state: 'default',
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
    attributes: [],
    connections: [],
  },
];

const MOCK_PAGED_RESPONSE = {
  content: MOCK_OBJECT_TYPES,
  totalElements: 2,
  page: 0,
  size: 25,
  totalPages: 1,
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('MasterDefinitionsSectionComponent', () => {
  let fixture: ComponentFixture<MasterDefinitionsSectionComponent>;
  let component: MasterDefinitionsSectionComponent;

  const apiStub = {
    listObjectTypes: vi.fn(() => of(MOCK_PAGED_RESPONSE)),
    listAttributeTypes: vi.fn(() => of([])),
    createObjectType: vi.fn(),
    addAttributeToObjectType: vi.fn(() => of({})),
    addConnectionToObjectType: vi.fn(() => of({})),
    deleteObjectType: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    apiStub.listObjectTypes.mockReturnValue(of(MOCK_PAGED_RESPONSE));
    apiStub.listAttributeTypes.mockReturnValue(of([]));
    apiStub.deleteObjectType.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [MasterDefinitionsSectionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiGatewayService, useValue: apiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MasterDefinitionsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── 1. Initial load ───────────────────────────────────────────────────────

  it('loads object types on init and updates signals', () => {
    expect(apiStub.listObjectTypes).toHaveBeenCalledWith({ page: 0, size: 25 });
    expect(component.objectTypes()).toHaveLength(2);
    expect(component.totalRecords()).toBe(2);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  // ── 2. Load error ─────────────────────────────────────────────────────────

  it('sets error signal and clears loading when load fails', () => {
    apiStub.listObjectTypes.mockReturnValueOnce(throwError(() => new Error('Network error')));

    component.loadObjectTypes();

    expect(component.error()).toContain('Failed to load');
    expect(component.loading()).toBe(false);
  });

  // ── 3-5. filteredTypes computed ───────────────────────────────────────────

  it('filteredTypes returns all items when no search or status filter', () => {
    expect(component.filteredTypes()).toHaveLength(2);
  });

  it('filteredTypes filters by name (case-insensitive)', () => {
    component.search.set('SERV');
    const results = component.filteredTypes();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Server');
  });

  it('filteredTypes filters by typeKey', () => {
    component.search.set('appli');
    expect(component.filteredTypes()).toHaveLength(1);
    expect(component.filteredTypes()[0].typeKey).toBe('application');
  });

  it('filteredTypes filters by code', () => {
    component.search.set('OBJ_001');
    expect(component.filteredTypes()).toHaveLength(1);
    expect(component.filteredTypes()[0].code).toBe('OBJ_001');
  });

  it('filteredTypes returns empty array when search matches nothing', () => {
    component.search.set('xyzzy_nonexistent');
    expect(component.filteredTypes()).toHaveLength(0);
  });

  it('filteredTypes filters by status', () => {
    component.statusFilter.set('planned');
    const results = component.filteredTypes();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Application');
  });

  it('filteredTypes returns all for status "all"', () => {
    component.statusFilter.set('all');
    expect(component.filteredTypes()).toHaveLength(2);
  });

  // ── 6. openWizard ─────────────────────────────────────────────────────────

  it('openWizard sets showWizard to true and resets state', () => {
    component.wizardName.set('Dirty State');
    component.wizardStep.set(2);

    component.openWizard();

    expect(component.showWizard()).toBe(true);
    expect(component.wizardStep()).toBe(0);
    expect(component.wizardName()).toBe('');
  });

  it('openWizard loads attribute types', () => {
    component.openWizard();
    expect(apiStub.listAttributeTypes).toHaveBeenCalled();
  });

  // ── 7. closeWizard ────────────────────────────────────────────────────────

  it('closeWizard sets showWizard to false and resets state', () => {
    component.showWizard.set(true);
    component.wizardName.set('Draft Name');
    component.wizardStep.set(3);

    component.closeWizard();

    expect(component.showWizard()).toBe(false);
    expect(component.wizardName()).toBe('');
    expect(component.wizardStep()).toBe(0);
  });

  // ── 8. nextStep ───────────────────────────────────────────────────────────

  it('nextStep increments wizardStep', () => {
    expect(component.wizardStep()).toBe(0);
    component.nextStep();
    expect(component.wizardStep()).toBe(1);
    component.nextStep();
    expect(component.wizardStep()).toBe(2);
  });

  it('nextStep does not exceed max step 3', () => {
    component.wizardStep.set(3);
    component.nextStep();
    expect(component.wizardStep()).toBe(3);
  });

  // ── 9. prevStep ───────────────────────────────────────────────────────────

  it('prevStep decrements wizardStep', () => {
    component.wizardStep.set(2);
    component.prevStep();
    expect(component.wizardStep()).toBe(1);
  });

  it('prevStep does not go below 0', () => {
    component.wizardStep.set(0);
    component.prevStep();
    expect(component.wizardStep()).toBe(0);
  });

  // ── 10-12. addDraftConnection ─────────────────────────────────────────────

  it('addDraftConnection adds a connection when target and active name are valid', () => {
    component.draftTargetTypeId.set('ot-1');
    component.draftActiveName.set('runs on');

    component.addDraftConnection();

    const connections = component.wizardConnections();
    expect(connections).toHaveLength(1);
    expect(connections[0].activeName).toBe('runs on');
    expect(connections[0].targetTypeId).toBe('ot-1');
    expect(connections[0].targetTypeName).toBe('Server');
  });

  it('addDraftConnection resets draft fields after adding', () => {
    component.draftTargetTypeId.set('ot-1');
    component.draftActiveName.set('runs on');
    component.draftPassiveName.set('hosts');

    component.addDraftConnection();

    expect(component.draftTargetTypeId()).toBe('');
    expect(component.draftActiveName()).toBe('');
    expect(component.draftPassiveName()).toBe('');
  });

  it('addDraftConnection is a no-op when target type is empty', () => {
    component.draftTargetTypeId.set('');
    component.draftActiveName.set('connects to');

    component.addDraftConnection();

    expect(component.wizardConnections()).toHaveLength(0);
  });

  it('addDraftConnection is a no-op when active name is blank', () => {
    component.draftTargetTypeId.set('ot-1');
    component.draftActiveName.set('   ');

    component.addDraftConnection();

    expect(component.wizardConnections()).toHaveLength(0);
  });

  it('addDraftConnection uses passiveName fallback to activeName when passive is empty', () => {
    component.draftTargetTypeId.set('ot-1');
    component.draftActiveName.set('manages');
    component.draftPassiveName.set('');

    component.addDraftConnection();

    expect(component.wizardConnections()[0].passiveName).toBe('manages');
  });

  // ── 13. removeConnection ──────────────────────────────────────────────────

  it('removeConnection removes the connection at the given index', () => {
    component.draftTargetTypeId.set('ot-1');
    component.draftActiveName.set('manages');
    component.addDraftConnection();
    expect(component.wizardConnections()).toHaveLength(1);

    component.removeConnection(0);

    expect(component.wizardConnections()).toHaveLength(0);
  });

  // ── 14-16. toggleAttributeId / isAttributeSelected ───────────────────────

  it('toggleAttributeId adds attribute id when not selected', () => {
    component.toggleAttributeId('at-1');
    expect(component.isAttributeSelected('at-1')).toBe(true);
  });

  it('toggleAttributeId removes attribute id when already selected', () => {
    component.toggleAttributeId('at-1');
    component.toggleAttributeId('at-1');
    expect(component.isAttributeSelected('at-1')).toBe(false);
  });

  it('isAttributeSelected returns false for an id that was never toggled', () => {
    expect(component.isAttributeSelected('at-99')).toBe(false);
  });

  // ── 17. selectObjectType ──────────────────────────────────────────────────

  it('selectObjectType sets selectedObjectType signal', () => {
    component.selectObjectType(MOCK_OBJECT_TYPES[0]);
    expect(component.selectedObjectType()?.id).toBe('ot-1');

    component.selectObjectType(MOCK_OBJECT_TYPES[1]);
    expect(component.selectedObjectType()?.id).toBe('ot-2');
  });

  // ── 18. setViewMode ───────────────────────────────────────────────────────

  it('setViewMode switches between list and card', () => {
    expect(component.viewMode()).toBe('list');
    component.setViewMode('card');
    expect(component.viewMode()).toBe('card');
    component.setViewMode('list');
    expect(component.viewMode()).toBe('list');
  });

  // ── 19. saveObjectType — guard ────────────────────────────────────────────

  it('saveObjectType does nothing when wizardName is empty', () => {
    component.wizardName.set('');
    component.saveObjectType();
    expect(apiStub.createObjectType).not.toHaveBeenCalled();
  });

  it('saveObjectType does nothing when wizardName is whitespace only', () => {
    component.wizardName.set('   ');
    component.saveObjectType();
    expect(apiStub.createObjectType).not.toHaveBeenCalled();
  });

  // ── 20. saveObjectType — success ──────────────────────────────────────────

  it('saveObjectType calls createObjectType, prepends result, closes wizard', () => {
    const created: ObjectType = {
      id: 'ot-new',
      tenantId: 'tenant-a',
      name: 'Network Switch',
      typeKey: 'network_switch',
      code: 'OBJ_003',
      description: '',
      iconName: 'box',
      iconColor: '#428177',
      status: 'active',
      state: 'user_defined',
      attributes: [],
      connections: [],
    };
    apiStub.createObjectType.mockReturnValue(of(created));

    component.wizardName.set('Network Switch');
    component.showWizard.set(true);

    component.saveObjectType();

    expect(apiStub.createObjectType).toHaveBeenCalled();
    // Prepended to list
    expect(component.objectTypes()[0].id).toBe('ot-new');
    expect(component.objectTypes()).toHaveLength(3);
    // Total incremented
    expect(component.totalRecords()).toBe(3);
    // Wizard closed
    expect(component.showWizard()).toBe(false);
    expect(component.wizardSaving()).toBe(false);
  });

  // ── 21. saveObjectType — fires attribute/connection API calls ─────────────

  it('saveObjectType fires addAttributeToObjectType for each selected attribute', () => {
    const created = {
      id: 'ot-new',
      name: 'Net',
      typeKey: 'net',
      code: 'OBJ_003',
      status: 'active',
      state: 'user_defined',
      attributes: [],
      connections: [],
    };
    apiStub.createObjectType.mockReturnValue(of(created));

    component.wizardName.set('Net');
    component.toggleAttributeId('at-1');
    component.toggleAttributeId('at-2');

    component.saveObjectType();

    expect(apiStub.addAttributeToObjectType).toHaveBeenCalledTimes(2);
    expect(apiStub.addAttributeToObjectType).toHaveBeenCalledWith(
      'ot-new',
      expect.objectContaining({ attributeTypeId: 'at-1' }),
    );
    expect(apiStub.addAttributeToObjectType).toHaveBeenCalledWith(
      'ot-new',
      expect.objectContaining({ attributeTypeId: 'at-2' }),
    );
  });

  it('saveObjectType fires addConnectionToObjectType for each draft connection', () => {
    const created = {
      id: 'ot-new',
      name: 'Net',
      typeKey: 'net',
      code: 'OBJ_003',
      status: 'active',
      state: 'user_defined',
      attributes: [],
      connections: [],
    };
    apiStub.createObjectType.mockReturnValue(of(created));

    component.wizardName.set('Net');
    component.draftTargetTypeId.set('ot-1');
    component.draftActiveName.set('connects to');
    component.addDraftConnection();

    component.saveObjectType();

    expect(apiStub.addConnectionToObjectType).toHaveBeenCalledTimes(1);
    expect(apiStub.addConnectionToObjectType).toHaveBeenCalledWith(
      'ot-new',
      expect.objectContaining({ targetObjectTypeId: 'ot-1' }),
    );
  });

  // ── 22. saveObjectType — error ────────────────────────────────────────────

  it('saveObjectType sets error and stops saving on API failure', () => {
    apiStub.createObjectType.mockReturnValue(throwError(() => new Error('API error')));

    component.wizardName.set('Network');
    component.saveObjectType();

    expect(component.wizardSaving()).toBe(false);
    expect(component.error()).toContain('Failed to create');
  });

  // ── 23. confirmDelete + executeDelete — success ───────────────────────────

  it('confirmDelete + executeDelete calls API, removes item from list, decrements totalRecords', () => {
    const event = new Event('click');
    component.confirmDelete(MOCK_OBJECT_TYPES[0], event);
    expect(component.showDeleteConfirm()).toBe(true);
    expect(component.pendingDeleteItem()?.id).toBe('ot-1');

    component.executeDelete();

    expect(apiStub.deleteObjectType).toHaveBeenCalledWith('ot-1');
    expect(component.objectTypes()).not.toContainEqual(expect.objectContaining({ id: 'ot-1' }));
    expect(component.objectTypes()).toHaveLength(1);
    expect(component.totalRecords()).toBe(1);
    expect(component.showDeleteConfirm()).toBe(false);
  });

  // ── 24. confirmDelete + executeDelete — clears selection ─────────────────

  it('executeDelete clears selectedObjectType when it was the deleted item', () => {
    component.selectedObjectType.set(MOCK_OBJECT_TYPES[0]);
    const event = new Event('click');

    component.confirmDelete(MOCK_OBJECT_TYPES[0], event);
    component.executeDelete();

    expect(component.selectedObjectType()).toBeNull();
  });

  it('executeDelete preserves selectedObjectType when a different item is deleted', () => {
    component.selectedObjectType.set(MOCK_OBJECT_TYPES[1]);
    const event = new Event('click');

    component.confirmDelete(MOCK_OBJECT_TYPES[0], event);
    component.executeDelete();

    expect(component.selectedObjectType()?.id).toBe('ot-2');
  });

  // ── 25. executeDelete — error ─────────────────────────────────────────────

  it('executeDelete sets error signal on API failure', () => {
    apiStub.deleteObjectType.mockReturnValueOnce(throwError(() => new Error('Delete failed')));
    const event = new Event('click');

    component.confirmDelete(MOCK_OBJECT_TYPES[0], event);
    component.executeDelete();

    expect(component.error()).toContain('Failed to delete');
  });

  // ── 26. getStatusSeverity ─────────────────────────────────────────────────

  it('getStatusSeverity returns correct PrimeNG severity per status', () => {
    // These values come from OBJECT_TYPE_STATUS_SEVERITY in administration.models.ts
    expect(['success', 'info', 'warn', 'danger', 'secondary']).toContain(
      component.getStatusSeverity('active'),
    );
    expect(['success', 'info', 'warn', 'danger', 'secondary']).toContain(
      component.getStatusSeverity('planned'),
    );
    expect(['success', 'info', 'warn', 'danger', 'secondary']).toContain(
      component.getStatusSeverity('hold'),
    );
    expect(['success', 'info', 'warn', 'danger', 'secondary']).toContain(
      component.getStatusSeverity('retired'),
    );
    expect(component.getStatusSeverity('unknown-status')).toBe('secondary');
  });

  // ── 27. getStatusLabel ────────────────────────────────────────────────────

  it('getStatusLabel returns human-readable label for each status', () => {
    expect(component.getStatusLabel('active')).toBe('Active');
    expect(component.getStatusLabel('planned')).toBe('Planned');
    expect(component.getStatusLabel('hold')).toBe('On Hold');
    expect(component.getStatusLabel('retired')).toBe('Retired');
    expect(component.getStatusLabel('unknown')).toBe('unknown'); // passthrough
  });

  // ── 28. getStateLabel ─────────────────────────────────────────────────────

  it('getStateLabel returns human-readable label for each state', () => {
    expect(component.getStateLabel('default')).toBe('Default');
    expect(component.getStateLabel('customized')).toBe('Customized');
    expect(component.getStateLabel('user_defined')).toBe('User Defined');
    expect(component.getStateLabel('unknown')).toBe('unknown'); // passthrough
  });
});
