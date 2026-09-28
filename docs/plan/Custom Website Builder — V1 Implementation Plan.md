# Custom Website Builder — V1 Implementation Plan

## 1. V1 Objective

Build the smallest complete version of the Website Builder that allows a user to:

1. Register / log in
2. Create an organization
3. Create a website
4. Select an initial template
5. Edit the website visually
6. Manage pages, sections and nodes
7. Upload and use media
8. Customize the website theme
9. Reuse components through the Website UI Library
10. Preview the website
11. Save a draft
12. Publish the website
13. Open the published public website

The user should accomplish this without writing code.

---

# 2. Core Architecture

The foundation is domain-agnostic.

```text
Platform
├── Component Registry
├── Feature Registry
└── Templates

Organization
├── Members
└── Websites
    ├── Pages
    │   ├── Child Pages
    │   └── Sections
    │       └── Nodes
    │           └── Child Nodes
    │
    ├── Theme
    ├── Website UI Library
    └── Media
```

The platform must not create foundational business entities such as:

- Product
- Service
- Book
- Course
- Gallery
- FAQ
- Testimonial
- etc.

Those are examples of what an organization may represent through generic website content.

---

# 3. V1 Implementation Milestones

## Milestone 1 — Foundation & Authentication

Build the existing application foundation around:

- User registration
- Login
- Refresh token
- Logout
- Current user
- Organization creation
- Organization membership
- Basic authorization
- Multi-tenant ownership enforcement

The original BasicPlan already establishes the authentication and organization direction.

### Completion condition

A user can:

```text
Register
  ↓
Login
  ↓
Create Organization
  ↓
Enter Builder/Application
```

---

# Milestone 2 — Website & Generic Database Structure

Introduce the website-building foundation:

```text
Organization
    ↓
Website
    ↓
Pages
    ↓
Sections
    ↓
Nodes
```

Support:

- Multiple websites per organization
- Website identity/configuration
- Page creation
- Page naming
- Page ordering
- Page hierarchy
- Section creation
- Section ordering
- Node creation
- Nested nodes
- Node ordering
- Stable node identity

The backend must return a generic hierarchical representation.

Conceptually:

```text
Website
  └── Pages
       └── Sections
            └── Nodes
                 └── Children
```

The API must not return React components or frontend-specific implementation instructions.

---

# Milestone 3 — Component / Node Registry

**Status (Phase 2): Implemented**

Platform node knowledge lives in a shared package:

```text
packages/node-registry
```

Both API and frontend consume the same registry. The registry is framework-agnostic: no React component names, JSX, or frontend file paths are stored or returned by the API.

### Current V1 registered node types

- `container` — structural wrapper; may nest any registered child
- `heading` — title content; HTML tag (`h1`–`h6`) is semantic metadata via `data.level`, not node identity
- `text` — body copy
- `image` — image reference + alt
- `button` — CTA; renders as `a` when `href` is set, otherwise `button`
- `link` — hyperlink
- `spacer` — vertical spacing primitive

### Registry responsibilities

Each definition includes:

- Stable type id / label / category
- Content, style, and layout capability flags (style reserved for later editing phases)
- Child policy (`none` | `anyRegistered` | allowlist)
- Default `data`
- Zod `data` schema for validation
- Platform-controlled HTML semantics

### Persistence boundary

- DB stores `type` + generic JSON `data` only
- API validates create/update against the registry (type, data shape, parent/child rules)
- `GET /api/registry/node-types` exposes registry metadata for clients
- Unsupported types are rejected at write time

### Architectural refinement vs earlier drafts

Older coding-standards examples that imply hard-coded business sections (`HeroSection`, `ProductsSection`, etc.) are **not** the V1 foundation. Sections remain generic containers of node trees. Business meaning stays in content/configuration, not platform entity types.

Icon / Divider remain optional future registry entries; Spacer covers basic spacing for now. Link is included as a first-class action node.

---

# Milestone 4 — Generic Renderer

**Status (Phase 2): Implemented (preview-level)**

Renderer location:

```text
apps/frontend/src/features/website/renderer/
```

Pipeline:

```text
Website tree API
   ↓
Page → Section → Node tree
   ↓
Registry-backed recursive NodeRenderer
```

### Design rules in force

