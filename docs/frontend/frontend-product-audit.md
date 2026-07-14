# Frontend Product Audit & UX Architecture Report

## 1. User Experience

### 1.1 Unstructured Empty States
- **Severity:** High
- **User impact:** Users arriving at empty lists (e.g. Orders or Requests) see no guidance, resulting in confusion or perceived application errors.
- **Screenshot location:** `/portal/customer/requests/page.tsx`, `/portal/customer/orders/page.tsx`
- **Recommended improvement:** Introduce dedicated `EmptyState` components with illustrative icons (e.g., Lucide React icons) and primary CTAs (e.g., "Create your first request").
- **Estimated effort:** Low

### 1.2 Disjointed Post-Quote Conversion Flow
- **Severity:** High
- **User impact:** Customers approving a quote have no automatic bridge to the Checkout or Cart page. This creates friction at the most critical revenue-generating step.
- **Screenshot location:** `/portal/customer/requests/[id]/quotes/page.tsx`
- **Recommended improvement:** Upon quote approval, display a success modal with an immediate primary CTA routing the user to `/portal/customer/checkout` or `/portal/customer/cart`.
- **Estimated effort:** Medium

## 2. Information Architecture

### 2.1 Low-Utility Customer Dashboard
- **Severity:** Medium
- **User impact:** The dashboard only shows aggregate numbers (e.g. "5 Requests"). Users cannot see immediate next steps or actionable items (like "1 Quote pending approval").
- **Screenshot location:** `/portal/customer/page.tsx`
- **Recommended improvement:** Redesign dashboard to focus on "Action Required" items. Add an activity timeline.
- **Estimated effort:** High

### 2.2 Rigid Portal Navigation Hierarchy
- **Severity:** Low
- **User impact:** Navigation is a flat list. As features grow, the sidebar becomes overwhelming.
- **Screenshot location:** `src/layouts/PortalLayouts.tsx`
- **Recommended improvement:** Group sidebar items logically into "Commerce" (Shop, Cart, Orders), "Support" (Requests, Notifications), and "Account" (Settings).
- **Estimated effort:** Low

## 3. Visual Quality

### 3.1 Portal vs. Marketing Visual Disconnect
- **Severity:** Medium
- **User impact:** The marketing site is premium and vibrant, while the portal feels like an internal admin tool (basic cards, minimal styling). This breaks brand continuity.
- **Screenshot location:** All portal routes under `/portal/*`
- **Recommended improvement:** Inject the marketing design tokens (glassmorphism, soft gradients, rounded-2xl containers) into the portal's `PortalShell` layout and `Card` components.
- **Estimated effort:** High

## 4. Conversion Flow

### 4.1 Dead End After Public Request Submission
- **Severity:** Critical
- **User impact:** Leads submit the contact form and see a "Request Received!" message, but are left on the public page without instructions on how to track it.
- **Screenshot location:** `/contact` (QuoteForm.tsx)
- **Recommended improvement:** After submission, offer a CTA prompting them to "Create an Account to Track Your Request", feeding into an onboarding flow.
- **Estimated effort:** High

## 5. Frontend Engineering Quality

### 5.1 Binary Loading States
- **Severity:** Medium
- **User impact:** `PageState` blocks the entire screen with a spinner. This causes jarring layout shifts and poor perceived performance.
- **Screenshot location:** `src/components/auth/PortalGuards.tsx`
- **Recommended improvement:** Implement Skeleton loaders for Cards and Tables to preserve layout structure during data fetching.
- **Estimated effort:** Medium

### 5.2 Lack of Optimistic Updates
- **Severity:** Low
- **User impact:** Actions like approving a quote or updating settings feel sluggish because the UI waits for network roundtrips.
- **Screenshot location:** `useRequests.ts`, `useOrders.ts`
- **Recommended improvement:** Implement `onMutate` in React Query hooks to instantly update the local cache, providing immediate UI feedback.
- **Estimated effort:** Medium

## 6. Mobile Responsiveness

### 6.1 Intrusive Mobile Sidebar Stacking
- **Severity:** High
- **User impact:** On mobile devices, the `PortalNav` renders fully at the top of the screen, pushing all critical dashboard content below the fold.
- **Screenshot location:** `src/layouts/PortalLayouts.tsx` (mobile view)
- **Recommended improvement:** Refactor the mobile layout to use a collapsible hamburger menu or bottom tab navigation for the portal.
- **Estimated effort:** Medium

### 6.2 Table Overflow Breakages
- **Severity:** High
- **User impact:** Data tables break mobile layouts, forcing the entire page body to scroll horizontally.
- **Screenshot location:** `@entercom/design-system/src/components/Table`
- **Recommended improvement:** Wrap tables in an `overflow-x-auto` container or implement a CSS media query that converts table rows into stacked cards on mobile.
- **Estimated effort:** Low

---

## Prioritized Implementation Roadmap

Based on impact (conversion & user trust), effort, and business value:

### Phase 1: High Impact, Low Effort (Quick Wins)
1. **Unstructured Empty States (1.1):** Add `EmptyState` components to guide users when no data exists.
2. **Table Overflow Breakages (6.2):** Apply horizontal scroll wrappers to all data tables to immediately fix mobile viewports.
3. **Rigid Portal Navigation Hierarchy (2.2):** Add simple category headers to the `PortalNav` sidebar to improve scanability.

### Phase 2: High Business Value, Medium Effort (Revenue Driving)
4. **Disjointed Post-Quote Conversion Flow (1.2):** Add direct links to checkout post-quote approval to reduce drop-off during the payment step.
5. **Intrusive Mobile Sidebar Stacking (6.1):** Build a responsive hamburger menu for the portal layout, as mobile traffic is critical.
6. **Binary Loading States (5.1):** Swap full-page spinners for skeleton loaders to increase perceived performance.

### Phase 3: High Effort, Strategic Value (Long-term UX)
7. **Dead End After Public Request Submission (4.1):** Build the guest-to-authenticated onboarding bridge for lead tracking.
8. **Low-Utility Customer Dashboard (2.1):** Redesign the customer portal homepage to be action-oriented rather than data-oriented.
9. **Portal vs. Marketing Visual Disconnect (3.1):** Upgrade the internal design system to match the premium marketing aesthetic.
10. **Lack of Optimistic Updates (5.2):** Enhance React Query mutation hooks for instantaneous UI feedback.
