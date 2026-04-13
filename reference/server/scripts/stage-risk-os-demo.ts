import '../config/load-env.js';
import { ethers } from 'ethers';
import { getPool, initDB, withTransaction } from '../db/postgres.js';
import { getACPClient } from '../erc8183/acp-client.js';
import { getSharedProvider } from '../onchainos/shared-signers.js';

type DemoRole = 'buyer' | 'seller';

interface DemoAgentConfig {
  role: DemoRole;
  agentId: string;
  name: string;
  archetype: string;
  walletAddress: string;
  okxAccountId: string;
  okxAccountName: string | null;
  erc8004TokenId: number | null;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readOptionalInt(name: string, fallback: number | null): number | null {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric env var: ${name}`);
  }
  return parsed;
}

function loadAgentConfig(role: DemoRole): DemoAgentConfig {
  const upper = role.toUpperCase();
  const defaultAgentId = role === 'buyer' ? 'oracle' : 'fox';
  const defaultName = role === 'buyer' ? 'Oracle' : 'Fox';
  const defaultArchetype = role === 'buyer' ? 'oracle' : 'fox';
  const defaultTokenId = role === 'buyer' ? 6 : 3;

  return {
    role,
    agentId: process.env[`RISK_OS_DEMO_${upper}_AGENT_ID`]?.trim() || defaultAgentId,
    name: process.env[`RISK_OS_DEMO_${upper}_NAME`]?.trim() || defaultName,
    archetype: process.env[`RISK_OS_DEMO_${upper}_ARCHETYPE`]?.trim() || defaultArchetype,
    walletAddress: ethers.getAddress(readRequiredEnv(`RISK_OS_DEMO_${upper}_WALLET`)),
    okxAccountId: readRequiredEnv(`RISK_OS_DEMO_${upper}_OKX_ACCOUNT_ID`),
    okxAccountName: process.env[`RISK_OS_DEMO_${upper}_OKX_ACCOUNT_NAME`]?.trim() || null,
    erc8004TokenId: readOptionalInt(`RISK_OS_DEMO_${upper}_TOKEN_ID`, defaultTokenId),
  };
}

async function upsertDemoAgent(config: DemoAgentConfig): Promise<void> {
  const walletCapabilities = JSON.stringify(['wallet_addresses', 'contract_call', 'x402_sign']);
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO agents (
         agent_id,
         name,
         wallet_address,
         archetype,
         risk_tolerance,
         balance,
         initial_balance,
         reputation_score,
         is_alive,
         erc8004_token_id,
         tee_key_ref,
         tee_wallet_source,
         wallet_provider,
         okx_account_id,
         okx_account_name,
         okx_login_type,
         wallet_capabilities,
         wallet_provisioned_at
       ) VALUES (
         $1, $2, $3, $4, 0.50, 100.000000, 100.000000, 500, true, $5, $6, 'okx_agentic_wallet', 'okx_agentic_wallet', $7, $8, 'email', $9::jsonb, NOW()
       )
       ON CONFLICT (agent_id) DO UPDATE
       SET name = EXCLUDED.name,
           wallet_address = EXCLUDED.wallet_address,
           archetype = EXCLUDED.archetype,
           erc8004_token_id = EXCLUDED.erc8004_token_id,
           tee_key_ref = EXCLUDED.tee_key_ref,
           tee_wallet_source = EXCLUDED.tee_wallet_source,
           wallet_provider = EXCLUDED.wallet_provider,
           okx_account_id = EXCLUDED.okx_account_id,
           okx_account_name = EXCLUDED.okx_account_name,
           okx_login_type = EXCLUDED.okx_login_type,
           wallet_capabilities = EXCLUDED.wallet_capabilities,
           wallet_provisioned_at = NOW(),
           is_alive = true`,
      [
        config.agentId,
        config.name,
        config.walletAddress,
        config.archetype,
        config.erc8004TokenId,
        config.okxAccountId,
        config.okxAccountId,
        config.okxAccountName,
        walletCapabilities,
      ],
    );
  });
}

