/** Shared Tailwind class tokens for consistent UI across screens.
 * 색상은 항상 shadcn 테마 변수(bg-card, text-foreground, border-border 등)를 참조한다 —
 * 라이트/다크가 자동으로 맞춰지므로 zinc-* 같은 리터럴 팔레트를 여기 추가하지 않는다.
 * 버튼은 @/components/ui/button의 <Button>을 쓴다(중복 정의 금지). */

export const pageShellClass =
  "mx-auto flex w-full flex-col gap-8 px-6 py-10 sm:px-8";

export const pageShellNarrowClass = `${pageShellClass} max-w-2xl`;
export const pageShellMediumClass = `${pageShellClass} max-w-3xl`;
export const pageShellWideClass = `${pageShellClass} max-w-6xl`;

export const pageTitleClass =
  "text-[1.375rem] font-semibold leading-snug tracking-tight text-foreground sm:text-2xl";

export const pageDescriptionClass =
  "mt-1.5 text-sm leading-relaxed text-muted-foreground";

export const breadcrumbClass =
  "text-xs font-medium tracking-wide text-muted-foreground";

export const sectionTitleClass =
  "text-base font-semibold leading-snug text-foreground";

export const fieldLabelClass =
  "text-sm font-medium leading-none text-foreground";

export const metaLabelClass =
  "text-xs font-medium tracking-wide text-muted-foreground";

export const bodyTextClass = "text-sm leading-relaxed text-foreground";

export const mutedTextClass = "text-sm leading-relaxed text-muted-foreground";

export const helpTextClass = "text-xs leading-relaxed text-muted-foreground";

export const cardClass =
  "rounded-xl border border-border bg-card p-5 shadow-xs dark:shadow-none";

export const codeChipClass =
  "rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs leading-normal text-foreground";

export const tableWrapClass =
  "overflow-x-auto rounded-xl border border-border bg-card shadow-xs dark:shadow-none";

export const tableClass = "w-full text-left text-sm";

export const tableHeadClass =
  "border-b border-border bg-muted/50 text-xs font-medium tracking-wide text-muted-foreground";

export const tableHeadCellClass = "px-3.5 py-2.5 font-medium";

export const tableRowClass = "border-b border-border/60 last:border-0";

export const tableCellClass = "px-3.5 py-3 align-middle";

export const linkClass = "text-primary underline-offset-2 hover:underline";

export const errorTextClass = "text-sm leading-relaxed text-destructive";

export const emptyStateClass =
  "py-10 text-center text-sm leading-relaxed text-muted-foreground";

export const metricCardClass =
  "rounded-xl border border-border bg-card px-3.5 py-3.5 shadow-xs dark:shadow-none";
