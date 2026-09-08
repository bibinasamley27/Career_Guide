import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Save, Search } from 'lucide-react';
import { ApiError, InterestOption, profileApi, ProfileData, Proficiency, SkillOption } from '../lib/api';

interface ProfilePageProps { onNavigate?: (path: string) => void; }

interface FormState {
  name: string;
  education: string;
  degreeBranch: string;
  experienceLevel: string;
  careerGoal: string;
  preferredDomains: string;
  learningPreference: string;
  weeklyLearningHours: string;
}

const emptyForm: FormState = {
  name: '',
  education: '',
  degreeBranch: '',
  experienceLevel: 'STUDENT',
  careerGoal: '',
  preferredDomains: '',
  learningPreference: 'SELF_PACED',
  weeklyLearningHours: '',
};

const experienceOptions = [['BEGINNER', 'Beginner'], ['STUDENT', 'Student'], ['ENTRY_LEVEL', 'Entry level'], ['INTERMEDIATE', 'Intermediate'], ['EXPERIENCED', 'Experienced']];
const learningOptions = [['SELF_PACED', 'Self-paced'], ['GUIDED_COURSE', 'Guided courses'], ['PROJECT_BASED', 'Project-based'], ['MIXED', 'A mix of approaches']];

const profileToForm = (data: ProfileData): FormState => {
  if (!data.profile) return emptyForm;
  return {
    name: data.profile.name,
    education: data.profile.education,
    degreeBranch: data.profile.degreeBranch || '',
    experienceLevel: data.profile.experienceLevel,
    careerGoal: data.profile.careerGoal || '',
    preferredDomains: data.profile.preferredDomains.join(', '),
    learningPreference: data.profile.learningPreference || 'SELF_PACED',
    weeklyLearningHours: data.profile.weeklyLearningHours?.toString() || '',
  };
};

