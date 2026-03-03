/** SSE helper — write a typed event to the response stream */
export function sse(res, type, payload = {}) {
  res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
}
