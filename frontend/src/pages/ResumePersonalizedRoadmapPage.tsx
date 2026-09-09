import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpenText, BriefcaseBusiness, CheckCircle2, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { resumeApi, resumeRoadmapApi, ResumeRoadmapResult } from '../lib/api';

interface ResumePersonalizedRoadmapPageProps {
  onNavigate: (path: string) => void;
}

const loadingSteps = [
  'Reading your experience...',
  'Identifying your current strengths...',
  'Finding the most important skill gaps...',
  'Building your learning path...',
  'Preparing your next steps...',
];

export default function ResumePersonalizedRoadmapPage({ onNavigate }: ResumePersonalizedRoadmapPageProps) {
  const [result, setResult] = useState<ResumeRoadmapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string>('Your uploaded resume');
  const [expandedStage, setExpandedStage] = useState<number | null>(1);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      const latest = await resumeApi.getLatest();
      if (!latest.resume) {
        setResult(null);
        setError('No analyzed resume found.');
        return;
      }
      setResumeName(latest.resume.originalFileName);
      const roadmapResult = await resumeRoadmapApi.generate();
      setResult(roadmapResult);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to generate your resume-based roadmap.';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoadmap();
  }, []);

  const sourceChecklist = useMemo(() => ['Education', 'Skills', 'Projects', 'Experience', 'Certifications'], []);

  const onRegenerate = async () => {
    await loadRoadmap();
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="editorial-panel rounded-[30px] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Resume-based roadmap</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-[#f2efe7]">Your experience becomes your starting point.</h1>
          <div className="mt-8 space-y-4">
            {loadingSteps.map((step) => (
              <div key={step} className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-[#1b1a17]/80 p-4 text-sm text-[#b8b3a8]">
                <Loader2 className="h-4 w-4 animate-spin text-[#c9a96e]" />
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && !result) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="editorial-panel rounded-[30px] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Resume roadmap</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-[#f2efe7]">No analyzed resume found.</h1>
          <p className="mt-4 text-lg text-[#b8b3a8]">{error}</p>
          <button type="button" onClick={() => onNavigate('/resume-analyzer')} className="premium-button mt-6">
            Analyze your resume first
          </button>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="editorial-panel rounded-[30px] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Resume roadmap</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-[#f2efe7]">Something went wrong.</h1>
          <p className="mt-4 text-lg text-[#b8b3a8]">Please try again in a moment.</p>
          <button type="button" onClick={() => onNavigate('/resume-analyzer')} className="premium-button-secondary mt-6">Back to resume analyzer</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="editorial-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">RESUME-BASED ROADMAP</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#f2efe7]">Your experience becomes your starting point.</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-[#b8b3a8]">Built from where your experience already begins.</p>
          </div>
          <button type="button" onClick={onRegenerate} className="premium-button-secondary self-start">
            Regenerate roadmap
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="editorial-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">ROADMAP SOURCE</p>
                <p className="mt-2 text-2xl font-bold text-[#f2efe7]">Uploaded Resume</p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Active
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-white/10 bg-[#1b1a17]/80 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">Resume</p>
              <p className="mt-2 text-lg font-semibold text-[#f2efe7]">{resumeName}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {sourceChecklist.map((item) => (
                  <span key={item} className="rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-2.5 py-1 text-xs font-semibold text-[#f0e7d5]">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="editorial-panel rounded-[30px] p-6">
            <div className="flex items-center gap-3 text-[#c9a96e]">
              <BriefcaseBusiness className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Current position</p>
            </div>
            <h2 className="mt-4 text-3xl font-black text-[#f2efe7]">{result.careerDirection}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {result.currentStrengths.map((strength) => (
                <span key={strength} className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-100">
                  {strength}
                </span>
              ))}
            </div>
          </div>

          <div className="editorial-panel rounded-[30px] p-6">
            <div className="flex items-center gap-3 text-[#c9a96e]">
              <BookOpenText className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Your next journey</p>
            </div>

            <div className="mt-6 space-y-4">
              {result.roadmap.map((stage) => (
                <div key={stage.stageNumber} className="rounded-[24px] border border-white/10 bg-[#1b1a17]/80 p-4">
                  <button type="button" onClick={() => setExpandedStage(expandedStage === stage.stageNumber ? null : stage.stageNumber)} className="flex w-full items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 text-lg font-black text-[#f2efe7]">
                        {String(stage.stageNumber).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">Stage {stage.stageNumber}</p>
                        <p className="mt-1 text-xl font-bold text-[#f2efe7]">{stage.title}</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-[#b8b3a8] transition ${expandedStage === stage.stageNumber ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedStage === stage.stageNumber && (
                    <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Objective</p>
                        <p className="mt-2 text-sm leading-7 text-[#d7d0c2]">{stage.objective}</p>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Skills</p>
                          <ul className="mt-3 space-y-2 text-sm text-[#f2efe7]">
                            {stage.skills.map((skill) => (
                              <li key={skill} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]" />{skill}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Topics</p>
                          <ul className="mt-3 space-y-2 text-sm text-[#f2efe7]">
                            {stage.topics.map((topic) => (
                              <li key={topic} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d7be85]" />{topic}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[#c9a96e]/20 bg-[#c9a96e]/5 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#c9a96e]">Why this comes next</p>
                        <p className="mt-3 text-sm leading-7 text-[#f2efe7]">{stage.whyThisComesNext || 'This step follows naturally from your current resume strengths and the skills most relevant to your chosen direction.'}</p>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Practice</p>
                          <p className="mt-2 text-sm leading-7 text-[#d7d0c2]">{stage.practice}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Project</p>
                          <p className="mt-2 text-sm leading-7 text-[#d7d0c2]">{stage.project}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Estimated duration</p>
                        <p className="mt-2 text-sm font-semibold text-[#f2efe7]">{stage.estimatedDuration}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Completion criteria</p>
                        <p className="mt-2 text-sm leading-7 text-[#d7d0c2]">{stage.completionCriteria}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="editorial-panel rounded-[30px] p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">Current strengths</p>
            <div className="mt-4 space-y-3">
              {result.currentStrengths.map((strength) => (
                <div key={strength} className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-[#1b1a17]/80 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-[#f2efe7]">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="editorial-panel rounded-[30px] p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">Skills to develop</p>
            <div className="mt-4 space-y-3">
              {result.skillGaps.map((gap) => (
                <div key={gap.name} className="rounded-[18px] border border-white/10 bg-[#1b1a17]/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#f2efe7]">{gap.name}</p>
                    <span className="rounded-full border border-[#c9a96e]/25 bg-[#c9a96e]/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#e3d7b8]">
                      {gap.status.replace('_', ' ')}
                    </span>
                  </div>
                  {gap.reason && <p className="mt-2 text-xs leading-6 text-[#b8b3a8]">{gap.reason}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="editorial-panel rounded-[30px] p-6">
            <button type="button" onClick={() => onNavigate('/resume-analyzer')} className="flex items-center gap-2 text-sm font-semibold text-[#c9a96e]">
              <ArrowLeft className="h-4 w-4" />
              Back to resume analyzer
            </button>
            <div className="mt-5 flex items-center gap-2 text-sm text-[#b8b3a8]">
              <Sparkles className="h-4 w-4 text-[#c9a96e]" />
              Built from your uploaded resume only.
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
