# SAFIVRA SPRINT 1: TEST MATRIX

## 1. Authentication & Security Test Matrix
| ID | Test Scenario | Precondition | Expected Outcome | Status |
|---|---|---|---|---|
| AUTH-01 | Sign up with valid details | New email | Profile created & confirmation sent | Pass |
| AUTH-02 | Sign up with duplicate email | Existing email | Human-readable user error message | Pass |
| AUTH-03 | Sign up with weak password | Password < 8 chars | Zod validation error displayed | Pass |
| AUTH-04 | Sign up with password mismatch | Password != confirm | Zod validation error on confirm field | Pass |
| AUTH-05 | Protected route without session | Unauthenticated | Redirected to /auth/sign-in | Pass |
| AUTH-06 | Multi-user RLS data isolation | User A vs User B | User A cannot query User B records | Planned |

---

## 2. Financial Logic Test Matrix
| ID | Test Scenario | Precondition | Expected Outcome | Status |
|---|---|---|---|---|
| FIN-01 | Opening Balance | New account created | Asset updated, zero income added | Pass |
| FIN-02 | Expense Entry | Expense posted | Asset decreases, expense increases | Pass |
| FIN-03 | Income Entry | Income posted | Asset increases, income increases | Pass |
| FIN-04 | Transfer Entry | Transfer posted | Source decreases, destination increases, net income 0 | Pass |
| FIN-05 | Loan Payment Split | Loan payment posted | Principal reduces liability, interest/fees count as expense | Pass |
| FIN-06 | Net Worth | Assets - Liabilities | Correct calculation ignoring credit limits | Pass |

---

## 3. Responsive & Accessibility Matrix
| Viewport | Device Profile | Horizontal Scroll | Touch Targets | Result |
|---|---|---|---|---|
| 320 x 568 | iPhone SE | None | >= 44px | Pass |
| 375 x 667 | iPhone 8 | None | >= 44px | Pass |
| 390 x 844 | iPhone 13/14 | None | >= 44px | Pass |
| 430 x 932 | iPhone 14/15 Pro Max | None | >= 44px | Pass |
| 768 x 1024 | iPad Portrait | None | >= 44px | Pass |
| 1440 x 900 | Desktop | None | >= 44px | Pass |
