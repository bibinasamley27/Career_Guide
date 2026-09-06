import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { agentApi, ApiError, careerApi, CareerGuideResult } from '../lib/api';

interface CareerGuidePageProps {
  careerId?: string;
  onNavigate: (path: string) => void;
}

const steps = ['Profile analyzed', 'Career evaluated', 'Skill gaps identified', 'Learning plan generated', 'Roadmap validated'];

export default function CareerGuidePage({ careerId, onNavigate }: CareerGuidePageProps) {
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(careerId ?? null);
  const [result, setResult] = useState<CareerGuideResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Array<{ id: string; name: string; detail: string; matchScore?: number }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(!careerId);

  useEffect(() => {
    if (careerId) {
      setSelectedCareerId(careerId);
      setLoadingOptions(false);
      return;
    }

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [recommendationsResult, savedResult] = await Promise.all([careerApi.recommendations(), careerApi.saved()]);

        const nextOptions = [
          ...savedResult.savedCareers.map((career) => ({
            id: career.careerId,
            name: career.careerName,
            detail: career.domain,
            matchScore: career.matchScore?.matchScore,
          })),
          ...recommendationsResult.recommendations.map((career) => ({
            id: career.careerId,
            name: career.careerName,
            detail: career.explanation,
            matchScore: career.matchScore,
          })),
        ];

        const deduplicated = nextOptions.filter((option, index, list) => list.findIndex((item) => item.id === option.id) === index);
        setOptions(deduplicated.slice(0, 5));

        if (deduplicated[0]) {
          setSelectedCareerId(deduplicated[0].id);
        }
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : 'Unable to load career options.');
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [careerId]);

  useEffect(() => {
    if (!selectedCareerId) return;

    const run = async () => {
      try {
        setError(null);
        setResult(null);
        setResult(await agentApi.careerGuide(selectedCareerId));
      } catch (runError) {
        setError(runError instanceof ApiError ? runError.message : 'Unable to generate your career guide.');
      }
    };

    void run();
  }, [selectedCareerId]);

  if (error) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p role="alert" className="border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">{error}</p>
        <button type="button" onClick={() => onNavigate('/recommendations')} className="mt-5 flex items-center gap-2 text-sm text-cyan-300">
          <ArrowLeft className="h-4 w-4" />
          Back to recommendations
        </button>
      </section>
    );
  }

  if (loadingOptions && !result) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
          Loading your next best career path...
        </div>
        <div className="mt-8 space-y-3">
          {steps.map((step) => (
            <div key={step} className="flex items-center gap-3 border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
              {step}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Choose a target</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Build a personalized career guide</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {options.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setSelectedCareerId(option.id)}
                className="rounded-2xl border border-white/10 bg-[#0d1728]/60 p-4 text-left transition hover:border-sky-300/40 hover:bg-[#102033]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{option.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{option.detail}</p>
                  </div>
                  {option.matchScore !== undefined && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                      {option.matchScore}%
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-sky-300">
                  Build my plan
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <button type="button" onClick={() => onNavigate('/recommendations')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-200">
        <ArrowLeft className="h-4 w-4" />
        Back to recommendations
      </button>

      <div className="mt-8 flex items-start gap-4">
        <div className="border border-amber-300/30 bg-amber-300/10 p-3 text-amber-300">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Career Guide Agent</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Your path toward {result.career.name}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{result.summary}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-5">
        {steps.map((step) => (
          <div key={step} className="border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">
            <Check className="mb-2 h-4 w-4 text-emerald-300" />
            {step}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="border border-slate-700/70 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Guidance match</p>
          <p className="mt-3 text-4xl font-semibold text-cyan-300">
            {result.match.matchScore}
            <span className="text-xl text-slate-500">/100</span>
          </p>
          <p className="mt-3 text-sm text-slate-400">{result.match.explanation}</p>
        </div>

        <div className="border border-slate-700/70 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Skill coverage</p>
          <p className="mt-3 text-4xl font-semibold text-amber-300">{result.skillGap.skillCoverage}%</p>
          <p className="mt-3 text-sm text-slate-400">
            {result.skillGap.matchedSkillCount} of {result.skillGap.totalRequiredSkills} career skills meet the target proficiency.
          </p>
        </div>

        <div className="border border-slate-700/70 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Personalized for</p>
          <p className="mt-3 text-xl font-semibold text-white">{result.roadmap.personalizedFor}</p>
          <p className="mt-3 text-sm text-slate-400">{result.career.domain}</p>
        </div>
      </div>

      <div className="mt-10 rounded-[28px] border border-slate-700/70 bg-[#0b1220]/80 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Career roadmap</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{result.roadmap.stages.length} stages to become job-ready</h2>
          </div>
          <button type="button" onClick={() => onNavigate('/recommendations')} className="premium-button-secondary">
            Explore other paths
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {result.roadmap.stages.map((stage) => (
            <div key={stage.stageNumber} className="rounded-2xl border border-white/10 bg-[#0d1728]/60 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Stage {stage.stageNumber}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{stage.title}</h3>
                </div>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  {stage.estimatedDuration}
                </span>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Skills</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {stage.skills.map((skill) => (
                      <li key={skill} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Objectives</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {stage.objectives.map((objective) => (
                      <li key={objective} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Practice tasks</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {stage.practiceTasks.map((task) => (
                      <li key={task} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Completion</p>
                  <p className="mt-3 text-sm text-slate-200">{stage.completionCriteria}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-700/70 bg-[#0b1220]/80 p-6">
          <div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resources</p><button type="button" onClick={() => onNavigate(`/resources/${result.career.id}`)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">Open library</button></div>
          <div className="mt-5 space-y-3">
            {result.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url || '#'}
                target={resource.url ? '_blank' : undefined}
                rel={resource.url ? 'noreferrer' : undefined}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d1728]/60 p-4 text-left text-slate-200 transition hover:border-cyan-300/40 hover:bg-[#102033]"
              >
                <div>
                  <p className="font-semibold text-white">{resource.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {resource.provider} · {resource.level}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-cyan-300" />
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700/70 bg-[#0b1220]/80 p-6">
          <div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project ideas</p><button type="button" onClick={() => onNavigate(`/projects/${result.career.id}`)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">Open workspace</button></div>
          <div className="mt-5 space-y-4">
            {result.projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-white/10 bg-[#0d1728]/60 p-4">
                <p className="text-lg font-semibold text-white">{project.title}</p>
                <p className="mt-2 text-sm text-slate-300">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-1 text-xs text-sky-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
