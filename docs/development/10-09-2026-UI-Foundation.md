# UI Foundation

## 1. Purpose

The UI Foundation is the reusable frontend design system for the Custom Website Builder Admin Portal.

Its purpose is to ensure that:

- The application has a consistent visual language.
- Common UI elements are built once and reused everywhere.
- Global visual changes can be made centrally.
- New features do not create duplicate UI implementations.
- Components remain scalable as the application grows.
- The foundation can support the future customer Website Theme system without coupling the two systems.

The UI Foundation is a **platform-level UI system**.

It is separate from the future **customer Website Theme** system.

---

# 2. Core Principle

The main rule of the UI architecture is:

> **Build once → Register in UI Library → Reuse everywhere.**

If a required UI pattern already exists, future features must use the existing component.

Do not create another component with the same purpose only because the feature has a different name.

For example:

- Product drawer → use `Drawer`
- User drawer → use `Drawer`
- Settings drawer → use `Drawer`

The feature provides the content and behavior.

The UI Foundation provides the common UI structure and visual behavior.

---

# 3. UI Architecture

The frontend UI architecture follows these layers:

```text
Design Tokens
      ↓
Semantic / Usage Tokens
      ↓
Theme
      ↓
UI Primitives
      ↓
Component Variants / Recipes
      ↓
Shared Components
      ↓
Feature Components
      ↓
Page Components
```

Each layer has a specific responsibility.

---

# 4. Design Tokens

Design tokens contain the fundamental visual values of the application.

Examples include:

```text
Colors
Spacing
Typography
Font Sizes
Font Weights
Border Radius
Shadows
Breakpoints
Transitions
```

These values should be centralized rather than repeatedly defined inside individual features.

The purpose is to allow the overall visual language of the application to be changed without rewriting every component.

---

# 5. Semantic / Usage Tokens

Components should not depend directly on arbitrary raw colors.

Instead, the UI system uses semantic meaning.

Examples:

```text
Background
Foreground
Surface
Muted
Border
Success
Warning
Danger
Info
```

The semantic layer describes **what a color is used for**, rather than where the color came from.

This allows the underlying visual values to change while component implementations remain stable.

---

# 6. Important Color Architecture Rule

The UI Foundation must not assume that the application only has:

```text
Primary
Secondary
```

as its complete color system.

The future customer Website Theme system may allow an organization to select multiple colors from a palette.

The conceptual model is:

```text
Color Palette
    ↓
Color Usage / Semantic Mapping
    ↓
Component Styling
```

For example, a future website may have:

```text
Color 1
Color 2
Color 3
Color 4
Color 5
```

The architecture should remain extensible so additional colors can be supported later without redesigning the entire component system.

---

# 7. Admin Portal Theme vs Website Theme

These are two different concepts.

## Admin Portal

The Admin Portal uses the platform's own UI Foundation and visual design system.

It controls:

- Dashboard appearance
- Sidebar
- Forms
- Tables
- Dialogs
- Drawers
- Buttons
- Navigation
- Feedback
- Other administrative UI

## Customer Website

Each organization will eventually have its own Website Theme.

The Website Theme controls things such as:

```text
Brand Colors
Typography
Shape
Spacing
Shadows
Component Appearance
```

These two systems must remain separated.

```text
Admin Portal
    ↓
Platform UI Foundation

Customer Website
    ↓
Organization Website Theme
```

A customer's website customization must not accidentally change the Admin Portal's visual system.

---

# 8. UI Components

The UI Foundation contains reusable production components.

## Actions

```text
Button
Icon Button
```

## Form

```text
Input
Textarea
Select
Checkbox
Radio
Switch
Label
```

## Display

```text
Card
Badge / Tag
Avatar
Separator
Skeleton
Spinner
Progress
```

## Feedback

```text
Alert
Toast
```

## Overlay / Interaction

```text
Dialog / Popup
Drawer
Popover
Tooltip
Dropdown Menu
```

## Navigation / Structure

```text
Tabs
Breadcrumb
Pagination
```

## Data

```text
Table
```

These components are the application's reusable UI building blocks.

---

# 9. Component Behavior

Components are not merely visual wrappers.

Interactive components must provide their actual intended behavior.

Examples:

### Dialog

Should support:

```text
Open
Close
Overlay
Keyboard interaction
Accessible focus behavior
```

### Drawer

Should support:

```text
Open
Close
Placement
Overlay
Responsive behavior
```

### Dropdown Menu

Should support:

```text
Opening
Closing
Item selection
Keyboard interaction
```

### Tooltip

Should provide the expected tooltip interaction.

### Tabs

Should support switching between tab content.

### Toast

Should provide temporary feedback notifications.

Future features should rely on these production behaviors instead of rebuilding them.

---

# 10. Component Variants

Reusable components should support controlled variants rather than allowing every feature to invent its own styling.

For example:

```text
Button
 ├── Variant
 │    ├── Default
 │    ├── Destructive
 │    ├── Outline
 │    └── Ghost
 │
 └── Size
      ├── Small
      ├── Default
      └── Large
```

The exact variants can evolve as the application grows.

The important rule is that variants belong to the reusable component itself.

---

# 11. UI Library

The Admin Portal contains a final sidebar item:

```text
UI Library
```

It is positioned as the last navigation item.

The UI Library is an internal visual reference catalog for the application's production UI components.

It is conceptually similar to having an internal Storybook-style reference inside the Admin Portal.

---

# 12. UI Library Responsibilities

The UI Library should show:

- Component name
- Available variants
- Available sizes
- Important states
- Interactive behavior
- Visual examples

The UI Library should use the **actual production components**.

