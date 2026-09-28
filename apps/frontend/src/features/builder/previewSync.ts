import type { BuilderSelection } from "./selection";

export const PREVIEW_SCROLL_DURATION_MS = 650;
export const PREVIEW_FLASH_DURATION_MS = 1300;
export const PREVIEW_FLASH_CLASS = "builder-preview-flash";

export function findPreviewElement(
  container: ParentNode,
  selection: NonNullable<BuilderSelection>,
): HTMLElement | null {
  const attribute =
    selection.kind === "node"
      ? "data-node-id"
      : selection.kind === "section"
        ? "data-section-id"
        : "data-page-id";

  const escapedId =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(selection.id)
      : selection.id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return container.querySelector<HTMLElement>(`[${attribute}="${escapedId}"]`);
}

export function getCenteredScrollTop(container: HTMLElement, target: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetTop = targetRect.top - containerRect.top + container.scrollTop;
  const desired =
    targetTop + targetRect.height / 2 - container.clientHeight / 2;
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  return Math.max(0, Math.min(desired, maxScroll));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Animate container.scrollTop. Returns cancel fn. */
export function animateScrollTop(
  container: HTMLElement,
  to: number,
  durationMs = PREVIEW_SCROLL_DURATION_MS,
): () => void {
  const from = container.scrollTop;
  const delta = to - from;
  if (Math.abs(delta) < 1) {
    return () => undefined;
  }

  let frame = 0;
  const start = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / durationMs);
    container.scrollTop = from + delta * easeInOutCubic(progress);
    if (progress < 1) {
      frame = requestAnimationFrame(tick);
    }
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/** Temporary editor-only flash. Returns cleanup fn. */
export function flashPreviewElement(
  target: HTMLElement,
  durationMs = PREVIEW_FLASH_DURATION_MS,
): () => void {
  target.classList.add(PREVIEW_FLASH_CLASS);
  const timer = globalThis.setTimeout(() => {
    target.classList.remove(PREVIEW_FLASH_CLASS);
  }, durationMs);

  return () => {
    globalThis.clearTimeout(timer);
    target.classList.remove(PREVIEW_FLASH_CLASS);
  };
}

/**
 * Scroll preview container to selection target and flash it.
 * Safe no-op when target missing. Returns cleanup for rapid re-selection.
 */
export function syncPreviewToSelection(
  container: HTMLElement,
  selection: NonNullable<BuilderSelection>,
  options?: {
    scrollDurationMs?: number;
    flashDurationMs?: number;
  },
): () => void {
  const target = findPreviewElement(container, selection);
  if (!target) {
    return () => undefined;
  }

  const cancelScroll = animateScrollTop(
    container,
    getCenteredScrollTop(container, target),
    options?.scrollDurationMs ?? PREVIEW_SCROLL_DURATION_MS,
  );
  const cancelFlash = flashPreviewElement(
    target,
    options?.flashDurationMs ?? PREVIEW_FLASH_DURATION_MS,
  );

  return () => {
    cancelScroll();
    cancelFlash();
  };
}
