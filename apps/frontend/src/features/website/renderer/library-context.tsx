"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LibraryItemDefinitionView } from "@custom-website-builder/node-registry";

const LibraryLookupContext = createContext<Record<string, LibraryItemDefinitionView>>({});

export function LibraryLookupProvider({
  libraryItems,
  children,
}: {
  libraryItems?: LibraryItemDefinitionView[] | null;
  children: ReactNode;
}) {
  const lookup: Record<string, LibraryItemDefinitionView> = {};
  for (const item of libraryItems ?? []) {
    lookup[item.id] = item;
  }

  return (
    <LibraryLookupContext.Provider value={lookup}>{children}</LibraryLookupContext.Provider>
  );
}

export function useLibraryLookup() {
  return useContext(LibraryLookupContext);
}
