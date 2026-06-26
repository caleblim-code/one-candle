export function sanitize(input: string | null | undefined): string | null {
  if (input == null) return input === null ? null : '';
  
  // Basic HTML tag stripping
  return input.replace(/<\/?[^>]+(>|$)/g, "");
}

export function sanitizeObj<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = sanitize(result[key]) as any;
    }
  }
  return result;
}
