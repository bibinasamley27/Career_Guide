import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { assessmentApi, careerApi, CareerRecommendation, ProfileData, profileApi, SavedCareer } from '../lib/api';

interface Props { onNavigate: (path: string) => void; }

export default function StudentDashboardPage({ onNavigate }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [matches, setMatches] = useState<CareerRecommendation[]>([]);
  const [saved, setSaved] = useState<SavedCareer[]>([]);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [resumeStatus, setResumeStatus] = useState<string | null>(null);
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

    fetch('/api/resume', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          setResumeStatus(null);
          return;
        }
        const payload = await response.json();
        setResumeStatus(payload.data?.resume ? 'Resume analyzed' : null);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load your dashboard.'));
  }, []);

  if (loading) {
    return <section className="mx-auto flex max-w-7xl items-center gap-3 px-2 py-16 text-[#b8b3a8]"><Loader2 className="h-5 w-5 animate-spin text-[#c9a96e]" />Loading your dashboard...</section>;
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
  const topMatch = matches[0];

  return (
    <section className="space-y-8">
      <div className="editorial-panel overflow-hidden rounded-[30px] p-6 sm:p-8">
        <div className="rounded-[26px] border border-[#c9a96e]/20 bg-[radial-gradient(circle_at_top_left,_rgba(201,169,110,0.12),transparent_33%),linear-gradient(135deg,#1b1a17,#151514_64%,#0d0d0c)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c9a96e]">Career command center</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#f2efe7] sm:text-4xl">Let your next move become clear.</h2>
            </div>
            <button type="button" onClick={() => onNavigate('/career-guide-ai')} className="premium-button">
              {topMatch ? 'Continue my plan' : 'Build my plan'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#817d75]">Current direction</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.05em] text-[#f2efe7] sm:text-5xl">
                Good morning, {profile?.profile?.name || 'student'}.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[#b8b3a8]">
                Your career direction is becoming clearer. Here’s where your strengths, profile, and next actions align.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#c9a96e]/20 bg-[#1b1a17]/80 p-5 metric-glow">
              <p className="text-xs uppercase tracking-[0.2em] text-[#817d75]">Top match</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold text-[#f2efe7]">{topMatch ? topMatch.careerName : 'Career fit'}</p>
                  <p className="text-sm text-[#b8b3a8]">{topMatch ? `${topMatch.matchScore}% alignment` : 'Assess and match'}</p>
                </div>
                <div className="text-right">
                  <span className="block text-4xl font-black text-[#c9a96e]">{topMatch ? topMatch.matchScore : 0}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[#817d75]">/100</span>
                </div>
              </div>
              <button type="button" onClick={() => onNavigate(topMatch ? `/career-guide/${topMatch.careerId}` : '/assessment')} className="premium-button-secondary mt-5 w-full justify-center">
                Continue your journey
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statuses.map(([label, complete, path]) => (
            <button
              type="button"
              key={label}
              onClick={() => onNavigate(path)}
              className="group rounded-[24px] border border-white/10 bg-[#1b1a17]/80 p-4 text-left transition hover:-translate-y-1 hover:border-[#c9a96e]/40 hover:bg-[#22211d]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">{label}</span>
                {complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <CircleDashed className="h-5 w-5 text-[#817d75]" />
                )}
              </div>
              <p className="mt-4 text-2xl font-bold text-[#f2efe7]">{complete ? 'Complete' : 'In progress'}</p>
              <p className="mt-2 text-sm text-[#b8b3a8]">{complete ? 'Ready for your next step.' : 'Finish this to improve guidance.'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="editorial-panel rounded-[30px] p-6">
          <div className="rounded-[24px] border border-[#c9a96e]/20 bg-[#c9a96e]/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Resume status</p>
                <h3 className="mt-2 text-2xl font-bold text-[#f2efe7]">{resumeStatus ? 'Resume analyzed and ready.' : 'Upload your resume to ground your path in your experience.'}</h3>
              </div>
              <button type="button" onClick={() => onNavigate('/resume-analyzer')} className="premium-button-secondary">
                {resumeStatus ? 'View resume' : 'Analyze my resume'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#817d75]">Next best step</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#f2efe7]">{nextBestStep}</h2>
            </div>
            <button type="button" onClick={() => onNavigate(!assessmentDone ? '/assessment' : '/recommendations')} className="premium-button">
              <span>{!assessmentDone ? 'Start assessment' : 'View matches'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#1b1a17]/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#817d75]">Current focus</p>
            <p className="mt-3 text-2xl font-bold text-[#f2efe7]">{topMatch ? `${topMatch.careerName} — ${topMatch.matchScore}% match` : 'Build stronger career signals'}</p>
            <p className="mt-3 max-w-2xl text-[#b8b3a8]">{topMatch ? 'This path has the strongest alignment with your interests, profile, and assessment result.' : 'Complete your profile and assessment to unlock more specific career guidance.'}</p>
          </div>
        </section>

        <section className="editorial-panel rounded-[30px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#817d75]">Career preview</p>
          <div className="mt-5 space-y-4">
            {matches.slice(0, 3).map((match, index) => (
              <button
                type="button"
                key={match.careerId}
                onClick={() => onNavigate(`/career-guide/${match.careerId}`)}
                className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-[#1b1a17]/80 p-4 text-left transition hover:border-[#c9a96e]/40 hover:bg-[#22211d]"
              >
                <div className="flex gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#22211d] text-sm font-bold text-[#c9a96e]">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="text-lg font-semibold text-[#f2efe7]">{match.careerName}</p>
                    <p className="text-sm text-[#b8b3a8]">{match.matchScore}% strong match</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#c9a96e]">
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="editorial-panel rounded-[30px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#817d75]">Your journey</p>
          <div className="mt-6 space-y-5">
            {journey.map((step, index) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`grid h-9 w-9 place-items-center rounded-full ${step.complete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#22211d] text-[#817d75]'}`}>
                    {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                  </div>
                  {index < journey.length - 1 && <div className="mt-2 h-8 w-px bg-white/10" />}
                </div>
                <div className="flex-1 rounded-[18px] border border-white/10 bg-[#1b1a17]/80 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">{step.label}</p>
                  <p className="mt-1 text-base font-semibold text-[#f2efe7]">{step.complete ? 'Completed' : 'In progress'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="editorial-panel rounded-[30px] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#817d75]">Saved focus</p>
          {selected ? (
            <div className="mt-4 rounded-[22px] border border-[#c9a96e]/20 bg-[#c9a96e]/10 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">Saved career</p>
              <h3 className="mt-2 text-2xl font-bold text-[#f2efe7]">{selected.careerName}</h3>
              <p className="mt-3 text-sm text-[#b8b3a8]">{selected.domain}</p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => onNavigate(`/skill-gap/${selected.careerId}`)} className="premium-button-secondary">Skill gap</button>
                <button type="button" onClick={() => onNavigate(`/career-guide/${selected.careerId}`)} className="premium-button">Open guide</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[22px] border border-dashed border-white/10 bg-[#1b1a17]/80 p-5 text-[#b8b3a8]">
              <p className="text-lg font-semibold text-[#f2efe7]">No saved career yet</p>
              <p className="mt-2 text-sm text-[#817d75]">Bookmark a career and keep a shortlist close to your goals.</p>
              <button type="button" onClick={() => onNavigate('/recommendations')} className="premium-button mt-4">Explore matches</button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
