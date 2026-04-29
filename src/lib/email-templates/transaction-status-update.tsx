import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Resolva Credix'

interface Props {
  firstName?: string
  description?: string
  reference?: string
  amount?: string
  currency?: string
  newStatus?: 'completed' | 'failed' | 'cancelled'
  adminNotes?: string
  refund?: string
}

const statusCopy: Record<string, { headline: string; intro: string; tone: string }> = {
  completed: {
    headline: 'Your transaction has been completed',
    intro: 'Good news — your pending transaction has been processed and marked as completed.',
    tone: '#0d7a5f',
  },
  failed: {
    headline: 'Your transaction has failed',
    intro: "Unfortunately, your pending transaction could not be processed and has been marked as failed.",
    tone: '#c4302b',
  },
  cancelled: {
    headline: 'Your transaction has been cancelled',
    intro: 'Your pending transaction has been cancelled by our operations team.',
    tone: '#b45309',
  },
}

const TxStatusEmail = ({
  firstName,
  description,
  reference,
  amount,
  currency = 'USD',
  newStatus = 'failed',
  adminNotes,
  refund,
}: Props) => {
  const copy = statusCopy[newStatus] ?? statusCopy.failed
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{copy.headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>
          <Section style={content}>
            <Heading style={{ ...h1, color: copy.tone }}>{copy.headline}</Heading>
            <Text style={text}>{firstName ? `Hello ${firstName},` : 'Hello,'}</Text>
            <Text style={text}>{copy.intro}</Text>

            <Section style={detailsBox}>
              {description && (
                <Text style={detailRow}><span style={label}>Transaction:</span> <span style={value}>{description}</span></Text>
              )}
              {reference && (
                <Text style={detailRow}><span style={label}>Reference:</span> <span style={value}>{reference}</span></Text>
              )}
              {amount && (
                <Text style={detailRow}><span style={label}>Amount:</span> <span style={value}>{currency} {amount}</span></Text>
              )}
              <Text style={detailRow}><span style={label}>New status:</span> <span style={{ ...value, color: copy.tone, textTransform: 'capitalize' }}>{newStatus}</span></Text>
              {refund && (
                <Text style={detailRow}><span style={label}>Refunded to balance:</span> <span style={value}>{currency} {refund}</span></Text>
              )}
            </Section>

            {adminNotes && (
              <>
                <Heading as="h2" style={h2}>Note from our team</Heading>
                <Text style={noteBox}>{adminNotes}</Text>
              </>
            )}

            <Hr style={hr} />
            <Text style={footer}>
              You can view this transaction anytime from your dashboard. If you have questions, simply reply to this email.
            </Text>
            <Text style={footer}>— The {SITE_NAME} Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TxStatusEmail,
  subject: (data: Record<string, any>) => {
    const s = (data?.newStatus as string) || 'updated'
    return `Your transaction has been ${s}`
  },
  displayName: 'Transaction status update',
  previewData: {
    firstName: 'Alex',
    description: 'Bill payment · Verizon',
    reference: 'RC123456789',
    amount: '250.00',
    currency: 'USD',
    newStatus: 'failed',
    adminNotes: 'Card declined by issuer. Please retry with a different funding source.',
    refund: '250.00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif', color: '#1a1a2e' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0' }
const brandBar = { backgroundColor: '#0f1b3d', padding: '24px 32px' }
const brandText = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, letterSpacing: '0.5px', margin: '0' }
const content = { padding: '32px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 'bold' as const, color: '#0f1b3d', margin: '24px 0 8px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 14px' }
const detailsBox = { backgroundColor: '#f8f7f2', border: '1px solid #e5e2d8', borderRadius: '8px', padding: '16px 18px', margin: '18px 0' }
const detailRow = { fontSize: '13px', margin: '4px 0', color: '#1a1a2e' }
const label = { color: '#777', fontWeight: '500' as const }
const value = { fontWeight: 'bold' as const, color: '#0f1b3d' }
const noteBox = { fontSize: '14px', color: '#1a1a2e', backgroundColor: '#fff8e6', border: '1px solid #f0d78c', borderRadius: '8px', padding: '14px 16px', lineHeight: '1.6', margin: '0 0 14px' }
const hr = { border: 'none', borderTop: '1px solid #ececec', margin: '28px 0 18px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '6px 0' }