/** Cohen (1988) reference thresholds, applied consistently (correctly ordered,
 * unlike the inconsistent thresholds spotted in the DataTab teardown). */
export function classifyCohenD(d: number): "negligible" | "small" | "medium" | "large" {
  const abs = Math.abs(d);
  if (abs < 0.2) return "negligible";
  if (abs < 0.5) return "small";
  if (abs < 0.8) return "medium";
  return "large";
}

export function classifyEtaSquared(eta2: number): "negligible" | "small" | "medium" | "large" {
  if (eta2 < 0.01) return "negligible";
  if (eta2 < 0.06) return "small";
  if (eta2 < 0.14) return "medium";
  return "large";
}

export function classifyCorrelationR(r: number): "negligible" | "small" | "medium" | "large" {
  const abs = Math.abs(r);
  if (abs < 0.1) return "negligible";
  if (abs < 0.3) return "small";
  if (abs < 0.5) return "medium";
  return "large";
}

export function classifyCohenF2(f2: number): "negligible" | "small" | "medium" | "large" {
  if (f2 < 0.02) return "negligible";
  if (f2 < 0.15) return "small";
  if (f2 < 0.35) return "medium";
  return "large";
}
