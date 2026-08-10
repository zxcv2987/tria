import type { ReactNode } from "react";
import {
  pageDescriptionClass,
  pageShellMediumClass,
  pageShellNarrowClass,
  pageShellWideClass,
  pageTitleClass,
  breadcrumbClass,
} from "./styles";

type Width = "narrow" | "medium" | "wide";

const WIDTH_CLASS: Record<Width, string> = {
  narrow: pageShellNarrowClass,
  medium: pageShellMediumClass,
  wide: pageShellWideClass,
};

export function PageShell({
  width = "medium",
  children,
}: {
  width?: Width;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <main className={WIDTH_CLASS[width]}>{children}</main>
    </div>
  );
}

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  tone = "default",
}: {
  breadcrumb?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  tone?: "default" | "inverse";
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <div className="min-w-0">
        {breadcrumb ? <p className={tone === "inverse" ? "text-xs font-medium text-white/75" : breadcrumbClass}>{breadcrumb}</p> : null}
        <h1 className={`${tone === "inverse" ? "text-xl font-semibold text-white sm:text-2xl" : pageTitleClass} break-keep [overflow-wrap:anywhere] ${breadcrumb ? "mt-1.5" : ""}`}>
          {title}
        </h1>
        {description ? (
          <p className={tone === "inverse" ? "mt-1 text-sm text-white/75" : pageDescriptionClass}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
