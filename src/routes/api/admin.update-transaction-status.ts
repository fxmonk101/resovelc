import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Admin-only: update a single pending transaction's status (completed,
 * failed, cancelled), with an optional admin note. Refunds debits when
 * applicable, emits an in-app notification, and sends an email to the user.
 */
export const Route = createFileRoute('/api/admin/update-transaction-status')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !supabaseServiceKey) {
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const callerToken = authHeader.slice(7).trim()

        const admin = createClient(supabaseUrl, supabaseServiceKey)

        const { data: { user }, error: authError } = await admin.auth.getUser(callerToken)
        if (authError || !user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
        if (!isAdmin) {
          return Response.json({ error: 'Forbidden — admin only' }, { status: 403 })
        }

        let body: { transactionId?: string; newStatus?: string; adminNotes?: string }
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const { transactionId, newStatus, adminNotes } = body
        if (!transactionId || !newStatus) {
          return Response.json({ error: 'transactionId and newStatus required' }, { status: 400 })
        }
        if (!['completed', 'failed', 'cancelled'].includes(newStatus)) {
          return Response.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Run the update via the SECURITY DEFINER RPC, but we need it to act
        // as the admin caller — call with the caller's token client.
        const callerClient = createClient(supabaseUrl, supabaseServiceKey, {
          global: { headers: { Authorization: `Bearer ${callerToken}` } },
        })
        const { data: rpcResult, error: rpcError } = await callerClient.rpc(
          'admin_update_transaction_status',
          { _id: transactionId, _new_status: newStatus, _admin_notes: adminNotes ?? null },
        )
        if (rpcError) {
          return Response.json({ error: rpcError.message }, { status: 400 })
        }

        const result = rpcResult as {
          user_id: string
          amount: number
          refund: number
          reference: string
          description: string
          new_status: string
          admin_notes: string | null
        }

        // Look up email + first name
        const [{ data: profile }, userRes] = await Promise.all([
          admin.from('profiles').select('first_name').eq('user_id', result.user_id).maybeSingle(),
          admin.auth.admin.getUserById(result.user_id),
        ])
        const email = userRes.data?.user?.email

        let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped'
        let emailError: string | undefined
        if (email) {
          try {
            const origin = new URL(request.url).origin
            const resp = await fetch(`${origin}/lovable/email/transactional/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${callerToken}`,
              },
              body: JSON.stringify({
                templateName: 'transaction-status-update',
                recipientEmail: email,
                idempotencyKey: `tx-status-${transactionId}-${newStatus}`,
                templateData: {
                  firstName: profile?.first_name ?? undefined,
                  description: result.description,
                  reference: result.reference,
                  amount: Math.abs(Number(result.amount)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  currency: 'USD',
                  newStatus: result.new_status,
                  adminNotes: result.admin_notes ?? undefined,
                  refund: result.refund > 0
                    ? Number(result.refund).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : undefined,
                },
              }),
            })
            if (!resp.ok) {
              emailStatus = 'failed'
              emailError = (await resp.text()).slice(0, 200)
            } else {
              emailStatus = 'sent'
            }
          } catch (e) {
            emailStatus = 'failed'
            emailError = e instanceof Error ? e.message : String(e)
          }
        }

        return Response.json({
          ok: true,
          transaction: result,
          email: { status: emailStatus, error: emailError, recipient: email ?? null },
        })
      },
    },
  },
})