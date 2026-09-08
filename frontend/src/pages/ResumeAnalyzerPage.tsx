import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { careerApi, resumeApi, ResumeParsedData, ResumeRecord } from '../lib/api';

interface ResumeAnalyzerPageProps {
  onNavigate: (path: string) => void;
}

const defaultParsedData: ResumeParsedData = {
  personalSummary: null,
  education: [],
  experience: [],
  skills: [],
  projects: [],
  certifications: [],
  achievements: [],
  interests: [],
  languages: [],
  extractedKeywords: [],
};

const normalizeParsedData = (value: unknown): ResumeParsedData => {
  if (!value || typeof value !== 'object') {
    return defaultParsedData;
  }

  const source = value as Partial<ResumeParsedData>;
  return {
    personalSummary: source.personalSummary ?? null,
    education: Array.isArray(source.education) ? source.education : [],
    experience: Array.isArray(source.experience) ? source.experience : [],
    skills: Array.isArray(source.skills) ? source.skills : [],
    projects: Array.isArray(source.projects) ? source.projects : [],
    certifications: Array.isArray(source.certifications) ? source.certifications : [],
    achievements: Array.isArray(source.achievements) ? source.achievements : [],
    interests: Array.isArray(source.interests) ? source.interests : [],
    languages: Array.isArray(source.languages) ? source.languages : [],
    extractedKeywords: Array.isArray(source.extractedKeywords) ? source.extractedKeywords : [],
  };
};

