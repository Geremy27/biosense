# Design System (standard Tailwind)

> Visual reference for the Health EMR app: clean healthcare SaaS with dark cyan headings, teal accents, soft aurora gradients, glassy navigation, and softly rounded buttons.
>
> **For Cursor:** Use **only built-in Tailwind utilities**. Design tokens are mapped to the nearest standard Tailwind class. Reuse component classes from `app/app.css` when possible.

---

## Rounding guide

Design tokens use precise pixel values in the source palette. We map them to the closest standard Tailwind class:

| Token              | Nearest Tailwind           | Notes                    |
| ------------------ | -------------------------- | ------------------------ |
| Navy `#0C3651`     | `cyan-950`                 | Headings, nav            |
| Teal `#0891B2`     | `cyan-600`                 | Exact match              |
| Body `#334155`     | `slate-700`                | Exact match              |
| Muted `#64748B`    | `slate-500`                | Exact match              |
| Light bg `#F2F6F8` | `slate-100`                | Inset panels             |
| Success `#0F766E`  | `teal-700`                 | Exact match              |
| Container 1412px   | `max-w-7xl`                | 1280px — close enough    |
| Padding 66px       | `px-16`                    | 64px                     |
| Hero 56px          | `text-5xl` / `md:text-6xl` | 48px / 60px              |
| Section 40px       | `text-4xl`                 | 36px                     |
| Eyebrow 11px       | `text-xs`                  | 12px                     |
| Card shadow        | `shadow-sm` / `shadow-lg`  | Skip custom rgba shadows |
| Aurora blur 110px  | `blur-3xl`                 | 64px — good enough       |

---

## Design philosophy

| Principle          | Tailwind approach                                                     |
| ------------------ | --------------------------------------------------------------------- |
| **Clinical trust** | `text-cyan-950` headings, restrained `slate-*` neutrals               |
| **AI / modern**    | `text-cyan-600` accents, `bg-purple-300` / `bg-cyan-200` aurora blobs |
| **Readable**       | Open Sans, `leading-relaxed`, clear size scale                        |
| **Spacious**       | `max-w-7xl`, `py-16`, `gap-12`                                        |
| **Soft depth**     | `shadow-sm` / `shadow-lg`, `rounded-xl` cards, `rounded-lg` buttons   |

---

## Colors

Use these Tailwind palettes only — no custom `@theme` colors.

| Role           | Class                          | When to use                             |
| -------------- | ------------------------------ | --------------------------------------- |
| Heading        | `text-cyan-950`                | H1–H3, labels, nav links                |
| Accent         | `text-cyan-600`                | Eyebrows, link hover, badges            |
| Body           | `text-slate-700`               | Paragraphs, form values                 |
| Muted          | `text-slate-500`               | Subtitles, helper text                  |
| Faint          | `text-slate-400`               | Footer labels, placeholders             |
| Surface        | `bg-white`                     | Default background                      |
| Inset          | `bg-slate-100`                 | Query boxes, code blocks                |
| Accent surface | `bg-cyan-50`                   | Badge backgrounds, highlights           |
| Border         | `border-slate-200`             | Cards, inputs                           |
| Accent border  | `border-cyan-200`              | Header rule, elevated cards             |
| Primary CTA    | `bg-slate-700`                 | Buttons — slate fill, not teal |
| Success        | `text-teal-700` / `bg-teal-50` | Validation, positive states             |

### Aurora blobs (decorative only)

```tsx
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
  <div className="absolute -top-72 -left-48 size-96 rounded-full bg-purple-300 opacity-20 blur-3xl" />
  <div className="absolute -top-32 right-0 size-80 rounded-full bg-cyan-200 opacity-25 blur-3xl" />
  <div className="absolute inset-0 bg-linear-to-b from-white/10 via-white/60 to-white" />
</div>
```

Or use the `.aurora-bg` component class from `app/app.css`.

### Gradients (standard only)

| Use           | Classes                                                |
| ------------- | ------------------------------------------------------ |
| Section wash  | `bg-gradient-to-b from-white via-blue-50 to-white`     |
| Aurora fade   | `bg-gradient-to-b from-white/10 via-white/60 to-white` |
| Nav highlight | `bg-gradient-to-br from-cyan-50 to-blue-50`            |

---

## Typography

**Font:** Open Sans via `font-sans` in `app/root.tsx`.

