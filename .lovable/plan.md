

## Add preflight admin role check to "Post transaction"

Verify the current session actually has the `admin` role on the server (via Supabase RPC) before enabling the **Post transaction** button on `/admin/funds`. This prevents non-admins (or stale sessions whose role was revoked) from even attempting a write that the database would reject.

### What changes

**`src/routes/admin.funds.tsx`**

1. Add three new state values:
   - `roleStatus: "checking" | "ok" | "denied" | "error"`
   - `roleError: string | null`
   - `currentUserId: string | null`

2. On mount, run a preflight that:
   - Calls `supabase.auth.getUser()` to confirm a session exists.
   - Calls `supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })` to confirm the admin role server-side.
   - Sets `roleStatus` to `"ok"` on success, `"denied"` if the RPC returns `false`, `"error"` (with `roleError`) if the call itself fails.
   - Only loads the user list once `roleStatus === "ok"`.

3. Render a small status pill above the action panel:
   - `checking` → "Verifying admin permissions…" (muted)
   - `ok` → green check "Admin permissions verified"
   - `denied` → red "You no longer have admin permissions. Please sign in again."
   - `error` → amber "Couldn't verify permissions" + Retry button

4. Disable the **Post transaction** button (and add a tooltip) whenever `roleStatus !== "ok"`. Keep the existing `submitting` disable behavior.

5. In `submit()`, add an early guard: if `roleStatus !== "ok"`, show a toast and bail before calling any RPC.

### Technical notes

- `has_role(_user_id uuid, _role app_role)` already exists as a `SECURITY DEFINER` RPC and is the same function the database uses internally — using it for the preflight guarantees the client's view matches what the server will allow.
- The existing `AdminLayout` role check stays as the route-level guard; the preflight here is an extra in-page check scoped to the destructive action, surfacing clear UI feedback when permissions change mid-session.
- No database changes required.

### Files touched

- `src/routes/admin.funds.tsx` (state, preflight effect, status pill, button disabled logic, submit guard)

