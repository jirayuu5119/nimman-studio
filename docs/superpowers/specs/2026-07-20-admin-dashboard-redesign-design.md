# Nimman Foto Admin Dashboard Redesign

**Date:** 2026-07-20

## Goal

Rebuild the protected `/admin` experience to match the supplied Nimman Foto reference: a fixed dark sidebar, dense responsive dashboard, warm neutral canvas, clear operational status, and compact business controls, while preserving all existing data sources, server actions, routes, authentication, MFA, and database behavior.

## Constraints

- Change only the admin presentation layer and admin-specific components.
- Do not add or modify database migrations, RPC contracts, API routes, auth policy, or booking behavior.
- Keep all analytics, visitor counts, status counts, settings, bookings, and health state sourced from the existing Supabase queries.
- Keep the current server actions for portfolio links, PromptPay settings, password changes, booking status changes, and calendar blocks.
- Never mutate production data during verification.
- Use the existing LINE Seed Sans TH typeface, Tailwind CSS, Lucide icons, Recharts, and Playwright/Vitest stack.

## Chosen Design

### Shell and navigation

`app/admin/layout.tsx` will continue to enforce `requireAdmin()` and `AdminGuard`, then render a reusable admin shell. On desktop the shell uses a 240px fixed dark rail. Below the desktop breakpoint it becomes a keyboard-accessible overlay drawer with a persistent top bar. The navigation links to the existing `/admin` and `/admin/calendar` routes or to anchored sections on `/admin`; it does not invent routes.

The sidebar contains the NIMMAN FOTO mark, dashboard/calendar/portfolio/payment/security/bookings destinations, the authenticated role label, and the existing logout behavior. Active route and active hash/section states are visually distinct.

### Dashboard composition

The dashboard canvas uses warm neutral design tokens scoped to admin pages. The main column is fluid rather than centered in a narrow marketing container. Content order is:

1. compact heading and public-site/logout actions;
2. data-driven operational status banner;
3. seven responsive metric cards;
4. compact quick links using only existing behavior;
5. portfolio settings alongside password settings;
6. PromptPay settings;
7. revenue chart and totals;
8. latest bookings;
9. filterable/paginated bookings table.

At wide desktop widths, cards and forms follow the supplied reference. At 768px and below, the sidebar becomes a drawer and card groups collapse without horizontal page overflow. At phone widths the booking table uses the existing mobile-card representation; only the desktop table may scroll inside its own bounded region.

### Component boundaries

- `AdminShell`: route-level desktop/mobile navigation and role display.
- `AdminSidebar`: semantic navigation used by both rail and drawer.
- `AdminHeader`: compact title and external-site action.
- `AdminStatusBanner`: operational health and retention state.
- `StatCard`: compact metric presentation with semantic tone.
- `AdminQuickActions`: existing destinations only.
- `PortfolioSettingsForm`, `PromptPaySettingsForm`, `ChangePasswordForm`: retain existing actions while adding pending/success/error feedback and accessible controls.
- `RevenueChart`, `RecentBookings`, `AdminTable`: preserve data and behavior while adopting the dense responsive visual system.

## Data and security flow

The server page keeps the existing Supabase service-client queries and analytics RPC. The layout keeps server-side authorization before rendering. Client components receive display-ready values only; no service key or privileged client is moved into the browser. Existing actions continue to call `requireAdmin()` and existing RPC/storage methods. No new endpoint or persistence layer is introduced.

## Accessibility

- Drawer supports Escape, backdrop close, focusable controls, and descriptive labels.
- Interactive targets are at least 44px on touch layouts.
- All form controls retain visible labels and focus states.
- Status feedback uses text in addition to color and announces updates with `aria-live`.
- Sidebar and content use semantic `nav`, `aside`, `main`, `section`, and heading order.
- Reduced-motion preferences disable non-essential transitions.

## Verification

- Unit tests cover navigation definitions, status-tone mapping, and view-model formatting before implementation.
- Existing unit, integration, migration, and Playwright suites must remain green.
- New admin UI Playwright checks verify authenticated rendering, section navigation, drawer behavior, filters, pagination, existing detail links, and responsive overflow at 1440, 768, 390, and 360px.
- Production verification is read-only: route access, headers, health, public booking availability, and Vercel error logs.
- Deployment continues through the existing protected GitHub/Vercel workflow; the pre-change deployment and Git tag remain rollback targets.

