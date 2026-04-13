import { RuntimeState } from './runtime-state.mjs';

export { RuntimeState };

export default {
  async fetch(request, env) {
    const id = env.RUNTIME_STATE.idFromName('bundled');
    return env.RUNTIME_STATE.get(id).fetch(request);
  },
};
