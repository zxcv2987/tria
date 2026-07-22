"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ProjectConfig } from "./mock-data";
import { ActiveBadge } from "@/components/status-badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  btnGhostClass,
  btnPrimaryClass,
  cardClass,
  fieldLabelClass,
  helpTextClass,
  inputClass,
  sectionTitleClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/styles";

const REPO_NONE = "__none__";

type RepoOption = { owner: string; repo: string };

type Props = {
  initialProjects: ProjectConfig[];
};

const emptyForm: Omit<ProjectConfig, "id"> = {
  key: "",
  name: "",
  asanaProjectValue: "",
  githubOwner: "",
  githubRepository: "",
  defaultRef: "main",
  isActive: true,
  analysisPrompt: "",
};

export function ProjectConfigForm({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [repoOptions, setRepoOptions] = useState<RepoOption[]>([]);

  useEffect(() => {
    fetch("/api/github/available-repos")
      .then((res) => res.json())
      .then((data: { repositories?: RepoOption[] }) =>
        setRepoOptions(data.repositories ?? []),
      )
      .catch(() => setRepoOptions([]));
  }, []);

  function handleRepoSelect(value: string) {
    const [githubOwner = "", githubRepository = ""] = value.split("/");
    setForm((prev) => ({ ...prev, githubOwner, githubRepository }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(project: ProjectConfig) {
    setEditingId(project.id);
    setForm({
      key: project.key,
      name: project.name,
      asanaProjectValue: project.asanaProjectValue,
      githubOwner: project.githubOwner,
      githubRepository: project.githubRepository,
      defaultRef: project.defaultRef,
      isActive: project.isActive,
      analysisPrompt: project.analysisPrompt,
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.key.trim() || !form.name.trim()) return;

    // TODO: /api/projects 연동
    if (editingId) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)),
      );
    } else {
      setProjects((prev) => [
        ...prev,
        { id: `proj-${Date.now()}`, ...form },
      ]);
    }
    startCreate();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className={tableWrapClass}>
        <table className={`${tableClass} min-w-[48rem]`}>
          <thead className={tableHeadClass}>
            <tr>
              <th className={tableHeadCellClass}>키</th>
              <th className={tableHeadCellClass}>표시 이름</th>
              <th className={tableHeadCellClass}>Asana 프로젝트</th>
              <th className={tableHeadCellClass}>GitHub 저장소</th>
              <th className={tableHeadCellClass}>기본 브랜치</th>
              <th className={tableHeadCellClass}>활성화</th>
              <th className={tableHeadCellClass} />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className={tableRowClass}>
                <td className={`${tableCellClass} font-mono text-xs`}>{p.key}</td>
                <td className={tableCellClass}>{p.name}</td>
                <td className={tableCellClass}>{p.asanaProjectValue}</td>
                <td className={`${tableCellClass} font-mono text-xs`}>
                  {p.githubOwner}/{p.githubRepository}
                </td>
                <td className={tableCellClass}>{p.defaultRef}</td>
                <td className={tableCellClass}>
                  <ActiveBadge active={p.isActive} />
                </td>
                <td className={tableCellClass}>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className={btnGhostClass}
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`${cardClass} flex max-w-xl flex-col gap-4`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className={sectionTitleClass}>
            {editingId ? "프로젝트 수정" : "프로젝트 추가"}
          </h2>
          {editingId && (
            <button type="button" onClick={startCreate} className={btnGhostClass}>
              새로 추가
            </button>
          )}
        </div>

        {(
          [
            ["key", "프로젝트 키", "classroom"],
            ["name", "표시 이름", "Classroom"],
            ["asanaProjectValue", "Asana 프로젝트 값", "Classroom 이슈"],
            ["defaultRef", "기본 브랜치", "main"],
          ] as const
        ).map(([field, label, placeholder]) => (
          <div key={field} className="flex flex-col gap-2">
            <label htmlFor={field} className={fieldLabelClass}>
              {label}
            </label>
            <input
              id={field}
              value={form[field]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [field]: e.target.value }))
              }
              placeholder={placeholder}
              className={inputClass}
            />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label htmlFor="githubRepo" className={fieldLabelClass}>
            GitHub 저장소
          </label>
          {repoOptions.length > 0 ? (
            <Select
              value={
                form.githubOwner && form.githubRepository
                  ? `${form.githubOwner}/${form.githubRepository}`
                  : REPO_NONE
              }
              onValueChange={(value) => {
                if (value === REPO_NONE) {
                  setForm((prev) => ({
                    ...prev,
                    githubOwner: "",
                    githubRepository: "",
                  }));
                  return;
                }
                handleRepoSelect(value);
              }}
            >
              <SelectTrigger id="githubRepo" className="h-9 w-full">
                <SelectValue placeholder="선택하세요 (App이 설치된 저장소만 표시)" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={REPO_NONE}>
                  선택하세요 (App이 설치된 저장소만 표시)
                </SelectItem>
                {repoOptions.map(({ owner, repo }) => (
                  <SelectItem
                    key={`${owner}/${repo}`}
                    value={`${owner}/${repo}`}
                  >
                    {owner}/{repo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <p className={helpTextClass}>
                설치된 저장소 목록을 못 불러와서 직접 입력으로 대체합니다.
              </p>
              <div className="flex gap-2">
                <input
                  value={form.githubOwner}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, githubOwner: e.target.value }))
                  }
                  placeholder="tria-org"
                  className={inputClass}
                />
                <input
                  value={form.githubRepository}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      githubRepository: e.target.value,
                    }))
                  }
                  placeholder="classroom-web"
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20 dark:border-zinc-600"
          />
          활성화
        </label>

        <div className="flex flex-col gap-2">
          <label htmlFor="analysisPrompt" className={fieldLabelClass}>
            분석 프롬프트 설정
          </label>
          <textarea
            id="analysisPrompt"
            value={form.analysisPrompt}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                analysisPrompt: e.target.value,
              }))
            }
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </div>

        <button type="submit" className={`${btnPrimaryClass} self-start`}>
          {editingId ? "저장" : "추가"}
        </button>
      </form>
    </div>
  );
}
