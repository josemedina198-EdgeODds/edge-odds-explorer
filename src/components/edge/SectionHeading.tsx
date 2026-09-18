export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  text?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] md:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{text}</p>}
    </div>
  );
}
