"use client";

import { useState, type FormEvent } from "react";

type IssueFormProps = {
  onSubmit: (input: { title: string; body: string }) => void;
  disabled?: boolean;
};

export function IssueForm({ onSubmit, disabled }: IssueFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onSubmit({ title, body });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
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
