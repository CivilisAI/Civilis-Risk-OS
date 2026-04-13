'use client'

import { useEffect, useState } from 'react'
import {
  api,
  type Agent,
  type IntelItemV2Detail,
  type IntelProtectionDecision,
  type IntelProtectionResolutionProof,
  type IntelProtectionPurchaseMode,
  type IntelProtectionQuote,
  type IntelProtectedPurchase,
  describeIntelProtectionWorkspace,
  isIntelProtectionFinalStatus,
} from '@/lib/api'
import {
  EmptyState,
  NoticeBanner,
  ProtocolBadge,
  formatRelativeTime,
  formatUsd,
} from '@/components/CivilisPrimitives'

const DEFAULT_CLAIM_REASON = 'The delivered intel is misleading, incomplete, or not delivered as quoted.'
const DEFAULT_RESOLUTION_REASON = 'Evaluator reviewed the protected purchase outcome.'
const CLAIM_TYPE = 'misleading_or_invalid_intel'
const PROOF_BUYER_AGENT_IDS = ['sage']
type WorkspaceView = 'buyer' | 'evaluator'

function getModeTone(mode: IntelProtectionPurchaseMode | undefined) {
  if (mode === 'instant') return 'emerald'
  if (mode === 'challengeable') return 'violet'
  return 'slate'
}

function getStatusTone(status: string | undefined) {
  const normalized = (status ?? '').toLowerCase()
  if (['released', 'settled', 'complete', 'completed'].includes(normalized)) return 'emerald'
  if (['refunded', 'refund', 'rejected'].includes(normalized)) return 'sky'
  if (['claimed', 'open'].includes(normalized)) return 'violet'
  if (['settling', 'resolving'].includes(normalized)) return 'violet'
  if (['pending_purchase_record'].includes(normalized)) return 'gold'
  if (['pending_delivery'].includes(normalized)) return 'gold'
  if (['purchase_failed'].includes(normalized)) return 'gold'
  if (['delivery_failed'].includes(normalized)) return 'gold'
  if (['submitted', 'challenge_window', 'challenging'].includes(normalized)) return 'gold'
  return 'slate'
}

function labelMode(mode: IntelProtectionPurchaseMode | undefined, zh: boolean) {
  if (mode === 'instant') return zh ? '即时结算' : 'Instant'
  if (mode === 'challengeable') return zh ? '可争议结算' : 'Challengeable'
  return zh ? '自动选择' : 'Auto'
}

function labelStatus(status: string | undefined, zh: boolean) {
  const normalized = (status ?? '').toLowerCase()
  if (normalized === 'quoted') return zh ? '已报价' : 'Quoted'
  if (normalized === 'pending_purchase_record') return zh ? '待写入购买记录' : 'Pending Purchase Record'
  if (normalized === 'pending_delivery') return zh ? '待提交交付' : 'Pending Delivery'
  if (normalized === 'submitted') return zh ? '已提交' : 'Submitted'
  if (normalized === 'challenge_window') return zh ? '争议窗口' : 'Challenge Window'
  if (normalized === 'claimed' || normalized === 'open') return zh ? '已申诉' : 'Claim Open'
  if (normalized === 'settling' || normalized === 'resolving') return zh ? '结算处理中' : 'Settlement Pending'
  if (normalized === 'released' || normalized === 'complete' || normalized === 'completed') return zh ? '已放款' : 'Released'
  if (normalized === 'refunded' || normalized === 'refund') return zh ? '已退款' : 'Refunded'
  if (normalized === 'purchase_failed') return zh ? '购买记录失败' : 'Purchase Record Failed'
  if (normalized === 'delivery_failed') return zh ? '交付失败' : 'Delivery Failed'
  if (normalized === 'rejected') return zh ? '已驳回' : 'Rejected'
  if (normalized === 'expired') return zh ? '已过期' : 'Expired'
  return status || (zh ? '未知' : 'Unknown')
}

function labelDecision(decision: IntelProtectionDecision | null | undefined, zh: boolean) {
  if (decision === 'release') return zh ? '放款' : 'Release'
  if (decision === 'refund') return zh ? '退款' : 'Refund'
  return zh ? '未决' : 'Pending'
}

function formatAmount(amount: string | number | null | undefined) {
  if (amount == null) return '—'
  const numeric = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(numeric)) return String(amount)
  return formatUsd(numeric)
}

function resolveMode(selection: IntelProtectionPurchaseMode, quote: IntelProtectionQuote | null) {
  if (selection === 'auto') return quote?.recommended_mode ?? 'challengeable'
  return selection
}

function requestShape(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2)
}

