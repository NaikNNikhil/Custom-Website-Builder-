# Custom Website Builder — Coding Standards & Architecture Contract

**Document status:** Mandatory project coding standard  
**Applies to:** Entire repository  
**Audience:** Human developers, AI coding agents, reviewers, and future maintainers

---

## 1. Purpose of This Document

This document is the **coding and architecture contract** for the Custom Website Builder codebase.

Any developer or AI tool working on this repository must use this document as the default implementation standard.

The goal is to keep the repository:

- predictable
- modular
- easy to understand
- easy to extend
- safe to modify
- consistent across developers
- resistant to folder-structure drift

If a new implementation conflicts with this document, the developer must first determine whether the requirement truly requires an architecture change. Do not introduce structural changes merely for convenience.

---

# 2. Current Technology Rules

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

## Backend

- Node.js
- Express
- TypeScript
- Prisma ORM

## Database

- PostgreSQL

## Storage

- Cloudinary for V1
- Storage abstraction must allow AWS S3 or another provider later

## General

- TypeScript is mandatory for application code.
- Avoid JavaScript files for application logic.
- Prefer strict typing over `any`.
- Use asynchronous APIs consistently.
- Keep business logic independent from HTTP details where practical.

---

# 3. Core Architectural Principle

The application uses a **feature/module-oriented architecture**.

Do not organize the entire application into global technical folders such as:

```text
controllers/
services/
models/
routes/
```

with files from every feature mixed together.

Instead, each business capability owns its related code.

Backend example:

```text
modules/
└── products/
    ├── product.controller.ts
    ├── product.service.ts
    ├── product.routes.ts
    ├── product.validation.ts
    └── product.types.ts
```

Frontend example:

```text
features/
└── products/
    ├── components/
    ├── api/
    ├── hooks/
    ├── types.ts
    └── utils.ts
```

A feature should be understandable by opening its own folder.

---

# 4. Repository Structure

The approved high-level structure is:

```text
Custom Website Builder/
│
├── apps/
│   ├── api/
│   └── frontend/
│
├── packages/
│   ├── database/
│   ├── shared/
│   ├── validation/
│   └── eslint-config/
│
├── docs/
│
├── infrastructure/
│
├── .github/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

Do not create additional top-level application folders unless there is a clear architectural reason.

---

# 5. Backend Architecture

Backend source lives under:

```text
apps/api/src/
```

Approved structure:

```text
apps/api/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   ├── routes/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
│
└── tests/
```

---

## 5.1 `config/`

Contains application configuration and external service setup.

Example:

```text
config/
├── env.ts
├── database.ts
└── cloudinary.ts
```

Rules:

- Environment variables are read through the config layer.
- Do not scatter `process.env.X` throughout business logic.
- External service configuration belongs here.
- Do not put business logic in config files.

---

# 6. Backend Modular Structure

All business functionality belongs under:

```text
apps/api/src/modules/
```

Initial modules may include:

```text
auth/
organizations/
users/
sites/
products/
categories/
gallery/
testimonials/
faqs/
leads/
media/
themes/
publishing/
analytics/
```

Only create a module when the corresponding functionality is being implemented.

---

## 6.1 Standard Module Structure

A standard backend module should look like:

```text
products/
├── product.controller.ts
├── product.service.ts
├── product.routes.ts
├── product.validation.ts
└── product.types.ts
```

A more complex module may contain subfolders:

```text
products/
├── controllers/
├── services/
├── routes/
├── validations/
├── types/
└── utils/
```

Do not introduce this more complex structure unless the module actually becomes large enough to need it.

Prefer the simpler structure first.

---

# 7. Backend Layer Responsibilities

## Routes

Routes define HTTP endpoints and connect them to controllers.

Example:

```text
POST /products
GET /products
GET /products/:id
PATCH /products/:id
DELETE /products/:id
```

Routes must not contain business logic.

---

## Controllers

Controllers handle HTTP concerns.

Responsibilities:

- read request data
- read authenticated user/tenant information
- call services
- return HTTP responses

Controllers should remain thin.

Bad:

```text
Controller
├── validation
├── database queries
├── pricing calculations
├── business rules
└── response formatting
```

Good:

```text
Controller
    ↓
