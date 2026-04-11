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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { NgIcon } from '@ng-icons/core';
import { IconNamePipe } from '../../../../core/icons/icon-template.pipe';
import { IconService } from '../../../../core/icons/icon.service';
import { ApiGatewayService } from '../../../../core/api/api-gateway.service';
import { ObjectTypeCreateRequest } from '../../../../core/api/models';
import {
  MOBILE_DIALOG_BREAKPOINTS,
  WIZARD_DIALOG_STYLE,
  standardDialogPt as sharedStandardDialogPt,
  wizardDialogPt as sharedWizardDialogPt,
} from '../../../../core/theme/overlay-presets';
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
  targetObjectTypeId: string;
  targetObjectTypeName: string;
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
    InputTextModule,
    TagModule,
    SelectModule,
    ProgressSpinnerModule,
    SkeletonModule,
    TabsModule,
    DialogModule,
    TextareaModule,
    ToggleSwitchModule,
    TooltipModule,
    NgIcon,
    IconNamePipe,
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
  readonly stepIndex = signal(0);
  readonly search = signal('');
  readonly statusFilter = signal<ObjectTypeStatus | 'all'>('all');
  readonly currentPage = signal(0);
  readonly pageSize = signal(25);
  readonly totalRecords = signal(0);
  readonly error = signal<string | null>(null);

  // ── Wizard basic form state ───────────────────────────────────────────────
  readonly wizardName = signal('');
  readonly wizardTypeKey = signal('');
  readonly wizardIconName = signal('phosphorCubeThin');
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

  // ── Fact sheet tab state ─────────────────────────────────────────────────
  readonly factSheetTab = signal<string>('attributes');

  // ── Delete confirmation state ─────────────────────────────────────────────
  readonly showDeleteConfirm = signal(false);
  readonly pendingDeleteItem = signal<ObjectType | null>(null);

  // ── Detail edit mode state ────────────────────────────────────────────────
  readonly detailEditMode = signal(false);
  readonly editName = signal('');
  readonly editDescription = signal('');
  readonly editIconName = signal('phosphorCubeThin');
  readonly editIconColor = signal('#428177');
  readonly editStatus = signal<ObjectTypeStatus>('active');
  readonly editSaving = signal(false);

  // ── Static display data ───────────────────────────────────────────────────
  private readonly iconSvc = inject(IconService);

  /** Icon names for icon picker grids (Phosphor Thin names). */
  readonly iconOptions = [
    'phosphorCubeThin',
    'phosphorDesktopThin',
    'phosphorDatabaseThin',
    'phosphorMonitorThin',
    'phosphorDeviceMobileThin',
    'phosphorCloudThin',
    'phosphorGearThin',
    'phosphorWrenchThin',
    'phosphorLightningThin',
    'phosphorShieldThin',
    'phosphorUserThin',
    'phosphorUsersThin',
    'phosphorHouseThin',
    'phosphorChartBarThin',
    'phosphorChartLineThin',
    'phosphorChartPieThin',
    'phosphorFileThin',
    'phosphorFolderThin',
    'phosphorEnvelopeThin',
    'phosphorCalendarThin',
    'phosphorClockThin',
    'phosphorTagThin',
    'phosphorBookmarkSimpleThin',
    'phosphorStarThin',
    'phosphorHeartThin',
    'phosphorFlagThin',
    'phosphorGlobeThin',
    'phosphorLinkThin',
    'phosphorLockThin',
    'phosphorTreeStructureThin',
    'phosphorSquaresFourThin',
    'phosphorListThin',
    'phosphorTextAlignJustifyThin',
    'phosphorSlidersThin',
    'phosphorTrayThin',
    'phosphorPaperPlaneTiltThin',
    'phosphorMapPinThin',
    'phosphorCpuThin',
    'phosphorWifiHighThin',
    'phosphorKeyThin',
    'phosphorIdentificationCardThin',
    'phosphorWarehouseThin',
    'phosphorTruckThin',
    'phosphorMoneyThin',
    'phosphorShoppingCartThin',
    'phosphorChatCircleThin',
    'phosphorPhoneThin',
    'phosphorPrinterThin',
    'phosphorMagnifyingGlassThin',
    'phosphorEyeThin',
    'phosphorPencilSimpleThin',
    'phosphorCheckCircleThin',
    'phosphorWarningThin',
    'phosphorInfoThin',
    'phosphorQuestionThin',
    'phosphorImageThin',
    'phosphorVideoCameraThin',
    'phosphorHeadphonesThin',
    'phosphorMapTrifoldThin',
    'phosphorSignpostThin',
    'phosphorHammerThin',
    'phosphorClipboardThin',
    'phosphorMegaphoneThin',
    'phosphorTimerThin',
    'phosphorPaletteThin',
    'phosphorCodeThin',
    'phosphorCopyThin',
    'phosphorFunnelThin',
    'phosphorSortAscendingThin',
    'phosphorArrowsOutCardinalThin',
    'phosphorShareNetworkThin',
    'phosphorEraserThin',
    'phosphorReceiptThin',
    'phosphorBriefcaseThin',
    'phosphorBuildingsThin',
    'phosphorGraduationCapThin',
    'phosphorWaveSineThin',
  ];

  readonly colorSwatches = [
    '#428177',
    '#054239',
    '#002623',
    '#F2EFE9',
    '#8FB8AE',
    '#988561',
    '#6b1f2a',
    '#4a151e',
    '#260f14',
    '#FAF8F5',
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
  protected readonly statusSelectPt = {
    root: {
      style: {
        'min-inline-size': '6.875rem',
        border: '1px solid rgba(var(--nm-black-rgb), 0.08)',
        'border-radius': 'var(--nm-radius-pill)',
        background: 'var(--tp-surface-raised)',
        'box-shadow': 'none',
      },
    },
    label: {
      style: {
        padding: 'var(--tp-space-2) var(--tp-space-3)',
        color: 'var(--nm-text)',
        'font-size': 'var(--tp-font-sm)',
      },
    },
    trigger: {
      style: {
        color: 'var(--nm-muted)',
      },
    },
    panel: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-md)',
        overflow: 'hidden',
      },
    },
    item: {
      style: {
        'font-size': 'var(--tp-font-sm)',
      },
    },
  } as const;
  protected readonly fieldSelectPt = {
    root: {
      style: {
        border: '1px solid rgba(var(--nm-black-rgb), 0.08)',
        'border-radius': 'var(--nm-radius-pill)',
        background: 'var(--tp-surface-raised)',
        'box-shadow': 'none',
      },
    },
    label: {
      style: {
        padding: 'var(--tp-space-2) var(--tp-space-3)',
        color: 'var(--nm-text)',
        'font-size': 'var(--tp-font-sm)',
      },
    },
    trigger: {
      style: {
        color: 'var(--nm-muted)',
      },
    },
    panel: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-md)',
        overflow: 'hidden',
      },
    },
    item: {
      style: {
        'font-size': 'var(--tp-font-sm)',
      },
    },
  } as const;
  protected readonly dialogPt = sharedStandardDialogPt;
  protected readonly wizardDialogPt = sharedWizardDialogPt;
  protected readonly dialogBreakpoints = MOBILE_DIALOG_BREAKPOINTS;
  protected readonly wizardDialogStyle = WIZARD_DIALOG_STYLE;
  protected readonly factSheetTabsPt = {
    tablist: {
      style: {
        'border-block-end': '1px solid color-mix(in srgb, var(--nm-muted) 20%, transparent)',
      },
    },
    tab: {
      style: {
        padding: 'var(--tp-space-2) var(--tp-space-3)',
        'font-size': 'var(--tp-font-sm)',
        'font-weight': '600',
      },
    },
    activeBar: {
      style: {
        background: 'var(--nm-accent)',
      },
    },
    tabpanels: {
      style: {
        padding: 'var(--tp-space-3) 0 0',
      },
    },
    tabpanel: {
      style: {
        padding: '0',
      },
    },
  } as const;

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
    this.detailEditMode.set(false);
    // Fetch fresh data with full relationships
    this.api.getObjectType(ot.id).subscribe({
      next: (fresh) => {
        const freshOt = fresh as unknown as ObjectType;
        this.selectedObjectType.set(freshOt);
        // Update in list too
        this.objectTypes.update((types) => types.map((t) => (t.id === freshOt.id ? freshOt : t)));
      },
      error: () => {
        // Keep stale data on error — non-critical
      },
    });
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
    this.stepIndex.update((s) => Math.min(s + 1, 3));
  }

  prevStep(): void {
    this.stepIndex.update((s) => Math.max(s - 1, 0));
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
        targetObjectTypeId: targetId,
        targetObjectTypeName: target.name,
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
      iconName: this.wizardIconName() || 'phosphorCubeThin',
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
              targetObjectTypeId: c.targetObjectTypeId,
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

  // ── Detail panel attribute/connection management ─────────────────────────
  readonly showAddAttributeDialog = signal(false);
  readonly showAddConnectionDialog = signal(false);
  readonly detailAvailableAttributes = signal<AttributeType[]>([]);
  readonly detailDraftAttrId = signal('');
  readonly detailDraftAttrRequired = signal(false);
  readonly detailDraftTargetTypeId = signal('');
  readonly detailDraftActiveName = signal('');
  readonly detailDraftPassiveName = signal('');
  readonly detailDraftCardinality = signal<ConnectionCardinality>('one-to-many');
  readonly detailDraftIsDirected = signal(true);

  // ── Create new attribute type ────────────────────────────────────────────
  readonly showCreateAttrTypeDialog = signal(false);
  readonly newAttrName = signal('');
  readonly newAttrKey = signal('');
  readonly newAttrDataType = signal('string');
  readonly newAttrGroup = signal('');
  readonly newAttrDescription = signal('');
  readonly newAttrSaving = signal(false);

  readonly dataTypeOptions = [
    { label: 'String', value: 'string' },
    { label: 'Text', value: 'text' },
    { label: 'Integer', value: 'integer' },
    { label: 'Float', value: 'float' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'DateTime', value: 'datetime' },
    { label: 'Enum', value: 'enum' },
    { label: 'JSON', value: 'json' },
  ];

  openCreateAttrTypeDialog(): void {
    this.newAttrName.set('');
    this.newAttrKey.set('');
    this.newAttrDataType.set('string');
    this.newAttrGroup.set('');
    this.newAttrDescription.set('');
    this.showCreateAttrTypeDialog.set(true);
  }

  createNewAttrType(): void {
    const name = this.newAttrName().trim();
    if (!name) return;
    this.newAttrSaving.set(true);
    const key = this.newAttrKey().trim() || name.toLowerCase().replace(/\s+/g, '_');
    this.api
      .createAttributeType({
        name,
        attributeKey: key,
        dataType: this.newAttrDataType(),
        attributeGroup: this.newAttrGroup().trim() || undefined,
        description: this.newAttrDescription().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.newAttrSaving.set(false);
          this.showCreateAttrTypeDialog.set(false);
          this.loadAttributeTypesForWizard();
        },
        error: () => {
          this.newAttrSaving.set(false);
          this.error.set('Failed to create attribute type.');
        },
      });
  }

  openAddAttributeDialog(): void {
    this.api.listAttributeTypes().subscribe({
      next: (types) => {
        const ot = this.selectedObjectType();
        const existingIds = new Set((ot?.attributes ?? []).map((a) => a.attributeTypeId));
        this.detailAvailableAttributes.set(
          (types as AttributeType[]).filter((t) => !existingIds.has(t.id)),
        );
        this.detailDraftAttrId.set('');
        this.detailDraftAttrRequired.set(false);
        this.showAddAttributeDialog.set(true);
      },
      error: () => this.error.set('Failed to load attribute types.'),
    });
  }

  addAttributeToSelected(): void {
    const ot = this.selectedObjectType();
    const attrId = this.detailDraftAttrId();
    if (!ot || !attrId) return;
    const order = (ot.attributes?.length ?? 0) + 1;
    this.api
      .addAttributeToObjectType(ot.id, {
        attributeTypeId: attrId,
        isRequired: this.detailDraftAttrRequired(),
        displayOrder: order,
      })
      .subscribe({
        next: () => {
          this.showAddAttributeDialog.set(false);
          this.selectObjectType(ot); // refresh
        },
        error: () => this.error.set('Failed to add attribute.'),
      });
  }

  removeAttributeFromSelected(attributeTypeId: string): void {
    const ot = this.selectedObjectType();
    if (!ot) return;
    this.api.removeAttributeFromObjectType(ot.id, attributeTypeId).subscribe({
      next: () => this.selectObjectType(ot),
      error: () => this.error.set('Failed to remove attribute.'),
    });
  }

  openAddConnectionDialog(): void {
    this.detailDraftTargetTypeId.set('');
    this.detailDraftActiveName.set('');
    this.detailDraftPassiveName.set('');
    this.detailDraftCardinality.set('one-to-many');
    this.detailDraftIsDirected.set(true);
    this.showAddConnectionDialog.set(true);
  }

  addConnectionToSelected(): void {
    const ot = this.selectedObjectType();
    const targetId = this.detailDraftTargetTypeId();
    if (!ot || !targetId || !this.detailDraftActiveName().trim()) return;
    const target = this.objectTypes().find((t) => t.id === targetId);
    if (!target) return;
    this.api
      .addConnectionToObjectType(ot.id, {
        targetObjectTypeId: targetId,
        relationshipKey: `connects_to_${target.typeKey || targetId}`,
        activeName: this.detailDraftActiveName().trim(),
        passiveName: this.detailDraftPassiveName().trim() || this.detailDraftActiveName().trim(),
        cardinality: this.detailDraftCardinality(),
        isDirected: this.detailDraftIsDirected(),
      })
      .subscribe({
        next: () => {
          this.showAddConnectionDialog.set(false);
          this.selectObjectType(ot);
        },
        error: () => this.error.set('Failed to add connection.'),
      });
  }

  removeConnectionFromSelected(targetTypeId: string): void {
    const ot = this.selectedObjectType();
    if (!ot) return;
    this.api.removeConnectionFromObjectType(ot.id, targetTypeId).subscribe({
      next: () => this.selectObjectType(ot),
      error: () => this.error.set('Failed to remove connection.'),
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
    this.stepIndex.set(0);
    this.wizardName.set('');
    this.wizardTypeKey.set('');
    this.wizardIconName.set('phosphorCubeThin');
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
