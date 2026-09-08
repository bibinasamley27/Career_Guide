import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Loader2, Send } from 'lucide-react';
import { AssessmentAnswer, AssessmentAnswers, AssessmentQuestion, assessmentApi, ApiError } from '../lib/api';

const emptyAnswers: Partial<AssessmentAnswers> = {};

const isAnswered = (answer: AssessmentAnswer | undefined) =>
  Array.isArray(answer) ? answer.length > 0 : answer !== undefined && answer !== '';

export default function AssessmentPage() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Partial<AssessmentAnswers>>(emptyAnswers);
  const [currentStep, setCurrentStep] = useState(0);
  const [existing, setExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [questionData, assessmentData] = await Promise.all([assessmentApi.getQuestions(), assessmentApi.get()]);
        setQuestions(questionData.questions);
        if (assessmentData.assessment) {
          setAnswers(assessmentData.assessment.answers);
          setExisting(true);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the assessment.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const currentQuestion = questions[currentStep];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id as keyof AssessmentAnswers] : undefined;
  const isReview = currentStep === questions.length;

  const validateQuestion = (question: AssessmentQuestion) => {
    const answer = answers[question.id as keyof AssessmentAnswers];
    if (question.required && !isAnswered(answer)) {
      setError('Please answer this question before continuing.');
      return false;
    }
    setError(null);
    return true;
  };

  const toggleMultiple = (question: AssessmentQuestion, value: string) => {
    const key = question.id as keyof AssessmentAnswers;
    const current = Array.isArray(answers[key]) ? (answers[key] as string[]) : [];
    if (!current.includes(value) && question.maxSelections && current.length >= question.maxSelections) {
      setError(`Choose up to ${question.maxSelections} options.`);
      return;
    }
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    setAnswers((currentAnswers) => ({ ...currentAnswers, [key]: next }));
    setError(null);
    setSuccess(null);
  };

  const chooseSingle = (question: AssessmentQuestion, value: string | number) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: value }));
    setError(null);
    setSuccess(null);
  };

  const submit = async () => {
    for (const question of questions) {
      if (!validateQuestion(question)) return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const completeAnswers = answers as AssessmentAnswers;
      if (existing) await assessmentApi.update(completeAnswers);
      else await assessmentApi.create(completeAnswers);
      setExisting(true);
      setSuccess('Assessment saved successfully.');
      setCurrentStep(questions.length);
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to save the assessment.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <section className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-[#b8b3a8]"><Loader2 className="h-5 w-5 animate-spin text-[#c9a96e]" />Loading your assessment...</section>;
  }

  if (!currentQuestion && !isReview) {
    return <section className="mx-auto max-w-6xl px-6 py-16 text-rose-200">{error || 'No assessment questions are available.'}</section>;
  }

  return (
    <section className="mx-auto max-w-4xl px-2 py-6 sm:px-4">
      <div className="editorial-panel overflow-hidden rounded-[30px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 p-3 text-[#c9a96e]"><ClipboardList className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Career assessment</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#f2efe7]">What kind of work pulls you forward?</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#b8b3a8]">Seven quick reflections help us calibrate future guidance. There are no wrong answers.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-white/10 bg-[#1b1a17]/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-8">
        <div className="flex items-center justify-between text-sm text-[#b8b3a8]"><span>{isReview ? 'Review your answers' : `Question ${currentStep + 1} of ${questions.length}`}</span><span>{isReview ? 'Ready to submit' : `${Math.round(((currentStep + 1) / questions.length) * 100)}%`}</span></div>
        <div className="mt-3 h-2.5 rounded-full bg-[#2a2723]"><div className="h-2.5 rounded-full bg-gradient-to-r from-[#d8c19a] to-[#c9a96e] transition-all" style={{ width: `${isReview ? 100 : ((currentStep + 1) / questions.length) * 100}%` }} /></div>

        {!isReview && currentQuestion && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-[#f2efe7]">{currentQuestion.question}</h2>
            <p className="mt-3 text-[#b8b3a8]">{currentQuestion.description}</p>
            <div className="mt-7 grid gap-3">
              {currentQuestion.options.map((option) => {
                const selected = currentQuestion.type === 'multiple' ? Array.isArray(currentAnswer) && currentAnswer.includes(option.value) : currentQuestion.type === 'rating' ? currentAnswer === Number(option.value) : currentAnswer === option.value;
                return (
                  <button type="button" key={option.value} onClick={() => currentQuestion.type === 'multiple' ? toggleMultiple(currentQuestion, option.value) : currentQuestion.type === 'rating' ? chooseSingle(currentQuestion, Number(option.value)) : chooseSingle(currentQuestion, option.value)} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${selected ? 'border-[#c9a96e]/50 bg-[#c9a96e]/10 text-[#f2efe7]' : 'border-white/10 bg-[#22211d]/80 text-[#f2efe7] hover:border-[#c9a96e]/30'}`}>
                    <span>{option.label}</span>
                    {selected && <Check className="h-5 w-5 text-[#c9a96e]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isReview && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-[#f2efe7]">Assessment complete</h2>
            <p className="mt-3 text-[#b8b3a8]">Review your answers before submitting. You can go back and adjust any response.</p>
            <div className="mt-7 space-y-3">
              {questions.map((question) => {
                const answer = answers[question.id as keyof AssessmentAnswers];
                const labels = Array.isArray(answer) ? answer.map((value) => question.options.find((option) => option.value === value)?.label || value).join(', ') : question.options.find((option) => option.value === String(answer))?.label || String(answer);
                return (
                  <div key={question.id} className="rounded-2xl border border-white/10 bg-[#0d0d0c] p-4">
                    <p className="text-sm text-[#b8b3a8]">{question.question}</p>
                    <p className="mt-1 text-[#f2efe7]">{labels}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-7 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {success && <p role="status" className="mt-7 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p>}
        <div className="mt-10 flex flex-wrap justify-between gap-3">
          <button type="button" disabled={currentStep === 0} onClick={() => { setCurrentStep((step) => step - 1); setError(null); }} className="premium-button-secondary disabled:cursor-not-allowed disabled:opacity-40">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {isReview ? (
            <button type="button" disabled={isSaving} onClick={() => void submit()} className="premium-button disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {isSaving ? 'Saving...' : 'Submit assessment'}
            </button>
          ) : (
            <button type="button" onClick={() => { if (validateQuestion(currentQuestion)) setCurrentStep((step) => step + 1); }} className="premium-button">
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
