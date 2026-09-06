import { FormEvent, useState } from 'react';
import { ArrowRight, Compass, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuthStore } from '../state/auth';

interface AuthFormProps {
  mode: 'login' | 'register';
  onNavigate: (path: string) => void;
}

const passwordHint = '8+ characters with uppercase, lowercase, and a number';

export default function AuthForm({ mode, onNavigate }: AuthFormProps) {
  const isRegister = mode === 'register';
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (isRegister && name.trim().length < 2) {
      setFormError('Please enter your name.');
      return;
    }
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setFormError(`Password must meet this policy: ${passwordHint}.`);
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to complete authentication.');
    }
  };

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-[#0b1220]/85 shadow-[0_30px_100px_rgba(15,23,42,0.6)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <div className="hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),transparent_35%),linear-gradient(135deg,#101c36,#0a1222_60%,#050b16)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <button type="button" onClick={() => onNavigate('/')} className="mb-16 flex items-center gap-3 rounded-lg text-left text-sky-200 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-[#101c36]">
                <Compass className="h-8 w-8" />
                <span className="text-lg font-semibold tracking-tight">AI Career Guide</span>
              </button>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-sky-300">A clearer next step</p>
              <h1 className="max-w-md text-5xl font-semibold leading-[1.05] text-white">Build a career path that feels like yours.</h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-sky-100/75">
                Save your profile and return to grounded guidance as your skills grow.
              </p>
            </div>
            <p className="text-sm text-slate-400">Your account is the private starting point for the journey.</p>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <button type="button" onClick={() => onNavigate('/')} className="mb-10 flex items-center gap-3 rounded-lg text-left text-sky-300 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-[#0b1220] lg:hidden">
              <Compass className="h-7 w-7" />
              <span className="text-lg font-semibold tracking-tight">AI Career Guide</span>
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {isRegister ? 'Start with a strong foundation.' : 'Continue your career work.'}
            </h2>
            <p className="mt-3 text-slate-400">
              {isRegister ? 'Your profile will be ready for the next step.' : 'Sign in to pick up where you left off.'}
            </p>

            <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
              {isRegister && (
                <label className="block text-sm font-medium text-slate-200">
                  Name
                  <div className="relative mt-2">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="premium-input pl-11"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>
                </label>
              )}

              <label className="block text-sm font-medium text-slate-200">
                Email
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="premium-input pl-11"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-200">
                Password
                <div className="relative mt-2">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="premium-input pl-11"
                    placeholder="Your password"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                </div>
              </label>

              {isRegister && (
                <label className="block text-sm font-medium text-slate-200">
                  Confirm password
                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="premium-input pl-11"
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                    />
                  </div>
                </label>
              )}

              {isRegister && <p className="text-xs text-slate-400">Password policy: {passwordHint}.</p>}
              {formError && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{formError}</p>}

              <button type="submit" disabled={isLoading} className="premium-button w-full justify-center">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><span>{isRegister ? 'Create account' : 'Sign in'}</span><ArrowRight className="h-5 w-5" /></>}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              {isRegister ? 'Already have an account?' : 'New to AI Career Guide?'}{' '}
              <button type="button" onClick={() => onNavigate(isRegister ? '/login' : '/register')} className="font-semibold text-sky-300 transition hover:text-sky-200">
                {isRegister ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
