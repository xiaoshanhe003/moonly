import type { PropsWithChildren, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { uiLayoutStyles } from "./styles";

type SheetProps = PropsWithChildren<{
  header: ReactNode;
  onClose: () => void;
  bodyClassName?: string;
  contentClassName?: string;
}>;

export function Sheet({ header, onClose, bodyClassName, contentClassName, children }: SheetProps) {
  return (
    <div className={uiLayoutStyles.sheetOverlay} onClick={onClose}>
      <div className={cn(uiLayoutStyles.sheetBody, bodyClassName)} onClick={(event) => event.stopPropagation()}>
        <div className={uiLayoutStyles.sheetHeader}>
          <div>{header}</div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className={cn(uiLayoutStyles.sheetContent, contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
