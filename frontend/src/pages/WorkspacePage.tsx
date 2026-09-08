import { BookOpenText, ExternalLink, FolderGit2, Loader2, RefreshCw, Search, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiError, CareerProject, CareerResource, careerApi } from '../lib/api';

interface WorkspacePageProps {
  title: string;
  description: string;
  type: 'resources' | 'projects';
  careerId?: string;
}

export default function WorkspacePage({ title, description, type, careerId: requestedCareerId }: WorkspacePageProps) {
  const Icon = type === 'resources' ? BookOpenText : FolderGit2;
  const [career, setCareer] = useState<{ id: string; name: string } | null>(null);
  const [resources, setResources] = useState<CareerResource[]>([]);
  const [projects, setProjects] = useState<CareerProject[]>([]);
  const [gaps, setGaps] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recommendations, saved] = await Promise.all([careerApi.recommendations(), careerApi.saved()]);
      const selected = requestedCareerId
        ? [...saved.savedCareers, ...recommendations.recommendations].find((item) => item.careerId === requestedCareerId)
        : saved.savedCareers[0] || recommendations.recommendations[0];
      if (!selected) {
        setCareer(null);
        setResources([]);
        setProjects([]);
        return;
      }
      setCareer({ id: selected.careerId, name: selected.careerName });
      const [content, gap] = await Promise.all([
        type === 'resources' ? careerApi.resources(selected.careerId) : careerApi.projects(selected.careerId),
        careerApi.skillGap(selected.careerId),
      ]);
      setGaps([...gap.missingSkills, ...gap.partialSkills].map((skill) => skill.name));
      if (type === 'resources') setResources((content as { resources: CareerResource[] }).resources);
      else setProjects((content as { projects: CareerProject[] }).projects);
    } catch (loadError) {
      setError(loadError instanceof ApiError ? 'Unable to load your workspace right now.' : 'Unable to load your workspace right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [requestedCareerId, type]);

  const visibleResources = useMemo(() => resources.filter((resource) => {
    const matchesQuery = `${resource.title} ${resource.provider} ${resource.relevance || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === 'ALL' || resource.type === filter);
  }), [filter, query, resources]);

  const visibleProjects = useMemo(() => projects.filter((project) => {
    const matchesQuery = `${project.title} ${project.description} ${project.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === 'ALL' || project.difficulty === filter);
  }), [filter, projects, query]);

  const resourceFilters = [...new Set(resources.map((resource) => resource.type))];
  const projectFilters = [...new Set(projects.map((project) => project.difficulty))];

  return (
    <section className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 p-3 text-[#c9a96e]">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Career workspace</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#f2efe7]">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#b8b3a8]">{description}</p>
        </div>
      </div>
      {loading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-48 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]" />)}
          <p className="col-span-full flex items-center gap-2 text-sm text-[#b8b3a8]"><Loader2 className="h-4 w-4 animate-spin text-[#c9a96e]" />Loading your {type}...</p>
        </div>
      ) : error ? (
        <div className="mt-10 rounded-[24px] border border-rose-400/30 bg-rose-500/10 p-6">
          <p role="alert" className="text-rose-200">{error}</p>
          <button type="button" onClick={() => void load()} className="premium-button-secondary mt-5"><RefreshCw className="h-4 w-4" />Try again</button>
        </div>
      ) : !career ? (
        <div className="mt-10 rounded-[24px] border border-dashed border-white/10 bg-[#1b1a17]/80 p-8 text-[#b8b3a8]">
          <p className="text-lg font-semibold text-[#f2efe7]">Choose a career direction first.</p>
          <p className="mt-2 text-sm text-[#b8b3a8]">Complete your profile and assessment to generate career matches before exploring {type}.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-[#c9a96e]/20 bg-[#c9a96e]/10 p-4">
            <div className="flex items-center gap-3"><Target className="h-5 w-5 text-[#c9a96e]" /><div><p className="text-xs uppercase tracking-[0.16em] text-[#c9a96e]">Current career direction</p><p className="mt-1 text-lg font-semibold text-[#f2efe7]">{career.name}</p></div></div>
            {gaps.length > 0 && <div className="text-sm text-[#b8b3a8]"><span className="text-[#8d8679]">Recommended for your gaps:</span> {gaps.join(', ')}</div>}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="premium-input pl-9" placeholder={`Search ${type}...`} /></label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="premium-input sm:w-56"><option value="ALL">All {type}</option>{(type === 'resources' ? resourceFilters : projectFilters).map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}</select>
          </div>

          {type === 'resources' ? (
            visibleResources.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{visibleResources.map((resource) => <article key={resource.id} className="rounded-[24px] border border-white/10 bg-[#22211d]/80 p-5 transition hover:-translate-y-1 hover:border-[#c9a96e]/40"><div className="flex items-start justify-between gap-3"><span className="rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#e3d7b8]">{resource.type.replace(/_/g, ' ')}</span><span className="text-xs uppercase tracking-[0.12em] text-[#8d8679]">{resource.level.replace(/_/g, ' ')}</span></div><h2 className="mt-5 text-xl font-semibold text-[#f2efe7]">{resource.title}</h2><p className="mt-3 text-sm leading-6 text-[#b8b3a8]">{resource.relevanceReason}</p>{resource.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{resource.skills.map((skill) => <span key={skill} className="rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-2 py-1 text-xs text-[#e3d7b8]">{skill}</span>)}</div>}<div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4"><span className="text-xs uppercase tracking-[0.12em] text-[#8d8679]">{resource.provider}</span>{resource.url ? <a href={resource.url} target="_blank" rel="noreferrer" className="premium-button-secondary">Open resource <ExternalLink className="h-4 w-4" /></a> : <span className="text-xs text-[#8d8679]">No external link</span>}</div></article>)}</div> : <div className="mt-6 rounded-[24px] border border-dashed border-white/10 p-8 text-[#b8b3a8]">Resources aren't available for this career yet.</div>
          ) : (
            visibleProjects.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{visibleProjects.map((project) => { const matchedGaps = project.skills.filter((skill) => gaps.includes(skill)); return <article key={project.id} className="rounded-[24px] border border-white/10 bg-[#22211d]/80 p-5 transition hover:-translate-y-1 hover:border-[#c9a96e]/40"><div className="flex items-start justify-between gap-3"><span className="rounded-full border border-[#d7be85]/20 bg-[#d7be85]/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#e9d4a4]">{project.difficulty.toLowerCase()}</span><FolderGit2 className="h-5 w-5 text-[#c9a96e]" /></div><h2 className="mt-5 text-xl font-semibold text-[#f2efe7]">{project.title}</h2><p className="mt-3 text-sm leading-6 text-[#b8b3a8]">{project.description}</p>{project.skills.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{project.skills.map((skill) => <span key={skill} className="rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-2.5 py-1 text-xs text-[#e3d7b8]">{skill}</span>)}</div>}<div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs uppercase tracking-[0.12em] text-[#8d8679]">Why this fits</p><p className="mt-2 text-sm text-[#b8b3a8]">{project.relevanceReason}</p><p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#8d8679]">Expected outcome</p><p className="mt-2 text-sm text-[#b8b3a8]">{project.expectedOutcome}</p>{matchedGaps.length > 0 && <p className="mt-3 text-xs text-[#d7be85]">Supports current gaps: {matchedGaps.join(', ')}</p>}</div></article>; })}</div> : <div className="mt-6 rounded-[24px] border border-dashed border-white/10 p-8 text-[#b8b3a8]">No projects are currently available for this career.</div>
          )}
        </>
      )}
    </section>
  );
}
