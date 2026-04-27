# Pending status for external transfers

## Goal

When a user submits an external transfer (domestic ACH or international wire), the money should be **debited from the balance immediately**, but the resulting transaction must be clearly marked **Pending** with a friendly message like:

> "Funds will arrive in the recipient's bank within 24 - 48 Hours."

Both if the transaction does not pull through the money should be credited back to the user account

Internal member-to-member transfers stay instant (they already complete on both sides).

## Current state

- `user_submit_domestic_transfer` already debits the balance and inserts the transaction with `status = 'pending'`. ✅
- `user_submit_international_transfer` debits the balance but the transaction is inserted **without a status**, so it defaults to `'completed'`. ❌ This is the main bug — international wires look completed instantly.
- The transfer success modal in `MoneyActions.tsx` shows a generic confirmation but the timing message is short and only appears for external transfers.
- The transaction details modal doesn't surface a friendly "when will this arrive" line for pending external transfers.

## Changes

### 1. Database migration — fix international transfer status

Update `public.user_submit_international_transfer` so the inserted transactions row explicitly sets `status = 'pending'` (matching the domestic flow). No schema changes — only the function body.

### 2. Success receipt modal (`src/features/dashboard/MoneyActions.tsx`)

In the external-transfer success view (`receipt.kind === "external"`):

- Replace the current short subtitle with a clear pending banner:
  > "Pending — funds were debited from your account and will arrive at the recipient's bank within **1–3 business days** (domestic) / **3–5 business days** (international)."
- Show an amber/pending pill instead of the green success check for external transfers (keep green for internal).
- Add a small helper line: "You can cancel this transfer from Recent transactions while it is still pending."

### 3. Transaction details modal (`src/features/dashboard/TransactionDetailsModal.tsx`)

When the open transaction is pending and is a domestic or international transfer, render an info banner above the existing details:

> "This transfer is being processed. Funds typically arrive at the recipient bank within 1–3 business days (domestic) or 3–5 business days (international). You can edit or cancel it while it remains pending."

### 4. Recent transactions list

No code change needed — the existing pending pill already surfaces the status. The improved DB status from step 1 means international wires will now correctly render as Pending in the list.

## Out of scope

- Internal member transfers stay instant.
- No changes to admin approval flow — admins still mark transfers `completed` / `failed` from the admin panel, which already updates the linked transaction status.

## Files touched

- `supabase/migrations/<new>.sql` — replace `user_submit_international_transfer` to set `status = 'pending'` on the transactions insert.
- `src/features/dashboard/MoneyActions.tsx` — pending banner + amber styling on external receipt.
- `src/features/dashboard/TransactionDetailsModal.tsx` — pending info banner for external transfers.