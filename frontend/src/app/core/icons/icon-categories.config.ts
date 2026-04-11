/**
 * Icon category definitions with assigned icon lists.
 * Used by IconService.getCategories() and the IconPickerComponent.
 *
 * Source: docs/lld/icon-migration-lld.md Section 5.4.
 */
import { IconEntry } from './icon.model';

interface CategoryDef {
  readonly id: string;
  readonly label: string;
  readonly icons: readonly { name: string; displayName: string; keywords: string[] }[];
}

export const ICON_CATEGORIES: CategoryDef[] = [
  {
    id: 'general',
    label: 'General',
    icons: [
      {
        name: 'phosphorCubeThin',
        displayName: 'Cube',
        keywords: ['box', 'object', '3d', 'package'],
      },
      { name: 'phosphorHouseThin', displayName: 'House', keywords: ['home', 'building', 'main'] },
      { name: 'phosphorGearThin', displayName: 'Gear', keywords: ['settings', 'cog', 'config'] },
      { name: 'phosphorWrenchThin', displayName: 'Wrench', keywords: ['tool', 'fix', 'repair'] },
      {
        name: 'phosphorLightningThin',
        displayName: 'Lightning',
        keywords: ['bolt', 'power', 'fast'],
      },
      {
        name: 'phosphorShieldThin',
        displayName: 'Shield',
        keywords: ['security', 'protect', 'safe'],
      },
      { name: 'phosphorStarThin', displayName: 'Star', keywords: ['favorite', 'rate', 'bookmark'] },
      { name: 'phosphorHeartThin', displayName: 'Heart', keywords: ['love', 'like', 'favorite'] },
      { name: 'phosphorFlagThin', displayName: 'Flag', keywords: ['report', 'mark', 'milestone'] },
      {
        name: 'phosphorBookmarkSimpleThin',
        displayName: 'Bookmark',
        keywords: ['save', 'mark', 'favorite'],
      },
      {
        name: 'phosphorTagThin',
        displayName: 'Tag',
        keywords: ['label', 'category', 'meta', 'tags'],
      },
      {
        name: 'phosphorBellThin',
        displayName: 'Bell',
        keywords: ['notification', 'alert', 'alarm'],
      },
      {
        name: 'phosphorLockThin',
        displayName: 'Lock',
        keywords: ['security', 'private', 'locked'],
      },
      {
        name: 'phosphorLockOpenThin',
        displayName: 'Lock Open',
        keywords: ['unlock', 'public', 'open'],
      },
      { name: 'phosphorKeyThin', displayName: 'Key', keywords: ['access', 'auth', 'password'] },
      { name: 'phosphorEyeThin', displayName: 'Eye', keywords: ['view', 'visible', 'show'] },
      {
        name: 'phosphorEyeSlashThin',
        displayName: 'Eye Slash',
        keywords: ['hidden', 'invisible', 'hide'],
      },
      {
        name: 'phosphorMagnifyingGlassThin',
        displayName: 'Search',
        keywords: ['find', 'search', 'lookup'],
      },
      {
        name: 'phosphorPencilSimpleThin',
        displayName: 'Pencil',
        keywords: ['edit', 'write', 'modify'],
      },
      { name: 'phosphorTrashThin', displayName: 'Trash', keywords: ['delete', 'remove', 'bin'] },
      { name: 'phosphorCopyThin', displayName: 'Copy', keywords: ['duplicate', 'clone', 'paste'] },
      {
        name: 'phosphorClipboardThin',
        displayName: 'Clipboard',
        keywords: ['paste', 'copy', 'board'],
      },
      { name: 'phosphorFloppyDiskThin', displayName: 'Save', keywords: ['save', 'disk', 'floppy'] },
      {
        name: 'phosphorPrinterThin',
        displayName: 'Printer',
        keywords: ['print', 'output', 'paper'],
      },
      {
        name: 'phosphorDownloadThin',
        displayName: 'Download',
        keywords: ['save', 'export', 'get'],
      },
      { name: 'phosphorUploadThin', displayName: 'Upload', keywords: ['import', 'send', 'put'] },
      {
        name: 'phosphorSpinnerThin',
        displayName: 'Spinner',
        keywords: ['loading', 'wait', 'progress'],
      },
      { name: 'phosphorPlusThin', displayName: 'Plus', keywords: ['add', 'new', 'create'] },
      { name: 'phosphorMinusThin', displayName: 'Minus', keywords: ['remove', 'subtract', 'less'] },
      {
        name: 'phosphorXThin',
        displayName: 'Close',
        keywords: ['close', 'dismiss', 'cancel', 'times'],
      },
      { name: 'phosphorCheckThin', displayName: 'Check', keywords: ['confirm', 'done', 'yes'] },
      {
        name: 'phosphorSlidersThin',
        displayName: 'Sliders',
        keywords: ['settings', 'adjust', 'filter'],
      },
      { name: 'phosphorFunnelThin', displayName: 'Funnel', keywords: ['filter', 'sort', 'narrow'] },
      { name: 'phosphorPowerThin', displayName: 'Power', keywords: ['off', 'shutdown', 'toggle'] },
      {
        name: 'phosphorPaletteThin',
        displayName: 'Palette',
        keywords: ['color', 'theme', 'design'],
      },
      {
        name: 'phosphorCodeThin',
        displayName: 'Code',
        keywords: ['developer', 'programming', 'source'],
      },
      {
        name: 'phosphorHammerThin',
        displayName: 'Hammer',
        keywords: ['build', 'tool', 'construct'],
      },
      { name: 'phosphorEraserThin', displayName: 'Eraser', keywords: ['clear', 'remove', 'clean'] },
    ],
  },
  {
    id: 'navigation',
    label: 'Arrows & Navigation',
    icons: [
      { name: 'phosphorArrowLeftThin', displayName: 'Arrow Left', keywords: ['back', 'previous'] },
      { name: 'phosphorArrowRightThin', displayName: 'Arrow Right', keywords: ['forward', 'next'] },
      { name: 'phosphorArrowUpThin', displayName: 'Arrow Up', keywords: ['up', 'top'] },
      { name: 'phosphorArrowDownThin', displayName: 'Arrow Down', keywords: ['down', 'bottom'] },
      { name: 'phosphorCaretLeftThin', displayName: 'Caret Left', keywords: ['chevron', 'back'] },
      {
        name: 'phosphorCaretRightThin',
        displayName: 'Caret Right',
        keywords: ['chevron', 'forward'],
      },
      { name: 'phosphorCaretUpThin', displayName: 'Caret Up', keywords: ['chevron', 'expand'] },
      {
        name: 'phosphorCaretDownThin',
        displayName: 'Caret Down',
        keywords: ['chevron', 'dropdown'],
      },
      {
        name: 'phosphorCaretDoubleLeftThin',
        displayName: 'Double Left',
        keywords: ['first', 'start'],
      },
      {
        name: 'phosphorCaretDoubleRightThin',
        displayName: 'Double Right',
        keywords: ['last', 'end'],
      },
      {
        name: 'phosphorArrowClockwiseThin',
        displayName: 'Refresh',
        keywords: ['reload', 'retry', 'redo'],
      },
      {
        name: 'phosphorArrowCounterClockwiseThin',
        displayName: 'Undo',
        keywords: ['back', 'revert'],
      },
      { name: 'phosphorArrowsClockwiseThin', displayName: 'Sync', keywords: ['refresh', 'update'] },
      {
        name: 'phosphorArrowsOutCardinalThin',
        displayName: 'Expand',
        keywords: ['fullscreen', 'resize'],
      },
      {
        name: 'phosphorArrowsLeftRightThin',
        displayName: 'Left Right',
        keywords: ['swap', 'exchange'],
      },
      { name: 'phosphorSignInThin', displayName: 'Sign In', keywords: ['login', 'enter'] },
      { name: 'phosphorSignOutThin', displayName: 'Sign Out', keywords: ['logout', 'exit'] },
      {
        name: 'phosphorShareNetworkThin',
        displayName: 'Share',
        keywords: ['share', 'network', 'social'],
      },
      { name: 'phosphorPlayThin', displayName: 'Play', keywords: ['start', 'run', 'begin'] },
    ],
  },
  {
    id: 'data',
    label: 'Data & Charts',
    icons: [
      {
        name: 'phosphorChartBarThin',
        displayName: 'Bar Chart',
        keywords: ['graph', 'statistics', 'data'],
      },
      {
        name: 'phosphorChartLineThin',
        displayName: 'Line Chart',
        keywords: ['graph', 'trend', 'data'],
      },
      {
        name: 'phosphorChartPieThin',
        displayName: 'Pie Chart',
        keywords: ['graph', 'distribution', 'data'],
      },
      {
        name: 'phosphorDatabaseThin',
        displayName: 'Database',
        keywords: ['storage', 'data', 'sql'],
      },
      {
        name: 'phosphorTableThin',
        displayName: 'Table',
        keywords: ['grid', 'data', 'spreadsheet'],
      },
      { name: 'phosphorListThin', displayName: 'List', keywords: ['menu', 'items', 'bars'] },
      {
        name: 'phosphorListBulletsThin',
        displayName: 'Bulleted List',
        keywords: ['list', 'items'],
      },
      {
        name: 'phosphorSquaresFourThin',
        displayName: 'Grid',
        keywords: ['cards', 'layout', 'th-large'],
      },
      {
        name: 'phosphorSortAscendingThin',
        displayName: 'Sort Ascending',
        keywords: ['order', 'asc'],
      },
      {
        name: 'phosphorSortDescendingThin',
        displayName: 'Sort Descending',
        keywords: ['order', 'desc'],
      },
      {
        name: 'phosphorTreeStructureThin',
        displayName: 'Tree',
        keywords: ['hierarchy', 'sitemap', 'org'],
      },
      { name: 'phosphorPercentThin', displayName: 'Percent', keywords: ['percentage', 'ratio'] },
      { name: 'phosphorHashThin', displayName: 'Hash', keywords: ['number', 'hashtag', 'count'] },
      {
        name: 'phosphorCheckSquareThin',
        displayName: 'Checkbox',
        keywords: ['check', 'select', 'done'],
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icons: [
      {
        name: 'phosphorEnvelopeThin',
        displayName: 'Envelope',
        keywords: ['email', 'mail', 'message'],
      },
      {
        name: 'phosphorPhoneThin',
        displayName: 'Phone',
        keywords: ['call', 'telephone', 'contact'],
      },
      {
        name: 'phosphorChatCircleThin',
        displayName: 'Chat',
        keywords: ['comment', 'message', 'talk'],
      },
      {
        name: 'phosphorMegaphoneThin',
        displayName: 'Megaphone',
        keywords: ['announce', 'broadcast'],
      },
      {
        name: 'phosphorPaperPlaneTiltThin',
        displayName: 'Send',
        keywords: ['send', 'submit', 'paper plane'],
      },
      {
        name: 'phosphorGlobeThin',
        displayName: 'Globe',
        keywords: ['world', 'international', 'web'],
      },
      { name: 'phosphorLinkThin', displayName: 'Link', keywords: ['url', 'chain', 'connect'] },
    ],
  },
  {
    id: 'files',
    label: 'Files & Media',
    icons: [
      { name: 'phosphorFileThin', displayName: 'File', keywords: ['document', 'page'] },
      { name: 'phosphorFolderThin', displayName: 'Folder', keywords: ['directory', 'group'] },
      { name: 'phosphorImageThin', displayName: 'Image', keywords: ['photo', 'picture', 'media'] },
      {
        name: 'phosphorImagesThin',
        displayName: 'Images',
        keywords: ['photos', 'gallery', 'media'],
      },
      {
        name: 'phosphorVideoCameraThin',
        displayName: 'Video',
        keywords: ['movie', 'camera', 'media'],
      },
      {
        name: 'phosphorHeadphonesThin',
        displayName: 'Headphones',
        keywords: ['audio', 'music', 'listen'],
      },
      {
        name: 'phosphorReceiptThin',
        displayName: 'Receipt',
        keywords: ['invoice', 'ticket', 'bill'],
      },
    ],
  },
  {
    id: 'status',
    label: 'Status & Alerts',
    icons: [
      {
        name: 'phosphorCheckCircleThin',
        displayName: 'Check Circle',
        keywords: ['success', 'done', 'ok'],
      },
      {
        name: 'phosphorWarningThin',
        displayName: 'Warning',
        keywords: ['alert', 'caution', 'triangle'],
      },
      {
        name: 'phosphorWarningCircleThin',
        displayName: 'Warning Circle',
        keywords: ['error', 'alert'],
      },
      { name: 'phosphorInfoThin', displayName: 'Info', keywords: ['information', 'help', 'about'] },
      {
        name: 'phosphorQuestionThin',
        displayName: 'Question',
        keywords: ['help', 'faq', 'support'],
      },
      {
        name: 'phosphorXCircleThin',
        displayName: 'Error Circle',
        keywords: ['error', 'fail', 'close'],
      },
      {
        name: 'phosphorProhibitThin',
        displayName: 'Prohibit',
        keywords: ['ban', 'block', 'forbidden'],
      },
      {
        name: 'phosphorCircleThin',
        displayName: 'Circle',
        keywords: ['dot', 'status', 'indicator'],
      },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce & Business',
    icons: [
      {
        name: 'phosphorBriefcaseThin',
        displayName: 'Briefcase',
        keywords: ['work', 'business', 'job'],
      },
      {
        name: 'phosphorBuildingsThin',
        displayName: 'Buildings',
        keywords: ['company', 'office', 'org'],
      },
      {
        name: 'phosphorMoneyThin',
        displayName: 'Money',
        keywords: ['currency', 'payment', 'bill'],
      },
      {
        name: 'phosphorShoppingCartThin',
        displayName: 'Cart',
        keywords: ['shop', 'buy', 'purchase'],
      },
      {
        name: 'phosphorGraduationCapThin',
        displayName: 'Graduation',
        keywords: ['education', 'school'],
      },
      {
        name: 'phosphorWarehouseThin',
        displayName: 'Warehouse',
        keywords: ['storage', 'inventory'],
      },
      {
        name: 'phosphorTruckThin',
        displayName: 'Truck',
        keywords: ['delivery', 'shipping', 'transport'],
      },
      {
        name: 'phosphorIdentificationCardThin',
        displayName: 'ID Card',
        keywords: ['identity', 'badge'],
      },
    ],
  },
  {
    id: 'devices',
    label: 'Devices & Infrastructure',
    icons: [
      {
        name: 'phosphorDesktopThin',
        displayName: 'Server',
        keywords: ['server', 'desktop', 'computer'],
      },
      {
        name: 'phosphorMonitorThin',
        displayName: 'Monitor',
        keywords: ['screen', 'display', 'desktop'],
      },
      {
        name: 'phosphorDeviceMobileThin',
        displayName: 'Mobile',
        keywords: ['phone', 'smartphone'],
      },
      { name: 'phosphorCloudThin', displayName: 'Cloud', keywords: ['hosting', 'saas', 'upload'] },
      { name: 'phosphorCpuThin', displayName: 'CPU', keywords: ['processor', 'chip', 'hardware'] },
      {
        name: 'phosphorWifiHighThin',
        displayName: 'Wifi',
        keywords: ['wireless', 'network', 'signal'],
      },
    ],
  },
  {
    id: 'location',
    label: 'Location & Time',
    icons: [
      {
        name: 'phosphorMapPinThin',
        displayName: 'Map Pin',
        keywords: ['location', 'marker', 'place'],
      },
      {
        name: 'phosphorMapTrifoldThin',
        displayName: 'Map',
        keywords: ['location', 'directions', 'area'],
      },
      {
        name: 'phosphorSignpostThin',
        displayName: 'Signpost',
        keywords: ['direction', 'navigate'],
      },
      { name: 'phosphorCompassThin', displayName: 'Compass', keywords: ['direction', 'navigate'] },
      {
        name: 'phosphorCalendarThin',
        displayName: 'Calendar',
        keywords: ['date', 'schedule', 'event'],
      },
      { name: 'phosphorClockThin', displayName: 'Clock', keywords: ['time', 'schedule', 'hour'] },
      { name: 'phosphorTimerThin', displayName: 'Timer', keywords: ['stopwatch', 'countdown'] },
      { name: 'phosphorTrayThin', displayName: 'Tray', keywords: ['inbox', 'container'] },
    ],
  },
  {
    id: 'layout',
    label: 'Layout & Text',
    icons: [
      {
        name: 'phosphorTextAlignJustifyThin',
        displayName: 'Align Justify',
        keywords: ['text', 'justify'],
      },
      { name: 'phosphorTextAlignLeftThin', displayName: 'Align Left', keywords: ['text', 'left'] },
      {
        name: 'phosphorDotsThreeOutlineThin',
        displayName: 'More',
        keywords: ['menu', 'ellipsis', 'options'],
      },
      {
        name: 'phosphorDotsThreeVerticalThin',
        displayName: 'More Vertical',
        keywords: ['menu', 'kebab'],
      },
      { name: 'phosphorFrameCornersThin', displayName: 'Frame', keywords: ['window', 'maximize'] },
      {
        name: 'phosphorCopySimpleThin',
        displayName: 'Copy Simple',
        keywords: ['clone', 'duplicate'],
      },
      { name: 'phosphorWaveSineThin', displayName: 'Wave', keywords: ['pulse', 'signal', 'sine'] },
      {
        name: 'phosphorThumbsUpThin',
        displayName: 'Thumbs Up',
        keywords: ['like', 'approve', 'good'],
      },
      {
        name: 'phosphorThumbsDownThin',
        displayName: 'Thumbs Down',
        keywords: ['dislike', 'reject'],
      },
    ],
  },
  {
    id: 'bpmn',
    label: 'BPMN',
    icons: [
      // BPMN icons will be loaded from /assets/icons/bpmn/ via provideNgIconLoader.
      // Placeholder entries -- actual SVGs to be added separately.
      { name: 'bpmnTask', displayName: 'Task', keywords: ['bpmn', 'activity', 'task'] },
      { name: 'bpmnGateway', displayName: 'Gateway', keywords: ['bpmn', 'decision', 'branch'] },
      { name: 'bpmnEvent', displayName: 'Event', keywords: ['bpmn', 'start', 'end', 'trigger'] },
      { name: 'bpmnPool', displayName: 'Pool', keywords: ['bpmn', 'lane', 'participant'] },
      {
        name: 'bpmnDataObject',
        displayName: 'Data Object',
        keywords: ['bpmn', 'data', 'document'],
      },
      { name: 'bpmnMessage', displayName: 'Message', keywords: ['bpmn', 'send', 'receive'] },
    ],
  },
];

/**
 * Build a flat IconEntry[] from the category definitions.
 */
export function buildIconEntries(): IconEntry[] {
  const entries: IconEntry[] = [];
  for (const cat of ICON_CATEGORIES) {
    for (const icon of cat.icons) {
      entries.push({
        name: icon.name,
        displayName: icon.displayName,
        category: cat.id,
        source: icon.name.startsWith('bpmn') ? 'bpmn' : 'phosphor',
        keywords: icon.keywords,
      });
    }
  }
  return entries;
}
