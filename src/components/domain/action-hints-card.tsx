import { Card } from "../ui/card";
import { cn } from "../../lib/utils";
import { uiSpacingStyles, uiSurfaceStyles, uiTextStyles } from "../ui/styles";

type ActionHintsCardProps = {
  dos: string[];
  donts: string[];
};

export function ActionHintsCard({ dos, donts }: ActionHintsCardProps) {
  return (
    <Card className={uiSpacingStyles.stackSm}>
      <div className={cn("flex", uiSpacingStyles.gapSm)}>
        <div className={cn("flex-1", uiSurfaceStyles.panel)}>
          <p className={uiTextStyles.sectionLabel}>宜</p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
            {dos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={cn("flex-1", uiSurfaceStyles.panelStrong)}>
          <p className={uiTextStyles.sectionLabel}>忌</p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
            {donts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
