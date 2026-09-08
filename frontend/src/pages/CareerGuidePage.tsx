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
        <p role="alert" className="border border-[#7a2f34]/50 bg-[#7a2f34]/10 p-4 text-[#f1d7d9]">{error}</p>
        <button type="button" onClick={() => onNavigate('/recommendations')} className="mt-5 flex items-center gap-2 text-sm text-[#c9a96e]">
          <ArrowLeft className="h-4 w-4" />
          Back to recommendations
        </button>
      </section>
    );
  }

  if (loadingOptions && !result) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3 text-[#b8b3a8]">
          <Loader2 className="h-5 w-5 animate-spin text-[#c9a96e]" />
          Loading your next best career path...
        </div>
        <div className="mt-8 space-y-3">
          {steps.map((step) => (
            <div key={step} className="flex items-center gap-3 border border-white/10 bg-[#1b1a17]/80 p-4 text-sm text-[#b8b3a8]">
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
        <div className="rounded-[28px] border border-white/10 bg-[#1b1a17]/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8b3a8]">Choose a target</p>
          <h1 className="mt-3 text-4xl font-bold text-[#f2efe7]">Build a personalized career guide</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {options.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setSelectedCareerId(option.id)}
                className="rounded-2xl border border-white/10 bg-[#22211d]/80 p-4 text-left transition hover:border-[#c9a96e]/40 hover:bg-[#2a2723]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[#f2efe7]">{option.name}</p>
                    <p className="mt-1 text-sm text-[#b8b3a8]">{option.detail}</p>
                  </div>
                  {option.matchScore !== undefined && (
                    <span className="rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-2.5 py-1 text-xs font-semibold text-[#e3d7b8]">
                      {option.matchScore}%
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#c9a96e]">
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
      <button type="button" onClick={() => onNavigate('/recommendations')} className="flex items-center gap-2 text-sm text-[#b8b3a8] hover:text-[#c9a96e]">
        <ArrowLeft className="h-4 w-4" />
        Back to recommendations
      </button>

      <div className="mt-8 editorial-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 p-3 text-[#c9a96e]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c9a96e]">Career guide agent</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#f2efe7]">Your path toward {result.career.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#b8b3a8]">{result.summary}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-5">
        {steps.map((step) => (
          <div key={step} className="rounded-[20px] border border-[#8f7d5b]/50 bg-[#8f7d5b]/10 p-3 text-sm text-[#f2efe7]">
            <Check className="mb-2 h-4 w-4 text-emerald-300" />
            {step}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="editorial-panel rounded-[28px] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8b3a8]">Guidance match</p>
          <p className="mt-3 text-4xl font-black text-[#c9a96e]">
            {result.match.matchScore}
            <span className="text-xl text-[#b8b3a8]">/100</span>
          </p>
          <p className="mt-3 text-sm text-[#b8b3a8]">{result.match.explanation}</p>
        </div>

        <div className="editorial-panel rounded-[28px] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8b3a8]">Skill coverage</p>
          <p className="mt-3 text-4xl font-black text-[#d7be85]">{result.skillGap.skillCoverage}%</p>
          <p className="mt-3 text-sm text-[#b8b3a8]">
            {result.skillGap.matchedSkillCount} of {result.skillGap.totalRequiredSkills} career skills meet the target proficiency.
          </p>
        </div>

        <div className="editorial-panel rounded-[28px] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8b3a8]">Personalized for</p>
          <p className="mt-3 text-xl font-semibold text-[#f2efe7]">{result.roadmap.personalizedFor}</p>
          <p className="mt-3 text-sm text-[#b8b3a8]">{result.career.domain}</p>
        </div>
      </div>

      <div className="mt-10 editorial-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b8b3a8]">Career roadmap</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#f2efe7]">{result.roadmap.stages.length} stages to become job-ready</h2>
          </div>
          <button type="button" onClick={() => onNavigate('/recommendations')} className="premium-button-secondary">
            Explore other paths
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {result.roadmap.stages.map((stage) => (
            <div key={stage.stageNumber} className="rounded-[24px] border border-white/10 bg-[#22211d]/80 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">Stage {stage.stageNumber}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#f2efe7]">{stage.title}</h3>
                </div>
                <span className="rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e3d7b8]">
                  {stage.estimatedDuration}
                </span>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b8b3a8]">Skills</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#f2efe7]">
                    {stage.skills.map((skill) => (
                      <li key={skill} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b8b3a8]">Objectives</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#f2efe7]">
                    {stage.objectives.map((objective) => (
                      <li key={objective} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#d7be85]" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b8b3a8]">Practice tasks</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#f2efe7]">
                    {stage.practiceTasks.map((task) => (
                      <li key={task} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#8a7b5b]" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#b8b3a8]">Completion</p>
                  <p className="mt-3 text-sm text-[#f2efe7]">{stage.completionCriteria}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="editorial-panel rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8b3a8]">Resources</p>
            <button type="button" onClick={() => onNavigate(`/resources/${result.career.id}`)} className="text-xs font-semibold text-[#c9a96e] hover:text-[#d7be85]">Open library</button>
          </div>
          <div className="mt-5 space-y-3">
            {result.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url || '#'}
                target={resource.url ? '_blank' : undefined}
                rel={resource.url ? 'noreferrer' : undefined}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-[#22211d]/80 p-4 text-left text-[#f2efe7] transition hover:border-[#c9a96e]/40 hover:bg-[#2a2723]"
              >
                <div>
                  <p className="font-semibold text-[#f2efe7]">{resource.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#b8b3a8]">
                    {resource.provider} · {resource.level}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-[#c9a96e]" />
              </a>
            ))}
          </div>
        </div>

        <div className="editorial-panel rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8b3a8]">Project ideas</p>
            <button type="button" onClick={() => onNavigate(`/projects/${result.career.id}`)} className="text-xs font-semibold text-[#c9a96e] hover:text-[#d7be85]">Open workspace</button>
          </div>
          <div className="mt-5 space-y-4">
            {result.projects.map((project) => (
              <div key={project.id} className="rounded-[20px] border border-white/10 bg-[#22211d]/80 p-4">
                <p className="text-lg font-semibold text-[#f2efe7]">{project.title}</p>
                <p className="mt-2 text-sm text-[#b8b3a8]">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-2 py-1 text-xs text-[#e3d7b8]">
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
