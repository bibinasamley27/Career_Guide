import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Flame, Loader2, Target } from 'lucide-react';
import { ApiError, careerApi, SkillGapItem, SkillGapResult } from '../lib/api';

interface SkillGapPageProps {
  careerId: string;
  onNavigate: (path: string) => void;
}

const SkillList = ({ title, items, tone }: { title: string; items: SkillGapItem[]; tone: 'green' | 'amber' | 'slate' }) => {
  const styles = { green: 'text-emerald-300 border-emerald-300/20 bg-emerald-300/10', amber: 'text-amber-200 border-amber-300/20 bg-amber-300/10', slate: 'text-slate-200 border-slate-600 bg-slate-800/60' };

  return (
    <div className="editorial-panel rounded-[24px] p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? items.map((item) => (
          <span key={item.name} className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-sm ${styles[tone]}`}>
            {tone === 'green' && <Check className="h-4 w-4" />}
            {item.name}
          </span>
        )) : <span className="text-sm text-slate-500">None recorded</span>}
      </div>
    </div>
  );
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

  if (isLoading) {
    return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-[#b8b3a8]"><Loader2 className="h-5 w-5 animate-spin text-[#c9a96e]" />Comparing your skills...</section>;
  }

  if (error) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p role="alert" className="border border-[#7a2f34]/50 bg-[#7a2f34]/10 p-4 text-[#f1d7d9]">{error}</p>
        <button type="button" onClick={() => onNavigate('/recommendations')} className="mt-5 flex items-center gap-2 text-sm text-[#c9a96e]"><ArrowLeft className="h-4 w-4" />Back to recommendations</button>
      </section>
    );
  }

  if (!result) {
    return <section className="mx-auto max-w-6xl px-6 py-16 text-slate-400">No skill-gap data is available.</section>;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => onNavigate('/recommendations')} className="flex items-center gap-2 text-sm text-[#b8b3a8] transition hover:text-[#c9a96e]">
        <ArrowLeft className="h-4 w-4" />Back to recommendations
      </button>

      <div className="editorial-panel mt-8 rounded-[30px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="border border-[#c9a96e]/30 bg-[#c9a96e]/10 p-3 text-[#c9a96e]"><Target className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9a96e]">Skill gap analysis</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#f2efe7]">{result.careerName}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#b8b3a8]">A transparent comparison against the skills in the Career Guide knowledge base. Coverage is an indicator of current alignment, not a probability of success.</p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="editorial-panel rounded-[28px] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#b8b3a8]">Your skill coverage</p>
          <p className="mt-4 text-6xl font-semibold text-[#c9a96e]">{result.skillCoverage}<span className="text-2xl text-[#b8b3a8]">%</span></p>
          <div className="mt-5 h-3 bg-[#2a2723]"><div className="h-3 bg-gradient-to-r from-[#d8c19a] to-[#c9a96e]" style={{ width: `${result.skillCoverage}%` }} /></div>
          <p className="mt-4 text-sm text-[#b8b3a8]">{result.matchedSkillCount} of {result.totalRequiredSkills} career skills currently meet the required proficiency.</p>
        </div>

        <div className="editorial-panel rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-[#f2efe7]">Priority skills</h2>
          <p className="mt-2 text-sm text-[#b8b3a8]">Required skills are ranked high priority; preferred supporting skills are ranked medium priority.</p>
          <div className="mt-5 space-y-3">
            {result.prioritySkills.length ? result.prioritySkills.map((skill) => (
              <div key={skill.name} className="flex items-start gap-3 border border-white/10 bg-[#0d0d0c]/70 p-3">
                <Flame className="h-4 w-4 text-[#d7be85]" />
                <div>
                  <p className="text-sm font-semibold text-[#f2efe7]">{skill.name}</p>
                  <p className="mt-1 text-xs text-[#b8b3a8]">{skill.reason || skill.requiredProficiency}</p>
                </div>
              </div>
            )) : <p className="text-sm text-[#b8b3a8]">No priority skills identified.</p>}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <SkillList title="Already aligned" items={result.existingSkills ?? []} tone="green" />
        <SkillList title="Needs attention" items={result.missingSkills ?? []} tone="amber" />
        <SkillList title="Partially matched" items={result.partialSkills ?? []} tone="slate" />

        <div className="editorial-panel rounded-[24px] p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#b8b3a8]">Next action</h3>
          <p className="mt-3 text-lg font-semibold text-[#f2efe7]">Build the highest-impact skill first, then review the recommended path and resources.</p>
          <button type="button" onClick={() => onNavigate(`/career-guide/${careerId}`)} className="premium-button mt-5">View roadmap</button>
        </div>
      </div>
    </section>
  );
}
