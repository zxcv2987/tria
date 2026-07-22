"use client";

import { useState, type FormEvent } from "react";

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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="asana-task"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Asana Task ID 또는 URL (선택)
        </label>
        <div className="flex gap-2">
          <input
            id="asana-task"
            value={asanaInput}
            onChange={(e) => setAsanaInput(e.target.value)}
            placeholder="예: 1216781303618826 또는 Asana URL"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="button"
            onClick={handleFetchAsana}
            disabled={asanaLoading || !asanaInput.trim()}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100"
          >
            {asanaLoading ? "불러오는 중..." : "불러오기"}
          </button>
        </div>
        {asanaError && (
          <p className="text-sm text-red-600 dark:text-red-400">{asanaError}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="issue-title"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          이슈 제목
        </label>
        <input
          id="issue-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 강의 수정 후 목록이 갱신되지 않음"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="issue-body"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          이슈 내용
        </label>
        <textarea
          id="issue-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="이슈 상세 내용을 입력하세요"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {disabled ? "분석 중..." : "분석"}
      </button>
    </form>
  );
}
