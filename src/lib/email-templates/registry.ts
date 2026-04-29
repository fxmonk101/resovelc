import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as transferCancelledCot } from './transfer-cancelled-cot'
import { template as transactionStatusUpdate } from './transaction-status-update'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'transfer-cancelled-cot': transferCancelledCot,
  'transaction-status-update': transactionStatusUpdate,
}
