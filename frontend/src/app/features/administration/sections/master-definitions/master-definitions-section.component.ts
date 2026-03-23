import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import { ObjectTypeCreateRequest } from '../../../../core/api/models';
import {
  OBJECT_TYPE_STATE_SEVERITY,
  OBJECT_TYPE_STATUS_SEVERITY,
  ObjectType,
  ObjectTypeState,
  ObjectTypeStatus,
  AttributeType,
  ConnectionCardinality,
} from '../../models/administration.models';

type ViewMode = 'list' | 'card';

interface ConnectionDraft {
  targetTypeId: string;
  targetTypeName: string;
  relationshipKey: string;
  activeName: string;
  passiveName: string;
  cardinality: ConnectionCardinality;
  isDirected: boolean;
}

@Component({
  selector: 'app-master-definitions-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    TagModule,
    SelectModule,
    ProgressSpinnerModule,
    SkeletonModule,
    DialogModule,
    TooltipModule,
  ],
  templateUrl: './master-definitions-section.component.html',
  styleUrl: './master-definitions-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDefinitionsSectionComponent implements OnInit {
  private readonly api = inject(ApiGatewayService);

  // ── State ────────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly objectTypes = signal<ObjectType[]>([]);
  readonly selectedObjectType = signal<ObjectType | null>(null);
  readonly viewMode = signal<ViewMode>('list');
  readonly showWizard = signal(false);
  readonly wizardStep = signal(0);
  readonly search = signal('');
  readonly statusFilter = signal<ObjectTypeStatus | 'all'>('all');
  readonly currentPage = signal(0);
  readonly pageSize = signal(25);
  readonly totalRecords = signal(0);
  readonly error = signal<string | null>(null);

  // ── Wizard basic form state ───────────────────────────────────────────────
  readonly wizardName = signal('');
  readonly wizardTypeKey = signal('');
  readonly wizardIconName = signal('box');
  readonly wizardIconColor = signal('#428177');
  readonly wizardDescription = signal('');
  readonly wizardStatus = signal<ObjectTypeStatus>('active');
  readonly wizardSaving = signal(false);

  // ── Wizard connection / attribute state ──────────────────────────────────
  readonly wizardConnections = signal<ConnectionDraft[]>([]);
  readonly wizardAttributeIds = signal<Set<string>>(new Set());
  readonly availableAttributeTypes = signal<AttributeType[]>([]);

  // ── Draft connection form ─────────────────────────────────────────────────
  readonly draftTargetTypeId = signal('');
  readonly draftActiveName = signal('');
  readonly draftPassiveName = signal('');
  readonly draftCardinality = signal<ConnectionCardinality>('one-to-many');
  readonly draftIsDirected = signal(true);

  // ── Delete confirmation state ─────────────────────────────────────────────
  readonly showDeleteConfirm = signal(false);
  readonly pendingDeleteItem = signal<ObjectType | null>(null);

  // ── Detail edit mode state ────────────────────────────────────────────────
  readonly detailEditMode = signal(false);
  readonly editName = signal('');
  readonly editDescription = signal('');
  readonly editIconName = signal('box');
  readonly editIconColor = signal('#428177');
  readonly editStatus = signal<ObjectTypeStatus>('active');
  readonly editSaving = signal(false);

  // ── Static display data ───────────────────────────────────────────────────
  readonly iconOptions = [
    'box',
    'server',
    'database',
    'desktop',
    'mobile',
    'cloud',
    'cog',
    'wrench',
    'bolt',
    'shield',
    'user',
    'users',
    'building',
    'home',
    'chart-bar',
    'chart-line',
    'chart-pie',
    'file',
    'folder',
    'envelope',
    'calendar',
    'clock',
    'tag',
    'bookmark',
    'star',
    'heart',
    'flag',
    'globe',
    'link',
    'lock',
    'sitemap',
    'th',
    'list',
    'bars',
    'sliders',
    'inbox',
    'send',
    'map-marker',
  ];

  readonly colorSwatches = [
    '#428177',
    '#054239',
    '#002623',
    '#edebe0',
    '#b9a779',
    '#988561',
    '#6b1f2a',
    '#4a151e',
    '#260f14',
    '#ffffff',
    '#3d3a3b',
    '#161616',
  ];

  readonly cardinalityOptions = [
    { label: 'One to One', value: 'one-to-one' },
    { label: 'One to Many', value: 'one-to-many' },
    { label: 'Many to Many', value: 'many-to-many' },
  ];

  readonly statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Planned', value: 'planned' },
    { label: 'On Hold', value: 'hold' },
    { label: 'Retired', value: 'retired' },
  ];

  readonly statusSeverityMap = OBJECT_TYPE_STATUS_SEVERITY;
  readonly stateSeverityMap = OBJECT_TYPE_STATE_SEVERITY;

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly filteredTypes = computed(() => {
    const needle = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.objectTypes().filter((t) => {
      const matchSearch =
        !needle ||
        t.name.toLowerCase().includes(needle) ||
        t.typeKey.toLowerCase().includes(needle) ||
        (t.code ?? '').toLowerCase().includes(needle);
      const matchStatus = status === 'all' || t.status === status;
      return matchSearch && matchStatus;
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadObjectTypes();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  loadObjectTypes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listObjectTypes({
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (response) => {
          this.objectTypes.set(response.content as ObjectType[]);
          this.totalRecords.set(response.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load object types. Please try again.');
          this.loading.set(false);
          console.error('Error loading object types:', err);
        },
      });
  }

  selectObjectType(ot: ObjectType): void {
    this.selectedObjectType.set(ot);
  }

  openWizard(): void {
    this.resetWizard();
    this.loadAttributeTypesForWizard();
    this.showWizard.set(true);
  }

  closeWizard(): void {
    this.showWizard.set(false);
    this.resetWizard();
  }

  nextStep(): void {
    this.wizardStep.update((s) => Math.min(s + 1, 3));
  }

  prevStep(): void {
    this.wizardStep.update((s) => Math.max(s - 1, 0));
  }

  // ── Attribute type loading ────────────────────────────────────────────────
  private loadAttributeTypesForWizard(): void {
    this.api.listAttributeTypes().subscribe({
      next: (types) => this.availableAttributeTypes.set(types as AttributeType[]),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {}, // non-critical — step shows empty state
    });
  }

  // ── Connection draft management ───────────────────────────────────────────
  addDraftConnection(): void {
    const targetId = this.draftTargetTypeId();
    if (!targetId || !this.draftActiveName().trim()) return;
    const target = this.objectTypes().find((t) => t.id === targetId);
    if (!target) return;
    this.wizardConnections.update((list) => [
      ...list,
      {
        targetTypeId: targetId,
        targetTypeName: target.name,
        relationshipKey: `connects_to_${target.typeKey || targetId}`,
        activeName: this.draftActiveName().trim(),
        passiveName: this.draftPassiveName().trim() || this.draftActiveName().trim(),
        cardinality: this.draftCardinality(),
        isDirected: this.draftIsDirected(),
      },
    ]);
    this.draftTargetTypeId.set('');
    this.draftActiveName.set('');
    this.draftPassiveName.set('');
  }

  removeConnection(index: number): void {
    this.wizardConnections.update((list) => list.filter((_, i) => i !== index));
  }

  // ── Attribute selection ───────────────────────────────────────────────────
  toggleAttributeId(id: string): void {
    this.wizardAttributeIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isAttributeSelected(id: string): boolean {
    return this.wizardAttributeIds().has(id);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  saveObjectType(): void {
    if (!this.wizardName().trim()) return;
    this.wizardSaving.set(true);
    const req: ObjectTypeCreateRequest = {
      name: this.wizardName().trim(),
      typeKey: this.wizardTypeKey().trim() || undefined,
      description: this.wizardDescription().trim() || undefined,
      iconName: this.wizardIconName() || 'box',
      iconColor: this.wizardIconColor() || '#428177',
      status: this.wizardStatus(),
      state: 'user_defined',
    };
    this.api.createObjectType(req).subscribe({
      next: (created) => {
        const createdId = (created as { id: string }).id;
        const attrIds = [...this.wizardAttributeIds()];
        const connections = this.wizardConnections();

        attrIds.forEach((id, idx) =>
          this.api
            .addAttributeToObjectType(createdId, {
              attributeTypeId: id,
              isRequired: false,
              displayOrder: idx + 1,
            })
            .subscribe(),
        );

        connections.forEach((c) =>
          this.api
            .addConnectionToObjectType(createdId, {
              targetObjectTypeId: c.targetTypeId,
              relationshipKey: c.relationshipKey,
              activeName: c.activeName,
              passiveName: c.passiveName,
              cardinality: c.cardinality,
              isDirected: c.isDirected,
            })
            .subscribe(),
        );

        this.objectTypes.update((types) => [created as unknown as ObjectType, ...types]);
        this.totalRecords.update((n) => n + 1);
        this.wizardSaving.set(false);
        this.closeWizard();
      },
      error: () => {
        this.wizardSaving.set(false);
        this.error.set('Failed to create object type. Please check your connection and try again.');
      },
    });
  }

  confirmDelete(ot: ObjectType, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteItem.set(ot);
    this.showDeleteConfirm.set(true);
  }

  executeDelete(): void {
    const ot = this.pendingDeleteItem();
    if (!ot) return;
    this.api.deleteObjectType(ot.id).subscribe({
      next: () => {
        this.objectTypes.update((types) => types.filter((t) => t.id !== ot.id));
        if (this.selectedObjectType()?.id === ot.id) {
          this.selectedObjectType.set(null);
          this.detailEditMode.set(false);
        }
        this.totalRecords.update((n) => n - 1);
        this.showDeleteConfirm.set(false);
        this.pendingDeleteItem.set(null);
      },
      error: () => {
        this.error.set('Failed to delete object type.');
        this.showDeleteConfirm.set(false);
        this.pendingDeleteItem.set(null);
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.pendingDeleteItem.set(null);
  }

  enterEditMode(ot: ObjectType): void {
    this.editName.set(ot.name);
    this.editDescription.set(ot.description ?? '');
    this.editIconName.set(ot.iconName);
    this.editIconColor.set(ot.iconColor);
    this.editStatus.set(ot.status);
    this.detailEditMode.set(true);
  }

  cancelEditMode(): void {
    this.detailEditMode.set(false);
  }

  saveEdit(): void {
    const ot = this.selectedObjectType();
    if (!ot || !this.editName().trim()) return;
    this.editSaving.set(true);
    this.api
      .updateObjectType(ot.id, {
        name: this.editName().trim(),
        description: this.editDescription().trim() || undefined,
        iconName: this.editIconName(),
        iconColor: this.editIconColor(),
        status: this.editStatus(),
      })
      .subscribe({
        next: (updated) => {
          const updatedOt = updated as unknown as ObjectType;
          this.objectTypes.update((types) =>
            types.map((t) => (t.id === updatedOt.id ? updatedOt : t)),
          );
          this.selectedObjectType.set(updatedOt);
          this.editSaving.set(false);
          this.detailEditMode.set(false);
        },
        error: () => {
          this.error.set('Failed to update object type.');
          this.editSaving.set(false);
        },
      });
  }

  duplicateItem(ot: ObjectType, event: Event): void {
    event.stopPropagation();
    this.api.duplicateObjectType(ot.id).subscribe({
      next: (copy) => {
        this.objectTypes.update((types) => [copy as unknown as ObjectType, ...types]);
        this.totalRecords.update((n) => n + 1);
      },
      error: () => {
        this.error.set('Failed to duplicate object type.');
      },
    });
  }

  restoreToDefault(ot: ObjectType, event?: Event): void {
    if (event) event.stopPropagation();
    this.api.restoreObjectType(ot.id).subscribe({
      next: (restored) => {
        const restoredOt = restored as unknown as ObjectType;
        this.objectTypes.update((types) =>
          types.map((t) => (t.id === restoredOt.id ? restoredOt : t)),
        );
        if (this.selectedObjectType()?.id === restoredOt.id) {
          this.selectedObjectType.set(restoredOt);
        }
      },
      error: () => {
        this.error.set('Failed to restore object type.');
      },
    });
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  getStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severity = this.statusSeverityMap[status as ObjectTypeStatus];
    return (
      (severity as 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast') ?? 'secondary'
    );
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Active',
      planned: 'Planned',
      hold: 'On Hold',
      retired: 'Retired',
    };
    return labels[status] ?? status;
  }

  getStateLabel(state: string): string {
    const labels: Record<string, string> = {
      default: 'Default',
      customized: 'Customized',
      user_defined: 'User Defined',
    };
    return labels[state] ?? state;
  }

  getStateSeverity(
    state: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severity = this.stateSeverityMap[state as ObjectTypeState];
    return (
      (severity as 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast') ?? 'secondary'
    );
  }

  private resetWizard(): void {
    this.wizardStep.set(0);
    this.wizardName.set('');
    this.wizardTypeKey.set('');
    this.wizardIconName.set('box');
    this.wizardIconColor.set('#428177');
    this.wizardDescription.set('');
    this.wizardStatus.set('active');
    this.wizardConnections.set([]);
    this.wizardAttributeIds.set(new Set());
    this.draftTargetTypeId.set('');
    this.draftActiveName.set('');
    this.draftPassiveName.set('');
    this.draftCardinality.set('one-to-many');
    this.draftIsDirected.set(true);
  }
}
