// The visitor's configuration on the index page, shared by the configurator and the reserve section.
import { DEFAULT_CONFIG } from '../data/catalog.js';

let config = { ...DEFAULT_CONFIG };
const subscribers = new Set();

export const configState = {
  get: () => ({ ...config }),
  set(next) {
    config = { ...config, ...next };
    subscribers.forEach((cb) => cb({ ...config }));
  },
  subscribe(cb) {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  },
};
