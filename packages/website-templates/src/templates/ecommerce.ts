import { DEFAULT_WEBSITE_THEME } from "@custom-website-builder/node-registry";
import type { WebsiteTemplateDefinition } from "../types";

const primaryButtonKey = "root";

/**
 * V1 e-commerce-style starter — visual/structural only.
 * No cart, products DB, checkout, or business entities.
 */
export const ecommerceTemplate: WebsiteTemplateDefinition = {
  id: "ecommerce",
  name: "E-commerce style",
  description:
    "A concise storefront-style starting layout: Home, Products, About, Contact, plus hero, featured cards, and footer on Home.",
  version: 1,
  theme: {
    ...DEFAULT_WEBSITE_THEME,
    colors: {
      ...DEFAULT_WEBSITE_THEME.colors,
      primary: "#171717",
      secondary: "#525252",
      background: "#ffffff",
      surface: "#f5f5f5",
      text: "#171717",
      mutedText: "#737373",
      border: "#e5e5e5",
    },
  },
  mediaAssets: [
    {
      key: "hero",
      kind: "image",
      filename: "hero.jpg",
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
      mimeType: "image/jpeg",
      byteSize: 180000,
      width: 1400,
      height: 900,
    },
    {
      key: "feature-1",
      kind: "image",
      filename: "feature-1.jpg",
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      mimeType: "image/jpeg",
      byteSize: 90000,
      width: 800,
      height: 800,
    },
    {
      key: "feature-2",
      kind: "image",
      filename: "feature-2.jpg",
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      mimeType: "image/jpeg",
      byteSize: 90000,
      width: 800,
      height: 800,
    },
    {
      key: "feature-3",
      kind: "image",
      filename: "feature-3.jpg",
      url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
      mimeType: "image/jpeg",
      byteSize: 90000,
      width: 800,
      height: 800,
    },
  ],
  libraryItems: [
    {
      key: "primary-button",
      name: "Primary Button",
      category: "Actions",
      definition: {
        key: primaryButtonKey,
        type: "button",
        name: "Primary Button",
        data: {
          label: "Shop now",
          href: "#",
          styles: {},
        },
        children: [],
      },
    },
  ],
  pages: [
    {
      title: "Home",
      slug: "home",
      sortOrder: 0,
      sections: [
        {
          name: "Navbar",
          sortOrder: 0,
          nodes: [
            {
              type: "container",
              name: "Navbar",
              data: {
                layout: "row",
                gap: "lg",
                styles: {
                  padding: "1rem",
                  border: "1px solid transparent",
                },
              },
              children: [
                {
                  type: "heading",
                  name: "Brand",
                  data: { text: "Storefront", level: 3, styles: {} },
                },
                {
                  type: "link",
                  name: "Nav Home",
                  data: { label: "Home", href: "#", styles: {} },
                },
                {
                  type: "link",
                  name: "Nav Catalog",
                  data: { label: "Catalog", href: "#", styles: {} },
                },
                {
                  type: "link",
                  name: "Nav Contact",
                  data: { label: "Contact", href: "#", styles: {} },
                },
              ],
            },
          ],
        },
        {
          name: "Hero",
          sortOrder: 1,
          nodes: [
            {
              type: "container",
              name: "Hero",
              data: { layout: "stack", gap: "md", styles: { padding: "2rem" } },
              children: [
                {
                  type: "heading",
                  name: "Hero heading",
                  data: {
                    text: "Discover pieces that feel right at home",
                    level: 1,
                    styles: {},
                  },
                },
                {
                  type: "text",
                  name: "Hero text",
                  data: {
                    text: "A clean starting layout for a modern storefront. Replace copy, media, and styles to match your brand.",
                    styles: {},
                  },
                },
                {
                  type: "button",
                  name: "Hero CTA",
                  data: {},
                  libraryItemKey: "primary-button",
                  libraryNodeKey: primaryButtonKey,
                },
                {
                  type: "image",
                  name: "Hero image",
                  data: {
                    mediaAssetKey: "hero",
                    alt: "Featured collection",
                    styles: { width: "100%" },
                  },
                },
              ],
            },
          ],
        },
        {
          name: "Featured Content",
          sortOrder: 2,
          nodes: [
            {
              type: "container",
              name: "Featured",
              data: { layout: "stack", gap: "lg", styles: { padding: "2rem" } },
              children: [
                {
                  type: "heading",
                  data: { text: "Featured", level: 2, styles: {} },
                },
                {
                  type: "container",
                  name: "Featured row",
                  data: { layout: "row", gap: "md", styles: {} },
                  children: [
                    featuredCard("One", "feature-1"),
                    featuredCard("Two", "feature-2"),
                    featuredCard("Three", "feature-3"),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Why Choose Us",
          sortOrder: 3,
          nodes: [
            {
              type: "container",
              name: "Why",
              data: { layout: "stack", gap: "md", styles: { padding: "2rem" } },
              children: [
                {
                  type: "heading",
                  data: { text: "Why choose us", level: 2, styles: {} },
                },
                {
                  type: "text",
                  data: {
                    text: "Thoughtful curation, clear presentation, and a structure ready for your own content.",
                    styles: {},
                  },
                },
                {
                  type: "text",
                  data: {
                    text: "Edit every section in the builder — nothing here is locked to a niche business model.",
                    styles: {},
                  },
                },
              ],
            },
          ],
        },
        {
          name: "Testimonials",
          sortOrder: 4,
          nodes: [
            {
              type: "container",
              name: "Testimonials",
              data: { layout: "stack", gap: "md", styles: { padding: "2rem" } },
              children: [
                {
                  type: "heading",
                  data: { text: "What people say", level: 2, styles: {} },
                },
                {
                  type: "container",
                  data: { layout: "row", gap: "md", styles: {} },
                  children: [
                    {
                      type: "container",
                      data: {
                        layout: "stack",
                        gap: "sm",
                        styles: { padding: "1rem", background: "#f5f5f5" },
                      },
                      children: [
                        {
                          type: "text",
                          data: {
                            text: "“Simple to browse and easy to trust.”",
                            styles: {},
                          },
                        },
                        {
                          type: "text",
                          data: { text: "— Alex", styles: { color: "#737373" } },
                        },
                      ],
                    },
                    {
                      type: "container",
                      data: {
                        layout: "stack",
                        gap: "sm",
                        styles: { padding: "1rem", background: "#f5f5f5" },
                      },
                      children: [
                        {
                          type: "text",
                          data: {
                            text: "“The layout feels polished without being loud.”",
                            styles: {},
                          },
                        },
                        {
                          type: "text",
                          data: { text: "— Jordan", styles: { color: "#737373" } },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Call To Action",
          sortOrder: 5,
          nodes: [
            {
              type: "container",
              name: "CTA",
              data: {
                layout: "stack",
                gap: "md",
                styles: { padding: "2rem", background: "#f5f5f5" },
              },
              children: [
                {
                  type: "heading",
                  data: { text: "Ready when you are", level: 2, styles: {} },
                },
                {
                  type: "text",
                  data: {
                    text: "Swap this call to action for your own next step.",
                    styles: {},
                  },
                },
                {
                  type: "button",
                  data: { styles: { fontSize: "1.125rem" } },
                  libraryItemKey: "primary-button",
                  libraryNodeKey: primaryButtonKey,
                },
              ],
            },
          ],
        },
        {
          name: "Footer",
          sortOrder: 6,
          nodes: [
            {
              type: "container",
              name: "Footer",
              data: {
                layout: "row",
                gap: "lg",
                styles: { padding: "1.5rem" },
              },
              children: [
                {
                  type: "text",
                  data: {
                    text: "© Storefront. Built with the website builder.",
                    styles: {},
                  },
                },
                {
                  type: "link",
                  data: { label: "Privacy", href: "#", styles: {} },
                },
                {
                  type: "link",
                  data: { label: "Terms", href: "#", styles: {} },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Products",
      slug: "products",
      sortOrder: 1,
      sections: [
        {
          name: "Products",
          sortOrder: 0,
          nodes: [
            {
              type: "container",
              name: "Products intro",
              data: { layout: "stack", gap: "md", styles: { padding: "2rem" } },
              children: [
                {
                  type: "heading",
                  data: { text: "Products", level: 1, styles: {} },
                },
                {
                  type: "text",
                  data: {
                    text: "A starting catalog page. Replace this content with your own offerings.",
                    styles: {},
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "About",
      slug: "about",
      sortOrder: 2,
      sections: [
        {
          name: "About",
          sortOrder: 0,
          nodes: [
            {
              type: "container",
              name: "About intro",
              data: { layout: "stack", gap: "md", styles: { padding: "2rem" } },
              children: [
                {
                  type: "heading",
                  data: { text: "About", level: 1, styles: {} },
                },
                {
                  type: "text",
                  data: {
                    text: "Tell visitors who you are. This page is a blank canvas in the builder.",
                    styles: {},
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sortOrder: 3,
      sections: [
        {
          name: "Contact",
          sortOrder: 0,
          nodes: [
            {
              type: "container",
              name: "Contact intro",
              data: { layout: "stack", gap: "md", styles: { padding: "2rem" } },
              children: [
                {
                  type: "heading",
                  data: { text: "Contact", level: 1, styles: {} },
                },
                {
                  type: "text",
                  data: {
                    text: "Add your contact details or form later. This is a starter page only.",
                    styles: {},
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function featuredCard(label: string, mediaKey: string) {
  return {
    type: "container" as const,
    name: `Feature ${label}`,
    data: {
      layout: "stack" as const,
      gap: "sm" as const,
      styles: { width: "100%", padding: "0.5rem" },
    },
    children: [
      {
        type: "image" as const,
        data: {
          mediaAssetKey: mediaKey,
          alt: `Feature ${label}`,
          styles: { width: "100%", borderRadius: "8px" },
        },
      },
      {
        type: "heading" as const,
        data: { text: `Feature ${label}`, level: 3, styles: {} },
      },
      {
        type: "text" as const,
        data: {
          text: "Short supporting copy for this featured block.",
          styles: {},
        },
      },
      {
        type: "button" as const,
        data: {},
        libraryItemKey: "primary-button",
        libraryNodeKey: primaryButtonKey,
      },
    ],
  };
}