It must not create separate fake/demo implementations.

For example:

```text
UI Library
    ↓
Button component actually used by the application
```

not:

```text
UI Library
    ↓
Special ButtonDemo component
```

---

# 13. UI Library Is Not a Code Repository

The UI Library is primarily a visual and behavioral reference.

It does not need to provide copyable source code snippets.

Its purpose is to answer questions such as:

> "What Button component should I use?"

> "What does the Drawer look like?"

> "Which Badge variants are available?"

> "How does the Dialog behave?"

The answer should be visible directly in the UI Library.

---

# 14. Rules for Future Feature Development

Before implementing a new frontend feature, developers must first check the UI Foundation and UI Library.

### Rule 1 — Reuse Existing Components

If the required component already exists, use it.

Do not create another equivalent component.

---

### Rule 2 — Do Not Create Feature-Specific UI Duplicates

Avoid components such as:

```text
ProductDrawer
UserDrawer
SettingsDrawer
```

when the only difference is the content.

Instead:

```text
Drawer
    +
Feature Content
```

---

### Rule 3 — Do Not Use Arbitrary Raw Colors

Feature code should not introduce unrelated hard-coded colors when an appropriate design or semantic token exists.

---

### Rule 4 — Do Not Spread Global Styling

Global design decisions should remain centralized.

Avoid creating unrelated global CSS rules inside feature modules.

---

### Rule 5 — Do Not Build a Second UI System

Future features must not introduce another component library or styling approach alongside the existing UI Foundation.

---

### Rule 6 — New Reusable Patterns Must Enter the Foundation

If a genuinely new reusable UI pattern is required:

```text
Identify new pattern
       ↓
Build reusable component
       ↓
Add it to UI Foundation
       ↓
Expose it through UI Library
       ↓
Reuse it across features
```

Do not build a reusable pattern privately inside one feature.

---

# 15. When a New Component Is Allowed

A new component is justified when:

1. The UI pattern does not already exist.
2. The pattern is likely to be reused.
3. Existing components cannot reasonably represent the pattern.
4. The new component follows the same token and styling architecture.

If the pattern is feature-specific and unlikely to be reused, it may remain a feature component while composing existing UI Foundation components.

---

# 16. Composition Model

Features should be constructed by composing reusable building blocks.

Example:

```text
Product Management Page
        ↓
Feature Components
        ↓
Card / Table / Dialog / Drawer / Button / Input
        ↓
UI Foundation
        ↓
Design Tokens
```

The feature owns the business-specific structure.

The UI Foundation owns common visual and interaction patterns.

---

# 17. Centralized Customization

The UI architecture is intentionally designed so that global visual decisions can be changed centrally.

Examples:

```text
Global spacing
Global typography
Global radius
Global shadows
Global semantic colors
Global component appearance
```

A change to the underlying design system should propagate to components without requiring every feature to be manually redesigned.

---

# 18. Future Website Theme Compatibility

The UI Foundation must remain compatible with the future Website Theme Engine.

The future theme architecture is expected to conceptually follow:

```text
User Color Picker
       ↓
Color Palette
       ↓
Theme Configuration
       ↓
CSS Variables / Theme Tokens
       ↓
Website Components
       ↓
Public Website
```

The Website Theme Engine may eventually support:

```text
Colors
Typography
Shape
Spacing
Shadows
Component Usage
```

The UI Foundation should therefore avoid architectural decisions that make multiple-color palettes or richer theme configuration impossible later.

---

# 19. Technology Direction

The UI Foundation follows the existing frontend technology choices:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Radix UI
CSS Variables
TanStack Query
```

The project should use these technologies consistently with the existing application architecture.

The UI Foundation is not intended to become a completely custom UI framework.

It is a structured layer over the project's existing frontend technologies.

---

# 20. Accessibility

Reusable components should preserve appropriate accessibility behavior.

Interactive primitives should support expected keyboard and focus behavior.

Where the underlying component technology already provides accessibility behavior, future features should use those primitives rather than replacing them with custom implementations.

---

# 21. Quality Expectations

The UI Foundation is considered healthy when:

- Components are reusable.
- Components have controlled variants.
- Components have predictable states.
- Interactive components behave correctly.
- Styling is centralized.
- Features do not duplicate common components.
- The UI Library reflects production components.
- Global visual changes can be made centrally.
- Existing application pages remain unaffected.
- The architecture can support future website customization.

---

# 22. Current Status

The initial UI Foundation has been implemented and verified.

The application builds successfully using:

```text
npm run build:frontend
```

The application is also running correctly.

The UI Library is available inside the Admin Portal and contains the implemented reusable components and their interactive demonstrations.

---

# 23. Completion Criteria

This UI Foundation phase is considered complete when:

```text
✓ Design tokens exist
✓ Semantic/usage tokens exist
✓ Reusable UI components exist
✓ Component variants are controlled
✓ Component states are supported
✓ Interactive behavior works
✓ UI Library exists
✓ UI Library uses production components
✓ UI Library is accessible from the Admin Portal
✓ UI Library is the final sidebar item
✓ Existing application functionality remains working
✓ Frontend production build succeeds
✓ Architecture is extensible
✓ Future features can reuse the foundation
✓ Future Website Theme architecture is not blocked
```

---

# 24. Golden Rule for the Project

For every future frontend feature:

> **Before creating UI, check the UI Foundation and UI Library first.**

If an appropriate component exists:

```text
USE IT.
```

If it does not exist but the pattern is reusable:

```text
ADD IT TO THE UI FOUNDATION.
```

Only then should the feature be implemented.

This keeps the Custom Website Builder consistent, maintainable, scalable, and easy to customize as the product grows.