Service
    ↓
Database
```

---

## Services

Services contain business logic.

Examples:

```text
createProduct()
updateProduct()
deleteProduct()
getProducts()
```

Services may call:

- Prisma
- external services
- helper functions

Business rules belong here, not in controllers.

---

## Validation

Request validation belongs in:

```text
<module>.validation.ts
```

Validation must happen before business logic executes.

Use the project's chosen schema validation library consistently.

Do not duplicate the same request schema unnecessarily.

---

## Types

Module-specific TypeScript types belong in:

```text
<module>.types.ts
```

Shared types that are genuinely used across applications belong in:

```text
packages/shared/
```

---

# 8. Backend Request Flow

The standard request flow is:

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL
```

For authenticated tenant requests:

```text
HTTP Request
     ↓
Authentication Middleware
     ↓
Tenant / Organization Middleware
     ↓
Authorization
     ↓
Validation
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL
```

Do not bypass this flow without a documented reason.

---

# 9. Multi-Tenancy Rule

The application is multi-tenant.

Organization-owned data must never be queried without tenant context.

Conceptually:

```text
User
  ↓
Organization Membership
  ↓
Organization
  ↓
Organization-owned data
```

Examples:

```text
products
gallery
testimonials
faqs
leads
site settings
```

must be scoped to the appropriate organization.

Never assume a frontend-supplied organization ID is trustworthy.

The backend must derive or verify tenant access from the authenticated user/session.

---

# 10. Database Rules

Database code belongs in:

```text
packages/database/
```

Structure:

```text
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   └── client.ts
│
└── package.json
```

Rules:

1. Prisma is the database access layer.
2. Database queries must not be written directly inside frontend code.
3. API business services use the database package.
4. Schema changes require Prisma migrations.
5. Never manually modify an already-applied migration.
6. Create a new migration for schema changes.
7. Seed data must be deterministic where practical.
8. Organization ownership and relations must be explicit in the schema.

---

# 11. Frontend Architecture

Frontend source lives under:

```text
apps/frontend/src/
```

Approved structure:

```text
src/
├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── providers/
├── types/
└── styles/
```

---

# 12. Next.js `app/` Rules

The `app/` directory is primarily responsible for:

- routing
- pages
- layouts
- route groups
- route parameters
- loading states
- error boundaries where required

Do not turn page files into large business-logic files.

A page should generally compose feature components.

Example:

```text
app/
└── (dashboard)/
    └── products/
        └── page.tsx
```

The page can use:

```text
features/products/
```

for the actual product functionality.

---

# 13. Route Groups

Use Next.js route groups when a group of routes shares layout or organization but should not appear in the URL.

Example:

```text
app/
└── (auth)/
    ├── login/
    └── signup/
```

URLs remain:

```text
/login
/signup
```

Do not use route groups merely to create arbitrary nesting.

---

# 14. Frontend Feature Architecture

Application functionality belongs under:

```text
features/
```

Example:

```text
features/
└── products/
    ├── components/
    ├── api/
    ├── hooks/
    ├── types.ts
    └── utils.ts
```

Possible feature folders:

```text
auth/
organization/
website/
products/
gallery/
testimonials/
faq/
leads/
media/
themes/
publishing/
```

---

# 15. Frontend Feature Rules

A feature owns its application-specific code.

For example:

```text
features/products/
```

may contain:

```text
components/
    product-form.tsx
    product-table.tsx
    product-card.tsx

api/
    products-api.ts

hooks/
    use-products.ts

types.ts
utils.ts
```

Do not put product-specific components in:

```text
components/
```

unless they are genuinely generic/reusable.

---

# 16. `components/` Rules

Global components belong in:

```text
components/
```

Only place components here if they are reusable across multiple unrelated features.

Examples:

```text
components/
├── ui/
├── layout/
├── forms/
└── common/
```

---

## `components/ui/`

Contains reusable UI primitives.

Examples:

```text
Button
Input
Card
Dialog
Dropdown
Table
```

shadcn/ui components belong here.

