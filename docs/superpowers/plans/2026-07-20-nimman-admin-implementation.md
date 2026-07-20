# Nimman Foto Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. In this session the sub-skill is unavailable, so the primary agent executes the same gates inline.

**Goal:** Rebuild the authenticated Nimman Foto admin workspace as a compact, responsive minimal-luxury dashboard without changing existing data, authentication, API, RPC, storage, or booking behavior.

**Architecture:** Keep `/admin` as a dynamic Server Component that owns every existing Supabase query. Add a reusable client-side admin shell at the route layout boundary, pass display-only values into focused presentation/form components, and centralize the admin visual system under `.admin-shell` CSS tokens.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript 5, Tailwind CSS 4, Supabase JS 2.110.7, Lucide React, Recharts, Vitest, Playwright, Vercel/GitHub deployment workflow.

## Global Constraints

- Modify only admin presentation code, admin tests, and design/plan documents.
- Preserve `requireAdmin()`, `AdminGuard`, every existing Supabase query/RPC/storage call, server-action validation, API route, database schema, and customer booking behavior.
- Use only live values returned by existing data sources; never hardcode dashboard metrics or health state.
- Do not mutate Production data during tests or smoke checks; QR upload and password mutations run only against disposable local/test infrastructure.
- Add no UI framework or large dependency; reuse LINE Seed Sans TH, Tailwind, Lucide, Recharts, Vitest, and Playwright.
- Support 1440px, 1280px, 768px, 390px, and 360px without page-level horizontal overflow.
- Keep the rollback tag `admin-dashboard-pre-redesign-20260720` and use the existing GitHub/Vercel workflow.

---

### Task 1: Lock navigation and display contracts

**Files:**
- Create: `lib/admin-navigation.ts`
- Create: `lib/admin-dashboard.ts`
- Modify: `tests/admin-navigation.test.ts`
- Create: `tests/unit/admin-dashboard.test.ts`

**Interfaces:**
- Produces `ADMIN_NAVIGATION`, `AdminNavigationItem`, `isAdminNavigationActive(pathname, href)`, `ADMIN_SECTION_IDS`, `getAdminStatusPresentation(status)`, and `getOperationalStatus(count)`.
- Consumed by `AdminSidebar`, `StatusBadge`, and `AdminStatusBanner`.

- [ ] **Step 1: Write failing contract tests**

```ts
expect(ADMIN_NAVIGATION.map(({ label, href }) => ({ label, href }))).toEqual([
  { label: "แดชบอร์ด", href: "/admin" },
  { label: "ปฏิทินคิว", href: "/admin/calendar" },
  { label: "ช่องทางติดต่อ", href: "/admin#portfolio" },
  { label: "การรับชำระเงิน", href: "/admin#payments" },
  { label: "ความปลอดภัย", href: "/admin#security" },
  { label: "รายการจอง", href: "/admin#bookings" },
]);
expect(getOperationalStatus(0).tone).toBe("success");
expect(getOperationalStatus(2).tone).toBe("warning");
expect(getAdminStatusPresentation("confirmed").label).toBe("ยืนยันแล้ว");
```

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/admin-navigation.test.ts tests/unit/admin-dashboard.test.ts`

Expected: FAIL because `lib/admin-navigation.ts` and `lib/admin-dashboard.ts` do not exist.

- [ ] **Step 3: Implement the typed pure modules**

```ts
export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: "dashboard" | "calendar" | "portfolio" | "payment" | "security" | "bookings";
};

export function isAdminNavigationActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}
```

`getOperationalStatus` must derive its tone and copy solely from the failed-notification count. Status presentation must cover `draft`, `pending`, `paid`, `confirmed`, `completed`, `cancelled`, and an unknown fallback.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- tests/admin-navigation.test.ts tests/unit/admin-dashboard.test.ts`

Expected: both files pass with zero failures.

- [ ] **Step 5: Commit**

Run: `git add lib/admin-navigation.ts lib/admin-dashboard.ts tests/admin-navigation.test.ts tests/unit/admin-dashboard.test.ts && git commit -m "test: lock admin dashboard contracts"`

### Task 2: Add the responsive authenticated shell

**Files:**
- Create: `components/admin/AdminShell.tsx`
- Create: `components/admin/AdminSidebar.tsx`
- Modify: `components/admin/LogoutButton.tsx`
- Modify: `app/admin/layout.tsx`
- Modify: `app/globals.css`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- `AdminShell({ children }: { children: React.ReactNode })` owns mobile drawer state and renders the shared rail/top bar.
- `AdminSidebar({ pathname, onNavigate? })` consumes `ADMIN_NAVIGATION` and renders `LogoutButton`.
- `app/admin/layout.tsx` must continue to await `requireAdmin()` before rendering `AdminGuard` and `AdminShell`.

- [ ] **Step 1: Add failing browser assertions**

