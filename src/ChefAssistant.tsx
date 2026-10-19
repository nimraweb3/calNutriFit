import { readChatStream } from './ai-stream';
import { useEffect, useRef, useState } from 'react';
import { ChefHat, Send, Square, RefreshCw } from 'lucide-react';
import { backendUrl, publicKey, cloud } from './backend';
export default function ChefAssistant() {
    const [input, setInput] = useState(''), [answer, setAnswer] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false); const controller = useRef<AbortController | null>(null);
    useEffect(() => () => controller.current?.abort(), []);
    async function send() {
        if (!input.trim() || busy) return; setError(''); setAnswer(''); setBusy(true); controller.current = new AbortController(); try {
            const { data: { session } } = await cloud!.auth.getSession(); if (!session) throw Error('Sign in before using the AI chef.');
            const response = await fetch(`${backendUrl}/functions/v1/chef-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: publicKey, Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ messages: [{ role: 'user', content: `Suggest a practical recipe using these ingredients: ${input}. Ask about allergies when relevant. Give quantities, servings, steps, substitutions and approximate nutrition with assumptions. Do not diagnose or prescribe. No profile data has been supplied.` }] }), signal: AbortSignal.any([controller.current.signal, AbortSignal.timeout(60000)]) });
            if (!response.ok) throw Error(response.status === 429 ? 'The chef is busy. Wait a moment and retry.' : response.status === 402 ? 'The existing AI service has no credits available.' : response.status === 401 ? 'Your session expired. Sign in again.' : 'The existing AI function could not complete this request.');
            await readChatStream(response, setAnswer);
        } catch (e) { if ((e as Error).name === 'AbortError') setError('Response stopped. You can retry when ready.'); else setError((e as Error).name === 'TimeoutError' ? 'The chef took too long. Please retry.' : (e as Error).message) } finally { setBusy(false); controller.current = null }
    }
    return <div><div className="notice"><ChefHat size={22} />Your ingredients are sent to the existing Nutrio AI service. Your health profile and journal are not sent.</div><label className="field"><span>Ingredients, allergies, and preferences</span><textarea rows={4} maxLength={3000} placeholder="Chicken, yogurt, rice, tomatoes…" value={input} onChange={e => setInput(e.target.value)} /></label><div className="chef-actions"><button className="button" disabled={busy || !input.trim() || !cloud} onClick={send}>{error ? <RefreshCw size={16} /> : <Send size={16} />} {busy ? 'Preparing ideas…' : error ? 'Retry' : 'Ask the chef'}</button>{busy && <button className="button secondary" onClick={() => controller.current?.abort()}><Square size={15} />Stop</button>}</div>{error && <p role="alert" className="notice error">{error}</p>}{answer && <div className="chef-response" aria-live="polite">{answer}</div>}<p className="help">AI suggestions can be inaccurate. Nutrition is estimated and depends on your actual ingredients and measurements.</p></div>
}
