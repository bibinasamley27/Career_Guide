import {
  ArrowRight,
  BookOpenText,
  Bookmark,
  BriefcaseBusiness,
  ClipboardList,
  Compass,
  FileText,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '../state/auth';

interface AuthenticatedShellProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export default function AuthenticatedShell({ children, onNavigate }: AuthenticatedShellProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const currentPath = window.location.pathname;

  const links = [
    ['/', 'Dashboard', LayoutDashboard],
    ['/profile', 'Profile', UserRound],
    ['/assessment', 'Assessment', ClipboardList],
    ['/recommendations', 'Career Matches', Target],
    ['/skill-gap', 'Skill Gap', Compass],
    ['/career-guide-ai', '✨ Career Guide AI', Sparkles],
    ['/roadmap', 'Roadmap', FileText],
    ['/resources', 'Resources', BookOpenText],
    ['/projects', 'Projects', FolderGit2],
    ['/saved', 'Saved careers', Bookmark],
  ] as const;

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto flex max-w-[1600px] gap-4 px-3 py-4 sm:px-5 lg:gap-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:flex">
          <button type="button" onClick={() => onNavigate('/')} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-3 py-3 text-left transition hover:border-sky-400/40 hover:bg-white/10">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950 shadow-[0_8px_24px_rgba(56,189,248,0.45)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-white">AI Career Guide</span>
              <span className="block text-[11px] text-slate-400">Discover. Plan. Grow.</span>
            </span>
          </button>

          <nav className="mt-8 space-y-2" aria-label="Main navigation">
            {links.map(([path, label, Icon]) => {
              const active = currentPath === path || (path === '/' && currentPath === '/');
              return (
                <button
                  type="button"
                  key={path}
                  onClick={() => onNavigate(path)}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0d172a] p-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-slate-950">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'Student'}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Career profile</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center justify-between rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-500/20"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <div className="flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220]/85 shadow-[0_20px_80px_rgba(15,23,42,0.4)] backdrop-blur-xl">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#0a1628]/80 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950 shadow-[0_8px_24px_rgba(56,189,248,0.4)]">
                <BriefcaseBusiness className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-white">AI Career Guide</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-400 md:flex">
              <span className="status-dot" />
              Career workspace live
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-slate-950">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{user?.name || 'Student'}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Profile</p>
                </div>
              </div>
              <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-300/40 hover:text-rose-200">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            {children || (
              <section className="mx-auto max-w-6xl px-2 py-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Your workspace</p>
                <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white">Welcome back, {user?.name || 'student'}.</h1>
                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
                  Your profile, assessment, and career planning tools are ready when you are.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
