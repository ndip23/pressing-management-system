# Payment Flow Issues and Impact

Below are the issues identified in the payment flow and the impact of each.

## 1) Duplicate order payment routes override each other
- **Severity:** High
- **Owner:** TBD
- **Where:** `server/routes/orderRoutes.js`
- **What:** `/orders/:id/mark-paid` and `/orders/:id/payments` are registered twice.
- **Impact:** Only the last handler wins, so earlier handlers are unreachable. This can disable the “mark fully paid” and partial-payment behaviors, causing incorrect payment status updates or missing logic.

## 2) Client payment request sends an invalid payload
- **Severity:** High
- **Owner:** TBD
- **Where:** `client/src/services/api.js`, `src/api/index.js`
- **What:** `recordPartialPaymentApi` overwrites `paymentData` with a function and posts that function.
- **Impact:** The backend receives an invalid body, likely causing payment recording to fail and breaking the order payment UI.

## 3) Payment history inconsistency (payments not recorded)
- **Severity:** Medium
- **Owner:** TBD
- **Where:** `server/controllers/orderController.js`, `server/models/Order.js`, `server/controllers/paymentReportController.js`
- **What:** `recordPayment` increments `amountPaid` directly without pushing into `payments[]`.
- **Impact:** Daily payment reports omit those payments, `lastPaymentDate` stays stale, and `amountPaid` can diverge from actual payment history.

## 4) TLS verification disabled for the gateway client
- **Severity:** High
- **Owner:** TBD
- **Where:** `server/services/accountPeService.js`
- **What:** `rejectUnauthorized: false` disables SSL/TLS verification.
- **Impact:** Exposure to MITM attacks and gateway response tampering in production.

## 5) Subscription flow controller missing imports
- **Severity:** High
- **Owner:** TBD
- **Where:** `server/controllers/subscriptionController.js`
- **What:** Uses `User`, `customAlphabet`, `sendOtpEmail`, and `finalizeRegistrationLogic` without importing them.
- **Impact:** Subscription initiation/verification can crash at runtime, blocking paid signups and verification.

## 6) AccountPe webhook lacks verification and uses hard-coded plan
- **Severity:** Critical
- **Owner:** TBD
- **Where:** `server/controllers/webhookController.js`
- **What:** No signature verification; trusts raw `status === 'success'`; upgrade flow hard-codes `newPlanName = "Pro"` and infers tenantId from a split.
- **Impact:** Vulnerable to spoofed upgrades and incorrect plan assignments; upgrades can be applied without validated payment details.
