"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RendererInteraction = {
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
};

const RendererInteractionContext = createContext<RendererInteraction | null>(null);

export function RendererInteractionProvider({
  value,
  children,
}: {
  value: RendererInteraction | null;
  children: ReactNode;
}) {
  return (
    <RendererInteractionContext.Provider value={value}>
      {children}
    </RendererInteractionContext.Provider>
  );
}

export function useRendererInteraction() {
  return useContext(RendererInteractionContext);
}

export function SelectableNodeFrame({
  nodeId,
  children,
}: {
  nodeId: string;
  children: ReactNode;
}) {
  const interaction = useRendererInteraction();

  if (!interaction) {
    return <>{children}</>;
  }

  const selected = interaction.selectedNodeId === nodeId;

  return (
    <div
      data-node-id={nodeId}
      data-node-selected={selected ? "true" : "false"}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        interaction.onSelectNode(nodeId);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          interaction.onSelectNode(nodeId);
        }
      }}
      className={cn(
        "relative rounded-sm outline-offset-2 transition-[outline-color,box-shadow]",
        selected
          ? "outline outline-2 outline-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary),transparent_70%)]"
          : "hover:outline hover:outline-1 hover:outline-primary/40",
      )}
    >
      {children}
    </div>
  );
}
