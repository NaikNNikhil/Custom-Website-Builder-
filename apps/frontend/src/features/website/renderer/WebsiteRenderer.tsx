"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  libraryStylesFromData,
  mergeNodeData,
  resolveEffectiveStyles,
  resolveHtmlTag,
  resolveLibraryDataForNode,
  safeParseNodeData,
  stylesToCss,
  type ButtonData,
  type ContainerData,
  type HeadingData,
  type ImageData,
  type LibraryItemDefinitionView,
  type LinkData,
  type NodeStyles,
  type SpacerData,
  type TextData,
  type WebsiteTheme,
} from "@custom-website-builder/node-registry";
import type {
  LibraryItemRecord,
  WebsiteTreeNode,
  WebsiteTreePage,
  WebsiteTreeSection,
} from "@/features/websites/types";
import {
  RendererInteractionProvider,
  SelectableNodeFrame,
  type RendererInteraction,
} from "./interaction";
import { WebsiteThemeProvider, useWebsiteTheme } from "./theme-context";
import { LibraryLookupProvider, useLibraryLookup } from "./library-context";
import {
  MediaLookupProvider,
  resolveImageSrc,
  useMediaLookup,
  type MediaAssetView,
} from "./media-context";

type NodeRendererProps = {
  node: WebsiteTreeNode;
};

const gapClass: Record<ContainerData["gap"], string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-8",
};

const spacerClass: Record<SpacerData["size"], string> = {
  sm: "h-4",
  md: "h-8",
  lg: "h-16",
};

function toStyle(styles: NodeStyles): CSSProperties {
  return stylesToCss(styles) as CSSProperties;
}

function useEffectiveNodeData(node: WebsiteTreeNode): Record<string, unknown> {
  const lookup = useLibraryLookup();
  const libraryData = resolveLibraryDataForNode({
    libraryItemId: node.libraryItemId,
    libraryNodeKey: node.libraryNodeKey,
    lookup,
  });
  return mergeNodeData(libraryData ?? {}, node.data ?? {});
}

function useResolvedStyles(
  nodeType: string,
  nodeStyles?: NodeStyles | null,
  libraryStyles?: Partial<NodeStyles> | null,
): NodeStyles {
  const theme = useWebsiteTheme();
  return resolveEffectiveStyles({
    nodeType,
    nodeStyles,
    libraryStyles,
    theme,
  });
}

function FallbackNode({ reason, nodeId, type }: { reason: string; nodeId: string; type: string }) {
  return (
    <div
      role="alert"
      data-node-fallback="true"
      data-node-id={nodeId}
      data-node-type={type}
      className="rounded border border-dashed border-amber-600/50 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      Unable to render node ({type}): {reason}
    </div>
  );
}

function renderChildren(nodes: WebsiteTreeNode[]): ReactNode {
  return nodes.map((child) => <NodeRenderer key={child.id} node={child} />);
}

function ContainerView({
  data,
  libraryStyles,
  children,
}: {
  data: ContainerData;
  libraryStyles?: Partial<NodeStyles> | null;
  children: ReactNode;
}) {
  const styles = useResolvedStyles("container", data.styles, libraryStyles);
  return (
    <div
      className={`flex w-full ${data.layout === "row" ? "flex-row flex-wrap items-start" : "flex-col"} ${gapClass[data.gap]}`}
      style={toStyle(styles)}
    >
      {children}
    </div>
  );
}

