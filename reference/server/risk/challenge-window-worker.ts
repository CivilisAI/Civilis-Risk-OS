import {
  runPendingDeliveryRecoveryCycle,
  runChallengeWindowReleaseCycle,
  runClaimResolutionRecoveryCycle,
} from './claim-lifecycle.js';

const WORKER_INTERVAL_MS = 30_000;

let intervalHandle: NodeJS.Timeout | null = null;
let bootstrapping: Promise<void> | null = null;

async function runWorkerCycle(): Promise<void> {
  const pendingDeliveryRecovered = await runPendingDeliveryRecoveryCycle();
  const released = await runChallengeWindowReleaseCycle();
  const recovered = await runClaimResolutionRecoveryCycle();
  if (pendingDeliveryRecovered > 0) {
    console.log(`[RiskOS] Recovered ${pendingDeliveryRecovered} pending-delivery protected purchase(s)`);
  }
  if (released > 0) {
    console.log(`[RiskOS] Auto-released ${released} protected intel purchase(s)`);
  }
  if (recovered > 0) {
    console.log(`[RiskOS] Recovered ${recovered} claim settlement(s)`);
  }
}

export function startChallengeWindowWorker(): void {
  if (intervalHandle || bootstrapping) {
    return;
  }

  bootstrapping = (async () => {
    await runWorkerCycle();
    intervalHandle = setInterval(() => {
      void runWorkerCycle();
    }, WORKER_INTERVAL_MS);
    console.log(`[RiskOS] Challenge window worker started (${WORKER_INTERVAL_MS / 1000}s interval)`);
  })().catch((error) => {
    console.error('[RiskOS] Challenge window worker bootstrap failed:', error);
  }).finally(() => {
    bootstrapping = null;
  });
}

export function stopChallengeWindowWorker(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
