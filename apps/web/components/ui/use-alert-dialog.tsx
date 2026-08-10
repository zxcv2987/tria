"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { bodyTextClass, sectionTitleClass } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "error";

type AlertState = {
  kind: "alert";
  title: string;
  description: string;
  variant: AlertVariant;
  resolve: () => void;
};

type ConfirmState = {
  kind: "confirm";
  title: string;
  description: string;
  destructive?: boolean;
  confirmLabel?: string;
  resolve: (ok: boolean) => void;
};

type DialogState = AlertState | ConfirmState | null;

export function useAlertDialog() {
  const [state, setState] = useState<DialogState>(null);
  const stateRef = useRef<DialogState>(null);

  const settle = useCallback((ok: boolean) => {
    const current = stateRef.current;
    if (!current) return;
    stateRef.current = null;
    setState(null);
    if (current.kind === "confirm") current.resolve(ok);
    else current.resolve();
  }, []);

  const alert = useCallback(
    (
      description: string,
      options?: { title?: string; variant?: AlertVariant },
    ) => {
      const variant = options?.variant ?? "default";
      return new Promise<void>((resolve) => {
        const next: AlertState = {
          kind: "alert",
          title: options?.title ?? (variant === "error" ? "오류" : "알림"),
          description,
          variant,
          resolve,
        };
        stateRef.current = next;
        setState(next);
      });
    },
    [],
  );

  const confirm = useCallback(
    (
      description: string,
      options?: {
        title?: string;
        destructive?: boolean;
        confirmLabel?: string;
      },
    ) => {
      return new Promise<boolean>((resolve) => {
        const next: ConfirmState = {
          kind: "confirm",
          title: options?.title ?? "확인",
          description,
          destructive: options?.destructive,
          confirmLabel:
            options?.confirmLabel ??
            (options?.destructive ? "삭제" : "확인"),
          resolve,
        };
        stateRef.current = next;
        setState(next);
      });
    },
    [],
  );

  const dialog = (
    <AlertDialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          {state?.kind === "alert" && state.variant === "error" && (
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <AlertTriangle />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle
            className={cn(
              sectionTitleClass,
              state?.kind === "alert" &&
                state.variant === "error" &&
                "text-destructive",
            )}
          >
            {state?.title}
          </AlertDialogTitle>
          <AlertDialogDescription className={bodyTextClass}>
            {state?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {state?.kind === "confirm" && (
            <AlertDialogCancel onClick={() => settle(false)}>
              취소
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            variant={
              state?.kind === "confirm" && state.destructive
                ? "destructive"
                : "default"
            }
            onClick={() => settle(true)}
          >
            {state?.kind === "confirm"
              ? (state.confirmLabel ?? "확인")
              : "확인"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { alert, confirm, dialog };
}
