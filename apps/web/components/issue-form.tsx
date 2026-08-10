"use client";

import { useState, type FormEvent } from "react";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  cardClass,
  errorTextClass,
  fieldLabelClass,
  inputClass,
} from "@/components/ui/styles";

type IssueFormProps = {
  onSubmit: (input: { title: string; body: string }) => void;
  disabled?: boolean;
};

export function IssueForm({ onSubmit, disabled }: IssueFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [asanaInput, setAsanaInput] = useState("");
  const [asanaLoading, setAsanaLoading] = useState(false);
  const [asanaError, setAsanaError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onSubmit({ title, body });
  }

  async function handleFetchAsana() {
    if (!asanaInput.trim()) return;
    setAsanaLoading(true);
    setAsanaError(null);

    try {
      const res = await fetch("/api/asana-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIdOrUrl: asanaInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Asana 조회에 실패했습니다.");
      }

      setTitle(data.title);
      setBody(data.body);
    } catch (err) {
      setAsanaError(
        err instanceof Error
          ? err.message
          : "Asana 조회에 실패했습니다. 직접 입력해주세요."
      );
    } finally {
      setAsanaLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} flex flex-col gap-5`}>
      <div className="flex flex-col gap-2">
        <label htmlFor="asana-task" className={fieldLabelClass}>
          Asana Task ID 또는 URL (선택)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="asana-task"
            value={asanaInput}
            onChange={(e) => setAsanaInput(e.target.value)}
            placeholder="예: 1216781303618826 또는 Asana URL"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleFetchAsana}
            disabled={asanaLoading || !asanaInput.trim()}
            className={`${btnSecondaryClass} shrink-0`}
          >
            {asanaLoading ? "불러오는 중..." : "불러오기"}
          </button>
        </div>
        {asanaError && (
          <p className={errorTextClass} role="alert">
            {asanaError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="issue-title" className={fieldLabelClass}>
          이슈 제목
        </label>
        <input
          id="issue-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 강의 수정 후 목록이 갱신되지 않음"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="issue-body" className={fieldLabelClass}>
          이슈 내용
        </label>
        <textarea
          id="issue-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="이슈 상세 내용을 입력하세요"
          className={`${inputClass} min-h-[12rem] resize-y`}
        />
      </div>

      <button type="submit" disabled={disabled} className={`${btnPrimaryClass} self-start`}>
        {disabled ? "분석 중..." : "분석"}
      </button>
    </form>
  );
}
