import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

function PaperStrip({
  asChild = false,
  animated = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
  animated?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="paper-strip"
      className={cn("strip-shape strip-paper", animated && "strip-enter", className)}
      {...props}
    />
  );
}

function MetaRow({
  label,
  children,
  className,
  valueClassName,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex justify-between gap-3", className)}>
      <dt className="shrink-0 text-current/70">{label}</dt>
      <dd className={cn("min-w-0 text-right", valueClassName)}>{children}</dd>
    </div>
  );
}

function ConsoleSectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 text-white", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-xs text-white/70">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 text-xs font-medium text-white/70">{action}</div> : null}
    </div>
  );
}

export { ConsoleSectionHeader, MetaRow, PaperStrip };
