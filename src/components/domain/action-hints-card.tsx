import { Card } from "../ui/card";

type ActionHintsCardProps = {
  dos: string[];
  donts: string[];
};

export function ActionHintsCard({ dos, donts }: ActionHintsCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl bg-[var(--color-accent-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent-strong)]">宜</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink)]">
            {dos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="flex-1 rounded-2xl bg-[#f6ecec] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#b36d78]">忌</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink)]">
            {donts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
