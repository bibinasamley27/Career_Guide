import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Flame, Loader2, Target } from 'lucide-react';
import { ApiError, careerApi, SkillGapResult } from '../lib/api';

interface SkillGapPageProps {
  careerId: string;
  onNavigate: (path: string) => void;
}

const SkillList = ({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' | 'slate' }) => {
  const styles = { green: 'text-emerald-300 border-emerald-300/20 bg-emerald-300/10', amber: 'text-amber-200 border-amber-300/20 bg-amber-300/10', slate: 'text-slate-200 border-slate-600 bg-slate-800/60' };
  return <div><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{title}</h3><div className="mt-3 flex flex-wrap gap-2">{items.length ? items.map((item) => <span key={item} className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-sm ${styles[tone]}`}>{tone === 'green' && <Check className="h-4 w-4" />}{item}</span>) : <span className="text-sm text-slate-500">None recorded</span>}</div></div>;
};

export default function SkillGapPage({ careerId, onNavigate }: SkillGapPageProps) {
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setResult(await careerApi.skillGap(careerId));
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : 'Unable to load the skill gap.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [careerId]);

  if (isLoading) return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Comparing your skills...</section>;
  if (error) return <section className="mx-auto max-w-6xl px-6 py-16"><p role="alert" className="border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">{error}</p><button type="button" onClick={() => onNavigate('/recommendations')} className="mt-5 flex items-center gap-2 text-sm text-cyan-300"><ArrowLeft className="h-4 w-4" />Back to recommendations</button></section>;
  if (!result) return <section className="mx-auto max-w-6xl px-6 py-16 text-slate-400">No skill-gap data is available.</section>;

  return <section className="mx-auto max-w-6xl px-6 py-10"><button type="button" onClick={() => onNavigate('/recommendations')} className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-200"><ArrowLeft className="h-4 w-4" />Back to recommendations</button><div className="mt-8 flex items-start gap-4"><div className="border border-amber-300/30 bg-amber-300/10 p-3 text-amber-300"><Target className="h-6 w-6" /></div><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Skill gap analysis</p><h1 className="mt-3 text-4xl font-semibold text-white">{result.careerName}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">A transparent comparison against the skills in the Career Guide knowledge base. Coverage is an indicator of current alignment, not a probability of success.</p></div></div><div className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="border border-slate-700/70 bg-slate-900/60 p-6"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Your skill coverage</p><p className="mt-4 text-6xl font-semibold text-cyan-300">{result.skillCoverage}<span className="text-2xl text-slate-500">%</span></p><div className="mt-5 h-3 bg-slate-800"><div className="h-3 bg-cyan-300" style={{ width: `${result.skillCoverage}%` }} /></div><p className="mt-4 text-sm text-slate-400">{result.matchedSkillCount} of {result.totalRequiredSkills} career skills currently meet the required proficiency.</p></div><div className="border border-slate-700/70 bg-slate-900/60 p-6"><h2 className="text-xl font-semibold text-white">Priority skills</h2><p className="mt-2 text-sm text-slate-400">Required skills are ranked high priority; preferred supporting skills are ranked medium priority.</p><div className="mt-5 space-y-3">{result.prioritySkills.length ? result.prioritySkills.map((skill) => <div key={skill.name} className="flex items-start gap-3 border border-slate-700 bg-slate-950/40 p-3"><Flame className={`mt-0.5 h-5 w-5 ${skill.priority === 'HIGH' ? 'text-rose-300' : 'text-amber-300'}`} /><div><p className="font-medium text-slate-100">{skill.name} <span className="ml-2 text-xs uppercase tracking-wider text-slate-500">{skill.priority}</span></p><p className="mt-1 text-xs text-slate-400">{skill.reason}{skill.studentProficiency ? ` Current level: ${skill.studentProficiency.toLowerCase()}.` : ''}</p></div></div>) : <p className="text-sm text-slate-500">No skill gaps identified.</p>}</div></div></div><div className="mt-6 grid gap-6 border border-slate-700/70 bg-slate-900/60 p-6 md:grid-cols-3"><SkillList title="You already have" items={result.existingSkills.map((skill) => skill.name)} tone="green" /><SkillList title="Partial skills" items={result.partialSkills.map((skill) => `${skill.name} (${skill.studentProficiency?.toLowerCase()})`)} tone="slate" /><SkillList title="Skills to develop" items={result.missingSkills.map((skill) => skill.name)} tone="amber" /></div></section>;
}