```ts
await expect(page.getByRole("navigation", { name: "เมนูผู้ดูแลระบบ" })).toBeVisible();
await expect(page.getByText("NIMMAN FOTO")).toBeVisible();
expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
```

At 390px assert the menu button opens an accessible dialog/drawer and Escape closes it.

- [ ] **Step 2: Confirm RED against the authenticated local fixture**

Run: `npm run test:e2e -- --grep "admin shell"`

Expected: FAIL because the navigation rail and drawer do not exist.

- [ ] **Step 3: Implement the shell**

Use a client boundary only in `AdminShell`/`AdminSidebar`; keep authorization server-side. Desktop uses `lg:grid-cols-[240px_minmax(0,1fr)]`; mobile uses a fixed top bar and modal backdrop. Escape closes the drawer, navigation closes it, the close button has `aria-label="ปิดเมนู"`, and the main content has `min-w-0`.

Add `.admin-shell` variables:

```css
.admin-shell {
  --admin-bg: #f7f4ee;
  --admin-surface: #ffffff;
  --admin-surface-muted: #faf8f4;
  --admin-text: #211e1a;
  --admin-muted: #7b746b;
  --admin-sidebar: #201d19;
  --admin-accent: #806342;
  --admin-border: #e8e2d9;
  --admin-radius: 16px;
  background: var(--admin-bg);
  color: var(--admin-text);
}
```

- [ ] **Step 4: Verify shell behavior**

Run the focused e2e check, then `npm run typecheck` and `npm run lint`.

- [ ] **Step 5: Commit**

Run: `git add components/admin/AdminShell.tsx components/admin/AdminSidebar.tsx components/admin/LogoutButton.tsx app/admin/layout.tsx app/globals.css tests/e2e/smoke.spec.ts && git commit -m "feat: add responsive admin shell"`

### Task 3: Recompose the live dashboard

**Files:**
- Create: `components/admin/AdminHeader.tsx`
- Create: `components/admin/AdminStatusBanner.tsx`
- Create: `components/admin/AdminQuickActions.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/StatCard.tsx`
- Modify: `app/admin/RevenueChart.tsx`
- Modify: `app/admin/RecentBookings.tsx`
- Modify: `app/admin/AdminTable.tsx`
- Modify: `app/admin/StatusBadge.tsx`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- `AdminStatusBanner({ failedNotifications, retentionDays })` uses `getOperationalStatus`.
- `StatCard` accepts semantic `tone: "neutral" | "success" | "warning" | "danger" | "info"` instead of arbitrary color classes.
- `RevenueChart({ data, totalRevenue, confirmedCount })` remains a client component and receives existing analytics values.
- `RecentBookings` links “ดูทั้งหมด” to `#bookings`.

- [ ] **Step 1: Add failing dashboard assertions**

Assert seven metric labels, `#portfolio`, `#payments`, `#security`, `#revenue`, `#recent-bookings`, `#bookings`, status banner text, existing search/status filters, pagination, and detail links.

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "admin dashboard"`

Expected: FAIL because the new semantic structure and section IDs are absent.

- [ ] **Step 3: Implement the presentation split**

Leave `createAdminClient()`, `.from(...)`, `.rpc(...)`, `.range(...)`, signed URL creation, environment parsing, and error checks byte-for-byte equivalent. Replace only JSX composition. Use a six-column desktop metric grid with the seventh card wrapping naturally, 3–4 columns on tablet, and two columns at phone widths. The quick-actions card may contain only the public booking link, refresh, CSV export, and health/operations anchor already backed by existing behavior.

The chart retains its existing dataset and adds readable Thai currency tooltip formatting. The desktop table scrolls only inside its wrapper; the phone layout continues to show all required fields as cards.

- [ ] **Step 4: Verify**

Run focused unit/e2e checks, `npm run typecheck`, and `npm run lint`.

- [ ] **Step 5: Commit**

Run: `git add components/admin/AdminHeader.tsx components/admin/AdminStatusBanner.tsx components/admin/AdminQuickActions.tsx app/admin/page.tsx app/admin/StatCard.tsx app/admin/RevenueChart.tsx app/admin/RecentBookings.tsx app/admin/AdminTable.tsx app/admin/StatusBadge.tsx tests/e2e/smoke.spec.ts && git commit -m "feat: recompose live admin dashboard"`

### Task 4: Add safe action feedback and client validation

**Files:**
- Create: `components/admin/AdminSubmitButton.tsx`
- Create: `components/admin/PortfolioSettingsForm.tsx`
- Create: `components/admin/PromptPaySettingsForm.tsx`
- Modify: `components/admin/ChangePasswordForm.tsx`
- Modify: `app/admin/page.tsx`
- Create: `tests/unit/admin-form-state.test.ts`

**Interfaces:**
- Each form receives the existing server action as an import and does not alter its parameters or mutation logic.
- `AdminSubmitButton({ idleLabel, pendingLabel, icon })` reads `useFormStatus()` and prevents double submission.
- Form feedback is `{ tone: "idle" | "success" | "error"; message: string }` rendered with `aria-live="polite"`.

- [ ] **Step 1: Write failing validation tests**

```ts
expect(validatePasswordConfirmation("StrongPassword1!", "different")).toBe("mismatch");
expect(validatePasswordConfirmation("StrongPassword1!", "StrongPassword1!")).toBeNull();
expect(describeSelectedFile(undefined)).toBe("ยังไม่ได้เลือกไฟล์");
expect(describeSelectedFile("promptpay.png")).toBe("promptpay.png");
```

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/unit/admin-form-state.test.ts`

