import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, BookOpen, Check, CircleDot, Compass, Menu, Sparkles, X } from 'lucide-react';
import { Button } from '../components/ui';

interface Props { onNavigate: (path: string) => void; }
interface CareerNode { name: string; score: number; detail: string; x: string; y: string; tone: string; }

const careerNodes: CareerNode[] = [
  { name: 'AI Engineer', score: 92, detail: 'Python · ML systems', x: '78%', y: '15%', tone: 'border-[#d8c19a] bg-[#d8c19a]/10 text-[#f2efe7]' },
  { name: 'Software Developer', score: 94, detail: 'Programming · building', x: '90%', y: '40%', tone: 'border-[#c9a96e] bg-[#c9a96e]/12 text-[#f2efe7]' },
  { name: 'Data Scientist', score: 88, detail: 'Analytics · research', x: '77%', y: '69%', tone: 'border-[#c9a96e] bg-[#c9a96e]/10 text-[#f2efe7]' },
  { name: 'UI/UX Designer', score: 81, detail: 'Design · empathy', x: '23%', y: '20%', tone: 'border-[#6e3f46] bg-[#6e3f46]/12 text-[#f7d7dc]' },
  { name: 'Cybersecurity', score: 79, detail: 'Systems · protection', x: '10%', y: '53%', tone: 'border-[#a9b59b] bg-[#a9b59b]/12 text-[#eef3ea]' },
  { name: 'Cloud / DevOps', score: 84, detail: 'Infrastructure · scale', x: '27%', y: '78%', tone: 'border-[#c9a96e] bg-[#c9a96e]/10 text-[#f2efe7]' },
];
const process = [
  ['01', 'Your profile', 'A starting point built from your experience, interests, and ambitions.'],
  ['02', 'Your signals', 'A focused assessment reveals the work and problems that energize you.'],
  ['03', 'Your possibilities', 'Transparent matches show not only what fits, but why.'],
  ['04', 'Your next move', 'Skill gaps become a sequence of practical steps toward the future.'],
];
const roadmap = ['Foundations', 'Core skills', 'Advanced skills', 'Projects', 'Portfolio', 'Career preparation'];