Do not put business-specific components here.

Bad:

```text
components/ui/ProductManagementTable.tsx
```

Good:

```text
features/products/components/product-table.tsx
```

---

# 17. Frontend API Rules

API communication should not be scattered across page components.

Prefer:

```text
features/products/api/products-api.ts
```

and TanStack Query hooks:

```text
features/products/hooks/use-products.ts
```

Conceptually:

```text
Page
 ↓
Feature Component
 ↓
TanStack Query Hook
 ↓
Feature API Function
 ↓
Backend API
```

Do not write repeated `fetch()` logic in multiple components.

---

# 18. TanStack Query Rules

TanStack Query is the standard for server state.

Use it for:

- API data
- fetching
- caching
- refetching
- mutations
- loading state
- server error state

Do not copy server data into global client state unnecessarily.

Do not introduce another server-state library without an architectural decision.

---

# 19. Local UI State

Use React local state for temporary UI state such as:

- modal open/closed
- selected tab
- input visibility
- dropdown state
- temporary form state

Do not create global state for something that only belongs to one component.

---

# 20. `lib/` Rules

`lib/` is for application-wide technical utilities.

Examples:

```text
lib/
├── api/
├── auth/
├── query/
└── utils/
```

Do not use `lib/` as a dumping ground.

If code belongs specifically to Products, put it under:

```text
features/products/
```

not:

```text
lib/products.ts
```

---

# 21. Providers

Application-wide React providers belong under:

```text
providers/
```

Examples:

```text
providers/
├── query-provider.tsx
└── auth-provider.tsx
```

Only add providers when they are genuinely application-wide.

---

# 22. Shared Packages

Do not create shared packages for every small utility.

Approved initial packages:

```text
packages/
├── database/
├── shared/
├── validation/
└── eslint-config/
```

---

## `packages/shared/`

Contains genuinely shared definitions.

Examples:

```text
enums/
types/
constants/
```

Examples:

```text
UserRole
OrganizationStatus
ProductStatus
LeadStatus
```

Do not put feature-specific business logic here.

---

## `packages/validation/`

Contains schemas that genuinely need to be shared between frontend and backend.

Example:

```text
CreateProductSchema
UpdateProductSchema
CreateLeadSchema
```

The backend remains authoritative for security validation.

Client-side validation must never be treated as security.

---

# 23. Naming Conventions

## Files

Use kebab-case for frontend files:

```text
product-form.tsx
product-table.tsx
use-products.ts
```

Backend files may use:

```text
product.controller.ts
product.service.ts
product.routes.ts
```

Use consistent naming within each layer.

---

## Components

React components use PascalCase:

```tsx
<ProductForm />
<ProductTable />
<SiteHeader />
```

---

## Functions

Use camelCase:

```ts
createProduct()
getOrganization()
updateSiteSettings()
```

---

## Variables

Use camelCase:

```ts
organizationId
productId
currentUser
```

---

## Types

Use PascalCase:

```ts
Product
Organization
CreateProductInput
AuthUser
```

---

# 24. TypeScript Rules

Prefer explicit types at important boundaries.

Avoid:

```ts
const data: any = ...
```

Prefer:

```ts
const data: Product = ...
```

or inferred types when inference is reliable.

Use `unknown` instead of `any` when receiving genuinely unknown data.

Do not disable TypeScript strictness just to make code compile.

---

# 25. Error Handling

The backend must have centralized error handling.

Expected flow:

```text
Service Error
     ↓
Controller / Express
     ↓
Error Middleware
     ↓
Standard API Error Response
```

Do not return random error formats from different endpoints.

The API should use a consistent response/error contract.

Frontend should handle:

```text
loading
success
empty
error
```

states intentionally.

---

# 26. Authentication Rules

Authentication code belongs under:

```text
backend:
modules/auth/

frontend:
features/auth/
```

Authentication must not be mixed with organization or product business logic.

The auth module owns:

- registration
- login
- logout
- refresh
- current user
- authentication-related validation

Authorization and organization membership are related but remain separate concerns.

---

# 27. Authorization / RBAC

Roles and permissions must be enforced on the backend.

