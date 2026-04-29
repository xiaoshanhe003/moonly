import { useEffect, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
    const { documentElement, body } = document;
    const previousDocumentOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      documentElement.style.overflow = previousDocumentOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return createPortal(
    <div className={uiLayoutStyles.sheetOverlay} onClick={onClose}>
      <div className={cn(uiLayoutStyles.sheetBody, bodyClassName)} onClick={(event) => event.stopPropagation()}>
        <div className={uiLayoutStyles.sheetHeader}>
          <div>{header}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X className="size-5" />
          </Button>
        </div>

        <div className={cn(uiLayoutStyles.sheetContent, "overscroll-contain", contentClassName)}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