export default function ResumeAnalyzerPage({ onNavigate }: ResumeAnalyzerPageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [parsedData, setParsedData] = useState<ResumeParsedData>(defaultParsedData);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<{ id: string; name: string; matchScore?: number } | null>(null);
  const [loadingCareer, setLoadingCareer] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await resumeApi.getLatest();
      const nextResume = result.resume ?? null;
      setResume(nextResume);
      setParsedData(nextResume ? normalizeParsedData(nextResume.parsedData) : defaultParsedData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load your resume.');
      setResume(null);
      setParsedData(defaultParsedData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    const loadCareer = async () => {
      try {
        setLoadingCareer(true);
        const result = await careerApi.recommendations();
        const topCareer = result.recommendations[0];
        if (topCareer) {
          setSelectedCareer({ id: topCareer.careerId, name: topCareer.careerName, matchScore: topCareer.matchScore });
        }
      } catch (requestError) {
        console.error('Failed to load recommended career for roadmap CTA', requestError);
      } finally {
        setLoadingCareer(false);
      }
    };

    void loadCareer();
  }, []);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const response = await resumeApi.upload(file);
      if (!response.resume) {
        throw new Error('Unable to load your resume analysis. Please try uploading your resume again.');
      }
      setResume(response.resume);
      setParsedData(normalizeParsedData(response.resume.parsedData));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Resume analysis failed.');
      setResume(null);
      setParsedData(defaultParsedData);
    } finally {
      setUploading(false);
    }
  };

  const updateField = <K extends keyof ResumeParsedData>(key: K, value: ResumeParsedData[K]) => {
    setParsedData((current) => ({ ...current, [key]: value }));
  };

  const addSkill = () => {
    const next = [...(parsedData.skills || []), 'New Skill'];
    updateField('skills', next);
  };

  const removeSkill = (skill: string) => {
    updateField('skills', (parsedData.skills || []).filter((item) => item !== skill));
  };

  const saveEditedData = async () => {
    if (!resume) return;
    try {
      const result = await resumeApi.update(resume.id, parsedData);
      if (!result.resume) {
        throw new Error('Unable to save the edited resume information.');
      }
      setResume(result.resume);
      setParsedData(normalizeParsedData(result.resume.parsedData));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save the edited resume information.');
    }
  };

  const handleBuildRoadmap = () => {
    if (!selectedCareer || isGeneratingRoadmap) return;

    setIsGeneratingRoadmap(true);
    setError(null);
    onNavigate(`/career-guide/${selectedCareer.id}`);
  };

  if (loading) {
    return <section className="mx-auto max-w-6xl px-2 py-16 text-slate-300"><Loader2 className="mr-2 inline h-5 w-5 animate-spin text-cyan-300" />Loading resume analysis...</section>;
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-2 py-6 sm:px-4">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-300"><FileText className="h-6 w-6" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Resume Analyzer</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Upload your resume and let your Career Guide understand your journey.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">The system extracts resume details and blends them with your profile, skills, interests, and assessment so the roadmap starts from your current reality.</p>
        </div>
      </div>

      {error && <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">{error}</p>}

      {!resume && (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleUpload(event.dataTransfer.files?.[0]);
          }}
          className={`rounded-[28px] border border-dashed p-8 text-center ${dragging ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-[#0b1220]/70'}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => void handleUpload(event.target.files?.[0])} />
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200"><Upload className="h-7 w-7" /></div>
          <h2 className="mt-6 text-2xl font-semibold text-white">Upload your resume</h2>
          <p className="mt-3 text-slate-400">Supported: PDF, DOCX • Maximum size: 5MB</p>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="premium-button mt-6">
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : 'Choose resume'}
          </button>
        </div>
      )}

      {uploading && (
        <div className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6">
          <div className="flex items-center gap-3 text-cyan-300"><Loader2 className="h-5 w-5 animate-spin" />Uploading Resume</div>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            {['Extracting Resume Text', 'Analyzing Resume', 'Identifying Skills', 'Comparing Career Paths', 'Building Skill Gap', 'Generating Personalized Roadmap'].map((label) => (
              <div key={label} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{label}</div>
            ))}
          </div>
        </div>
      )}

      {resume && (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Resume analyzed ✓</p>
                <h2 className="mt-2 text-3xl font-bold text-white">{resume.originalFileName}</h2>
              </div>
              <button type="button" onClick={() => setResume(null)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300">Upload another</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0d1728]/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Education</p><p className="mt-2 text-lg font-semibold text-white">{(parsedData.education || []).length ? parsedData.education?.[0]?.degree || 'Not captured' : 'Not captured'}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1728]/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Experience</p><p className="mt-2 text-lg font-semibold text-white">{(parsedData.experience || []).length ? `${parsedData.experience?.length} item(s)` : 'Not captured'}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1728]/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Skills</p><p className="mt-2 text-lg font-semibold text-white">{(parsedData.skills || []).length ? parsedData.skills?.join(', ') : 'Not captured'}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1728]/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Projects</p><p className="mt-2 text-lg font-semibold text-white">{(parsedData.projects || []).length ? `${parsedData.projects?.length} detected` : 'Not captured'}</p></div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0d1728]/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Review Extracted Data</p>
                <button type="button" onClick={saveEditedData} className="premium-button-secondary">Save edits</button>
              </div>
              <div className="mt-5 space-y-6">
                <section>
                  <p className="text-sm font-semibold text-white">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(parsedData.skills || []).map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-100">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="text-cyan-200 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={addSkill} className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">+ Add Skill</button>
                </section>

                <section>
                  <p className="text-sm font-semibold text-white">Personal summary</p>
                  <textarea value={parsedData.personalSummary || ''} onChange={(event) => updateField('personalSummary', event.target.value || null)} className="mt-2 min-h-[100px] w-full resize-none rounded-xl border border-white/10 bg-[#091522] p-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50" />
                </section>

                <section>
                  <p className="text-sm font-semibold text-white">Education</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-300">{(parsedData.education || []).length ? parsedData.education?.map((entry, index) => <div key={`${entry.degree ?? 'degree'}-${index}`} className="rounded-xl border border-white/10 bg-[#091522] p-3">{entry.degree || 'Degree'} • {entry.institution || 'Institution'}</div>) : <p className="text-slate-500">No education found.</p>}</div>
                </section>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Career direction</p>
              <h3 className="mt-3 text-3xl font-bold text-white">{selectedCareer?.name || 'Career path'}</h3>
              <p className="mt-3 text-sky-200">{selectedCareer?.matchScore !== undefined ? `Match: ${selectedCareer.matchScore}/100` : 'Match data loading...'}</p>
              <p className="mt-3 text-sm text-slate-400">Based on your resume, profile, and assessment.</p>
              {selectedCareer ? (
                <button
                  type="button"
                  onClick={handleBuildRoadmap}
                  disabled={isGeneratingRoadmap || loadingCareer}
                  className="premium-button mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGeneratingRoadmap ? 'Building Your Personalized Roadmap...' : loadingCareer ? 'Loading career details...' : 'Build My Personalized Roadmap'}
                  {!isGeneratingRoadmap && <ArrowRight className="h-4 w-4" />}
                </button>
              ) : (
                <button type="button" disabled className="premium-button mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70">
                  Complete your profile to unlock roadmap generation
                </button>
              )}
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#0b1220]/80 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Current strengths</p>
              <div className="mt-4 space-y-2 text-sm text-slate-200">{(parsedData.skills || []).slice(0, 5).map((skill) => <div key={skill} className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-300" />{skill}</div>)}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