function useReveal(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} className={`${className} transition duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>{children}</div>;
}

function CareerMap() {
  const { ref, visible } = useReveal(0.05);
  const [active, setActive] = useState<CareerNode | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const mapLines = careerNodes.map((node) => ({ node, dx: parseFloat(node.x) - 50, dy: parseFloat(node.y) - 50 }));

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({ x: ((event.clientX - rect.left) / rect.width - 0.5) * 10, y: ((event.clientY - rect.top) / rect.height - 0.5) * 10 });
      }}
      onMouseLeave={() => {
        setActive(null);
        setPointer({ x: 0, y: 0 });
      }}
      className={`relative mx-auto aspect-square w-full max-w-[620px] transition duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-label="Interactive career path map"
    >
      <div className="absolute inset-0 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(201,169,110,0.12),transparent_62%)]" />
      <div className="absolute inset-[13%] rounded-full border border-dashed border-white/10" />
      <div className="absolute inset-[28%] rounded-full border border-white/10" />

      {mapLines.map(({ node, dx, dy }, index) => (
        <div
          key={node.name}
          className="absolute left-1/2 top-1/2 h-px origin-left bg-gradient-to-r from-[#c9a96e]/80 to-transparent transition duration-700"
          style={{
            width: `${Math.sqrt(dx * dx + dy * dy) * 1.65}%`,
            transform: `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg) scaleX(${visible ? 1 : 0})`,
            transitionDelay: `${index * 100 + 350}ms`,
          }}
        />
      ))}

      <div
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(calc(-50% + ${pointer.x}px), calc(-50% + ${pointer.y}px))` }}
      >
        <div className="career-you-pulse grid h-24 w-24 place-items-center rounded-full border border-[#e7d6af]/60 bg-[#f2efe7] text-sm font-black tracking-[0.2em] text-[#171510] shadow-[0_0_50px_rgba(201,169,110,0.25)] sm:h-28 sm:w-28">
          YOU
        </div>
      </div>

      {careerNodes.map((node, index) => (
        <button
          key={node.name}
          type="button"
          onMouseEnter={() => setActive(node)}
          onFocus={() => setActive(node)}
          onMouseLeave={() => setActive(null)}
          style={{ left: node.x, top: node.y, animationDelay: `${index * 120}ms` }}
          className={`career-node-in absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-left text-[11px] font-bold shadow-lg backdrop-blur transition duration-300 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/60 ${node.tone}`}
        >
          <span className="block text-[10px] uppercase tracking-[0.18em] text-white/70">{node.score}%</span>
          <span className="mt-1 block text-sm font-bold">{node.name}</span>
          {active?.name === node.name && <span className="mt-1 block text-[10px] font-medium text-white/75">{node.detail}</span>}
        </button>
      ))}
    </div>
  );
}

function AnimatedCoverage() {
  const { ref, visible } = useReveal();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const frame = (now: number) => {
      const progress = Math.min((now - start) / 800, 1);
      setValue(Math.round(68 * progress));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [visible]);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-3xl bg-[#1b1a17] p-7 text-[#f2efe7] sm:p-10">
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full border border-white/5" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9a96e]">Skill gap</p>
      <h3 className="mt-3 max-w-sm text-3xl font-bold tracking-tight">Knowing where you are is the first step.</h3>
      <div className="mt-10 flex items-end gap-4">
        <span className="text-6xl font-bold tabular-nums">{value}%</span>
        <span className="pb-2 text-sm text-[#d7d0c5]/70">skill<br />coverage</span>
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#c9a96e] transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
        <span className="flex items-center gap-2 text-emerald-200"><Check className="h-4 w-4" />Python</span>
        <span className="flex items-center gap-2 text-[#d7d0c5]/70"><CircleDot className="h-4 w-4" />Git · partial</span>
        <span className="flex items-center gap-2 text-[#d7d0c5]/70"><CircleDot className="h-4 w-4" />System design</span>
      </div>
    </div>
  );
}

export default function LandingPage({ onNavigate }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 32);
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--scroll-progress', `${pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0}%`);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const go = (path: string) => {
    setMenuOpen(false);
    onNavigate(path);
  };

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#0d0d0c] text-[#f2efe7]">
      <div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-white/5">
        <div className="scroll-progress h-full bg-[#c9a96e]" />
      </div>

      <nav className={`fixed inset-x-0 top-0 z-40 transition duration-300 ${scrolled ? 'border-b border-white/10 bg-[#0d0d0c]/90 shadow-xl backdrop-blur-md' : 'bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <button type="button" onClick={() => go('/')} className="flex items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8c19a] text-[#171510] shadow-lg shadow-[#d8c19a]/20">
              <Compass className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-[#f2efe7]">AI Career Guide</span>
              <span className="block text-xs text-[#b8b3a8]">Discover. Plan. Grow.</span>
            </span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#b8b3a8] transition hover:bg-white/5 hover:text-[#f2efe7]">How it works</a>
            <a href="#possibilities" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#b8b3a8] transition hover:bg-white/5 hover:text-[#f2efe7]">Possibilities</a>
            <a href="#roadmap" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#b8b3a8] transition hover:bg-white/5 hover:text-[#f2efe7]">Roadmap</a>
            <button type="button" onClick={() => go('/login')} className="px-3 py-2 text-sm font-semibold text-[#b8b3a8] hover:text-[#f2efe7]">Sign in</button>
            <Button className="bg-[#d8c19a] text-[#171510] hover:bg-[#e5d4ad]" onClick={() => go('/register')}>
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <button type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0d0d0c] px-5 py-4 md:hidden">
            <div className="grid gap-2">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-[#b8b3a8]">How it works</a>
              <a href="#possibilities" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-[#b8b3a8]">Possibilities</a>
              <a href="#roadmap" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-[#b8b3a8]">Roadmap</a>
              <button type="button" onClick={() => go('/login')} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#b8b3a8]">Sign in</button>
              <Button className="bg-[#d8c19a] text-[#171510] hover:bg-[#e5d4ad]" onClick={() => go('/register')}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative flex min-h-screen items-center px-5 pb-20 pt-32 sm:px-8 lg:pt-36">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(201,169,110,0.1),transparent_28%),linear-gradient(115deg,#0d0d0c_0%,#151514_54%,#1b1a17_100%)]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-xl">
            <div className="animate-rise">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">
                <Sparkles className="h-4 w-4" />AI-powered career discovery
              </p>
            </div>
            <h1 className="animate-rise-delay-1 mt-7 text-5xl font-bold leading-[1.02] tracking-[-0.045em] text-[#f2efe7] sm:text-6xl lg:text-7xl">
              Find the career path that fits <span className="text-[#c9a96e]">you.</span>
            </h1>
            <p className="animate-rise-delay-2 mt-7 max-w-lg text-lg leading-8 text-[#b8b3a8]">
              Your interests are unique. Your career path should be too. Discover your strengths, understand your gaps, and make your next move with clarity.
            </p>
            <div className="animate-rise-delay-3 mt-9 flex flex-wrap gap-3">
              <Button className="bg-[#d8c19a] text-[#171510] hover:bg-[#e5d4ad]" onClick={() => go('/register')}>
                Start your career journey
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
              >
                Explore how it works
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <CareerMap />
        </div>

        <button
          type="button"
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b8b3a8] transition hover:text-[#f2efe7]"
        >
          Scroll for more
        </button>
      </section>

      <section id="how-it-works" className="border-t border-white/10 bg-[#151514] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">The problem</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">
              Choosing a career shouldn’t feel like guessing.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#b8b3a8]">
              Interests. Skills. Education. Goals. Experience. The useful answer lives where those signals meet.
            </p>
          </Reveal>

          <div className="mt-16 grid gap-10 md:grid-cols-4">
            {process.map(([number, title, description], index) => (
              <Reveal key={number} className="relative">
                <div className="mb-5 flex items-center gap-4">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border text-xs font-bold ${index === 0 ? 'border-[#c9a96e] bg-[#c9a96e] text-[#171510]' : 'border-[#c9a96e]/30 text-[#c9a96e]'}`}>
                    {number}
                  </span>
                  {index < 3 && <span className="hidden h-px flex-1 bg-[#c9a96e]/20 md:block" />}
                </div>
                <h3 className="text-lg font-bold text-[#f2efe7]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#b8b3a8]">{description}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20 border-l-2 border-[#c9a96e] pl-6">
            <p className="text-2xl font-semibold tracking-tight text-[#f2efe7] sm:text-3xl">AI Career Guide brings the fragments together.</p>
            <p className="mt-3 text-[#b8b3a8]">Not a generic answer. A grounded starting point for your own exploration.</p>
          </Reveal>
        </div>
      </section>

      <section id="possibilities" className="relative bg-[#f3efe6] px-5 py-24 text-[#171510] sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6e3f46]">Your possibilities</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">
              What you’re interested in can reveal where you belong.
            </h2>
          </Reveal>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <div className="flex max-w-md flex-wrap gap-3">
                {['Technology', 'Creativity', 'Problem solving', 'Data', 'Leadership', 'Design', 'Research'].map((item, index) => (
                  <span key={item} className="interest-chip rounded-full border border-[#ded5c7] bg-[#fffdf9] px-4 py-3 text-sm font-semibold text-[#2a2723] shadow-sm" style={{ animationDelay: `${index * 100}ms` }}>
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-8 max-w-md text-base leading-7 text-[#5f5a54]">
                Your answers become structured signals, then connect to real career knowledge instead of disappearing into a black box.
              </p>
            </Reveal>

            <Reveal>
              <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-[#e8ddd0] bg-[#fffdf9] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.05)]">
                <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#6e3f46] px-5 py-3 text-sm font-bold text-[#f2efe7] shadow-xl shadow-[#6e3f46]/20">
                  YOUR SIGNALS
                </div>
                <div className="absolute left-[12%] top-[18%] text-xs font-bold text-[#5f5a54]">Technology</div>
                <div className="absolute right-[10%] top-[20%] text-xs font-bold text-[#5f5a54]">Problem solving</div>
                <div className="absolute bottom-[18%] left-[18%] text-xs font-bold text-[#5f5a54]">Data</div>
                <div className="absolute bottom-[18%] right-[14%] text-xs font-bold text-[#5f5a54]">Design</div>
                <div className="interest-line absolute left-[21%] top-[25%] h-px w-[29%] rotate-[25deg] bg-[#d8c19a]" />
                <div className="interest-line absolute right-[20%] top-[27%] h-px w-[30%] rotate-[-25deg] bg-[#d8c19a]" />
                <div className="interest-line absolute bottom-[24%] left-[28%] h-[24%] w-px rotate-[15deg] bg-[#d8c19a]" />
                <div className="interest-line absolute bottom-[24%] right-[28%] h-[24%] w-px rotate-[-15deg] bg-[#d8c19a]" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#151514] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Understand your position</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-[-0.03em] text-[#f2efe7] sm:text-5xl">
              A match is more useful when you can see the distance.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9a96e]">Career match</p>
                <div className="mt-7 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#b8b3a8]">Strongest signal</p>
                    <h3 className="mt-2 text-3xl font-bold text-[#f2efe7]">Software Developer</h3>
                  </div>
                  <span className="text-4xl font-bold text-[#c9a96e]">92%</span>
                </div>
                <div className="mt-7 h-2 rounded-full bg-white/10">
                  <div className="h-full w-[92%] rounded-full bg-[#c9a96e]" />
                </div>
                <div className="mt-8 grid gap-3 text-sm text-[#b8b3a8] sm:grid-cols-3">
                  {['Programming interest', 'Relevant skills', 'Career goal'].map((item) => (
                    <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" />{item}</div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <AnimatedCoverage />
            </Reveal>
          </div>
        </div>
      </section>

      <section id="roadmap" className="bg-[#f3efe6] px-5 py-24 text-[#171510] sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.75fr_1fr]">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6e3f46]">Your next move</p>
            <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">
              From where you are to where you want to be.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-[#5f5a54]">
              Your roadmap starts with the skills that matter most, paced for the time and experience you actually have.
            </p>
            <Button className="mt-8" onClick={() => go('/register')}>
              Build my career roadmap
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Reveal>

          <Reveal>
            <div className="relative border-l-2 border-[#d8c19a] pl-8 sm:pl-12">
              {roadmap.map((item, index) => (
                <div key={item} className="relative pb-9 last:pb-0">
                  <span className={`absolute -left-[3.05rem] top-0 grid h-10 w-10 place-items-center rounded-full border-4 border-[#f3efe6] text-xs font-bold sm:-left-[3.8rem] ${index === 0 ? 'bg-[#6e3f46] text-[#f2efe7]' : 'bg-[#f0e6d4] text-[#171510]'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6e3f46]">{item}</p>
                  <p className="mt-2 text-lg font-bold text-[#171510]">
                    {['Core concepts and confidence', 'Focused practice for your gaps', 'Depth and technical decisions', 'Evidence of what you can do', 'Make your work easy to review', 'Prepare for the next conversation'][index]}
                  </p>
                  <div className="mt-3 h-1.5 max-w-md rounded-full bg-[#e8ddd0]">
                    <div className="h-full rounded-full bg-[#c9a96e]" style={{ width: `${84 - index * 12}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-5 mb-8 overflow-hidden rounded-3xl bg-[#1b1a17] px-6 py-20 text-center sm:mx-8 sm:px-10">
        <Reveal>
          <BookOpen className="mx-auto h-6 w-6 text-[#c9a96e]" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#c9a96e]">Learn · Build · Grow</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-[-0.03em] text-[#f2efe7] sm:text-5xl">
            The future gets clearer one useful step at a time.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#b8b3a8]">
            Get grounded resources, practical projects, and a plan that starts with who you are today.
          </p>
          <Button className="mt-9 bg-[#d8c19a] text-[#171510] hover:bg-[#e5d4ad]" onClick={() => go('/register')}>
            Start your journey
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
