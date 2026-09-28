const DURATION_PATTERN = /^([0-9]+)(ms|s|m|h|d)$/i;

export function parseDurationToMs(value: string): number {
  const trimmed = value.trim();
  const match = DURATION_PATTERN.exec(trimmed);

  if (!match) {
    throw new Error(`Invalid duration: "${value}". Supported units: ms, s, m, h, d.`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: "${unit}".`);
  }
}

export function isValidDurationString(value: unknown): value is string {
  return typeof value === "string" && DURATION_PATTERN.test(value.trim());
}
