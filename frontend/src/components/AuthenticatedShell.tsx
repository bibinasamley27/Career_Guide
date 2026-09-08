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

  const discoverLinks = [
    ['/', 'Dashboard', LayoutDashboard],
    ['/recommendations', 'Career Matches', Target],
    ['/career-guide-ai', 'Career Guide AI', Sparkles],
  ] as const;

  const journeyLinks = [
    ['/profile', 'Profile', UserRound],
    ['/assessment', 'Assessment', ClipboardList],
    ['/resume-analyzer', 'Resume Analyzer', FileText],
    ['/skill-gap', 'Skill Gap', Compass],
    ['/roadmap', 'Roadmap', FolderGit2],
  ] as const;

  const libraryLinks = [
    ['/resources', 'Resources', BookOpenText],
    ['/projects', 'Projects', BriefcaseBusiness],
    ['/saved', 'Saved careers', Bookmark],
  ] as const;

  const navSections = [
    { label: 'Discover', links: discoverLinks },
    { label: 'My journey', links: journeyLinks },
    { label: 'Library', links: libraryLinks },
  ] as const;

  return (
    <main className="min-h-screen bg-[#0d0d0c] text-[#f2efe7]">
      <div className="mx-auto flex max-w-[1600px] gap-4 px-3 py-4 sm:px-5 lg:gap-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[28px] border border-white/10 bg-[#151514]/90 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:flex">
          <button type="button" onClick={() => onNavigate('/')} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left transition hover:border-[#c9a96e]/40 hover:bg-white/[0.04]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#f0e6d4] via-[#d8c19a] to-[#a77b56] text-[#171510] shadow-[0_12px_28px_rgba(201,169,110,0.25)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-[#f2efe7]">AI Career Guide</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-[#b8b3a8]">Career intelligence</span>
            </span>
          </button>

          <nav className="mt-8 space-y-6" aria-label="Main navigation">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#817d75]">{section.label}</p>
                <div className="mt-3 space-y-2">
                  {section.links.map(([path, label, Icon]) => {
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
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-3 rounded-[22px] border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1b1a17] p-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#f0e6d4] via-[#d8c19a] to-[#a77b56] text-sm font-bold text-[#171510]">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#f2efe7]">{user?.name || 'Student'}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#b8b3a8]">Career profile</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center justify-between rounded-xl border border-[#6e3f46]/30 bg-[#6e3f46]/10 px-3 py-2.5 text-sm font-semibold text-[#f7d7dc] transition hover:border-[#6e3f46]/50 hover:bg-[#6e3f46]/15"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <div className="flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#151514]/80 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#1b1a17]/90 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm text-[#b8b3a8] lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#f0e6d4] via-[#d8c19a] to-[#a77b56] text-[#171510] shadow-[0_8px_24px_rgba(201,169,110,0.2)]">
                <BriefcaseBusiness className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-[#f2efe7]">AI Career Guide</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#817d75]">Workspace</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[#b8b3a8] md:flex">
              <span className="status-dot" />
              Career workspace live
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#f0e6d4] via-[#d8c19a] to-[#a77b56] text-sm font-bold text-[#171510]">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#f2efe7]">{user?.name || 'Student'}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b3a8]">Profile</p>
                </div>
              </div>
              <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-[#f2efe7] transition hover:border-[#6e3f46]/40 hover:text-[#f7d7dc]">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            {children || (
              <section className="mx-auto max-w-6xl px-2 py-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9a96e]">Your workspace</p>
                <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-[#f2efe7]">Welcome back, {user?.name || 'student'}.</h1>
                <p className="mt-4 max-w-xl text-lg leading-8 text-[#b8b3a8]">
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
