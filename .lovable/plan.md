

## Fix: confirmed transactions don't update the user's balance

### Problem

After clicking **Confirm & post** in the modal, the toast says success but the selected member's balance doesn't change. Root cause is in `submit()` in `src/routes/admin.funds.tsx`:

The function uses `return toast.error(...)` for validation/error branches **inside the `try` block**. Because `toast.error()` returns a value, those `return` statements exit `submit()` early — but they short-circuit on the **happy path** too in subtle ways:

```ts
const { data, error } = await supabase.rpc("admin_set_balance", {...});
if (error) return toast.error(error.message);
const nextBalance = Number((data as ...)?.new_balance ?? amt);
setSelected({ ...selected, balance: nextBalance });
// ... no toast, no refresh here — falls through
```

The success toast and `refreshSelectedUser(selected)` only run **after** the `if/else` block. But `setSelected({ ...selected, balance: nextBalance })` mutates `selected` synchronously in state, while `refreshSelectedUser(selected)` is called with the **stale** closure `selected` (old balance). Combined with the modal's `setConfirmOpen(false)` racing the async refresh, the UI ends up showing the pre-transaction balance.

Additionally, the RPC may be silently failing with an RLS/permission error that's swallowed because the `try/finally` doesn't surface non-thrown errors clearly, and the role preflight uses a cached check that may not match the actual server-side `auth.uid()` at call time.

### Fix

**1. `src/routes/admin.funds.tsx` — rewrite `submit()` for correctness:**

- Stop using `return toast.error(...)` inside `try`. Use explicit `throw new Error(msg)` or set a flag and `return` cleanly so the `finally` always resets `submitting`.
- After a successful RPC, **always** call `await refreshSelectedUser(selected)` to re-fetch the authoritative balance from `profiles` — don't trust optimistic local state.
- Log the raw RPC response (`console.log("admin_adjust_balance result", { data, error })`) so we can see in the console exactly what came back if it still fails.
- Show the success toast **only after** the refresh resolves, so the user sees the new balance before dismissal.
- Move `setConfirmOpen(false)` to run **after** `await submit()` completes successfully — already done, but ensure `submit()` actually awaits the refresh.

**2. Add a re-verification of the session right before the RPC call:**

Call `supabase.auth.getSession()` inside `submit()` and confirm a valid `access_token` exists. If the session expired between mount and confirm, the RPC silently runs as anon and `has_role(auth.uid(), 'admin')` returns false → RPC raises "Admin only" → caught and toasted, but the modal already closed.

**3. Surface RPC errors loudly:**

Replace silent `if (error) return toast.error(error.message)` with:
```ts
if (error) {
  console.error("RPC failed:", error);
  toast.error(`Transaction failed: ${error.message}`);
  return;
}
```

**4. Ensure modal closes only on success:**

Change the modal's `AlertDialogAction` handler so `setConfirmOpen(false)` runs **only** if `submit()` returned a truthy success indicator. Update `submit()` to return `boolean`.

### Files touched

- `src/routes/admin.funds.tsx` — rewrite `submit()` to return boolean, always refresh after success, log RPC errors, re-verify session, and gate modal close on success.

No database, RPC, or RLS changes needed — the underlying `admin_adjust_balance` / `admin_set_balance` functions are correct.