function HeadingView({
  data,
  libraryStyles,
}: {
  data: HeadingData;
  libraryStyles?: Partial<NodeStyles> | null;
}) {
  const tag = resolveHtmlTag("heading", data) ?? "h2";
  const style = toStyle(useResolvedStyles("heading", data.styles, libraryStyles));
  const props = {
    style,
    className: "tracking-tight",
    children: data.text || "\u00A0",
  };

  switch (tag) {
    case "h1":
      return <h1 {...props} className={`${props.className} text-4xl`} />;
    case "h2":
      return <h2 {...props} className={`${props.className} text-3xl`} />;
    case "h3":
      return <h3 {...props} className={`${props.className} text-2xl`} />;
    case "h4":
      return <h4 {...props} className={`${props.className} text-xl`} />;
    case "h5":
      return <h5 {...props} className={`${props.className} text-lg`} />;
    case "h6":
      return <h6 {...props} className={`${props.className} text-base`} />;
    default:
      return <h2 {...props} className={`${props.className} text-3xl`} />;
  }
}

function TextView({
  data,
  libraryStyles,
}: {
  data: TextData;
  libraryStyles?: Partial<NodeStyles> | null;
}) {
  return (
    <p style={toStyle(useResolvedStyles("text", data.styles, libraryStyles))}>
      {data.text || "\u00A0"}
    </p>
  );
}

