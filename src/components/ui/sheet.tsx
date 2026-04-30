import { useEffect, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { uiLayoutStyles } from "./styles";

type SheetProps = PropsWithChildren<{
  header: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  bodyClassName?: string;
  contentClassName?: string;
}>;

export function Sheet({ header, onClose, footer, bodyClassName, contentClassName, children }: SheetProps) {
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
      <div className={cn(uiLayoutStyles.sheetFrame, bodyClassName)} onClick={(event) => event.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className={uiLayoutStyles.sheetCloseButton}
          onClick={onClose}
          aria-label="关闭"
        >
          <X className="size-5" />
        </Button>

        <div className={uiLayoutStyles.sheetBody}>
          <div className={uiLayoutStyles.sheetHeader}>{header}</div>
          <div className={cn(uiLayoutStyles.sheetContent, "overscroll-contain", contentClassName)}>{children}</div>
          {footer ? (
            <div className={uiLayoutStyles.sheetFooter}>
              <div className={uiLayoutStyles.sheetFooterContent}>{footer}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
