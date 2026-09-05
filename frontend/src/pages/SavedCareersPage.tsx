import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { ApiError, careerApi, SavedCareer } from '../lib/api';

interface Props { onNavigate: (path: string) => void; }

export default function SavedCareersPage({ onNavigate }: Props) {
  const [saved, setSaved] = useState<SavedCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setSaved((await careerApi.saved()).savedCareers); }
    catch (loadError) { setError(loadError instanceof ApiError ? loadError.message : 'Unable to load saved careers.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const remove = async (careerId: string) => {
    setRemoving(careerId); setError(null);
    try { await careerApi.unsave(careerId); setSaved((current) => current.filter((item) => item.careerId !== careerId)); }
    catch (removeError) { setError(removeError instanceof ApiError ? removeError.message : 'Unable to remove this career.'); }
    finally { setRemoving(null); }
  };

  if (loading) return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading saved careers...</section>;
  return <section className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Saved careers</p><h1 className="mt-3 text-4xl font-semibold text-white">Keep promising paths close.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">Return to a career, inspect its skill gap, or continue into a personalized roadmap.</p>{error && <p role="alert" className="mt-6 border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">{error}</p>}{saved.length === 0 ? <div className="mt-10 border border-dashed border-slate-600 p-8 text-slate-400">You haven't saved any careers yet. Explore your recommendations to find a career that fits you.</div> : <div className="mt-10 grid gap-5 lg:grid-cols-2">{saved.map((item) => <article key={item.id} className="border border-slate-700/70 bg-slate-900/60 p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold text-white">{item.careerName}</h2><p className="mt-1 text-sm text-cyan-300">{item.domain}</p></div>{item.matchScore && <span className="text-2xl font-semibold text-amber-300">{item.matchScore.matchScore}/100</span>}</div><p className="mt-5 text-sm leading-7 text-slate-300">{item.description}</p><p className="mt-4 text-xs text-slate-500">Saved {new Date(item.savedAt).toLocaleDateString()}</p><div className="mt-5 flex flex-wrap gap-4 border-t border-slate-700 pt-4"><button type="button" onClick={() => onNavigate(`/skill-gap/${item.careerId}`)} className="flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">View skill gap<ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => onNavigate(`/career-guide/${item.careerId}`)} className="bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">Open career guide</button><button type="button" disabled={removing === item.careerId} onClick={() => void remove(item.careerId)} className="flex items-center gap-2 text-sm text-rose-200 hover:text-rose-100 disabled:opacity-50"><Trash2 className="h-4 w-4" />{removing === item.careerId ? 'Removing...' : 'Remove'}</button></div></article>)}</div>}</section>;
}
