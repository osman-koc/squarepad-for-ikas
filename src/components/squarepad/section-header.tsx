type SectionHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function SectionHeader({ title, description, eyebrow }: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs font-medium uppercase tracking-wide text-primary/80">{eyebrow}</p> : null}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
