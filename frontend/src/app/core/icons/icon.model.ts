/**
 * Icon system type definitions.
 * Shared by IconService, IconPickerComponent, and consumers.
 */

/** Source origin for an icon entry. */
export type IconSource = 'phosphor' | 'bpmn';

/** A single icon entry with metadata for display and search. */
export interface IconEntry {
  /** The canonical icon name (e.g., 'phosphorCubeThin' or 'bpmnTask'). */
  readonly name: string;
  /** Human-readable display name (e.g., 'Cube', 'Task'). */
  readonly displayName: string;
  /** Category this icon belongs to. */
  readonly category: string;
  /** Source library. */
  readonly source: IconSource;
  /** Keywords for search matching. */
  readonly keywords: string[];
}

/** A category grouping for the icon picker. */
export interface IconCategory {
  /** Unique category identifier. */
  readonly id: string;
  /** Display label. */
  readonly label: string;
  /** Number of icons in this category. */
  readonly iconCount: number;
}

/** Event emitted when an icon is selected in the picker. */
export interface IconSelectedEvent {
  /** The canonical icon name. */
  readonly name: string;
  /** The source library. */
  readonly source: IconSource;
}
