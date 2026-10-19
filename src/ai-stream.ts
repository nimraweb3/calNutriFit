/** Bounded SSE reader shared by both AI surfaces. Never log prompts or tokens. */
export async function readChatStream(response: Response, onText?: (text: string) => void): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw Error('No response stream was received.');
  const decoder = new TextDecoder();
  let buffer = '', output = '', bytes = 0, complete = false;
  const consume = (line: string) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim();
    if (!payload) return;
    if (payload === '[DONE]') { complete = true; return; }
    let event;
    try { event = JSON.parse(payload); } catch { throw Error('The AI response was interrupted. Please retry.'); }
    if (event.error) throw Error('The AI service could not finish this response.');
    const text = event.choices?.[0]?.delta?.content;
    if (typeof text === 'string') {
      output += text;
      if (output.length > 50000) throw Error('The AI response was too large. Try fewer ingredients.');
      onText?.(output);
    }
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      bytes += value?.byteLength || 0;
      if (bytes > 1000000) throw Error('The AI response was too large.');
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split('\n'); buffer = lines.pop() || '';
      lines.forEach(consume);
      if (done || complete) { if (buffer.trim() && !complete) consume(buffer); break; }
    }
    if (!complete || !output.trim()) throw Error('The AI response did not finish. Nothing was saved. Please retry.');
    return output;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