| Role         | Classes                                                                          |
| ------------ | -------------------------------------------------------------------------------- |
| Hero H1      | `text-5xl md:text-6xl font-extrabold text-cyan-950 leading-tight tracking-tight` |
| Page H1      | `text-5xl font-extrabold text-cyan-950 leading-tight tracking-tight`             |
| App page title | `text-2xl font-bold text-cyan-950 tracking-tight` (`PageHeader`)               |
| Section H2   | `text-4xl font-bold text-cyan-950 leading-tight`                                 |
| Card H3      | `text-2xl font-bold text-cyan-950 leading-snug`                                  |
| Card title   | `text-lg font-semibold text-cyan-950`                                            |
| Hero body    | `text-lg text-slate-700 leading-relaxed`                                         |
| Body         | `text-base text-slate-700 leading-relaxed`                                       |
| Small        | `text-sm text-slate-500 leading-relaxed`                                         |
| Nav link     | `text-sm font-semibold text-cyan-950 hover:text-cyan-600 transition-colors`      |
| Eyebrow      | `text-xs font-bold uppercase tracking-widest text-cyan-600`                      |
| Footer label | `text-xs font-semibold uppercase tracking-widest text-slate-400`                 |

**Global defaults:** `font-sans text-slate-700 antialiased bg-white`

---

## Layout

| Element            | Classes                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| Page container     | `page-shell` → `mx-auto max-w-7xl px-5 md:px-16`                               |
| Section padding    | `py-16`                                                                        |
| Section header gap | `mb-12`                                                                        |
| Two-column         | `grid lg:grid-cols-2 gap-12 items-center`                                      |
| Card grid          | `grid gap-6 sm:grid-cols-2`                                                    |
| Header             | `sticky top-0 z-50 h-16 border-b border-cyan-200 bg-white/90 backdrop-blur-xl` |
| Scroll offset      | `scroll-mt-16`                                                                 |

---

## Components

Reusable classes live in `app/app.css`. Prefer them over repeating utilities.

### Buttons

App UI buttons use **soft corners**, not pill shapes. Default to `rounded-lg` for all actions in this app.

**Primary** (slate):

```
btn-primary
```

Equivalent: `inline-flex items-center rounded-lg bg-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 hover:shadow-lg hover:-translate-y-px transition-all duration-150`

**Ghost** (outline):

```
btn-ghost
```

Equivalent: `inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-cyan-950 hover:bg-slate-50 hover:border-slate-400 transition-all duration-150`

**Ghost on dark backgrounds:**

`rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10`

**Teal outline** (secondary):

`rounded-lg border border-teal-700/30 bg-white px-5 py-2 text-sm font-semibold text-teal-700 hover:border-teal-700 hover:shadow-md`

**Small / compact:** `rounded-md px-3 py-1.5 text-sm`

**Marketing-only pill** (landing pages, not app UI): `rounded-full` — do not use in admin/EMR screens.

### Eyebrow

```
eyebrow
```

### Badges

**Category:** `inline-flex items-center rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-600`

**Pill status:** `inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold`

### Cards

**Standard:** `card` → `rounded-xl bg-white p-6 shadow-sm`

**Elevated:** `card-elevated` → `rounded-xl border border-cyan-100 bg-white p-8 shadow-lg`

**Inset panel:** `rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-500 leading-relaxed`

### Forms

**Input:** `input`

**Label:** `label`

**Error:** `rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700`

### Navigation

```
sticky top-0 z-50 h-16 border-b border-cyan-200 bg-white/90 backdrop-blur-xl
```

Nav link: `px-3 py-1.5 text-sm font-semibold text-cyan-950 hover:text-cyan-600 transition-colors`

Header divider: `border-l border-slate-200 pl-5`

Dropdown: `absolute mt-2 rounded-xl bg-white p-2 shadow-lg`

Dropdown row: `rounded-lg px-2 py-2 hover:bg-slate-50`

### Sidebar (app shell)

Used in admin and provider portals via `AppSidebarLayout`.

| Element | Classes / component |
| ------- | ------------------- |
| Shell | `border-r border-cyan-200 bg-white` |
| Nav link | `admin-sidebar-link` |
| Active nav | `admin-sidebar-link-active` — adds `border-l-2 border-cyan-600 bg-cyan-50 text-cyan-700` |
| Collapsed nav | `admin-sidebar-link-collapsed` — removes left border |
| Content area | `admin-content` — gradient background + padding |
| User block | `rounded-lg bg-slate-50 px-3 py-3` with optional org subtitle in `text-cyan-600` |

