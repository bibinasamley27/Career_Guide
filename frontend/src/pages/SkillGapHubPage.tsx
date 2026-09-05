import { ArrowRight, Loader2, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, CareerRecommendation, careerApi } from '../lib/api';

interface SkillGapHubPageProps {
  onNavigate: (path: string) => void;
}

export default function SkillGapHubPage({ onNavigate }: SkillGapHubPageProps) {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    careerApi.recommendations()
      .then((result) => setRecommendations(result.recommendations))
      .catch((loadError) => setError(loadError instanceof ApiError ? loadError.message : 'Unable to load careers for skill-gap analysis.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-slate-300"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" />Loading careers to compare...</section>;
  }

  return (
    <section className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-amber-300"><Target className="h-6 w-6" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Skill gap analysis</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Choose a career to compare.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">See which skills already align with a career and which ones are worth building next.</p>
        </div>
      </div>

      {error ? <p role="alert" className="mt-8 border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">{error}</p> : recommendations.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-dashed border-white/10 bg-[#0b1220]/70 p-8 text-slate-400">Complete your profile or assessment to generate careers for comparison.</div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {recommendations.map((career) => (
            <button type="button" key={career.careerId} onClick={() => onNavigate(`/skill-gap/${career.careerId}`)} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5 text-left transition hover:border-cyan-300/40 hover:bg-[#102033]">
              <span>
                <span className="block text-lg font-semibold text-white">{career.careerName}</span>
                <span className="mt-1 block text-sm text-slate-400">{career.matchScore}% match</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-cyan-300" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