Frontend hiding a button is not authorization.

Conceptually:

```text
User
 ↓
Authentication
 ↓
Organization Membership
 ↓
Role
 ↓
Permission
 ↓
Action
```

The backend must reject unauthorized requests even if the frontend is bypassed.

---

# 28. Media / Storage Architecture

V1 uses Cloudinary.

Do not scatter Cloudinary calls throughout feature services.

Prefer a storage abstraction such as:

```text
modules/media/
```

or a dedicated storage service.

Conceptually:

```text
Feature
  ↓
Media / Storage Service
  ↓
Storage Provider
  ↓
Cloudinary
```

Later:

```text
Storage Service
  ↓
AWS S3
```

The rest of the application should not need major changes when the provider changes.

---

# 29. Website Renderer Rules

The public website renderer must be treated as a separate frontend concern.

Conceptually:

```text
Website
 ↓
Page
 ↓
Section
 ↓
Section Component
```

Recommended structure:

```text
features/website/
├── renderer/
├── sections/
├── themes/
└── types/
```

Example:

```text
sections/
├── hero/
├── about/
├── products/
├── gallery/
├── testimonials/
├── faq/
└── contact/
```

Do not hard-code business-specific website content directly inside section components.

Sections should receive data.

---

# 30. Website Content vs Website Rendering

Keep these concerns separate.

### Data

```text
organization
site settings
products
gallery
testimonials
faqs
```

### Rendering

```text
HeroSection
ProductSection
GallerySection
FaqSection
```

The renderer consumes data.

It must not become the database layer.

---

# 31. Theme Rules

Theme data belongs to the website/site domain.

Theme rendering belongs to the frontend website system.

For example:

```text
Theme Configuration
        ↓
Theme Provider
        ↓
Website Sections
```

Do not hard-code theme colors throughout individual components.

Bad:

```tsx
className="bg-[#FF6B6B]"
```

when the color is supposed to be configurable.

Theme values should come through the theme system.

---

# 32. Environment Variables

Never commit secrets.

Use:

```text
.env.local
```

for local development.

Maintain:

```text
.env.example
```

with variable names but no secrets.

Example:

```text
DATABASE_URL=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never commit:

```text
.env
.env.local
production secrets
API keys
private credentials
```

---

# 33. API URL Rules

Frontend must not hard-code backend URLs throughout components.

Bad:

```ts
fetch("http://localhost:5000/api/products")
```

inside multiple components.

Use a centralized API configuration/client.

Environment-specific configuration should be controlled through environment variables.

---

# 34. Comments

Do not comment obvious code.

Bad:

```ts
// Increment i
i++;
```

Use comments to explain:

- non-obvious decisions
- architectural constraints
- unusual workarounds
- security considerations
- reasons something must not be changed casually

Prefer clear code over excessive comments.

---

# 35. No Dead Code

Do not leave:

- unused files
- unused imports
- commented-out old implementations
- duplicate components
- abandoned APIs

If an implementation is replaced, remove the old implementation unless it is intentionally retained and documented.

---

# 36. No Duplicate Logic

Before creating a helper, hook, component, service, or utility, search the repository.

Do not create:

```text
formatDate.ts
dateFormatter.ts
format-date.ts
```

that all solve the same problem.

Likewise, do not create duplicate API clients for the same backend.

---

# 37. Do Not Over-Abstraction

Do not create abstractions before they are needed.

Avoid creating:

```text
BaseController
BaseService
GenericRepository
AbstractFactory
```

unless there is a real repeated requirement.

Prefer straightforward code.

Production-ready means maintainable, not unnecessarily sophisticated.

---

# 38. Dependency Rules

Before adding a dependency:

1. Check whether the project already has a solution.
2. Check whether the functionality can be implemented simply without a dependency.
3. Consider bundle size and maintenance.
4. Add the dependency only when justified.

Do not introduce multiple libraries that solve the same problem.

---

# 39. Testing Structure

Tests should live close to the application they test or in the application's designated test directory.

Backend:

```text
apps/api/tests/
```

Frontend:

```text
apps/frontend/tests/
```

Tests should cover important business behavior.

At minimum, critical areas should eventually include:

- authentication
- authorization
- tenant isolation
- product CRUD
- lead creation
- publishing behavior

---

# 40. Documentation Rules

Project architecture documents belong under:

```text
docs/
```

Approved core documents:

```text
docs/
├── requirements.md
├── architecture.md
├── cms-flow.md
├── db-design.md
├── api-design.md
├── authentication.md
├── multi-tenancy.md
├── theme-system.md
├── publishing.md
└── roadmap.md
```

Documentation should describe the current implementation.

Do not allow documentation and implementation to intentionally diverge.

---

# 41. Feature Addition Rules

When adding a new feature:

### Step 1

Identify the business domain.

Example:

```text
Appointments
```

### Step 2

Create backend module:

```text
apps/api/src/modules/appointments/
```

### Step 3

Create frontend feature:

```text
apps/frontend/src/features/appointments/
```

### Step 4

Add database changes under:

```text
packages/database/prisma/
```

### Step 5

Add shared types/validation only if genuinely shared.

### Step 6

Add routes.

### Step 7

Add tests.

### Step 8

Update documentation.

Do not scatter one feature across arbitrary folders.

---

# 42. Example: Adding Blog in V2

Correct:

```text
apps/api/src/modules/blog/
apps/frontend/src/features/blog/
packages/database/prisma/
```

Potential frontend:

```text
features/blog/
├── components/
├── api/
├── hooks/
├── types.ts
└── utils.ts
```

Potential backend:

```text
modules/blog/
├── blog.controller.ts
├── blog.service.ts
├── blog.routes.ts
├── blog.validation.ts
└── blog.types.ts
```

This pattern must remain consistent for future features.

---

# 43. Page vs Feature Rule

A useful rule:

> **Pages compose. Features implement.**

Example:

```text
app/(dashboard)/products/page.tsx
```

should compose:

```text
features/products/components/product-page.tsx
```

rather than containing the entire product implementation.

Similarly:

```text
app/(auth)/login/page.tsx
```

should use:

```text
features/auth/components/login-form.tsx
```

when the authentication UI becomes substantial.

---

# 44. Import Rules

Prefer path aliases:

```ts
@/features/auth
@/components/ui/button
@/lib/utils
```

Avoid long relative imports such as:

```ts
../../../../components/...
```

Do not create circular dependencies between features.

Prefer one-way dependency flow.

---

# 45. Feature Boundary Rules

Features should not directly reach into another feature's private implementation.

Bad:

```text
features/products/
    imports internal file from
features/orders/
```

Prefer shared public interfaces or shared packages when cross-feature communication is genuinely required.

Feature boundaries are important for future growth.

---

# 46. Security Rules

Never trust:

- frontend validation
- frontend role checks
- frontend organization IDs
- URL parameters
- request body ownership fields

The backend is the security boundary.

Always validate authorization server-side.

Never expose:

- database credentials
- JWT secrets
- Cloudinary secrets
- private API keys

to the browser.

---

# 47. API Design Rules

API endpoints should be predictable and REST-oriented.

Examples:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

POST   /organizations
GET    /organizations/me
PATCH  /organizations

GET    /products
POST   /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id

POST   /leads
GET    /leads
```

Do not create inconsistent endpoint naming for different modules.

---

# 48. Git Rules

Use meaningful commits.

Good:

```text
feat(auth): add login page
feat(auth): add signup validation
feat(products): add product CRUD API
fix(leads): prevent duplicate submission
refactor(media): isolate storage provider
```

Avoid:

```text
update
changes
final
done
test
new code
```

---

# 49. Pull Request / Code Review Rules

Before merging code, verify:

- correct folder
- correct module/feature
- no duplicated logic
- no secrets
- TypeScript passes
- lint passes
- tests pass where applicable
- tenant isolation preserved
- authorization preserved
- documentation updated if architecture changed

---

# 50. Rules for AI Coding Agents

Any AI coding tool working on this repository must follow these rules.

## Before coding