- Recursive, data-driven rendering through the registry
- Adding a node type = register definition + add one renderer case (no page-renderer rewrite)
- HTML semantics resolved via registry helpers (`resolveHtmlTag`), not user-authored HTML
- Unsupported / malformed nodes render a safe fallback and do not crash the page
- No business-specific section components as architecture

### Phase 2 frontend scope

Structure management screen shows a live renderer preview of the stored tree. Full visual builder, property editors, theme, and publishing remain later phases.

---

# Milestone 5 — Builder UI

**Status (Phase 3): Builder shell & selection implemented**

Layout:

```text
┌─────────────┬──────────────────────┬─────────────┐
│             │                      │             │
│ Left Panel  │   Website Preview    │ Right Panel │
│  (fixed)    │   (independently     │  (fixed)    │
│ Structure   │    scrollable)       │  Properties │
│             │                      │             │
└─────────────┴──────────────────────┴─────────────┘
```

Route:

```text
/dashboard/customer/orgs/:orgId/websites/:websiteId/builder
```

### Phase 3 scope in force

- Fixed left structure panel (page → section → node tree)
- Independently scrollable center preview using generic `WebsiteRenderer`
- Fixed right properties shell driven by Node Registry capability groups
- Click-to-select nodes in preview (recursive / nested), synced with left panel
- Selection state lives in builder shell, not inside business-specific renderers
- Optional renderer interaction layer (`interaction` prop / context) keeps public/static render clean
- Basic add / remove / reorder via existing Phase 1 APIs (no drag-drop positioning)

### Explicitly deferred to later phases

- Theme, UI Library, Media, Templates, Publishing
- Full property inheritance resolution UI (storage already sparse-override friendly)

### Preview

The center preview represents the actual website tree.

It is vertically scrollable independently of the builder chrome.

### Selection

```text
Click Heading in preview
      ↓
Heading Node selected
      ↓
Right panel shows registry-driven control groups (placeholders until Phase 4)
```

### Package structure note

Monorepo principle remains:

- `apps/` = runnable apps (api, frontend)
- `packages/` = shared modules

`packages/node-registry` correctly stays shared (API + frontend).  
`packages/database` remains API-facing shared DB client; no move required.

---

# Milestone 6 — Node Editing

**Status (Phase 4): Generic property editor implemented**

### Capability-driven editor

```text
Selected Node
     ↓
Node Registry capabilities
     ↓
PROPERTY_FIELD_CATALOG (shared package)
     ↓
Generic PropertyControl widgets
     ↓
Optimistic tree update + debounced PATCH /api/nodes/:id
     ↓
WebsiteRenderer (stylesToCss)
```

Do **not** ship per-type editor components (`HeadingEditor`, `ImageEditor`, …).  
Node types participate by declaring capability field ids.

### Property storage model

- Content fields stay top-level on `node.data` (`text`, `level`, `src`, `href`, …)
- Visual overrides live under sparse `node.data.styles`
- Unset style keys mean “inherit later” (Theme / UI Library / defaults) — not a full baked style dump
- V1 writes base/desktop values only; breakpoint bags can extend later without changing content fields
- Legacy `{ align }` migrates to `styles.textAlign`

### Editor / renderer boundary

- Builder owns selection + draft/optimistic state + persistence debounce
- Renderer stays data-driven and does not import editor UI
- Backend validation via registry schemas remains authoritative

### Categories shown when supported

- Content
- Typography
- Appearance
- Layout

Unsupported categories are hidden.

### Explicitly deferred

- Theme / UI Library inheritance resolution UI
- Media picker
- Full responsive device preview / per-breakpoint editors
- Undo/redo history

---

# Milestone 7 — Website UI Library

**Status (Phase 6): Website UI Library implemented**

### Ownership

UI Library belongs to a Website (`library_items` table, `website_id`).  
Org membership authorization applies (same as pages/nodes). Cross-website access is forbidden.

```text
Organization
 └── Website
      ├── Theme
      ├── UI Library (LibraryItem[])
      ├── Pages → Sections → Nodes
      └── Media
```

### Library item structure

A `LibraryItem` stores:

- `name` — user-defined label (e.g. “Product Card”) — **not** a business entity
- `category` — optional grouping/folder label
- `version` — integer, incremented on definition updates (versioning-ready)
- `definition` — generic JSON node tree (`LibraryNodeDefinition`)

