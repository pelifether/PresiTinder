import { bySlug, planPath } from "../data/candidates";
import { asset } from "../lib/asset";

interface Props {
  slug: string;
  children: React.ReactNode;
  className?: string;
}

/** Name (or "Ler o plano") pointing at the TSE-filed PDF. */
export default function PlanLink({ slug, children, className }: Props) {
  const c = bySlug[slug];
  return (
    <a
      className={className ? `plan-link ${className}` : "plan-link"}
      href={asset(planPath(c))}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}
