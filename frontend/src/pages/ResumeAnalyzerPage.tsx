import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
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
    if (isGeneratingRoadmap) return;
    setIsGeneratingRoadmap(true);
    setError(null);
    onNavigate('/resume-roadmap');
  };

  if (loading) {
    return <section className="mx-auto max-w-6xl px-2 py-16 text-[#b8b3a8]"><Loader2 className="mr-2 inline h-5 w-5 animate-spin text-[#c9a96e]" />Loading resume analysis...</section>;
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-2 py-6 sm:px-4">
      <div className="editorial-panel rounded-[30px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 p-3 text-[#c9a96e]"><FileText className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Resume analyzer</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#f2efe7]">Your experience becomes your starting point.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#b8b3a8]">Upload your resume and let Career Guide understand where you already have momentum, what you’ve built, and where you should focus next.</p>
          </div>
        </div>
      </div>

      {error && <p role="alert" className="rounded-[22px] border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">{error}</p>}

      {!resume && (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleUpload(event.dataTransfer.files?.[0]);
          }}
          className={`rounded-[30px] border border-dashed p-8 text-center ${dragging ? 'border-[#c9a96e] bg-[#c9a96e]/10' : 'border-white/10 bg-[#1b1a17]/80'}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => void handleUpload(event.target.files?.[0])} />
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 text-[#c9a96e]"><Upload className="h-7 w-7" /></div>
          <h2 className="mt-6 text-3xl font-bold text-[#f2efe7]">Upload your resume</h2>
          <p className="mt-3 text-[#b8b3a8]">Supported: PDF, DOCX · Maximum size: 5MB</p>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="premium-button mt-6">
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : 'Choose resume'}
          </button>
        </div>
      )}

      {uploading && (
        <div className="editorial-panel rounded-[30px] p-6">
          <div className="flex items-center gap-3 text-[#c9a96e]"><Loader2 className="h-5 w-5 animate-spin" />Uploading resume</div>
          <div className="mt-5 space-y-3 text-sm text-[#b8b3a8]">
            {['Extracting resume text', 'Analyzing resume', 'Identifying skills', 'Comparing career paths', 'Building skill gap', 'Generating personalized roadmap'].map((label) => (
              <div key={label} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{label}</div>
            ))}
          </div>
        </div>
      )}

      {resume && (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="editorial-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Resume analyzed ✓</p>
                <h2 className="mt-2 text-3xl font-bold text-[#f2efe7]">{resume.originalFileName}</h2>
              </div>
              <button type="button" onClick={() => setResume(null)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#b8b3a8]">Upload another</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-[#1b1a17]/80 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">Education</p><p className="mt-2 text-lg font-semibold text-[#f2efe7]">{(parsedData.education || []).length ? parsedData.education?.[0]?.degree || 'Not captured' : 'Not captured'}</p></div>
              <div className="rounded-[22px] border border-white/10 bg-[#1b1a17]/80 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">Experience</p><p className="mt-2 text-lg font-semibold text-[#f2efe7]">{(parsedData.experience || []).length ? `${parsedData.experience?.length} item(s)` : 'Not captured'}</p></div>
              <div className="rounded-[22px] border border-white/10 bg-[#1b1a17]/80 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">Skills</p><p className="mt-2 text-lg font-semibold text-[#f2efe7]">{(parsedData.skills || []).length ? parsedData.skills?.join(', ') : 'Not captured'}</p></div>
              <div className="rounded-[22px] border border-white/10 bg-[#1b1a17]/80 p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[#817d75]">Projects</p><p className="mt-2 text-lg font-semibold text-[#f2efe7]">{(parsedData.projects || []).length ? `${parsedData.projects?.length} detected` : 'Not captured'}</p></div>
            </div>

            <div className="mt-8 rounded-[22px] border border-white/10 bg-[#1b1a17]/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#817d75]">Review extracted data</p>
                <button type="button" onClick={saveEditedData} className="premium-button-secondary">Save edits</button>
              </div>
              <div className="mt-5 space-y-6">
                <section>
                  <p className="text-sm font-semibold text-[#f2efe7]">Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(parsedData.skills || []).map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-3 py-1.5 text-sm text-[#f2efe7]">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="text-[#d8c19a] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={addSkill} className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-2 text-sm text-[#b8b3a8]">+ Add skill</button>
                </section>

                <section>
                  <p className="text-sm font-semibold text-[#f2efe7]">Personal summary</p>
                  <textarea value={parsedData.personalSummary || ''} onChange={(event) => updateField('personalSummary', event.target.value || null)} className="mt-2 min-h-[100px] w-full resize-none rounded-xl border border-white/10 bg-[#0d0d0c] p-3 text-sm text-[#f2efe7] outline-none focus:border-[#c9a96e]/50" />
                </section>

                <section>
                  <p className="text-sm font-semibold text-[#f2efe7]">Education</p>
                  <div className="mt-2 space-y-2 text-sm text-[#b8b3a8]">{(parsedData.education || []).length ? parsedData.education?.map((entry, index) => <div key={`${entry.degree ?? 'degree'}-${index}`} className="rounded-xl border border-white/10 bg-[#0d0d0c] p-3">{entry.degree || 'Degree'} • {entry.institution || 'Institution'}</div>) : <p className="text-[#817d75]">No education found.</p>}</div>
                </section>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="editorial-panel rounded-[30px] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Career direction</p>
              <h3 className="mt-3 text-3xl font-bold text-[#f2efe7]">{selectedCareer?.name || 'Career path'}</h3>
              <p className="mt-3 text-[#f0e7d5]">{selectedCareer?.matchScore !== undefined ? `Match: ${selectedCareer.matchScore}/100` : 'Match data loading...'}</p>
              <p className="mt-3 text-sm text-[#b8b3a8]">Based on your resume, profile, and assessment.</p>
              {selectedCareer ? (
                <button
                  type="button"
                  onClick={handleBuildRoadmap}
                  disabled={isGeneratingRoadmap || loadingCareer}
                  className="premium-button mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGeneratingRoadmap ? 'Building your personalized roadmap...' : loadingCareer ? 'Loading career details...' : 'Build my personalized roadmap'}
                  {!isGeneratingRoadmap && <ArrowRight className="h-4 w-4" />}
                </button>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-[#b8b3a8]">Unable to load recommended path right now.</div>
              )}
            </div>

            <div className="editorial-panel rounded-[30px] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">What you already know</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(parsedData.skills || []).slice(0, 8).map((skill) => (
                  <span key={skill} className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-100">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