function ImageView({
  data,
  libraryStyles,
}: {
  data: ImageData;
  libraryStyles?: Partial<NodeStyles> | null;
}) {
  const mediaLookup = useMediaLookup();
  const resolved = resolveImageSrc(data, mediaLookup);
  const style = toStyle(useResolvedStyles("image", data.styles, libraryStyles));

  if (resolved.missing) {
    return (
      <div
        role="alert"
        data-media-fallback="missing"
        className="flex h-40 items-center justify-center rounded border border-dashed border-amber-600/50 bg-amber-50 text-sm text-amber-900"
        style={style}
      >
        Media asset unavailable
      </div>
    );
  }

  if (!resolved.src) {
    return (
      <div
        className="flex h-40 items-center justify-center rounded border border-dashed border-border bg-muted/40 text-sm text-muted-foreground"
        style={style}
      >
        No media selected
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- generic CMS image URL from media layer
    <img src={resolved.src} alt={data.alt || ""} className="max-w-full" style={style} />
  );
}

function ButtonView({
  data,
  libraryStyles,
}: {
  data: ButtonData;
  libraryStyles?: Partial<NodeStyles> | null;
}) {
  const tag = resolveHtmlTag("button", data);
  const style = toStyle(useResolvedStyles("button", data.styles, libraryStyles));
  const className = "inline-flex items-center justify-center text-sm";

  if (tag === "a" && data.href) {
    return (
      <a href={data.href} className={className} style={style} onClick={(event) => event.preventDefault()}>
        {data.label}
      </a>
    );
  }

  return (
    <button type="button" className={className} style={style}>
      {data.label}
    </button>
  );
}

function LinkView({
  data,
  libraryStyles,
}: {
  data: LinkData;
  libraryStyles?: Partial<NodeStyles> | null;
}) {
  return (
    <a
      href={data.href || "#"}
      className="underline underline-offset-4"
      style={toStyle(useResolvedStyles("link", data.styles, libraryStyles))}
      onClick={(event) => event.preventDefault()}
    >
      {data.label}
    </a>
  );
}

function SpacerView({
  data,
  libraryStyles,
}: {
  data: SpacerData;
  libraryStyles?: Partial<NodeStyles> | null;
}) {
  const styles = useResolvedStyles("spacer", data.styles, libraryStyles);
  return (
    <div
      aria-hidden="true"
      className={`w-full ${styles.height ? "" : spacerClass[data.size]}`}
      style={toStyle(styles)}
    />
  );
}

export function NodeRenderer({ node }: NodeRendererProps) {
  const lookup = useLibraryLookup();
  const libraryData = resolveLibraryDataForNode({
    libraryItemId: node.libraryItemId,
    libraryNodeKey: node.libraryNodeKey,
    lookup,
  });
  const libraryStyles = libraryStylesFromData(libraryData);
  // Effective content for schema parse = library + sparse override.
  // Styles for CSS still resolve Theme → Library → Node via resolveEffectiveStyles;
  // pass node styles only (not merged) so theme layer is not skipped.
  const contentData = mergeNodeData(libraryData ?? {}, {
    ...(node.data ?? {}),
    styles: (node.data?.styles as Record<string, unknown> | undefined) ?? {},
  });
  // For non-style fields we need library+override. For styles field in parsed data,
  // views read data.styles as node overrides only — so strip merged styles back to node overrides.
  const parsedPayload = {
    ...contentData,
    styles: (node.data?.styles as Record<string, unknown> | undefined) ?? {},
  };

  const parsed = safeParseNodeData(node.type, parsedPayload);

  const content = !parsed.ok ? (
    <FallbackNode
      nodeId={node.id}
      type={node.type}
      reason={parsed.issues[0]?.message ?? "Invalid node configuration"}
    />
  ) : (
    (() => {
      switch (node.type) {
        case "container":
          return (
            <ContainerView data={parsed.data as ContainerData} libraryStyles={libraryStyles}>
              {renderChildren(node.children)}
            </ContainerView>
          );
        case "heading":
          return <HeadingView data={parsed.data as HeadingData} libraryStyles={libraryStyles} />;
        case "text":
          return <TextView data={parsed.data as TextData} libraryStyles={libraryStyles} />;
        case "image":
          return <ImageView data={parsed.data as ImageData} libraryStyles={libraryStyles} />;
        case "button":
          return <ButtonView data={parsed.data as ButtonData} libraryStyles={libraryStyles} />;
        case "link":
          return <LinkView data={parsed.data as LinkData} libraryStyles={libraryStyles} />;
        case "spacer":
          return <SpacerView data={parsed.data as SpacerData} libraryStyles={libraryStyles} />;
        default:
          return <FallbackNode nodeId={node.id} type={node.type} reason="Unsupported node type" />;
      }
    })()
  );

  return <SelectableNodeFrame nodeId={node.id}>{content}</SelectableNodeFrame>;
}

export function SectionRenderer({ section }: { section: WebsiteTreeSection }) {
  return (
    <section data-section-id={section.id} className="space-y-4 py-6">
      {section.nodes.map((node) => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </section>
  );
}

export function PageRenderer({ page }: { page: WebsiteTreePage }) {
  return (
    <article data-page-id={page.id} className="space-y-2">
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
      {page.children.map((child) => (
        <PageRenderer key={child.id} page={child} />
      ))}
    </article>
  );
}

function toLibraryViews(items: LibraryItemRecord[] | LibraryItemDefinitionView[] | null | undefined) {
  return (items ?? []).map((item) => ({
    id: item.id,
    version: item.version,
    definition: item.definition,
  }));
}

export function WebsiteRenderer({
  pages,
  theme = null,
  libraryItems = null,
  mediaAssets = null,
  interaction = null,
}: {
  pages: WebsiteTreePage[];
  theme?: WebsiteTheme | null;
  libraryItems?: LibraryItemRecord[] | LibraryItemDefinitionView[] | null;
  mediaAssets?: MediaAssetView[] | null;
  interaction?: RendererInteraction | null;
}) {
  if (!pages.length) {
    return <p className="text-sm text-muted-foreground">No pages to render.</p>;
  }

  const resolvedTheme = theme;
  const background = resolvedTheme?.colors.background;

  return (
    <WebsiteThemeProvider theme={resolvedTheme}>
      <LibraryLookupProvider libraryItems={toLibraryViews(libraryItems)}>
        <MediaLookupProvider mediaAssets={mediaAssets}>
          <RendererInteractionProvider value={interaction}>
            <div
              data-website-renderer="true"
              className="space-y-10"
              style={background ? { background, color: resolvedTheme?.colors.text } : undefined}
            >
              {pages.map((page) => (
                <PageRenderer key={page.id} page={page} />
              ))}
            </div>
          </RendererInteractionProvider>
        </MediaLookupProvider>
      </LibraryLookupProvider>
    </WebsiteThemeProvider>
  );
}

export type { RendererInteraction };
export { useEffectiveNodeData };
