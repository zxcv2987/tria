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
    <div className="flex flex-1 flex-col">
      <main className={WIDTH_CLASS[width]}>{children}</main>
    </div>
  );
}

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb ? <p className={breadcrumbClass}>{breadcrumb}</p> : null}
        <h1 className={`${pageTitleClass} ${breadcrumb ? "mt-1.5" : ""}`}>
          {title}
        </h1>
        {description ? (
          <p className={pageDescriptionClass}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
