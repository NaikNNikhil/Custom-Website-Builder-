"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Minimal media shape for rendering (draft tree or published snapshot). */
export type MediaAssetView = {
  id: string;
  url: string;
};

const MediaLookupContext = createContext<Record<string, MediaAssetView>>({});

export function MediaLookupProvider({
  mediaAssets,
  children,
}: {
  mediaAssets?: MediaAssetView[] | null;
  children: ReactNode;
}) {
  const lookup: Record<string, MediaAssetView> = {};
  for (const asset of mediaAssets ?? []) {
    lookup[asset.id] = asset;
  }
  return <MediaLookupContext.Provider value={lookup}>{children}</MediaLookupContext.Provider>;
}

export function useMediaLookup() {
  return useContext(MediaLookupContext);
}

export function resolveImageSrc(
  data: { mediaAssetId?: string | null; src?: string },
  lookup: Record<string, MediaAssetView>,
): { src: string | null; missing: boolean } {
  if (data.mediaAssetId) {
    const asset = lookup[data.mediaAssetId];
    if (!asset) {
      return { src: null, missing: true };
    }
    return { src: asset.url, missing: false };
  }
  if (data.src) {
    return { src: data.src, missing: false };
  }
  return { src: null, missing: false };
}
