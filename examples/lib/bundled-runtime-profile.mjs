export const BUNDLED_RUNTIME_PORT = 3401;
export const BUNDLED_RUNTIME_BASE_URL = `http://127.0.0.1:${BUNDLED_RUNTIME_PORT}`;

export const BUNDLED_RUNTIME_AUTH = {
  claimantToken: 'bundled-claimant-token',
  evaluatorToken: 'bundled-evaluator-token',
  claimantSignature: '',
  evaluatorSignature: '',
};

export function isLocalRuntimeUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
}
