import { getStore } from '@netlify/blobs'

import { markProposalPaid, paymentSessionStorageKey } from './payments.mts'
import {
  proposalLookupStorageKey,
  proposalStorageKey,
  type PaymentProvider,
  type PrivateProposal,
} from './proposals.mts'

type ProposalLookup = {
  folio: string
  token: string
}

type PaymentSessionLookup = ProposalLookup & {
  provider: PaymentProvider
  sessionId: string
}

export async function rememberProposalLookup(proposal: PrivateProposal): Promise<void> {
  await proposalStore().setJSON(
    proposalLookupStorageKey(proposal.folio),
    { folio: proposal.folio, token: proposal.token },
    {
      metadata: {
        folio: proposal.folio,
        email: proposal.email,
        service: proposal.serviceTitle,
        createdAt: proposal.createdAt,
      },
    },
  )
}

export async function rememberPaymentSession(
  provider: PaymentProvider,
  sessionId: string,
  proposal: PrivateProposal,
): Promise<void> {
  await proposalStore().setJSON(
    paymentSessionStorageKey(provider, sessionId),
    { provider, sessionId, folio: proposal.folio, token: proposal.token },
    {
      metadata: {
        provider,
        sessionId,
        folio: proposal.folio,
        createdAt: new Date().toISOString(),
      },
    },
  )
}

export async function lookupProposalToken(folio: string): Promise<string> {
  const lookup = await proposalStore().get(proposalLookupStorageKey(folio), { type: 'json' })
  return isProposalLookup(lookup) ? lookup.token : ''
}

export async function lookupPaymentSession(
  provider: PaymentProvider,
  sessionId: string,
): Promise<PaymentSessionLookup | null> {
  const lookup = await proposalStore().get(paymentSessionStorageKey(provider, sessionId), {
    type: 'json',
  })
  return isPaymentSessionLookup(lookup) ? lookup : null
}

export async function markStoredProposalPaid(input: {
  folio: string
  token: string
  provider: PaymentProvider
  providerPaymentId: string
  paidAt: string
}): Promise<PrivateProposal | null> {
  const key = proposalStorageKey(input.folio, input.token)
  const proposal = await proposalStore().get(key, { type: 'json' })

  if (!isPrivateProposal(proposal)) {
    return null
  }

  const paidProposal = markProposalPaid(proposal, input)
  await proposalStore().setJSON(key, paidProposal, {
    metadata: {
      folio: paidProposal.folio,
      email: paidProposal.email,
      service: paidProposal.serviceTitle,
      paidAt: input.paidAt,
      paidProvider: input.provider,
    },
  })

  return paidProposal
}

function proposalStore() {
  return getStore({ name: 'oz-proposals', consistency: 'strong' })
}

function isProposalLookup(value: unknown): value is ProposalLookup {
  return (
    isRecord(value) &&
    typeof value.folio === 'string' &&
    typeof value.token === 'string' &&
    value.token.length > 0
  )
}

function isPaymentSessionLookup(value: unknown): value is PaymentSessionLookup {
  return (
    isRecord(value) &&
    typeof value.folio === 'string' &&
    typeof value.token === 'string' &&
    value.token.length > 0 &&
    (value.provider === 'stripe' || value.provider === 'mercado-pago') &&
    typeof value.sessionId === 'string' &&
    value.sessionId.length > 0
  )
}

function isPrivateProposal(value: unknown): value is PrivateProposal {
  return isRecord(value) && typeof value.folio === 'string' && typeof value.token === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
