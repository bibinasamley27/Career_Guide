import { BookOpenText, FolderGit2 } from 'lucide-react';

interface WorkspacePageProps {
  title: string;
  description: string;
  type: 'resources' | 'projects';
}

export default function WorkspacePage({ title, description, type }: WorkspacePageProps) {
  const Icon = type === 'resources' ? BookOpenText : FolderGit2;

  return (
    <section className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3 text-sky-300">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Career workspace</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{description}</p>
        </div>
      </div>
      <div className="mt-10 rounded-[28px] border border-dashed border-white/10 bg-[#0b1220]/70 p-8 text-slate-400">
        This workspace is ready for your personalized {type}.
      </div>
    </section>
  );
}
