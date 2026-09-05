import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDashed, Loader2, Sparkles } from 'lucide-react';
import { assessmentApi, careerApi, CareerRecommendation, ProfileData, profileApi, SavedCareer } from '../lib/api';

interface Props { onNavigate: (path: string) => void; }

export default function StudentDashboardPage({ onNavigate }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [matches, setMatches] = useState<CareerRecommendation[]>([]);
  const [saved, setSaved] = useState<SavedCareer[]>([]);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([profileApi.get(), assessmentApi.get(), careerApi.recommendations(), careerApi.saved()])
      .then(([profileResult, assessment, recommendationResult, savedResult]) => {
        setProfile(profileResult);
        setAssessmentDone(Boolean(assessment.assessment));
        setMatches(recommendationResult.recommendations);
        setSaved(savedResult.savedCareers);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load your dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className="mx-auto flex max-w-7xl items-center gap-3 px-2 py-16 text-slate-300"><Loader2 className="h-5 w-5 animate-spin text-sky-300" />Loading your dashboard...</section>;
  }

  if (error) {
    return <section className="mx-auto max-w-7xl px-2 py-16"><p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">{error}</p></section>;
  }

  const selected = saved[0];
  const statuses: [string, boolean, string][] = [
    ['Profile', Boolean(profile?.profile), '/profile'],
    ['Skills', Boolean(profile?.skills.length), '/profile'],
    ['Interests', Boolean(profile?.interests.length), '/profile'],
    ['Assessment', assessmentDone, '/assessment'],
  ];

  const journey = [
    { label: 'Profile', complete: Boolean(profile?.profile) },
    { label: 'Assessment', complete: assessmentDone },
    { label: 'Career Match', complete: matches.length > 0 },
    { label: 'Skill Gap', complete: Boolean(matches[0]) },
    { label: 'Roadmap', complete: Boolean(selected) },
    { label: 'Career Ready', complete: Boolean(selected) },
  ];

  const nextBestStep = !assessmentDone ? 'Complete your assessment' : matches.length === 0 ? 'Explore recommended careers' : 'Review your top career match';

  return (
    <section className="space-y-8">
      <div className="rounded-[28px] border border-sky-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),transparent_33%),linear-gradient(135deg,#101c36,#0a1222_64%,#080d18)] p-6 shadow-[0_16px_60px_rgba(14,116,144,0.15)] sm:p-8">
        <div className="mb-8 rounded-[24px] border border-sky-400/20 bg-[#0d1728]/60 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Your AI Career Guide</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Let AI build your personalized career path.</h2>
            </div>
            <button type="button" onClick={() => onNavigate('/career-guide-ai')} className="premium-button">
              {matches[0] ? 'Continue My Career Plan' : 'Build My Career Plan'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 max-w-2xl text-slate-300">Your profile, strengths, assessment, and skill gaps are used to generate a more focused learning path and next step.</p>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Your career journey</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">Good morning, {profile?.profile?.name || 'student'}.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">Here’s where your career journey stands and what to focus on next.</p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
            <Sparkles className="h-4 w-4" />
            {matches[0] ? `${matches[0].careerName} is your top match` : 'Your next step is ready'}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statuses.map(([label, complete, path]) => (
            <button
              type="button"
              key={label}
              onClick={() => onNavigate(path)}
              className="group rounded-2xl border border-white/10 bg-[#0d1728]/70 p-4 text-left transition hover:-translate-y-1 hover:border-sky-300/40 hover:bg-[#102033]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm uppercase tracking-[0.18em] text-slate-400">{label}</span>
                {complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <CircleDashed className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <p className="mt-4 text-2xl font-bold text-white">{complete ? 'Complete' : 'In progress'}</p>
              <p className="mt-2 text-sm text-slate-400">{complete ? 'Ready for the next step.' : 'Finish this to improve guidance.'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.82fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_12px_48px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Next best step</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">{nextBestStep}</h2>
            </div>
            <button type="button" onClick={() => onNavigate(!assessmentDone ? '/assessment' : '/recommendations')} className="premium-button">
              <span>{!assessmentDone ? 'Start assessment' : 'View matches'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d1728]/60 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current focus</p>
            <p className="mt-3 text-2xl font-bold text-white">{matches[0] ? `${matches[0].careerName} — ${matches[0].matchScore}% match` : 'Build stronger career signals'}</p>
            <p className="mt-3 max-w-2xl text-slate-300">{matches[0] ? 'This path has the strongest alignment with your interests, profile, and assessment result.' : 'Complete your profile and assessment to unlock more specific career guidance.'}</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_12px_48px_rgba(15,23,42,0.25)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Career preview</p>
          <div className="mt-5 space-y-4">
            {matches.slice(0, 3).map((match, index) => (
              <button
                type="button"
                key={match.careerId}
                onClick={() => onNavigate(`/career-guide/${match.careerId}`)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0d1728]/60 p-4 text-left transition hover:border-sky-300/40 hover:bg-[#102033]"
              >
                <div className="flex gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-800 text-sm font-bold text-sky-300">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="text-lg font-semibold text-white">{match.careerName}</p>
                    <p className="text-sm text-slate-400">{match.matchScore}% strong match</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_12px_48px_rgba(15,23,42,0.25)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Journey roadmap</p>
          <div className="mt-6 space-y-5">
            {journey.map((step, index) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`grid h-9 w-9 place-items-center rounded-full ${step.complete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                  </div>
                  {index < journey.length - 1 && <div className="mt-2 h-8 w-px bg-white/10" />}
                </div>
                <div className="flex-1 rounded-2xl border border-white/10 bg-[#0d1728]/60 px-4 py-3">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{step.label}</p>
                  <p className="mt-1 text-base font-semibold text-white">{step.complete ? 'Completed' : 'In progress'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_12px_48px_rgba(15,23,42,0.25)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Saved focus</p>
          {selected ? (
            <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Saved career</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{selected.careerName}</h3>
              <p className="mt-3 text-sm text-slate-300">{selected.domain}</p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => onNavigate(`/skill-gap/${selected.careerId}`)} className="premium-button-secondary">Skill gap</button>
                <button type="button" onClick={() => onNavigate(`/career-guide/${selected.careerId}`)} className="premium-button">Open guide</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-[#0d1728]/60 p-5 text-slate-300">
              <p className="text-lg font-semibold text-white">No saved career yet</p>
              <p className="mt-2 text-sm text-slate-400">Bookmark a career and keep a shortlist close to your goals.</p>
              <button type="button" onClick={() => onNavigate('/recommendations')} className="premium-button mt-4">Explore matches</button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