**Portal branding:**

| Portal | Eyebrow | Title |
| ------ | ------- | ----- |
| Admin | Administración | Health EMR |
| Provider | Consultorio | Health EMR |

### Page header

Use `PageHeader` on every app screen — list pages, dashboards, and forms.

```tsx
<PageHeader
  eyebrow="Consultorio"
  title="Pacientes"
  description="Optional subtitle"
  headingLevel="h1" // dashboards only
  actions={<Link to="..." className="btn-primary">Nuevo paciente</Link>}
/>
```

- Dashboards: `headingLevel="h1"`, no wrapper card — header sits on the gradient background.
- List pages: include `actions` for the primary CTA (e.g. “Nuevo usuario”).
- Forms: pair with `Breadcrumbs` above the header.
- Title size: `text-2xl font-bold text-cyan-950` (app screens — not marketing hero scale).

### Breadcrumbs

Use on form and detail pages for wayfinding:

```tsx
<Breadcrumbs
  items={[
    { label: 'Panel', to: '/provider' },
    { label: 'Pacientes', to: '/provider/patients' },
    { label: 'Nuevo paciente' },
  ]}
/>
```

Classes: `text-sm text-slate-500`, current page `font-semibold text-cyan-950`, links `hover:text-cyan-600`.

### Stat cards

Use `StatCard` for dashboard metrics. Linked cards use `stat-card-interactive` (hover lift + shadow).

```tsx
<StatCard label="Pacientes" value={12} to="/provider/patients" icon={Users} />
<StatCard label="Consultas" value="—" icon={Calendar} comingSoon />
```

- Include a Lucide icon in the `icon-container` (`size-12 rounded-xl bg-cyan-50`).
- Linked cards show “Ver detalle →” in `text-cyan-600`.
- Placeholder metrics: `comingSoon` prop renders muted “Próximamente” card at `opacity-60`.
- Dashboard grids: `sm:grid-cols-2` until enough metrics exist.

### Data tables

Reusable classes in `app/app.css`:

| Element | Class |
| ------- | ----- |
| Table | `data-table` |
| Header row | `data-table-head` — `text-xs uppercase tracking-wider text-slate-500 bg-slate-50` |
| Header cell | `data-table-th` |
| Body row | `data-table-row` — `hover:bg-slate-50/80 transition-colors` |
| Body cell | `data-table-td` |
| Wrapper | `card overflow-hidden p-0` |

Row name column: `font-medium text-cyan-950`. Secondary columns: `text-slate-600`.

Action links in last column: `font-semibold text-cyan-600 hover:text-cyan-800`.

### Empty states

Do **not** show empty messages inside table rows. Use `EmptyState` instead:

```tsx
<EmptyState
  icon={Users}
  title="Aún no tienes pacientes registrados"
  description="Registra tu primer paciente para comenzar."
  action={<Link to="..." className="btn-primary">Registrar primer paciente</Link>}
/>
```

Class: `empty-state` — centered card with `icon-container`, title, description, and optional CTA.

### Filter tabs

Use `FilterTabs` for list page filters (e.g. user roles):

```tsx
<FilterTabs tabs={[{ label: 'Todos', href: '/admin/users', isActive: true }, ...]} />
```

Classes: `filter-tab` (inactive), `filter-tab-active` (matches sidebar active styling).

### Status badges

Pill badges for roles and states:

| Variant | Class | Use |
| ------- | ----- | --- |
| Provider | `badge-role-provider` | `bg-cyan-50 text-cyan-600` |
| Admin | `badge-role-admin` | `bg-slate-100 text-slate-600` |
| Active | `badge-status-active` | `bg-teal-50 text-teal-700` |
| Inactive | `badge-status-inactive` | `bg-slate-100 text-slate-400` |

Base: `badge-pill` → `inline-flex rounded-full px-3 py-1 text-xs font-semibold`.

Use `RoleBadge` component for user role columns in tables.

### Login pages

Use `LoginPageShell` with aurora background and `card-elevated`. Include cross-portal footer:

```tsx
<LoginPageShell
  eyebrow="Portal de prestadores"
  title="Iniciar sesión"
  description="..."
  footer={
    <p className="text-center text-sm text-slate-500">
      ¿Eres administrador?{' '}
      <Link to="/admin/login" className="font-semibold text-cyan-600 hover:text-cyan-800">
        Ir al portal de administración
      </Link>
    </p>
  }
>
```

