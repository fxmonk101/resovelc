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

interface TransferCancelledCOTProps {
  firstName?: string
  reference?: string
  amount?: string
  currency?: string
}

const TransferCancelledCOTEmail = ({
  firstName,
  reference,
  amount,
  currency = 'USD',
}: TransferCancelledCOTProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your transfer was cancelled — refund issued (COT code required)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Section style={content}>
          <Heading style={h1}>
            {firstName ? `Hello ${firstName},` : 'Hello,'}
          </Heading>

          <Text style={text}>
            We're writing to let you know that your recent transfer has been
            <strong> cancelled and fully refunded</strong> to your account
            balance.
          </Text>

          {(reference || amount) && (
            <Section style={detailsBox}>
              {reference && (
                <Text style={detailRow}>
                  <span style={label}>Reference:</span>{' '}
                  <span style={value}>{reference}</span>
                </Text>
              )}
              {amount && (
                <Text style={detailRow}>
                  <span style={label}>Amount refunded:</span>{' '}
                  <span style={value}>
                    {currency} {amount}
                  </span>
                </Text>
              )}
            </Section>
          )}

          <Heading as="h2" style={h2}>
            Why was my transfer cancelled?
          </Heading>
          <Text style={text}>
            Your transfer could not be processed because the required{' '}
            <strong>COT (Cost of Transfer) code</strong> was not provided. The
            COT code is a mandatory clearance code that authorizes outbound
            wire transfers and ensures funds are securely released through the
            interbank settlement network.
          </Text>

          <Text style={text}>
            Without a valid COT code, we are unable to release the funds to
            the beneficiary bank, so the full amount has been returned to your
            checking balance. No fees have been charged.
          </Text>

          <Heading as="h2" style={h2}>
            What to do next
          </Heading>
          <Text style={text}>
            To complete your transfer, please contact our support team to
            obtain your COT code. Once you have the code, you can re-initiate
            the transfer from your dashboard.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions, reply to this email or reach out to our
            support team. We're here to help.
          </Text>
          <Text style={footer}>— The {SITE_NAME} Team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TransferCancelledCOTEmail,
  subject: 'Your transfer was cancelled — refund issued',
  displayName: 'Transfer cancelled (COT)',
  previewData: {
    firstName: 'Alex',
    reference: 'DT-ABC1234567',
    amount: '1,500.00',
    currency: 'USD',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  color: '#1a1a2e',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0',
}
const brandBar = {
  backgroundColor: '#0f1b3d',
  padding: '24px 32px',
}
const brandText = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.5px',
  margin: '0',
}
const content = {
  padding: '32px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0f1b3d',
  margin: '0 0 16px',
}
const h2 = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#0f1b3d',
  margin: '28px 0 10px',
}
const text = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 14px',
}
const detailsBox = {
  backgroundColor: '#f8f7f2',
  border: '1px solid #e5e2d8',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '18px 0',
}
const detailRow = {
  fontSize: '13px',
  margin: '4px 0',
  color: '#1a1a2e',
}
const label = {
  color: '#777',
  fontWeight: '500' as const,
}
const value = {
  fontWeight: 'bold' as const,
  color: '#0f1b3d',
}
const hr = {
  border: 'none',
  borderTop: '1px solid #ececec',
  margin: '28px 0 18px',
}
const footer = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '6px 0',
}