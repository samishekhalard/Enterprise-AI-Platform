const PRIME_DIALOG_MASK_SELECTOR = '.p-dialog-mask';

/**
 * PrimeNG dialog masks are mounted on <body>. If one is left behind after
 * switching away from master definitions, it can dim the entire admin page
 * even though no dialog is still visible.
 */
export function cleanupStalePrimeDialogMasks(
  documentRef: Document | null | undefined,
  activeSection: string,
): void {
  if (!documentRef || activeSection === 'master-definitions') {
    return;
  }

  const body = documentRef.body;
  const masks = Array.from(body.querySelectorAll<HTMLElement>(PRIME_DIALOG_MASK_SELECTOR));
  if (masks.length === 0 || hasVisiblePrimeDialog(body, documentRef)) {
    return;
  }

  masks.forEach((mask) => mask.remove());
  body.classList.remove('p-overflow-hidden');
  documentRef.documentElement.classList.remove('p-overflow-hidden');
  body.style.removeProperty('overflow');
  documentRef.documentElement.style.removeProperty('overflow');
}

function hasVisiblePrimeDialog(root: ParentNode, documentRef: Document): boolean {
  const dialogs = Array.from(root.querySelectorAll<HTMLElement>('.p-dialog'));
  return dialogs.some((dialog) => isVisible(dialog, documentRef));
}

function isVisible(element: HTMLElement, documentRef: Document): boolean {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const computedStyle = documentRef.defaultView?.getComputedStyle(element);
  return computedStyle?.display !== 'none' && computedStyle?.visibility !== 'hidden';
}
