// Trace steps (rule ID, formula, inputs) behind every planned number. The
// "why this number" view renders them.

export interface TraceStep {
  ruleId: string;
  label: string;
  inputs: Record<string, number | string>;
  output: number;
}

export interface Warning {
  code: string;
  ruleId: string;
  values?: Record<string, number | string>;
}

export function step(
  ruleId: string,
  label: string,
  inputs: Record<string, number | string>,
  output: number,
): TraceStep {
  return { ruleId, label, inputs, output };
}
