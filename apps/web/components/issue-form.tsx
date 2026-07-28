"use client";

import { useState, type FormEvent } from "react";
import {
  btnPrimaryClass,
  cardClass,
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onSubmit({ title, body });
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} flex flex-col gap-5`}>
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
