import { describe, it, expect } from 'vitest';
import { readChatStream } from './ai-stream';
const response = (text: string) => new Response(text);
describe('AI streaming reliability', () => {
  it('combines deltas and requires completion', async () => {
    expect(await readChatStream(response('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n'))).toBe('Hello');
  });
  it('rejects truncated output instead of silently accepting it', async () => {
    await expect(readChatStream(response('data: {"choices":[{"delta":{"content":"Half"}}]}\n'))).rejects.toThrow('did not finish');
  });
  it('reports malformed complete events', async () => {
    await expect(readChatStream(response('data: broken\n'))).rejects.toThrow('interrupted');
  });
  it('limits response size', async () => {
    await expect(readChatStream(response('data: '+JSON.stringify({choices:[{delta:{content:'a'.repeat(50001)}}]})+'\n'))).rejects.toThrow('too large');
  });
});
