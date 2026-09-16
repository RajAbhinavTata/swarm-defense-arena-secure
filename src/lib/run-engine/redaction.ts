const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/g,
  /\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi,
  /\bAKIA[A-Z0-9]{16}\b/g,
  /\b(?:Bearer\s+)[A-Za-z0-9._~-]{12,}/gi,
];

export function redactSensitiveText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let redacted = value;
  for (const pattern of SECRET_PATTERNS) redacted = redacted.replace(pattern, '[REDACTED]');
  return redacted;
}

export function redactActionValue(value: string | undefined, inputType?: string): string | undefined {
  if (value === undefined) return undefined;
  if (inputType?.toLowerCase() === 'password') return `[REDACTED ${value.length} chars]`;
  const redacted = redactSensitiveText(value) ?? '';
  return redacted === value ? value : `[REDACTED ${value.length} chars]`;
}
