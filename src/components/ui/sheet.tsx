import { useEffect, type PropsWithChildren, type ReactNode } from "react";
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
  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div className={uiLayoutStyles.sheetOverlay} onClick={onClose}>
      <div className={cn(uiLayoutStyles.sheetBody, bodyClassName)} onClick={(event) => event.stopPropagation()}>
        <div className={uiLayoutStyles.sheetHeader}>
          <div>{header}</div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className={cn(uiLayoutStyles.sheetContent, "overscroll-contain", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
