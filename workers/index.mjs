import { handleRuntimeRequest } from './runtime-state.mjs';

export default {
  async fetch(request) {
    return handleRuntimeRequest(request);
  },
};