Footer sits below a `border-t border-slate-100` divider inside the card.

### Feature list (dot bullets)

```html
<ul class="space-y-1">
  <li
    class="relative pl-5 text-sm text-slate-700 leading-relaxed before:absolute before:left-0 before:top-2.5 before:size-1.5 before:rounded-full before:bg-cyan-600"
  >
    Item text
  </li>
</ul>
```

### Icon container

`icon-container` → `flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50`

Used in stat cards, empty states, and feature lists.

### Footer

`border-t border-cyan-200 bg-white py-16`

Column headings: `text-xs font-semibold uppercase tracking-widest text-slate-400`

Links: `text-sm text-slate-600 hover:text-cyan-950`

---

## Hero pattern

```tsx
<section className="relative flex min-h-screen items-center overflow-hidden bg-white pt-16">
  <div className="aurora-bg" aria-hidden />
  <div
    className="absolute inset-0 bg-linear-to-b from-white/10 via-white/60 to-white"
    aria-hidden
  />

  <div className="page-shell relative z-10 w-full">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      {/* eyebrow + h1 + body + btn-primary */}
      {/* card-elevated panel */}
    </div>
  </div>
</section>
```

---

## Motion

| Pattern          | Classes                                                              |
| ---------------- | -------------------------------------------------------------------- |
| Hover lift       | `hover:-translate-y-px`                                              |
| Card hover       | `hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200` |
| Color transition | `transition-colors duration-150`                                     |
| General          | `transition-all duration-150` or `duration-200`                      |

---

## Shadows & radius

| Use                      | Class                           |
| ------------------------ | ------------------------------- |
| Button                   | `shadow-md` → hover `shadow-lg` |
| Card                     | `shadow-sm`                     |
| Elevated card / dropdown | `shadow-lg`                     |
| Hero panel               | `shadow-xl`                     |
| Buttons (app UI)         | `rounded-lg`                    |
| Buttons (compact)        | `rounded-md`                    |
| Status badges            | `rounded-full`                  |
| Cards                    | `rounded-xl`                    |
| Large panels             | `rounded-2xl`                   |
| Inputs / rows            | `rounded-lg`                    |

---

## Do / Don't

**Do**

- Use `cyan-950` + `cyan-600` + `slate-*` only
- Use `shadow-sm` / `shadow-md` / `shadow-lg` — not arbitrary shadows
- Use `rounded-lg` buttons in app UI (`btn-primary`, `btn-ghost`)
- Reuse `.btn-primary`, `.card`, `.page-shell`, etc. from `app/app.css`
- Use `PageHeader` on every screen; pair with `Breadcrumbs` on forms
- Use `EmptyState` instead of empty table rows
- Use `RoleBadge` / `StatusBadge` for role and status columns
- Reserve `card-elevated` for login, success states — not dashboard intros

**Don't**

- Use arbitrary values: `text-[56px]`, `max-w-[1412px]`, `shadow-[0_2px_8px_…]`
- Use custom `@theme` colors — only `font-sans` is customized
- Use teal/cyan as primary button fill
- Use dark mode by default
- Use Inter — stick to Open Sans
- Wrap dashboard welcome text in `card-elevated`
- Hand-roll page headers — use `PageHeader` component
- Use `@apply card` (or any custom component class) inside another `@layer components` rule — Tailwind v4 only allows `@apply` with utility classes; inline the utilities instead

---

## File map

| File                              | Purpose                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| `app/app.css`                     | `font-sans` theme + component classes (standard `@apply` only) |
| `app/root.tsx`                    | Open Sans font link                                            |
| `app/components/ui/page-header.tsx` | Page title + actions toolbar                                 |
| `app/components/ui/stat-card.tsx` | Dashboard metric cards                                       |
| `app/components/ui/breadcrumbs.tsx` | Form/detail wayfinding                                     |
| `app/components/ui/empty-state.tsx` | List empty states with CTA                                 |
| `app/components/ui/filter-tabs.tsx` | List page filter tabs                                      |
| `app/components/ui/status-badge.tsx` | Role and status pill badges                               |
| `app/components/layout/app-sidebar-layout.tsx` | Admin/provider sidebar shell                  |
| `app/components/auth/login-page-shell.tsx` | Login card with aurora background              |
| `docs/design-system.md`           | This reference                                                 |
| `.cursor/rules/design-system.mdc` | Cursor rule pointing here                                      |
