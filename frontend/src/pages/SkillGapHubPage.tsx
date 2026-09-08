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
    return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-[#b8b3a8]"><Loader2 className="h-5 w-5 animate-spin text-[#c9a96e]" />Loading careers to compare...</section>;
  }

  return (
    <section className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div className="editorial-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 p-3 text-[#c9a96e]"><Target className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Skill gap analysis</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#f2efe7]">Choose a career to compare.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#b8b3a8]">See which skills already align with a career and which ones are worth building next.</p>
          </div>
        </div>
      </div>

      {error ? <p role="alert" className="mt-8 border border-[#7a2f34]/50 bg-[#7a2f34]/10 p-4 text-[#f1d7d9]">{error}</p> : recommendations.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-dashed border-white/10 bg-[#1b1a17]/80 p-8 text-[#b8b3a8]">Complete your profile or assessment to generate careers for comparison.</div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {recommendations.map((career) => (
            <button type="button" key={career.careerId} onClick={() => onNavigate(`/skill-gap/${career.careerId}`)} className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-[#22211d]/80 p-5 text-left transition hover:-translate-y-1 hover:border-[#c9a96e]/40 hover:bg-[#2a2723]">
              <span>
                <span className="block text-lg font-semibold text-[#f2efe7]">{career.careerName}</span>
                <span className="mt-1 block text-sm text-[#b8b3a8]">{career.matchScore}% match</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#e3d7b8]">Open <ArrowRight className="h-4 w-4" /></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
