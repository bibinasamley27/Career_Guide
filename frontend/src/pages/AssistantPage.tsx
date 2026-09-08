import { FormEvent, useState } from 'react';
import { Bot, Check, CircleAlert, Loader2, Send, Sparkles, UserRound } from 'lucide-react';
import { agentApi, ApiError, AssistantResponse } from '../lib/api';

interface ChatMessage { role: 'user' | 'assistant'; content: string; tools?: AssistantResponse['toolsUsed']; }

const suggestions = [
  'Which career suits me best?',
  'What skills am I missing for my strongest career?',
  'Create a learning plan for me',
  'Suggest a project based on my skill gaps',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const message = (preset ?? input).trim();
    if (!message || loading) return;
    setInput('');
    setError(null);
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const response = await agentApi.chat({ message, conversationId });
      setConversationId(response.conversationId);
      setMessages((current) => [...current, { role: 'assistant', content: response.message.content, tools: response.toolsUsed }]);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The career assistant is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 py-4 lg:py-8">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]"><Sparkles className="h-4 w-4" /> Career Guide AI</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#f2efe7]">A clearer next step.</h1>
          <p className="mt-3 max-w-2xl text-[#b8b3a8]">Ask about your career matches, skill gaps, roadmap, projects, or learning priorities. Answers use your Career Guide data.</p>
        </div>
        <button type="button" onClick={() => { setMessages([]); setConversationId(undefined); setError(null); }} className="self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#d7d0c5] transition hover:border-[#c9a96e]/40 hover:text-[#f2efe7] sm:self-auto">Clear conversation</button>
      </header>

      <div className="min-h-[520px] border border-white/10 bg-[#1b1a17]/80 p-4 shadow-2xl sm:p-6">
        {messages.length === 0 ? (
          <div className="flex min-h-[390px] flex-col justify-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 text-[#d8c19a]"><Bot /></div>
            <h2 className="mt-6 text-2xl font-semibold text-[#f2efe7]">What are you working toward?</h2>
            <p className="mt-2 max-w-lg text-[#b8b3a8]">Start with one of these questions, or ask naturally. The assistant will inspect only the data belonging to your account.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void send(undefined, suggestion)} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm font-medium text-[#f2efe7] transition hover:border-[#c9a96e]/40 hover:bg-[#c9a96e]/5">{suggestion}</button>)}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#c9a96e]/10 text-[#d8c19a]"><Bot className="h-4 w-4" /></span>}
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === 'user' ? 'bg-[#d8c19a] text-[#171510]' : 'border border-white/10 bg-white/[0.04] text-[#f2efe7]'}`}>{message.content}
                  {message.tools && message.tools.length > 0 && <div className="mt-4 border-t border-white/10 pt-3 text-xs text-[#b8b3a8]"><p className="mb-2 font-semibold uppercase tracking-[0.15em] text-[#b8b3a8]">Agent activity</p>{message.tools.map((tool, toolIndex) => <div key={`${tool.name}-${toolIndex}`} className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 ${tool.status === 'success' ? 'text-emerald-300' : 'text-rose-300'}`} />{tool.name.replace(/_/g, ' ')}</div>)}</div>}
                </div>
                {message.role === 'user' && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f2efe7]"><UserRound className="h-4 w-4" /></span>}
              </div>
            ))}
            {loading && <div className="flex items-center gap-3 text-sm text-[#b8b3a8]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c9a96e]/10 text-[#d8c19a]"><Loader2 className="h-4 w-4 animate-spin" /></span>Analyzing your career context...</div>}
          </div>
        )}
      </div>

      {error && <div role="alert" className="flex items-center gap-2 border border-[#7a2f34]/50 bg-[#7a2f34]/10 p-3 text-sm text-[#f1d7d9]"><CircleAlert className="h-4 w-4" />{error}</div>}
      <form onSubmit={(event) => void send(event)} className="flex items-end gap-3 border border-white/10 bg-[#1b1a17]/80 p-3">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={2} maxLength={2000} aria-label="Ask Career Guide AI" placeholder="Ask about your next career step..." className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#f2efe7] outline-none placeholder:text-[#8d8679]" />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Send message" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d8c19a] text-[#171510] transition hover:bg-[#e5d4ad] disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
      </form>
    </section>
  );
}