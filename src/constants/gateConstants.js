/**
 * Centralized Gate Terminal and Cooldown Constants
 */

export const GATE_COOLDOWN = {
  MIN_EXIT_INTERVAL_MS: 60 * 1000, // 60 seconds minimum visit duration before OUT
  MIN_EXIT_INTERVAL_SECONDS: 60,
  SHORT_SCAN_COOLDOWN_MS: 2500 // 2.5 seconds short debounce cooldown per card
};

export const GATE_SCAN_COOLDOWN_MS = GATE_COOLDOWN.SHORT_SCAN_COOLDOWN_MS;
export const MIN_VISIT_DURATION_SECONDS = GATE_COOLDOWN.MIN_EXIT_INTERVAL_SECONDS;
export const MIN_VISIT_DURATION_MS = GATE_COOLDOWN.MIN_EXIT_INTERVAL_MS;
