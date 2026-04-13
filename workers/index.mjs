import { RuntimeState } from './runtime-state.mjs';

export { RuntimeState };

function resolveSessionKey(request) {
  const url = new URL(request.url);
  const explicitSession =
    url.searchParams.get('session') ||
    request.headers.get('x-civilis-runtime-session');

  if (explicitSession) {
    return explicitSession.trim();
  }

  const ip = request.headers.get('cf-connecting-ip') || 'anon';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

export default {
  async fetch(request, env) {
    const sessionKey = resolveSessionKey(request);
    const id = env.RUNTIME_STATE.idFromName(`bundled:${sessionKey}`);
    return env.RUNTIME_STATE.get(id).fetch(request);
  },
};
