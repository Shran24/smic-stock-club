import { Icon } from "./Icon";

export default function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 mt-1 flex items-center gap-3">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-forest-800 text-cream-50 shadow-glow">
        <Icon name={icon} size={21} />
      </div>
      <div>
        <h3 className="font-display text-[22px] font-bold tracking-tight text-ink">{title}</h3>
        {subtitle && <p className="text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