export function ProtectedCommercePanel({
  detail,
  zh,
}: {
  detail: IntelItemV2Detail
  zh: boolean
}) {
  const [buyerAgentId, setBuyerAgentId] = useState('')
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('buyer')
  const [buyerOptions, setBuyerOptions] = useState<Agent[]>([])
  const [purchaseMode, setPurchaseMode] = useState<IntelProtectionPurchaseMode>('auto')
  const [quote, setQuote] = useState<IntelProtectionQuote | null>(null)
  const [postOutcomeQuote, setPostOutcomeQuote] = useState<IntelProtectionQuote | null>(null)
  const [purchase, setPurchase] = useState<IntelProtectedPurchase | null>(null)
  const [claimReason, setClaimReason] = useState(DEFAULT_CLAIM_REASON)
  const [resolutionReason, setResolutionReason] = useState(DEFAULT_RESOLUTION_REASON)
  const [claimantToken, setClaimantToken] = useState('')
  const [evaluatorToken, setEvaluatorToken] = useState('')
  const [evaluatorSignature, setEvaluatorSignature] = useState('')
  const [resolutionProof, setResolutionProof] = useState<IntelProtectionResolutionProof | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [postOutcomeQuoteLoading, setPostOutcomeQuoteLoading] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const [resolveLoading, setResolveLoading] = useState(false)
  const [resolutionProofLoading, setResolutionProofLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [postOutcomeQuoteError, setPostOutcomeQuoteError] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [resolutionProofError, setResolutionProofError] = useState<string | null>(null)
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null)

  useEffect(() => {
    setBuyerAgentId('')
    setWorkspaceView('buyer')
    setBuyerOptions([])
    setPurchaseMode('auto')
    setQuote(null)
    setPostOutcomeQuote(null)
    setPurchase(null)
    setClaimReason(DEFAULT_CLAIM_REASON)
    setResolutionReason(DEFAULT_RESOLUTION_REASON)
    setClaimantToken('')
    setEvaluatorToken('')
    setEvaluatorSignature('')
    setResolutionProof(null)
    setQuoteError(null)
    setPostOutcomeQuoteError(null)
    setPurchaseError(null)
    setStatusError(null)
    setClaimError(null)
    setResolutionProofError(null)
    setAgentLoadError(null)
  }, [detail.item.id])

  useEffect(() => {
    let cancelled = false

    async function loadBuyerOptions() {
      try {
        const agents = await api.getAgents()
        if (cancelled) return

        const options = agents
          .filter((agent) => agent.is_alive && agent.agent_id !== detail.item.producer_agent_id)
          .sort((left, right) => {
            const leftRank = PROOF_BUYER_AGENT_IDS.indexOf(left.agent_id)
            const rightRank = PROOF_BUYER_AGENT_IDS.indexOf(right.agent_id)
            if (leftRank !== -1 || rightRank !== -1) {
              return (leftRank === -1 ? Number.POSITIVE_INFINITY : leftRank)
                - (rightRank === -1 ? Number.POSITIVE_INFINITY : rightRank)
            }
            return left.name.localeCompare(right.name)
          })
        const proofScopedOptions = options.filter((agent) => PROOF_BUYER_AGENT_IDS.includes(agent.agent_id))
        const activeOptions = proofScopedOptions.length > 0 ? proofScopedOptions : options
        setBuyerOptions(activeOptions)
        setBuyerAgentId((current) => {
          if (current && activeOptions.some((agent) => agent.agent_id === current)) return current
          return activeOptions.find((agent) => PROOF_BUYER_AGENT_IDS.includes(agent.agent_id))?.agent_id
            ?? activeOptions[0]?.agent_id
            ?? ''
        })
      } catch (error) {
        if (cancelled) return
        setAgentLoadError(error instanceof Error ? error.message : zh ? '加载 Agent 失败。' : 'Failed to load agents.')
      }
    }

    void loadBuyerOptions()

    return () => {
      cancelled = true
    }
  }, [detail.item.producer_agent_id, zh])

  async function fetchQuote(setError: (message: string | null) => void) {
    const normalizedBuyer = buyerAgentId.trim()
    if (!normalizedBuyer) {
      const message = zh ? '请输入买方 Agent ID 后再预览报价。' : 'Enter a buyer Agent ID before previewing a quote.'
      setError(message)
      return null
    }

    try {
      const body = {
        intelItemId: detail.item.id,
        buyerAgentId: normalizedBuyer,
      }

      return await api.postIntelProtectionQuote(body)
    } catch (error) {
      const message = error instanceof Error ? error.message : zh ? '报价预览失败。' : 'Quote preview failed.'
      setError(message)
      return null
    }
  }

  async function previewQuote() {
    setQuoteLoading(true)
    setQuoteError(null)
    setPurchaseError(null)
    setStatusError(null)

    try {
      const nextQuote = await fetchQuote(setQuoteError)
      if (!nextQuote) return null
      setQuote(nextQuote)
      setPostOutcomeQuote(null)
      return nextQuote
    } finally {
      setQuoteLoading(false)
    }
  }

  async function previewPostOutcomeQuote() {
    const claimResolved = isIntelProtectionFinalStatus(purchase?.status) || isIntelProtectionFinalStatus(purchase?.claim?.status)
    if (!claimResolved) {
      setPostOutcomeQuoteError(zh ? '先完成 claim 裁决，再刷新 post-resolution re-quote。' : 'Resolve the claim first, then refresh the post-resolution re-quote.')
      return
    }

    setPostOutcomeQuoteLoading(true)
    setPostOutcomeQuoteError(null)
    setStatusError(null)

    try {
      const nextQuote = await fetchQuote(setPostOutcomeQuoteError)
      if (!nextQuote) return
      setPostOutcomeQuote(nextQuote)
    } finally {
      setPostOutcomeQuoteLoading(false)
    }
  }

  async function executeProtectedPurchase() {
    const normalizedBuyer = buyerAgentId.trim()
    if (!normalizedBuyer) {
      setPurchaseError(zh ? '请输入买方 Agent ID。' : 'Enter a buyer Agent ID.')
      return
    }

    const nextQuote = quote ?? (await previewQuote())
    if (!nextQuote) return

    const resolvedMode = resolveMode(purchaseMode, nextQuote)
    setPurchaseLoading(true)
    setPurchaseError(null)
    setClaimError(null)
    setStatusError(null)

    try {
      const nextPurchase = await api.postIntelProtectedBuy(detail.item.id, {
        buyerAgentId: normalizedBuyer,
        purchaseMode: resolvedMode,
        quoteId: nextQuote.quote_id,
      })
      setPurchase(nextPurchase)
      if (nextPurchase.claim?.reason_text) {
        setClaimReason(nextPurchase.claim.reason_text)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : zh ? '保护购买失败。' : 'Protected purchase failed.'
      setPurchaseError(message)
    } finally {
      setPurchaseLoading(false)
    }
  }

  async function refreshStatus() {
    if (!purchase?.protected_purchase_id) return

    setStatusLoading(true)
    setStatusError(null)

    try {
      const latestPurchase = await api.getIntelProtectedPurchase(purchase.protected_purchase_id)
      setPurchase(latestPurchase)
    } catch (error) {
      const message = error instanceof Error ? error.message : zh ? '状态刷新失败。' : 'Status refresh failed.'
      setStatusError(message)
    } finally {
      setStatusLoading(false)
    }
  }

  async function fileClaim() {
    if (!purchase?.protected_purchase_id) {
      setClaimError(zh ? '先完成一笔受保护购买，再发起 claim。' : 'Complete a protected purchase before filing a claim.')
      return
    }

    const normalizedBuyer = buyerAgentId.trim()
    if (!normalizedBuyer) {
      setClaimError(zh ? '请输入买方 Agent ID。' : 'Enter a buyer Agent ID.')
      return
    }

    if (!claimReason.trim()) {
      setClaimError(zh ? '请写一句申诉理由。' : 'Please provide a claim reason.')
      return
    }

    setClaimLoading(true)
    setClaimError(null)

    try {
      const nextClaim = await api.postIntelProtectionClaim({
        protectedPurchaseId: purchase.protected_purchase_id,
        claimType: CLAIM_TYPE,
        reasonText: claimReason.trim(),
        evidence: {
          intelItemId: detail.item.id,
          purchaseMode: purchase.purchase_mode,
          quoteId: purchase.quote_id,
        },
      }, claimantToken.trim() || undefined)

      setPurchase((current) => current ? { ...current, claim: nextClaim } : current)
      if (purchase.protected_purchase_id) {
        const latestPurchase = await api.getIntelProtectedPurchase(purchase.protected_purchase_id)
        setPurchase(latestPurchase)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : zh ? '申诉提交失败。' : 'Claim submission failed.'
      setClaimError(message)
    } finally {
      setClaimLoading(false)
    }
  }

  async function resolveClaim(decision: IntelProtectionDecision) {
    if (!purchase?.claim?.claim_id || !purchase.protected_purchase_id) {
      setClaimError(zh ? '当前没有可处理的 claim。' : 'There is no claim to resolve.')
      return
    }

    setResolveLoading(true)
    setClaimError(null)

    try {
      const nextClaim = await api.resolveIntelProtectionClaim(purchase.claim.claim_id, {
        decision,
        decisionReason: resolutionReason.trim() || DEFAULT_RESOLUTION_REASON,
      }, evaluatorToken.trim() || undefined, evaluatorSignature.trim() || undefined)
      setPurchase((current) => current ? { ...current, claim: nextClaim } : current)
      const latestPurchase = await api.getIntelProtectedPurchase(purchase.protected_purchase_id)
      setPurchase(latestPurchase)
      setPostOutcomeQuote(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : zh ? 'claim 处理失败。' : 'Claim resolution failed.'
      setClaimError(message)
    } finally {
      setResolveLoading(false)
    }
  }

  async function previewResolutionProof(decision: IntelProtectionDecision) {
    if (!purchase?.claim?.claim_id) {
      setResolutionProofError(zh ? '先生成 claim，再预览 evaluator proof。' : 'Create a claim before previewing evaluator proof.')
      return
    }

    setResolutionProofLoading(true)
    setResolutionProofError(null)

    try {
      const proof = await api.getIntelProtectionResolutionProof(purchase.claim.claim_id, {
        decision,
        decisionReason: resolutionReason.trim() || DEFAULT_RESOLUTION_REASON,
      })
      setResolutionProof(proof)
    } catch (error) {
      const message = error instanceof Error ? error.message : zh ? '加载 evaluator proof 失败。' : 'Failed to load evaluator proof.'
      setResolutionProofError(message)
    } finally {
      setResolutionProofLoading(false)
    }
  }

  const resolvedMode = resolveMode(purchaseMode, quote)
  const requestPreview = {
    buyerAgentId: buyerAgentId.trim() || null,
    purchaseMode: resolvedMode,
    quoteId: quote?.quote_id ?? null,
  }
  const activeClaim = purchase?.claim ?? null
  const claimResolved = isIntelProtectionFinalStatus(purchase?.status) || isIntelProtectionFinalStatus(activeClaim?.status)
  const claimPreview = purchase
    ? {
        protectedPurchaseId: purchase.protected_purchase_id,
        claimType: CLAIM_TYPE,
        reasonText: claimReason.trim() || DEFAULT_CLAIM_REASON,
        roleToken: claimantToken ? 'provided' : 'optional_or_server_disabled',
      }
    : null
  const resolvePreview = purchase
    ? {
        claimId: purchase.claim?.claim_id ?? null,
        evaluatorAddress: purchase.evaluator_address ?? null,
        decision: 'release',
        decisionReason: resolutionReason.trim() || DEFAULT_RESOLUTION_REASON,
        evaluatorToken: evaluatorToken ? 'provided' : 'required_if_server_gate_enabled',
        evaluatorSignature: evaluatorSignature ? 'provided' : 'optional_if_using_wallet_signature',
      }
    : null
  const currentQuoteLabel = quote ? (zh ? '当前 quote' : 'Current Quote') : (zh ? '尚未生成 quote' : 'No current quote yet')
  const postOutcomeQuoteLabel = claimResolved
    ? (postOutcomeQuote ? (zh ? '已刷新 post-resolution re-quote' : 'Post-resolution Re-Quote Ready') : (zh ? '可刷新 post-resolution re-quote' : 'Ready to Refresh Post-resolution Re-Quote'))
    : (zh ? '等待 claim 裁决后再刷新' : 'Waiting for claim resolution')
  const evaluatorPathReady = Boolean(purchase?.claim?.claim_id)
  const showBuyerWorkspace = workspaceView === 'buyer'
  const showEvaluatorWorkspace = workspaceView === 'evaluator'
  const selectedBuyer = buyerOptions.find((agent) => agent.agent_id === buyerAgentId) ?? null

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
            {zh ? '可复用保护 Skill' : 'Reusable Protection Skill'}
          </p>
          <h3 className="font-display text-2xl tracking-wider text-[var(--text-primary)]">
            {zh ? 'Civilis Risk OS: 买方预览、评审裁决与结果重定价' : 'Civilis Risk OS: buyer preview, evaluator review, and outcome repricing'}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
            {zh
              ? '以 Intel Market 作为参考接入，先给出风险报价，再让买方和评审沿着分离的角色路径完成保护性购买、申诉和裁决；结果回写后，重新报价的入口会被明确保留。'
              : 'Using Intel Market as the reference integration, this skill quotes risk first, then lets buyer and evaluator move through separate role-scoped workflows for protected purchase, claim, and resolution; the post-outcome re-quote entry remains explicit instead of being implied.'}
          </p>
        </div>
        <ProtocolBadge label={labelMode(purchaseMode, zh)} tone={getModeTone(purchaseMode)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
          {zh ? 'Intel Market 参考接入' : 'Intel Market Reference Integration'}
        </span>
        <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
          {zh ? 'Agentic Wallet 链上身份' : 'Agentic Wallet Identity'}
        </span>
        <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
          {zh ? 'x402 基线 + ACP 保护流' : 'x402 Baseline + ACP Protection'}
        </span>
        <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
          {zh ? 'claim 后再重报价' : 'Re-quote After Outcome'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            {zh ? 'Canonical Buyer' : 'Canonical Buyer'}
          </p>
          <p className="mt-1 font-mono text-sm text-[var(--text-primary)]">
            {selectedBuyer?.agent_id ?? 'sage'}
          </p>
          <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
            {zh
              ? '买方路径只展示报价、买入和 claim 准备，保持 buyer-only 语义。'
              : 'The buyer path only exposes quoting, purchase, and claim preparation to keep the workflow buyer-only.'}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            {zh ? 'Canonical Seller' : 'Canonical Seller'}
          </p>
          <p className="mt-1 font-mono text-sm text-[var(--text-primary)]">{detail.item.producer_agent_id}</p>
          <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
            {zh
              ? '卖方在当前 proof console 里不直接操作，只通过受保护交付和后续重定价被观察。'
              : 'The seller is observed through protected delivery and later repricing rather than direct operator controls.'}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            {zh ? 'Canonical Evaluator' : 'Canonical Evaluator'}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[var(--text-primary)]">
            {purchase?.evaluator_address ?? '0x400ea2f2af2732c4e2af9fb2f8616468ad49023d'}
          </p>
          <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
            {zh
              ? '评审路径只在 claim 成功创建后激活，避免把 buyer 和 evaluator 混成一个后台角色。'
              : 'The evaluator path activates only after claim creation so the buyer and evaluator do not collapse into one operator view.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
          {zh ? '角色路径' : 'Role Path'}
        </span>
        <span className="ml-auto text-xs leading-6 text-[var(--text-dim)]">
          {zh
            ? '同一时间只展示一个角色工作台；评审路径会在买方成功提交 claim 后才激活。'
            : 'Only one role workspace is shown at a time; the evaluator path activates only after the buyer successfully opens a claim.'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {([
          [
            'buyer',
            zh ? 'Buyer Replay' : 'Buyer Replay',
            zh ? '先报价、买入，再准备 claim。这里是默认 judge 入口。' : 'Quote first, buy next, then prepare the claim. This is the default judge entry lane.',
            zh ? '1. Quote  2. Challengeable buy  3. Claim-proof  4. Claim' : '1. Quote  2. Challengeable buy  3. Claim-proof  4. Claim',
          ],
          [
            'evaluator',
            zh ? 'Evaluator Replay' : 'Evaluator Replay',
            zh ? '只在 claim 存在后解锁。这里负责 resolve-proof 和最终 release/refund。' : 'Unlocks only after a claim exists. This lane handles resolve-proof and final release/refund.',
            zh ? '5. Resolve-proof  6. Resolve  7. Re-quote' : '5. Resolve-proof  6. Resolve  7. Re-quote',
          ],
        ] as Array<[WorkspaceView, string, string, string]>).map(([mode, title, description, steps]) => {
          const active = workspaceView === mode
          const disabled = mode === 'evaluator' && !evaluatorPathReady
          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                if (disabled) return
                setWorkspaceView(mode)
              }}
              disabled={disabled}
              className={`rounded-xl border p-4 text-left transition ${
                active
                  ? 'border-[var(--border-gold)] bg-[var(--gold-wash)]'
                  : disabled
                    ? 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] opacity-60 cursor-not-allowed'
                    : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:border-[var(--border-gold)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {mode === 'buyer' ? (zh ? '默认路径' : 'Default Lane') : (zh ? '后续路径' : 'Follow-on Lane')}
                  </p>
                  <h4 className="mt-1 font-display text-lg tracking-wider text-[var(--text-primary)]">
                    {title}
                  </h4>
                </div>
                <ProtocolBadge
                  label={active ? (zh ? '当前显示' : 'Active') : disabled ? (zh ? '等待 claim' : 'Waiting for Claim') : (zh ? '可切换' : 'Ready')}
                  tone={active ? 'gold' : disabled ? 'slate' : 'violet'}
                />
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                {description}
              </p>
              <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-dim)]">
                {steps}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-5 grid gap-4">
        {showBuyerWorkspace ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {zh ? describeIntelProtectionWorkspace('buyer', zh) : describeIntelProtectionWorkspace('buyer', zh)}
                </p>
                <h4 className="mt-1 font-display text-lg tracking-wider text-[var(--text-primary)]">
                  {zh ? '买方预览与受保护购买' : 'Buyer preview and protected purchase'}
                </h4>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  {zh
                    ? '这边只负责报价、买入和买方侧申诉，不做裁决。'
                    : 'This side only handles quoting, purchase, and buyer-side claims. It does not resolve claims.'}
                </p>
              </div>
              <ProtocolBadge
                label={labelMode(purchaseMode, zh)}
                tone={getModeTone(purchaseMode)}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr,auto] md:items-end">
              <label className="block">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {zh ? '买方 Agent ID' : 'Buyer Agent ID'}
                </span>
                <select
                  className="input mt-2 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
                  value={buyerAgentId}
                  onChange={(event) => setBuyerAgentId(event.target.value)}
                >
                  <option value="">{zh ? '选择买方 Agent' : 'Select buyer agent'}</option>
                  {buyerOptions.map((agent) => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.name} ({agent.agent_id}){PROOF_BUYER_AGENT_IDS.includes(agent.agent_id) ? (zh ? ' - 证明角色' : ' - proof actor') : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {zh ? '购买模式' : 'Purchase Mode'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['auto', 'instant', 'challengeable'] as IntelProtectionPurchaseMode[]).map((mode) => {
                    const active = purchaseMode === mode
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPurchaseMode(mode)}
                        className={`rounded-full border px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] transition ${
                          active
                            ? 'border-[var(--border-gold)] bg-[var(--gold-wash)] text-[var(--gold)]'
                            : 'border-[var(--border-primary)] text-[var(--text-dim)] hover:border-[var(--border-gold)] hover:text-[var(--gold)]'
                        }`}
                      >
                        {labelMode(mode, zh)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void previewQuote()}
                disabled={quoteLoading || purchaseLoading}
                className="rounded-lg border border-[var(--border-gold)] bg-[var(--gold-wash)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--gold)] transition hover:bg-[var(--gold)]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {quoteLoading ? (zh ? '预览中…' : 'Previewing…') : (zh ? '预览当前 quote' : 'Preview Current Quote')}
              </button>
              <button
                type="button"
                onClick={() => void executeProtectedPurchase()}
                disabled={purchaseLoading || quoteLoading}
                className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {purchaseLoading ? (zh ? '购买中…' : 'Buying…') : (zh ? '执行受保护购买' : 'Buy Protected Intel')}
              </button>
              {purchase?.protected_purchase_id ? (
                <button
                  type="button"
                  onClick={() => void refreshStatus()}
                  disabled={statusLoading}
                  className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {statusLoading ? (zh ? '刷新中…' : 'Refreshing…') : (zh ? '刷新状态' : 'Refresh Status')}
                </button>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
              <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {zh ? 'Buyer 请求形状' : 'Buyer Call Shape'}
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 font-mono text-[0.72rem] leading-6 text-[var(--text-secondary)]">
                {requestShape(requestPreview)}
              </pre>
              <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                {zh
                  ? '当选择“自动”时，实际 purchaseMode 会使用当前 quote 的推荐模式。'
                  : 'When Auto is selected, the live purchaseMode follows the current quote’s recommendation.'}
              </p>
            </div>
            {agentLoadError ? <NoticeBanner title={zh ? 'Agent 加载失败' : 'Agent Load Error'} message={agentLoadError} tone="warning" /> : null}
          </div>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                {zh ? '当前 quote' : 'Current Quote'}
              </p>
              <ProtocolBadge
                label={currentQuoteLabel}
                tone={quote ? getModeTone(quote.recommended_mode) : 'slate'}
              />
            </div>

            {quoteError ? <NoticeBanner title={zh ? '报价失败' : 'Quote Error'} message={quoteError} tone="error" /> : null}

            {quote ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? '风险分' : 'Risk Score'}
                  </p>
                  <p className="mt-1 font-mono text-lg text-[var(--gold)]">{quote.risk_score}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? '推荐模式' : 'Recommended Mode'}
                  </p>
                  <div className="mt-1">
                    <ProtocolBadge label={labelMode(quote.recommended_mode, zh)} tone={getModeTone(quote.recommended_mode)} />
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? '保费' : 'Premium'}
                  </p>
                  <p className="mt-1 font-mono text-lg text-[var(--text-primary)]">{formatUsd(quote.premium_amount)}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? '争议窗口' : 'Claim Window'}
                  </p>
                  <p className="mt-1 font-mono text-lg text-[var(--text-primary)]">{Math.round(quote.claim_window_seconds / 60)}m</p>
                </div>
              </div>
            ) : (
              <EmptyState label={zh ? '先预览当前 quote，再决定购买模式。' : 'Preview the current quote first, then choose the purchase mode.'} />
            )}

            {quote ? (
              <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? '报价理由' : 'Risk Reasons'}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {quote.reasons.length > 0 ? quote.reasons.map((reason) => (
                      <li key={reason} className="leading-6">• {reason}</li>
                    )) : (
                      <li>{zh ? '暂无额外风险理由。' : 'No extra risk reasons were returned.'}</li>
                    )}
                  </ul>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <span className="text-xs text-[var(--text-dim)]">
                    {zh ? '报价过期' : 'Quote Expires'}
                  </span>
                  <span className="font-mono text-xs text-[var(--text-primary)]">{formatRelativeTime(quote.expires_at)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {zh ? '买方侧 claim' : 'Buyer-side Claim'}
                </p>
                <p className="mt-1 text-sm leading-7 text-[var(--text-secondary)]">
                  {zh
                    ? '买方在这里提出 claim；裁决在右侧的评审工作台完成。'
                    : 'The buyer files the claim here; the evaluator resolves it in the workspace on the right.'}
                </p>
              </div>
              <ProtocolBadge label={claimResolved ? (zh ? '已裁决后可重跑 quote' : 'Ready After Outcome') : (zh ? '等待裁决' : 'Waiting on Outcome')} tone={claimResolved ? 'emerald' : 'gold'} />
            </div>

            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {zh ? '申诉理由' : 'Claim Reason'}
                </span>
                <textarea
                  className="textarea mt-2 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
                  value={claimReason}
                  onChange={(event) => setClaimReason(event.target.value)}
                  placeholder={DEFAULT_CLAIM_REASON}
                />
              </label>

              <label className="block">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {zh ? '买方保护令牌' : 'Buyer Protection Token'}
                </span>
                <input
                  className="input mt-2 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
                  type="password"
                  value={claimantToken}
                  onChange={(event) => setClaimantToken(event.target.value)}
                  placeholder={zh ? '若服务端启用了 claim 鉴权，请在此输入' : 'Enter if the server has claim-role auth enabled'}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void fileClaim()}
                  disabled={claimLoading || purchaseLoading || !purchase}
                  className="rounded-lg border border-[var(--border-gold)] bg-[var(--gold-wash)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--gold)] transition hover:bg-[var(--gold)]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {claimLoading ? (zh ? '提交中…' : 'Submitting…') : (zh ? '提交 claim' : 'File Claim')}
                </button>
                {purchase?.claim?.claim_id ? (
                  <button
                    type="button"
                    onClick={() => setWorkspaceView('evaluator')}
                    className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)]"
                  >
                    {zh ? '切到评审路径' : 'Continue As Evaluator'}
                  </button>
                ) : null}
              </div>

              {claimError ? <NoticeBanner title={zh ? '申诉错误' : 'Claim Error'} message={claimError} tone="error" /> : null}

              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? 'Claim 请求形状' : 'Claim Call Shape'}
                  </p>
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                    {zh ? 'Buyer only' : 'Buyer only'}
                  </span>
                </div>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 font-mono text-[0.72rem] leading-6 text-[var(--text-secondary)]">
                      {requestShape(claimPreview ?? {
                        protectedPurchaseId: 'pending',
                        claimType: CLAIM_TYPE,
                        reasonText: claimReason.trim() || DEFAULT_CLAIM_REASON,
                        roleToken: claimantToken ? 'provided' : 'required_by_default_in_strict_mode',
                      })}
                </pre>
                <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                  {zh
                    ? 'claim 权限不再从 body 里的 claimant ID 推断；如果服务端启用了买方令牌门控，这里需要提供对应 token。'
                    : 'Claim authority is no longer inferred from a claimant ID in the body; if the server enables buyer-token gating, this token is required.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {showEvaluatorWorkspace ? (
        <div className="space-y-4">
          {!evaluatorPathReady ? (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
              <EmptyState label={zh ? '先在买方路径完成受保护购买并提交 claim，评审路径才会激活。' : 'Complete the protected purchase and open a claim in the buyer path before entering the evaluator path.'} />
            </div>
          ) : null}
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {zh ? describeIntelProtectionWorkspace('evaluator', zh) : describeIntelProtectionWorkspace('evaluator', zh)}
                </p>
                <h4 className="mt-1 font-display text-lg tracking-wider text-[var(--text-primary)]">
                  {zh ? '裁决工作台' : 'Evaluator Review Workspace'}
                </h4>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  {zh
                    ? '这边只处理已存在的 claim，并且只应由当前 ACP 里配置的 evaluator 来操作。'
                    : 'This side only handles existing claims, and only the evaluator configured in the ACP job should act here.'}
                </p>
              </div>
              <ProtocolBadge
                label={purchase?.evaluator_address ? (zh ? '已配置 evaluator' : 'Evaluator Set') : (zh ? '等待 evaluator' : 'Evaluator Pending')}
                tone={purchase?.evaluator_address ? 'violet' : 'slate'}
              />
            </div>

            <div className="mt-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  {zh ? '评审视角说明' : 'Evaluator View Note'}
                </p>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  {zh ? 'Evaluator only' : 'Evaluator only'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                {zh
                  ? '该路径只展示已发生的 protected purchase 与 claim 结果，不再暴露买方报价或购买控件。这样评审能看到明确的角色分离。'
                  : 'This path only exposes the protected purchase and claim outcome state. Buyer quote and purchase controls are intentionally hidden so the review reads as a role-separated skill workflow.'}
              </p>
            </div>

            {purchaseError ? <NoticeBanner title={zh ? '购买失败' : 'Purchase Error'} message={purchaseError} tone="error" /> : null}
            {statusError ? <NoticeBanner title={zh ? '状态刷新失败' : 'Status Error'} message={statusError} tone="warning" /> : null}

            {purchase ? (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {zh ? '受保护购买 ID' : 'Protected Purchase ID'}
                    </p>
                    <p className="mt-1 font-mono text-lg text-[var(--text-primary)]">{purchase.protected_purchase_id}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {zh ? '当前状态' : 'Status'}
                    </p>
                    <p className="mt-1 font-mono text-lg text-[var(--gold)]">{labelStatus(purchase.status, zh)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {zh ? '主款' : 'Principal'}
                    </p>
                    <p className="mt-1 font-mono text-lg text-[var(--text-primary)]">{formatAmount(purchase.principal_amount)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {zh ? '保费' : 'Premium'}
                    </p>
                    <p className="mt-1 font-mono text-lg text-[var(--text-primary)]">{formatAmount(purchase.premium_amount)}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {zh ? '挑战截止' : 'Challenge Deadline'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {purchase.challenge_deadline ? formatRelativeTime(purchase.challenge_deadline) : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {zh ? 'ACP Job' : 'ACP Job'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {purchase.acp_job_id ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3 sm:col-span-2">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {zh ? '受信评审地址' : 'Trusted Evaluator'}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-[var(--text-primary)]">
                      {purchase.evaluator_address ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? '购买形状' : 'Purchase Shape'}
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 font-mono text-[0.72rem] leading-6 text-[var(--text-secondary)]">
                    {requestShape({
                      protectedPurchaseId: purchase.protected_purchase_id,
                      quoteId: purchase.quote_id,
                      buyerAgentId: purchase.buyer_agent_id,
                      purchaseMode: purchase.purchase_mode,
                      status: purchase.status,
                    })}
                  </pre>
                </div>

                {activeClaim ? (
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                        {zh ? '当前 Claim' : 'Current Claim'}
                      </p>
                      <ProtocolBadge label={labelStatus(activeClaim.status, zh)} tone={getStatusTone(activeClaim.status)} />
                    </div>
                    <div className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                      <p>{zh ? `Claim ID: ${activeClaim.claim_id}` : `Claim ID: ${activeClaim.claim_id}`}</p>
                      <p>{zh ? `类型: ${activeClaim.claim_type}` : `Type: ${activeClaim.claim_type}`}</p>
                      <p>{activeClaim.reason_text ?? (zh ? '暂无理由。' : 'No reason text yet.')}</p>
                      <p>{zh ? '决议' : 'Decision'}: {labelDecision(activeClaim.decision, zh)}</p>
                      <p>{zh ? '评审地址' : 'Evaluator'}: {activeClaim.evaluator_address ?? '—'}</p>
                      <p>{zh ? '解决时间' : 'Resolved'}: {activeClaim.resolved_at ? formatRelativeTime(activeClaim.resolved_at) : '—'}</p>
                    </div>
                  </div>
                ) : (
                  <EmptyState label={zh ? '当前还没有 claim。你可以先在左侧发起申诉，再回到这里裁决。' : 'There is no claim yet. File it on the left, then return here to resolve.'} />
                )}

                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {zh ? 'Resolution 请求形状' : 'Resolution Call Shape'}
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 font-mono text-[0.72rem] leading-6 text-[var(--text-secondary)]">
                    {requestShape(resolvePreview ?? {
                      claimId: 'pending',
                      evaluatorAddress: purchase?.evaluator_address ?? null,
                      decision: 'release',
                      decisionReason: resolutionReason.trim() || DEFAULT_RESOLUTION_REASON,
                      evaluatorToken: evaluatorToken ? 'provided' : 'required_if_server_gate_enabled',
                      evaluatorSignature: evaluatorSignature ? 'provided' : 'optional_if_using_wallet_signature',
                    })}
                  </pre>
                </div>

                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                  <label className="block">
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                      {zh ? '评审裁决令牌' : 'Evaluator Resolution Token'}
                    </span>
                    <input
                      className="input mt-2 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
                      type="password"
                      value={evaluatorToken}
                      onChange={(event) => setEvaluatorToken(event.target.value)}
                      placeholder={zh ? '若服务端启用了 evaluator 鉴权，请在此输入' : 'Enter if the server has evaluator-role auth enabled'}
                    />
                  </label>

                  <div className="mt-3 h-px bg-[var(--border-primary)]" />

                  <label className="mt-3 block">
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                      {zh ? 'Evaluator Signature（可选）' : 'Evaluator Signature (Optional)'}
                    </span>
                    <textarea
                      className="textarea mt-2 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
                      value={evaluatorSignature}
                      onChange={(event) => setEvaluatorSignature(event.target.value)}
                      placeholder={zh ? '如果外部接入方使用钱包签名，这里粘贴 evaluator 签名。' : 'Paste the evaluator signature here when using wallet-bound proof.'}
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void previewResolutionProof('release')}
                      disabled={resolutionProofLoading || !purchase?.claim?.claim_id}
                      className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resolutionProofLoading ? (zh ? '生成中…' : 'Preparing…') : (zh ? '预览 Release 签名消息' : 'Preview Release Proof')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void previewResolutionProof('refund')}
                      disabled={resolutionProofLoading || !purchase?.claim?.claim_id}
                      className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resolutionProofLoading ? (zh ? '生成中…' : 'Preparing…') : (zh ? '预览 Refund 签名消息' : 'Preview Refund Proof')}
                    </button>
                  </div>

                  {resolutionProofError ? <NoticeBanner title={zh ? 'Proof 错误' : 'Proof Error'} message={resolutionProofError} tone="warning" /> : null}

                  {resolutionProof ? (
                    <div className="mt-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                          {zh ? '可签名的裁决消息' : 'Signable Resolution Proof'}
                        </p>
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                          {labelDecision(resolutionProof.decision, zh)}
                        </span>
                      </div>
                      <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-primary)] bg-[var(--surface)] p-3 font-mono text-[0.72rem] leading-6 text-[var(--text-secondary)]">
                        {resolutionProof.message}
                      </pre>
                      <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                        {zh
                          ? '如果不用 evaluator token，外部接入方可以先签这条消息，再把签名随裁决请求一起提交。'
                          : 'If an external integrator does not use an evaluator token, they can sign this message and attach the signature to the resolution request.'}
                      </p>
                    </div>
                  ) : null}

                  <label className="block">
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                      {zh ? '裁决理由' : 'Resolution Reason'}
                    </span>
                    <textarea
                      className="textarea mt-2 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
                      value={resolutionReason}
                      onChange={(event) => setResolutionReason(event.target.value)}
                      placeholder={DEFAULT_RESOLUTION_REASON}
                    />
                  </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkspaceView('buyer')}
                    className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)]"
                  >
                    {zh ? '返回买方路径' : 'Back To Buyer Path'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveClaim('release')}
                      disabled={resolveLoading || !evaluatorPathReady || !purchase?.claim || !purchase?.evaluator_address}
                      className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resolveLoading ? (zh ? '裁决中…' : 'Resolving…') : (zh ? '裁决放款' : 'Resolve Release')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveClaim('refund')}
                      disabled={resolveLoading || !evaluatorPathReady || !purchase?.claim || !purchase?.evaluator_address}
                      className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resolveLoading ? (zh ? '裁决中…' : 'Resolving…') : (zh ? '裁决退款' : 'Resolve Refund')}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                    {zh
                      ? '这里仅应由 ACP 中配置的 evaluator 操作；严格证明环境可继续使用 evaluator token，更通用的接入方则可以切到 evaluator 钱包签名模式。买方在左侧发 claim，裁决和重定价在这里完成。'
                      : 'Only the evaluator configured in ACP should act here. The strict proof environment can continue using an evaluator token, while more general integrations can switch to a wallet-bound evaluator signature. The buyer files the claim on the left, and resolution plus repricing happens here.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <EmptyState label={zh ? '还没有受保护购买状态。预览当前 quote 后即可开始。' : 'No protected purchase yet. Preview the current quote to begin.'} />
              </div>
            )}
          </div>
        </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
              {zh ? 'post-resolution re-quote' : 'Post-resolution Re-Quote'}
            </p>
            <h4 className="font-display text-lg tracking-wider text-[var(--text-primary)]">
              {zh ? '结果后再跑一次 quote，不虚构 delta' : 'Run the quote again after the outcome, without pretending a delta'}
            </h4>
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
              {zh
                ? '这个槽位只在 claim 裁决后解锁。它会重新调用同一个 quote 入口，显示的是“结果之后的重新报价”，不是提前伪造的结果。'
                : 'This slot unlocks only after the claim is resolved. It reuses the same quote surface and shows a fresh post-outcome re-quote, not a fabricated result.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProtocolBadge
              label={postOutcomeQuoteLabel}
              tone={claimResolved ? (postOutcomeQuote ? getModeTone(postOutcomeQuote.recommended_mode) : 'gold') : 'slate'}
            />
            <button
              type="button"
              onClick={() => void previewPostOutcomeQuote()}
              disabled={postOutcomeQuoteLoading || !claimResolved}
              className="rounded-lg border border-[var(--border-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-dim)] transition hover:border-[var(--border-gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {postOutcomeQuoteLoading ? (zh ? '重跑中…' : 'Re-running…') : (zh ? '刷新 post-resolution quote' : 'Refresh Post-resolution Quote')}
            </button>
          </div>
        </div>

        {postOutcomeQuoteError ? <NoticeBanner title={zh ? '重报价失败' : 'Re-quote Error'} message={postOutcomeQuoteError} tone="warning" /> : null}

        {claimResolved ? (
          postOutcomeQuote ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  {zh ? 're-quote 风险分' : 'Re-Quote Risk Score'}
                </p>
                <p className="mt-1 font-mono text-lg text-[var(--gold)]">{postOutcomeQuote.risk_score}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  {zh ? 're-quote 模式' : 'Re-Quote Mode'}
                </p>
                <div className="mt-1">
                  <ProtocolBadge label={labelMode(postOutcomeQuote.recommended_mode, zh)} tone={getModeTone(postOutcomeQuote.recommended_mode)} />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  {zh ? 're-quote 保费' : 'Re-Quote Premium'}
                </p>
                <p className="mt-1 font-mono text-lg text-[var(--text-primary)]">{formatUsd(postOutcomeQuote.premium_amount)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface)] p-3">
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  {zh ? '变化说明' : 'Change Note'}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {quote
                    ? (
                      postOutcomeQuote.risk_score === quote.risk_score &&
                      postOutcomeQuote.recommended_mode === quote.recommended_mode &&
                      postOutcomeQuote.premium_amount === quote.premium_amount
                    )
                      ? (zh ? '当前 re-quote 仍与先前 quote 一致；这保持了叙事诚实，不虚构 repricing。' : 'The post-outcome re-quote still matches the original quote, which keeps the story honest instead of inventing repricing.')
                      : (zh ? 're-quote 已经和先前 quote 出现差异，说明结果反馈进入了定价。' : 'The re-quote now differs from the original quote, showing that outcome feedback reached pricing.')
                    : (zh ? '先生成当前 quote，再对比结果后 re-quote。' : 'Generate the current quote first, then compare it with the post-outcome re-quote.')}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              label={
                zh
                  ? 'claim 已裁决，post-resolution re-quote 槽位已解锁。点击右上角按钮，重新运行同一 quote 入口即可。'
                  : 'The claim is resolved and the post-resolution re-quote slot is unlocked. Use the button above to rerun the same quote surface.'
              }
            />
          )
        ) : (
          <EmptyState
            label={
              zh
                ? '等待 claim 裁决后，这里会成为 post-resolution re-quote 入口；当前不会提前伪造 outcome。'
                : 'After claim resolution, this area becomes the post-resolution re-quote entry. No outcome is fabricated ahead of time.'
            }
          />
        )}
      </div>
    </section>
  )
}
