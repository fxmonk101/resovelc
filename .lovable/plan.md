## Fix: Allow external bank transfers with any account number length

A customer reported they cannot transfer funds to their credit union account because the field implies a strict 10-digit limit and the flow only supports internal member-to-member transfers. We will rework the **Transfer money** modal so users can send to either an internal member account or an external US bank/credit union, with no artificial digit limit.

### Changes

**1. `src/features/dashboard/MoneyActions.tsx` — `TransferForm**`

Replace the single "Recipient account number" field with a transfer-type toggle plus contextual fields:

- Add a **Transfer to** selector: `Internal Resolva account` (default) | `External US bank / credit union`.
- **Internal mode** (current behaviour, polished): one field "Member account number", placeholder "Enter recipient account number", `inputMode="numeric"`, `maxLength={20}` (was effectively 10 by hint). Calls existing `user_transfer_funds` RPC.
- **External mode** (new): adds the following fields, all required:
  - Recipient full name
  - Bank / credit union name
  - Routing number (ABA) — `inputMode="numeric"`, `maxLength={9}`, `pattern="\d{9}"`
  - Account number — `inputMode="numeric"`, `maxLength={20}` (supports credit-union numbers longer than 10 digits)
  - Account type: Checking | Savings
- Amount and memo fields remain.
- On submit in external mode, call a new RPC `user_submit_domestic_transfer` (see below). On success, show "Transfer submitted. Funds typically arrive in 1–3 business days."
- Add explicit `text-navy-deep bg-white placeholder:text-navy-light/60` to all inputs/selects so admin-style visibility issue does not recur here.

**2. Database — new RPC + table for external (domestic) transfers**

Migration creates:

- `public.domestic_transfers` table:
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null` (references `auth.users` logically; not FK)
  - `reference text not null` (auto-generated like `DT-XXXXXX`)
  - `recipient_name text not null`
  - `bank_name text not null`
  - `routing_number text not null` (validated 9 digits)
  - `account_number text not null` (1–20 chars)
  - `account_type text not null check in ('checking','savings')`
  - `amount numeric(14,2) not null check (amount > 0)`
  - `memo text`
  - `status text not null default 'pending'`
  - `created_at timestamptz default now()`
- RLS enabled. Policies:
  - Users can `SELECT` their own rows (`auth.uid() = user_id`)
  - Users can `INSERT` only via the RPC (no direct insert policy)
  - Admins (via existing `has_role`) can select/update all
- RPC `public.user_submit_domestic_transfer(_recipient_name, _bank_name, _routing_number, _account_number, _account_type, _amount, _memo)` — `security definer`, validates routing length = 9, account 5–20 digits, debits balance via existing pattern, inserts row, returns json.

**3. Recent transfers visibility (light touch)**

The dashboard transfer modal stays focused on submission. The user's existing transactions list on the overview already shows debits. No new page is added in this change to keep scope minimal; admins can manage status from the existing admin tools (a follow-up task can add a dedicated `dashboard/transfers` view if desired).

### Files Edited / Created

- `src/features/dashboard/MoneyActions.tsx` (edit `TransferForm`)
- `supabase/migrations/<new>.sql` (table + RLS + RPC)

### Result

Customers can transfer funds to an external US bank or credit union with account numbers up to 20 digits, eliminating the "larger than 10 digits" blocker. Internal member transfers continue to work unchanged. fix any other related issues that may arise