```text
LibraryNodeDefinition
 ├── key          // stable id within the definition
 ├── type         // registry node type
 ├── name?
 ├── data         // configured content + sparse styles
 ├── children[]
 └── libraryItemId?  // nested library reference
```

Atomic = single node. Composite = nested children. No Product/Testimonial/Hero DB entities.

### Linked instance model

Page nodes may link via:

- `libraryItemId`
- `libraryNodeKey` — maps instance node → definition node
- `libraryItemVersion` — version at insert time (pin-ready; V1 resolves **live current** definition)

Insert (`POST /library-items/:id/use`) mirrors the definition tree into the section with empty sparse `data` and link fields set. Instance remains linked.

### Override behavior

Instance `node.data` stays sparse. Effective config:

```text
Registry/system defaults (via theme mapping)
          ↓
        Theme
          ↓
     Library value (definition ± nested refs)
          ↓
     Node override (sparse)
```

Central helpers: `resolveLibraryDataForNode` + `resolveEffectiveStyles({ libraryStyles, nodeStyles })`.  
Property editor shows merged values; writes only override paths.

### Composite child-level overrides

Composite insert creates one page node per definition node, each with the same `libraryItemId` and its own `libraryNodeKey`.  
Child overrides do not detach the composite.

### Nested references + cycle prevention

Definition nodes may set `libraryItemId` to another item on the same website.  
Backend rejects self-refs and deeper cycles (`A→B→C→A`) via `wouldCreateLibraryCycle`.

### Save / Use / Make Independent

- **Save to UI Library** (`POST /nodes/:id/save-to-library`): snapshot effective configured tree into a new item; original node unchanged (not auto-converted).
- **Use**: create linked instance tree.
- **Make Independent**: bake current library+override into `node.data`, clear link fields; theme inheritance remains.

### Deletion / detachment

`GET /library-items/:id/usage` → instance root count + other library refs.  
Unused → delete. Used → `409` unless `?force=true`, which:

1. Detaches linked instances (bake effective config)
2. Inlines this item into other library definitions that referenced it
3. Deletes the item

Pages must never keep broken library references.

### Versioning direction (V1)

- `LibraryItem.version` increments on definition change
- Nodes store `libraryItemVersion` at insert
- **V1 resolution uses current definition (live link)** so updates flow to instances without overrides
- Future: pin instances to a version + deliberate upgrade UX (fields already present; no version UI in V1)

### Builder UX

Left tabs: **Structure | Theme | UI Library**.  
Properties: Save to UI Library / Make Independent.  
Tree API includes `libraryItems` + per-node link fields.

### Backend boundary

Library definitions are generic structure/config only — no React component names, JSX, or frontend paths.

### Explicitly deferred

- Full version-management UI
- Page library
- Media / templates / publishing

---

# Milestone 8 — Theme

**Status (Phase 5): Website Theme implemented**

### Ownership

Theme belongs to a Website (`websites.theme` JSON).  
Not the builder/admin application palette.

### Application UI Palette ≠ Website Theme

Platform chrome (Admin, Customer dashboard, Builder shell) uses a fixed Application UI palette:

```text
#8A5F41  primary
#A77F60  secondary accent
#F3E4C9  soft surfaces / selected
#CCD67F  positive / highlight
#FFFFFF  cards / content
```

Customer Website Theme remains independent and is never driven by this application palette.
Shared components live under `/dashboard/admin/ui-library` and `apps/frontend/src/components/ui`.

### Structure (V1)

```text
theme.colors.{primary,secondary,background,surface,text,mutedText,border}
theme.typography.{headingFont,bodyFont,baseFontSize,headingWeight}
theme.general.{borderRadius,spacing}
```

Defaults live in shared package (`DEFAULT_WEBSITE_THEME`). Invalid theme falls back to defaults.

### Effective style resolution

Central helper in `@custom-website-builder/node-registry`:

```text
resolveEffectiveStyles({
  nodeType,
  theme,
  libraryStyles?,  // Phase 6 UI Library
  nodeStyles?,     // sparse Phase 4 overrides
})
```

Merge order:

```text
Theme → UI Library → Node override
```

Unset node style keys inherit. Explicit node overrides win.

