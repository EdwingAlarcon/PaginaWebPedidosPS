import { cn } from "@/lib/cn";

interface PageHeadingProps {
  eyebrow: string;
  title: string;
  className?: string;
}

export function PageHeading({ eyebrow, title, className }: PageHeadingProps) {
  return (
    <div className={cn("mb-6", className)}>
      <p className="mb-1.5 text-[0.82rem] font-bold uppercase tracking-wide text-primary">{eyebrow}</p>
      <h1 className="text-page-title">{title}</h1>
    </div>
  );
}
