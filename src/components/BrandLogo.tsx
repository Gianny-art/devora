import { Radar } from 'lucide-react';

type Props = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 to-accent/15 shadow-[0_0_24px_hsl(var(--primary)/0.12)]">
        <Radar className="h-5 w-5 text-primary" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-foreground">devora</span>
        {!compact && <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Local growth radar</span>}
      </span>
    </span>
  );
}
