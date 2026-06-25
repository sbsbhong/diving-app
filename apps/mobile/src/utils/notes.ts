export function firstNonBlankText(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value !== undefined && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}
