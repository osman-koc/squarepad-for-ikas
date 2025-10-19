type InlineHintProps = {
  children: React.ReactNode;
};

export function InlineHint({ children }: InlineHintProps) {
  return <div className="rounded-md border border-dashed border-muted/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">{children}</div>;
}
