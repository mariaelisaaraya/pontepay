// The DeFindex SDK's http-client rejects with the raw API response body
// (a plain object like { message, error, statusCode }), not an Error instance,
// so routes must unwrap both shapes to surface a useful message.
export function defindexErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;

  if (e && typeof e === 'object') {
    const { message, error } = e as { message?: string | string[]; error?: string };
    const text = Array.isArray(message) ? message.join('; ') : message;
    if (text) return error ? `${error}: ${text}` : text;
    if (error) return error;
  }

  return fallback;
}