1. Inspect the existing folder structure.
2. Inspect the relevant feature/module.
3. Search for existing implementations.
4. Reuse existing utilities/components/services where appropriate.
5. Read relevant documentation.
6. Determine the correct architectural location before creating files.

## While coding

1. Do not move folders without a clear reason.
2. Do not rename established architecture casually.
3. Do not create duplicate implementations.
4. Do not introduce new libraries without justification.
5. Do not bypass module boundaries.
6. Do not put business logic into route/page files.
7. Do not put feature-specific code into global folders.
8. Do not modify unrelated modules unnecessarily.

## After coding

1. Check imports.
2. Check TypeScript errors.
3. Check lint.
4. Run relevant tests.
5. Review changed files for accidental architecture drift.
6. Update documentation if behavior or architecture changed.

---

# 51. AI Must Not Assume

An AI tool must not assume that:

- a new folder is automatically acceptable
- a new dependency is acceptable
- an existing module should be rewritten
- frontend validation provides security
- organization IDs from the client are trusted
- existing code can be deleted because a cleaner approach exists
- a generic abstraction is better than existing simple code

When uncertain, inspect the repository and follow the existing pattern.

---

# 52. Change Management Rule

Architecture should evolve deliberately.

A developer may propose an architecture change when:

- the current structure prevents a required feature
- the current structure creates repeated problems
- scalability requires a clear change
- security requires a change
- a technology decision has changed

The change should be documented before large-scale restructuring.

Do not restructure the repository merely because another developer prefers a different style.

---

# 53. Current V1 Principle

V1 should remain intentionally simple.

Use:

```text
Next.js
    ↓
Express
    ↓
Prisma
    ↓
PostgreSQL
```

Do not introduce unnecessary:

```text
microservices
Kafka
event buses
GraphQL
CQRS
complex DDD layers
multiple state-management libraries
```

unless a real requirement proves they are necessary.

---

# 54. Golden Rules

These are the rules that should be remembered above everything else.

### Rule 1

**Pages compose; features implement.**

### Rule 2

**Backend business functionality belongs in modules.**

### Rule 3

**Feature-specific code stays inside its feature.**

### Rule 4

**Global folders are only for genuinely global code.**

### Rule 5

**Controllers handle HTTP; services handle business logic.**

### Rule 6

**The backend is the security boundary.**

### Rule 7

**All organization-owned data must respect tenant isolation.**

### Rule 8

**Do not duplicate logic. Search before creating.**

### Rule 9

**Do not add complexity without a real requirement.**

### Rule 10

**Do not restructure existing code casually.**

### Rule 11

**New features follow the same backend-module + frontend-feature pattern.**

### Rule 12

**When uncertain, inspect existing code and documentation before making architectural decisions.**

---

# 55. Reference Architecture

The intended long-term shape is:

```text
Custom Website Builder
│
├── apps
│   │
│   ├── api
│   │   │
│   │   └── src
│   │       ├── config
│   │       ├── middleware
│   │       ├── modules
│   │       │   ├── auth
│   │       │   ├── organizations
│   │       │   ├── sites
│   │       │   ├── products
│   │       │   ├── categories
│   │       │   ├── gallery
│   │       │   ├── testimonials
│   │       │   ├── faqs
│   │       │   ├── leads
│   │       │   ├── media
│   │       │   ├── themes
│   │       │   └── publishing
│   │       ├── routes
│   │       ├── utils
│   │       ├── app.ts
│   │       └── server.ts
│   │
│   └── frontend
│       │
│       └── src
│           ├── app
│           ├── components
│           │   └── ui
│           ├── features
│           │   ├── auth
│           │   ├── organization
│           │   ├── website
│           │   ├── products
│           │   ├── gallery
│           │   ├── testimonials
│           │   ├── faq
│           │   ├── leads
│           │   ├── media
│           │   └── themes
│           ├── hooks
│           ├── lib
│           ├── providers
│           ├── types
│           └── styles
│
├── packages
│   ├── database
│   ├── shared
│   ├── validation
│   └── eslint-config
│
├── docs
├── infrastructure
└── .github
```

This document is the **baseline coding contract**. Future implementation work should extend this structure rather than invent a new organizational pattern for each feature.