export default function ProfilePage(_props: ProfilePageProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [interests, setInterests] = useState<InterestOption[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Record<string, Proficiency>>({});
  const [selectedInterests, setSelectedInterests] = useState<Record<string, number>>({});
  const [skillSearch, setSkillSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, options] = await Promise.all([profileApi.get(), profileApi.getOptions()]);
        setForm(profileToForm(profileData));
        setSkills(options.skills);
        setInterests(options.interests);
        setSelectedSkills(Object.fromEntries(profileData.skills.map((skill) => [skill.id, skill.proficiency])));
        setSelectedInterests(Object.fromEntries(profileData.interests.map((interest) => [interest.id, interest.weight])));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your profile.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const filteredSkills = useMemo(
    () => skills.filter((skill) => `${skill.name} ${skill.category}`.toLowerCase().includes(skillSearch.toLowerCase())),
    [skills, skillSearch]
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess(null);
    setError(null);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((current) => {
      const next = { ...current };
      if (next[skillId]) delete next[skillId];
      else next[skillId] = 'BEGINNER';
      return next;
    });
    setSuccess(null);
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((current) => {
      const next = { ...current };
      if (next[interestId]) delete next[interestId];
      else next[interestId] = 3;
      return next;
    });
    setSuccess(null);
  };

  const save = async () => {
    setError(null);
    setSuccess(null);
    if (form.name.trim().length < 2 || form.education.trim().length < 2) {
      setError('Name and education are required.');
      return;
    }
    const hours = form.weeklyLearningHours ? Number(form.weeklyLearningHours) : null;
    if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 80)) {
      setError('Weekly learning time must be a whole number between 1 and 80.');
      return;
    }

    setIsSaving(true);
    try {
      await profileApi.update({
        name: form.name.trim(),
        education: form.education.trim(),
        degreeBranch: form.degreeBranch.trim() || null,
        experienceLevel: form.experienceLevel,
        careerGoal: form.careerGoal.trim() || null,
        preferredDomains: form.preferredDomains.split(',').map((domain) => domain.trim()).filter(Boolean),
        learningPreference: form.learningPreference || null,
        weeklyLearningHours: hours,
        skills: Object.entries(selectedSkills).map(([skillId, proficiency]) => ({ skillId, proficiency })),
        interests: Object.entries(selectedInterests).map(([interestId, weight]) => ({ interestId, weight })),
      });
      setSuccess('Profile saved successfully.');
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-[#b8b3a8]"><Loader2 className="h-5 w-5 animate-spin text-[#c9a96e]" />Loading your profile...</section>;
  }

  return (
    <section className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div className="editorial-panel rounded-[30px] p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Profile</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#f2efe7]">Give your career journey some context.</h1>
          <p className="mt-4 text-lg leading-8 text-[#b8b3a8]">This information helps shape more accurate career guidance, skill comparisons, and next steps.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="editorial-panel rounded-[24px] p-6">
          <h2 className="text-xl font-semibold text-white">Personal details</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-300">Name<input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="premium-input mt-2" /></label>
            <label className="block text-sm text-slate-300">Education<input value={form.education} onChange={(event) => updateField('education', event.target.value)} className="premium-input mt-2" placeholder="Degree, school, or current program" /></label>
            <label className="block text-sm text-slate-300">Degree / branch<input value={form.degreeBranch} onChange={(event) => updateField('degreeBranch', event.target.value)} className="premium-input mt-2" placeholder="Computer Science" /></label>
          </div>
        </section>

        <section className="editorial-panel rounded-[24px] p-6">
          <h2 className="text-xl font-semibold text-white">Experience and learning</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-300">Experience level<select value={form.experienceLevel} onChange={(event) => updateField('experienceLevel', event.target.value)} className="premium-input mt-2">{experienceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm text-slate-300">Learning preference<select value={form.learningPreference} onChange={(event) => updateField('learningPreference', event.target.value)} className="premium-input mt-2">{learningOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm text-slate-300">Weekly learning hours<input type="number" min="1" max="80" value={form.weeklyLearningHours} onChange={(event) => updateField('weeklyLearningHours', event.target.value)} className="premium-input mt-2" placeholder="5" /></label>
          </div>
        </section>

        <section className="editorial-panel rounded-[24px] p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white">Interests</h2>
          <p className="mt-2 text-sm text-slate-400">Choose the topics that capture your attention and the level of intensity you want to invest.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {interests.map((interest) => {
              const selected = selectedInterests[interest.id] !== undefined;
              return (
                <button type="button" key={interest.id} onClick={() => toggleInterest(interest.id)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${selected ? 'border-[#c9a96e]/50 bg-[#c9a96e]/10 text-[#f2efe7]' : 'border-white/10 bg-[#22211d]/80 text-[#d9d4c8] hover:border-[#c9a96e]/40 hover:text-[#f2efe7]'}`}>
                  {selected && <Check className="h-4 w-4" />}
                  {interest.name}
                  {selected && (
                    <select aria-label={`${interest.name} strength`} value={selectedInterests[interest.id]} onClick={(event) => event.stopPropagation()} onChange={(event) => setSelectedInterests((current) => ({ ...current, [interest.id]: Number(event.target.value) }))} className="ml-1 rounded-md border border-white/10 bg-[#0d0d0c] px-1 py-0.5 text-xs text-[#f2efe7] outline-none">
                      {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="editorial-panel rounded-[24px] p-6 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Skills</h2>
              <p className="mt-2 text-sm text-slate-400">Select the abilities you already bring and rate your confidence.</p>
            </div>
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={skillSearch} onChange={(event) => setSkillSearch(event.target.value)} className="premium-input pl-9" placeholder="Search skills" />
            </label>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSkills.map((skill) => {
              const selected = selectedSkills[skill.id] !== undefined;
              return (
                <div key={skill.id} className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${selected ? 'border-[#c9a96e]/50 bg-[#c9a96e]/10' : 'border-white/10 bg-[#22211d]/80'}`}>
                  <button type="button" onClick={() => toggleSkill(skill.id)} className="min-w-0 text-left">
                    <span className={`block truncate text-sm ${selected ? 'text-[#f2efe7]' : 'text-[#f2efe7]'}`}>{skill.name}</span>
                    <span className="text-xs text-[#b8b3a8]">{skill.category}</span>
                  </button>
                  {selected && (
                    <select aria-label={`${skill.name} proficiency`} value={selectedSkills[skill.id]} onChange={(event) => setSelectedSkills((current) => ({ ...current, [skill.id]: event.target.value as Proficiency }))} className="w-28 rounded-lg border border-white/10 bg-[#0d0d0c] p-1.5 text-xs text-[#f2efe7] outline-none">
                      {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as Proficiency[]).map((level) => <option key={level} value={level}>{level.toLowerCase()}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="editorial-panel rounded-[24px] p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white">Direction</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block text-sm text-slate-300">Preferred domains<span className="mt-2 block text-xs text-slate-500">Separate domains with commas.</span><input value={form.preferredDomains} onChange={(event) => updateField('preferredDomains', event.target.value)} className="premium-input mt-2" placeholder="Software Engineering, Data Science" /></label>
            <label className="block text-sm text-slate-300">Career goal<textarea value={form.careerGoal} onChange={(event) => updateField('careerGoal', event.target.value)} className="premium-input mt-2 min-h-[120px] resize-y" placeholder="What would you like to work toward?" /></label>
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {success && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</p>}
        <button type="button" onClick={() => void save()} disabled={isSaving} className="ml-auto premium-button disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </button>
      </div>
    </section>
  );
}
