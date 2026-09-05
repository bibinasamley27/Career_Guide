import { useEffect, useState } from 'react';
import { Bookmark, Loader2, Target } from 'lucide-react';
import { ApiError, CareerRecommendation, careerApi } from '../lib/api';

interface Props { onNavigate: (path: string) => void; }
const scoreTone = (score: number) => score >= 70 ? 'text-emerald-300' : score >= 45 ? 'text-amber-300' : 'text-slate-300';

export default function RecommendationsPage({ onNavigate }: Props) {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([careerApi.recommendations(), careerApi.saved()])
      .then(([matches, saved]) => {
        setRecommendations(matches.recommendations);
        setHasProfile(matches.hasProfile);
        setHasAssessment(matches.hasAssessment);
        setSavedIds(saved.savedCareers.map((item) => item.careerId));
      })
      .catch((loadError) => setError(loadError instanceof ApiError ? loadError.message : 'Unable to load recommendations.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleSave = async (careerId: string, careerName: string) => {
    setSaving(careerId); setError(null); setFeedback(null);
    try {
      if (savedIds.includes(careerId)) {
        await careerApi.unsave(careerId);
        setSavedIds((current) => current.filter((id) => id !== careerId));
        setFeedback(`${careerName} removed from saved careers.`);
      } else {
        await careerApi.save(careerId);
        setSavedIds((current) => [...current, careerId]);
        setFeedback(`${careerName} saved.`);
      }
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to update saved careers.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-slate-300"><Loader2 className="h-5 w-5 animate-spin text-sky-300" />Calculating your matches...</section>;
  if (error && recommendations.length === 0) return <section className="mx-auto max-w-6xl px-6 py-16"><p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">{error}</p></section>;

  return (
    <section className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3 text-sky-300"><Target className="h-6 w-6" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Career recommendations</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Paths worth exploring next.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">These guidance scores are calculated from your profile, skills, interests, and assessment. They are signals for exploration, not promises.</p>
        </div>
      </div>

      {(!hasProfile || !hasAssessment) && (
        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {!hasProfile && !hasAssessment ? 'Complete your profile and assessment to make these matches more personal.' : !hasProfile ? 'Complete your profile to strengthen these matches.' : 'Complete the assessment to add more signals to these matches.'}
        </div>
      )}

      {(error || feedback) && <p role={error ? 'alert' : 'status'} className={`mt-6 rounded-2xl border p-4 text-sm ${error ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>{error || feedback}</p>}

      {recommendations.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-dashed border-white/10 bg-[#0b1220]/70 p-8 text-slate-400">No careers are available to compare yet.</div>
      ) : (
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {recommendations.map((item, index) => (
            <article key={item.careerId} className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_14px_48px_rgba(15,23,42,0.26)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">#{index + 1} recommendation</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{item.careerName}</h2>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-semibold ${scoreTone(item.matchScore)}`}>{item.matchScore}<span className="text-base text-slate-500">/100</span></p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-300">{item.explanation}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Matching skills</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {item.matchedSkills.slice(0, 3).map((skill) => <li key={skill} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{skill}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Skills to develop</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {item.missingSkills.slice(0, 3).map((skill) => <li key={skill} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />{skill}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-400"><Bookmark className="h-4 w-4 text-sky-300" />{item.matchingInterests.length} matching interests</div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => onNavigate(`/career-guide/${item.careerId}`)} className="premium-button">Build Personalized Plan</button>
                  <button type="button" onClick={() => void toggleSave(item.careerId, item.careerName)} disabled={saving === item.careerId} className="premium-button-secondary disabled:cursor-not-allowed disabled:opacity-60">
                    {saving === item.careerId ? 'Working...' : savedIds.includes(item.careerId) ? 'Saved' : 'Save career'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