Renderer consumes resolved styles via `stylesToCss` — node views do not invent inheritance.

### Builder UX

Left panel tabs: **Structure | Theme | UI Library**.  
Theme edits update preview immediately (optimistic cache) and debounce-persist via `PATCH /api/websites/:id/theme`.

Tree API includes `theme` so reload restores saved values.

### Explicitly deferred

- Per-breakpoint theme editor
- Design-token platform

---

# Milestone 9 — Media

**Status (Phase 7): Website Media implemented**

### Ownership

Media belongs to a Website (`media_assets` table).  
Same org-membership authorization as pages/nodes/library. Cross-website access forbidden.

```text
Organization
 └── Website
      ├── Theme
      ├── UI Library
      ├── Media (MediaAsset[])
      └── Pages → Sections → Nodes
```

### Media Asset concept

Provider-independent platform record:

```text
MediaAsset
 ├── id / websiteId
 ├── kind (V1: image)
 ├── filename, mimeType, byteSize, width?, height?
 ├── url (delivery URL for renderer)
 ├── provider + providerId (storage locator)
 └── providerMeta (opaque extras — not the public contract)
```

Cloudinary response shapes stay inside the storage provider. Nodes never store Cloudinary-specific fields.

### Provider abstraction

```text
Media API → Media Service → MediaStorageProvider → Cloudinary (V1)
```

Future S3 (or other) swaps the provider implementation without changing Node / Website models.

Env: `CLOUDINARY_*`, `MEDIA_MAX_UPLOAD_BYTES`.

### Node → Media reference

Image node data:

```text
mediaAssetId  // preferred reference
src           // legacy/external URL fallback only
alt + styles  // presentation (Phase 4)
```

Selection = which asset. Styles = how it displays. Replacement changes `mediaAssetId` only; styles remain.

Tree API includes `mediaAssets` so renderer resolves URLs without Cloudinary calls on the frontend.

### Deletion / references

Usage scan across node `data` and library definitions.  
Unused → delete (DB + provider). Used → `409` unless `?force=true`, which clears `mediaAssetId` on refs then deletes.  
No silent broken links.

### Renderer fallback

- Asset exists → render URL  
- `mediaAssetId` set but missing → safe “Media asset unavailable” fallback  
- No selection → “No media selected”  
Page never crashes on bad media config.

### Builder UX

Left tabs: **Structure | Theme | UI Library | Media**.  
Image property control `mediaAsset` opens media picker (choose / upload / replace / clear).

### Explicitly deferred

- S3, video DAM, transformation UI, business media categories

---

# Milestone 10 — Template System

**Status (Phase 8): Template System implemented**

### Concept

A Template is a **platform-level initialization blueprint**, not a live parent of websites.

```text
Template Catalog (code)
   ↓ create website + copy
Website (independent)
   ├── Theme (own copy)
   ├── UI Library (own items)
   ├── Media (own MediaAsset rows)
   └── Pages → Sections → Nodes
```

After create, Website structure is authoritative. Template edits never silently change existing websites.

### Catalog

Package `@custom-website-builder/website-templates`:

- `listTemplateCatalog()` / `getWebsiteTemplate(id)`
- V1 entry: `ecommerce` (E-commerce style) v1
- Validated against Node Registry (`validateWebsiteTemplate`)

API: `GET /api/templates`, `GET /api/templates/:id`

### Version tracking

Website stores origin only:

- `templateId`
- `templateVersion`

No migration UI in V1. Future deliberate upgrades can use these fields.

### Copy behavior

`POST /organizations/:id/websites` with `templateId`:

1. Create Website
2. Copy template media → website `MediaAsset` (`provider: "template"`, public URLs — no cross-tenant FKs)
3. Copy template library keys → website `LibraryItem` UUIDs (nested refs remapped)
4. Copy pages/sections/nodes (hierarchy, order, sparse overrides, library links, mediaAssetId remaps)
5. Set website theme from template theme snapshot
6. Record `templateId` / `templateVersion`

On copy failure, created website is rolled back (deleted).

Blank create (no `templateId`) still allowed — existing Phase 1–7 websites unaffected.

### Theme / Library / Media

| Layer | On create | After create |
|-------|-----------|--------------|
| Theme | Snapshot into `websites.theme` | Independent |
| UI Library | Template defs → website-owned items | Independent |
| Media | Template URLs → website-owned assets | Independent |