async function seedReferenceIntel(params: {
  sellerAgentId: string;
  buyerAgentId: string;
  price: number;
}): Promise<number> {
  const pool = getPool();
  await pool.query(`DELETE FROM arena_matches`);
  await pool.query(`DELETE FROM tick_snapshots`);
  await pool.query(`DELETE FROM purchase_claims`);
  await pool.query(`DELETE FROM protected_intel_purchases`);
  await pool.query(`DELETE FROM risk_quotes`);
  await pool.query(`DELETE FROM intel_purchases`);
  await pool.query(`DELETE FROM acp_jobs`);
  await pool.query(`DELETE FROM intel_items`);

  await pool.query(
    `INSERT INTO intel_credit_scores (
       agent_id,
       total_produced,
       total_verified,
       average_accuracy,
       fake_count,
       credit_score,
       tier,
       updated_at
     ) VALUES ($1, 9, 3, 0.57, 1, 42.0, 'guarded', NOW())
     ON CONFLICT (agent_id) DO UPDATE
     SET total_produced = EXCLUDED.total_produced,
         total_verified = EXCLUDED.total_verified,
         average_accuracy = EXCLUDED.average_accuracy,
         fake_count = EXCLUDED.fake_count,
         credit_score = EXCLUDED.credit_score,
         tier = EXCLUDED.tier,
         updated_at = NOW()`,
    [params.sellerAgentId],
  );

  await pool.query(
    `INSERT INTO economy_state (
       tick_number,
       total_agent_balance,
       treasury_balance,
       target_money_supply,
       actual_ratio,
       pg_base_injection,
       pd_treasury_cut,
       pp_treasury_cut,
       economy_phase
     ) VALUES (1, 200.000000, 0.000000, 200.000000, 1.0000, 0.5, 0.08, 0.25, 'stable')
     ON CONFLICT DO NOTHING`,
  ).catch(() => undefined);

  await pool.query(
    `UPDATE agents
     SET reputation_score = CASE
       WHEN agent_id = $1 THEN 640
       ELSE reputation_score
     END
     WHERE agent_id IN ($1, $2)`,
    [params.buyerAgentId, params.sellerAgentId],
  );

  for (let index = 0; index < 4; index += 1) {
    await pool.query(
      `INSERT INTO arena_matches (
         match_type,
         player_a_id,
         player_b_id,
         status,
         current_round,
         settled_at
       ) VALUES (
         'prisoners_dilemma',
         $1,
         $2,
         'settled',
         1,
         NOW() - ($3 || ' minutes')::interval
       )`,
      [params.buyerAgentId, params.sellerAgentId, String(20 - index)],
    );
  }

  await pool.query(
    `INSERT INTO tick_snapshots (
       agent_balances,
       agent_reputations,
       active_arena_count,
       total_posts_today,
       total_x402_volume,
       world_regime,
       active_modifier_count,
       active_event_count,
       average_valence,
       average_arousal,
       effective_average_valence,
       effective_average_arousal
     )
     SELECT
       $1::jsonb,
       $2::jsonb,
       0,
       0,
       0.000000,
       'stable',
       0,
       0,
       0,
       0,
       0,
       0
     FROM generate_series(1, 40)`,
    [
      JSON.stringify({
        [params.buyerAgentId]: '135.000000',
        [params.sellerAgentId]: '95.000000',
      }),
      JSON.stringify({
        [params.buyerAgentId]: 640,
        [params.sellerAgentId]: 500,
      }),
    ],
  );

  const content = {
    thesis: 'Seller claims a high-confidence behavioral edge in the next arena round.',
    confidence: 0.81,
    signal: 'counterparty will defect after two apparent cooperation rounds',
    why_it_matters: 'Designed to exercise protected intel commerce and post-outcome repricing.',
  };

  const insert = await pool.query<{ id: number }>(
    `INSERT INTO intel_items (
       category,
       producer_agent_id,
       subject_agent_id,
       content,
       accuracy,
       declared_accuracy,
       is_fake,
       freshness,
       price,
       buyer_count,
       is_public,
       status,
       expires_at_tick,
       created_at_tick
     ) VALUES (
       'behavior_pattern',
       $1,
       $2,
       $3::jsonb,
       0.57,
       0.81,
       false,
       1.0,
       $4,
       0,
       false,
       'active',
       120,
       1
     )
     RETURNING id`,
    [
      params.sellerAgentId,
      params.buyerAgentId,
      JSON.stringify(content),
      params.price.toFixed(6),
    ],
  );

  return insert.rows[0].id;
}

async function printWalletFunding(config: DemoAgentConfig): Promise<void> {
  const provider = getSharedProvider();
  const protocol = await getACPClient().getProtocolDescriptor();
  const tokenAddress = protocol.paymentToken;
  if (!tokenAddress) {
    throw new Error('ACP payment token is not configured');
  }

  const erc20 = new ethers.Contract(
    tokenAddress,
    ['function balanceOf(address owner) view returns (uint256)'],
    provider,
  );

  const [nativeRaw, tokenRaw] = await Promise.all([
    provider.getBalance(config.walletAddress),
    erc20.balanceOf(config.walletAddress),
  ]);

  console.log(
    `[RiskOS Demo] ${config.role} ${config.agentId} -> ${config.walletAddress} | OKB ${ethers.formatEther(nativeRaw)} | USDT ${ethers.formatUnits(tokenRaw, 6)}`,
  );
}

async function main(): Promise<void> {
  await initDB();
  const buyer = loadAgentConfig('buyer');
  const seller = loadAgentConfig('seller');
  const price = Number(process.env.RISK_OS_DEMO_INTEL_PRICE ?? '0.250000');
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('RISK_OS_DEMO_INTEL_PRICE must be a positive number');
  }

  await upsertDemoAgent(buyer);
  await upsertDemoAgent(seller);
  const intelItemId = await seedReferenceIntel({
    sellerAgentId: seller.agentId,
    buyerAgentId: buyer.agentId,
    price,
  });

  await printWalletFunding(buyer);
  await printWalletFunding(seller);

  console.log('[RiskOS Demo] staged reference actors and intel item');
  console.log(JSON.stringify({
    buyer: {
      agentId: buyer.agentId,
      walletAddress: buyer.walletAddress,
      okxAccountId: buyer.okxAccountId,
      erc8004TokenId: buyer.erc8004TokenId,
    },
    seller: {
      agentId: seller.agentId,
      walletAddress: seller.walletAddress,
      okxAccountId: seller.okxAccountId,
      erc8004TokenId: seller.erc8004TokenId,
    },
    intelItemId,
    price: price.toFixed(6),
  }, null, 2));
}

main().catch((error) => {
  console.error('[RiskOS Demo] staging failed:', error);
  process.exit(1);
});