Expected: FAIL because the pure helpers are absent.

- [ ] **Step 3: Implement forms and helpers**

Portfolio fields keep `instagramUrl` and `facebookUrl`. Payment keeps `promptpayNumber` and `promptpayQr`, `accept="image/jpeg,image/png"`, and the existing 3 MB server validation. Password keeps the current policy function/server action, adds show/hide buttons with accessible labels, checks confirmation before calling the action, and clears password fields after success.

Never call the actions during unit/browser checks against Production. Interaction tests use local disposable infrastructure or validate client behavior before submission.

- [ ] **Step 4: Run GREEN and regression checks**

Run the focused unit test, full unit test suite, typecheck, and lint.

- [ ] **Step 5: Commit**

Run: `git add components/admin/AdminSubmitButton.tsx components/admin/PortfolioSettingsForm.tsx components/admin/PromptPaySettingsForm.tsx components/admin/ChangePasswordForm.tsx app/admin/page.tsx tests/unit/admin-form-state.test.ts && git commit -m "feat: add safe admin form feedback"`

### Task 5: Bring calendar and booking detail into the shell

**Files:**
- Modify: `app/admin/calendar/page.tsx`
- Modify: `app/admin/bookings/[id]/page.tsx`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Both routes inherit `AdminShell` from `app/admin/layout.tsx`.
- Calendar continues to submit to `blockCalendarSlot` and `blockCalendarDay` with the same hidden field names.
- Booking detail continues to use the same status action and detail data query.

- [ ] **Step 1: Add failing route assertions**

Assert the shared sidebar/top bar, page heading, existing calendar controls, booking fields, and status actions at desktop and phone widths.

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e -- --grep "admin calendar|admin booking detail"`.

- [ ] **Step 3: Remove duplicate page framing and apply shared tokens**

Do not change query construction, mutation actions, hidden field names, or capacity calculations. Replace only outer backgrounds, max-width wrappers, typography, card borders, buttons, and responsive grids.

- [ ] **Step 4: Run focused verification**

Run the focused e2e check, typecheck, and lint.

- [ ] **Step 5: Commit**

Run: `git add app/admin/calendar/page.tsx app/admin/bookings/[id]/page.tsx tests/e2e/smoke.spec.ts && git commit -m "style: align admin subpages with dashboard shell"`

### Task 6: Full verification, publication, deployment, and rollback gate

**Files:**
- Review all modified files; do not create deployment configuration unless the existing workflow requires a targeted correction.

**Interfaces:**
- GitHub checks must build the exact committed branch.
- Vercel production must deploy from the existing integration.
- Rollback target is the deployment corresponding to tag `admin-dashboard-pre-redesign-20260720`.

- [ ] **Step 1: Run local quality gates**

Run in order:

```text
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run test:e2e
```

Integration/e2e tests that require unavailable disposable infrastructure must be reported as blocked rather than redirected to Production.

- [ ] **Step 2: Perform visual/accessibility review**

Start the existing dev server, run the required agent-browser verification, and capture 1440px, 1280px, 768px, 390px, and 360px screenshots. Confirm no error overlay, page-level horizontal overflow, clipped text, inaccessible drawer, hidden booking fields, or unreadable chart/table labels.

- [ ] **Step 3: Review the final diff**

Confirm no `supabase/migrations`, API routes, lockfile, customer booking components, secrets, generated output, or unrelated files changed. Run `git diff --check` and a secret-pattern scan that prints file names only.

- [ ] **Step 4: Publish through the existing workflow**

Commit the verified implementation, push `codex/admin-dashboard-redesign`, open a pull request, and wait for required GitHub checks. Merge only after every required check passes.

- [ ] **Step 5: Run read-only Production smoke checks**

Verify the production URL and deployment status, `/admin` authentication boundary, `/booking`, security headers, read-only API health, and recent Vercel runtime error logs. Do not submit forms or mutate data.

- [ ] **Step 6: Roll back on any smoke failure**

If any post-deploy smoke check fails, immediately promote/redeploy the deployment corresponding to `admin-dashboard-pre-redesign-20260720`, re-run the read-only smoke suite, and report both failure and rollback evidence.
