import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Admin-only endpoint to email all users whose pending transfers were
 * cancelled due to missing COT codes. Idempotent: uses idempotencyKey per
 * (transfer reference + template) so re-running won't double-send.
 */
export const Route = createFileRoute('/api/admin/notify-cot-cancellations')({
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

        const adminClient = createClient(supabaseUrl, supabaseServiceKey)

        // Verify caller and admin role
        const { data: { user }, error: authError } = await adminClient.auth.getUser(callerToken)
        if (authError || !user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { data: isAdminData } = await adminClient.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        })
        if (!isAdminData) {
          return Response.json({ error: 'Forbidden — admin only' }, { status: 403 })
        }

        // Gather cancelled transfers w/ COT note
        const origin = new URL(request.url).origin

        type Row = {
          user_id: string
          reference: string
          amount: number
          currency: string
          kind: 'domestic' | 'international'
        }

        const rows: Row[] = []

        const { data: dom } = await adminClient
          .from('domestic_transfers')
          .select('user_id,reference,amount,admin_notes,status')
          .eq('status', 'cancelled')
          .ilike('admin_notes', '%COT%')
        for (const r of (dom ?? []) as Array<{ user_id: string; reference: string; amount: number }>) {
          rows.push({ user_id: r.user_id, reference: r.reference, amount: Number(r.amount), currency: 'USD', kind: 'domestic' })
        }

        const { data: intl } = await adminClient
          .from('international_transfers')
          .select('user_id,reference,amount,fee,currency,admin_notes,status')
          .eq('status', 'cancelled')
          .ilike('admin_notes', '%COT%')
        for (const r of (intl ?? []) as Array<{ user_id: string; reference: string; amount: number; fee: number; currency: string }>) {
          rows.push({ user_id: r.user_id, reference: r.reference, amount: Number(r.amount) + Number(r.fee), currency: r.currency || 'USD', kind: 'international' })
        }

        // Fetch profiles + emails
        const userIds = Array.from(new Set(rows.map((r) => r.user_id)))
        const profilesMap = new Map<string, { first_name: string | null }>()
        const emailMap = new Map<string, string>()

        if (userIds.length) {
          const { data: profiles } = await adminClient
            .from('profiles')
            .select('user_id,first_name')
            .in('user_id', userIds)
          for (const p of (profiles ?? []) as Array<{ user_id: string; first_name: string | null }>) {
            profilesMap.set(p.user_id, { first_name: p.first_name })
          }
          for (const uid of userIds) {
            const { data: u } = await adminClient.auth.admin.getUserById(uid)
            if (u?.user?.email) emailMap.set(uid, u.user.email)
          }
        }

        // Send via the transactional send route (one per transfer)
        const results: Array<{ reference: string; email: string; status: 'sent' | 'failed' | 'skipped'; error?: string }> = []
        for (const r of rows) {
          const email = emailMap.get(r.user_id)
          if (!email) {
            results.push({ reference: r.reference, email: '(unknown)', status: 'skipped', error: 'no email' })
            continue
          }
          const profile = profilesMap.get(r.user_id)
          try {
            const resp = await fetch(`${origin}/lovable/email/transactional/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${callerToken}`,
              },
              body: JSON.stringify({
                templateName: 'transfer-cancelled-cot',
                recipientEmail: email,
                idempotencyKey: `cot-cancel-${r.reference}`,
                templateData: {
                  firstName: profile?.first_name ?? undefined,
                  reference: r.reference,
                  amount: r.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  currency: r.currency,
                },
              }),
            })
            if (!resp.ok) {
              const errText = await resp.text()
              results.push({ reference: r.reference, email, status: 'failed', error: errText.slice(0, 200) })
            } else {
              results.push({ reference: r.reference, email, status: 'sent' })
            }
          } catch (e) {
            results.push({ reference: r.reference, email, status: 'failed', error: e instanceof Error ? e.message : String(e) })
          }
        }

        return Response.json({
          total: rows.length,
          sent: results.filter((r) => r.status === 'sent').length,
          failed: results.filter((r) => r.status === 'failed').length,
          skipped: results.filter((r) => r.status === 'skipped').length,
          results,
        })
      },
    },
  },
})