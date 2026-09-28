import test from "node:test";
import assert from "node:assert/strict";

import {
  findPreviewElement,
  getCenteredScrollTop,
  PREVIEW_FLASH_CLASS,
  flashPreviewElement,
} from "./previewSync";

test("findPreviewElement resolves by stable node/section/page id attributes", () => {
  const node = { id: "n1" } as HTMLElement;
  const section = { id: "s1" } as HTMLElement;
  const page = { id: "p1" } as HTMLElement;

  const container = {
    querySelector(selector: string) {
      if (selector === '[data-node-id="n1"]') return node;
      if (selector === '[data-section-id="s1"]') return section;
      if (selector === '[data-page-id="p1"]') return page;
      return null;
    },
  } as unknown as ParentNode;

  assert.equal(findPreviewElement(container, { kind: "node", id: "n1" }), node);
  assert.equal(findPreviewElement(container, { kind: "section", id: "s1" }), section);
  assert.equal(findPreviewElement(container, { kind: "page", id: "p1" }), page);
  assert.equal(findPreviewElement(container, { kind: "node", id: "missing" }), null);
});

test("getCenteredScrollTop clamps within scroll range", () => {
  const container = {
    clientHeight: 200,
    scrollHeight: 1000,
    scrollTop: 0,
    getBoundingClientRect: () => ({ top: 0 }),
  } as unknown as HTMLElement;

  const target = {
    getBoundingClientRect: () => ({ top: 800, height: 50 }),
  } as unknown as HTMLElement;

  const scrollTop = getCenteredScrollTop(container, target);
  assert.ok(scrollTop >= 0);
  assert.ok(scrollTop <= 800);
  // target mid at 825 relative to content → center in 200px viewport ≈ 725
  assert.equal(scrollTop, 725);
});

test("flashPreviewElement adds class and cleanup removes it", () => {
  const timers: Array<() => void> = [];
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;

  (globalThis as { setTimeout: typeof setTimeout }).setTimeout = ((fn: () => void) => {
    timers.push(fn);
    return 1 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;
  (globalThis as { clearTimeout: typeof clearTimeout }).clearTimeout = (() => undefined) as typeof clearTimeout;

  try {
    const classList = {
      values: new Set<string>(),
      add(value: string) {
        this.values.add(value);
      },
      remove(value: string) {
        this.values.delete(value);
      },
      contains(value: string) {
        return this.values.has(value);
      },
    };
    const target = { classList } as unknown as HTMLElement;

    const cleanup = flashPreviewElement(target, 1000);
    assert.equal(classList.contains(PREVIEW_FLASH_CLASS), true);

    cleanup();
    assert.equal(classList.contains(PREVIEW_FLASH_CLASS), false);
    assert.equal(timers.length, 1);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});
