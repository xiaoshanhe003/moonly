import { cn } from "../../lib/utils";

type SvgColorReplacement = {
  from: string;
  to: string;
};

type InlineStickerSvgProps = {
  svg: string;
  replacements?: SvgColorReplacement[];
  className?: string;
  title?: string;
};

function applySvgColorReplacements(svg: string, replacements: SvgColorReplacement[] = []) {
  return replacements.reduce((markup, replacement) => markup.replaceAll(replacement.from, replacement.to), svg);
}

export function InlineStickerSvg({ svg, replacements, className, title }: InlineStickerSvgProps) {
  return (
    <span
      title={title}
      className={cn("inline-flex [&_svg]:h-full [&_svg]:w-auto [&_svg]:overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: applySvgColorReplacements(svg, replacements) }}
    />
  );
}