No runtime `Template → Website` inheritance.

### Initial template structure

Generic Home page sections (names are section labels only — not business entities):

Navbar · Hero · Featured Content · Why Choose Us · Testimonials · Call To Action · Footer

Uses registry node types + one reusable “Primary Button” library item.

### Explicitly deferred

Marketplace, template editor, multi-template UX beyond catalog extensibility, migration UI, ecommerce engine.

---

# Milestone 11 — Draft & Publishing

**Status (Phase 9): Draft / Preview / Publish implemented**

### Concepts

```text
Website
 ├── Current Draft  = live editable tables (pages/sections/nodes/theme/library/media)
 └── Published Versions = immutable JSON snapshots
```

```text
Builder / Preview → Draft
Public (Phase 10) → Current Published Version only
```

Template is creation-only — not involved in publish.

### Published Version

`published_versions` row:

- `version` (monotonic per website)
- `contentHash` (sha256 of snapshot)
- `snapshot` (self-contained: theme + pages tree + library definitions + media records)
- `publishedAt`, `publishedByUserId`

Website.`currentPublishedVersionId` points at the live public version.

Snapshots embed library definitions and media URLs as they existed at publish time — later draft edits cannot mutate an already-published version.

### Publish flow

```text
POST /websites/:id/publish
  → build draft snapshot
  → validate (registry, hierarchy, library/media refs, theme, ≥1 page)
  → on failure: reject; current published unchanged
  → on success: transaction create PublishedVersion + set current
```

Also:

- `POST /websites/:id/validate`
- `GET /websites/:id/publication` / tree includes `publication` status
- `GET /websites/:id/published` (auth)
- `GET /api/public/websites/:websiteId/published` (no auth; never draft)
- `GET /api/public/sites/:slug` (no auth; never draft; Phase 10)

Unpublished websites → public 404 `"Website is not published"`.

### Preview

Builder Preview toggles chrome off and renders **draft** via existing `WebsiteRenderer`. Not the published snapshot.

### Failure safety

Validate before write. Create version + set current in one transaction. On failure, previous current published remains.

### Explicitly deferred

Public `/site/:slug` UI complete in Phase 10. History/rollback UI, scheduling, SEO remain out of V1.

---

# Milestone 12 — Public Website & V1 Hardening (complete)

Final V1 route:

```text
/site/:slug
/site/:slug/...pagePath
```

### Public flow

```text
/site/:slug
      ↓
Website (by slug)
      ↓
Current Published Version only
      ↓
Immutable snapshot (pages, theme, library, media)
      ↓
WebsiteRenderer (no builder interaction)
```

### Public API

- `GET /api/public/sites/:slug` — published-only by slug
- `GET /api/public/websites/:websiteId/published` — published-only by id

Never returns Draft rows, org membership, or unpublished content.

Unpublished website with matching slug → `404 "Website is not published"`.
Unknown slug → `404 "Website not found"`.
Multiple published websites sharing the same slug across orgs → `409 "Ambiguous website slug"` (slug remains org-unique in DB; public collisions are an edge case).

### Navigation

Public nav is driven by the published Page tree (titles, hierarchy, slugs). Not hardcoded business pages.
Missing path → page-not-found state inside the public shell.

### Builder / public separation

- `/dashboard/customer/...` — authenticated builder/app
- `/site/:slug` — public only; no Publish, Theme, Library, Media, selection, or structure chrome
- Builder Preview = draft; Public = published snapshot

### Responsive

Public shell uses max-width + fluid padding + `overflow-x-hidden`. Relies on existing renderer/responsive node styles — no separate public responsive editor.

### Hardening decisions

- Public payload is `toPublicPayload` (website id/name/slug + published version + snapshot)
- Snapshot remains immutable; draft edits cannot mutate prior versions
- Malformed nodes use existing renderer fallbacks; public shell adds a render error boundary
- Ecommerce starter template includes Home / Products / About / Contact pages for navigation; still structural only (no products DB)

### Explicitly out of V1

Custom domains, SEO suite, publish scheduling, version rollback UI, ecommerce, collections, collaboration.

---

# 4. V1 Data Philosophy

The database stores the website, not the business.

Primary structure:

```text
Organization
Website
Page
Section
Node
Theme
UI Library
Library Item
Media
Template
```

Website content is represented through the Node Tree.

There is deliberately no foundational:

```text
Products
Categories
Books
Services
Testimonials
FAQ
Gallery
```

---

# 5. Future Data Architecture

Collections are intentionally NOT part of V1.

However, the Node architecture must leave room for future:

```text
Collection
   ↓
Records
   ↓
Data Source
   ↓
Repeating / Dynamic Nodes
```

This is how we eventually support large sets of structured content without changing the fundamental Website → Page → Section → Node architecture.

For example, a future organization might create a collection named `Books`.

Another might create `Products`.

Another might create `Courses`.

The platform remains unaware of the business meaning.

This is a future capability, not a V1 dependency.

---

# 6. Explicit V1 Exclusions

Do not implement these as part of V1:

- Generic Collections
- Dynamic data/repeating record engine
- Ecommerce/cart
- Checkout
- Payments
- Orders
- Booking
- Blog
- Analytics
- Multilingual
- Advanced SEO
- Custom domains
- Subdomains
- Collaboration
- Advanced permissions
- Full arbitrary drag-and-drop positioning
- Advanced animation system

These can be added later without changing the core architecture.

---

# 7. V1 Builder Philosophy

V1 is a **controlled builder**.

Users choose from supported structures and edit their properties.

We are NOT trying to build Webflow/Figma-level freeform editing in V1.

But the underlying model must remain capable of evolving toward:

```text
Controlled Builder
      ↓
Better Layout Controls
      ↓
Drag & Drop
      ↓
Arbitrary Positioning
      ↓
Advanced Builder
```

---

# 8. Important Development Rule

Whenever a feature is proposed, first ask:

> "Is this a platform capability or a business-specific assumption?"

Example:

User says:

> Product Card needs Share.

Translate it to:

```text
Collection/Context: Product
UI Library Item: Product Card
Node: Share Button
```

The actual platform capability is:

```text
Share Button / Share Action
```

not:

```text
Product database
```

Likewise:

```text
Book Card
Service Card
Course Card
```

should all be treated as examples of reusable Node Trees.

---

# 9. V1 Completion Definition

V1 is complete when a user can perform this entire journey:

```text
Register
   ↓
Create Organization
   ↓
Create Website
   ↓
Select Template
   ↓
Open Builder
   ↓
Edit Pages
   ↓
Edit Sections
   ↓
Add/Edit Nodes
   ↓
Customize Theme
   ↓
Use UI Library
   ↓
Upload Media
   ↓
Preview
   ↓
Save Draft
   ↓
Publish
   ↓
Open Public Website
```

without writing code.

---

# 10. Implementation Order

### Current progress

- Steps 1–3: complete (auth, organizations, website structure / Phase 1)
- Steps 4–5: complete (shared node registry + generic recursive renderer / Phase 2)
- Step 6: complete (builder shell + selection / Phase 3)
- Step 7: complete (generic capability-driven node property editing / Phase 4)
- Step 8: complete (Website Theme + effective style resolution / Phase 5)
- Step 9: complete (Website UI Library / Phase 6)
- Step 10: complete (Media / Phase 7)
- Step 11: complete (Templates / Phase 8)
- Step 12: complete (Draft / Publish / Phase 9)
- Step 13–14: complete (Public Website + V1 hardening / Phase 10)

**V1 implementation plan is complete.** No further V1 product modules planned here.

The IDE agent should implement in this order:

```text
1. Foundation / Auth
        ↓
2. Organization + Website
        ↓
3. Website Structure
        ↓
4. Node Registry
        ↓
5. Generic Renderer
        ↓
6. Builder UI
        ↓
7. Node Editing
        ↓
8. Theme
        ↓
9. UI Library
        ↓
10. Media
        ↓
11. Template
        ↓
12. Draft / Publish
        ↓
13. Public Website
        ↓
14. V1 End-to-End Testing
```

Each milestone should be functional before moving to the next.

# Final Architecture Rule

The most important rule for the entire project:

> **We are building a generic website-building platform. We are not building an ecommerce system, bakery system, library system, salon system, or any other business-management system.**

Business meaning belongs to the organization and its website content.

The platform provides the structure, design system, reusable components, editing capabilities and publishing engine.