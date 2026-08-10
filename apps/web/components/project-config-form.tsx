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
import { useAlertDialog } from "@/components/ui/use-alert-dialog";
import {
  btnDestructiveClass,
  btnGhostClass,
  btnPrimaryClass,
  cardClass,
  emptyStateClass,
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
type AsanaProjectOption = { gid: string; name: string };

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
  const { alert, confirm, dialog } = useAlertDialog();
  const [projects, setProjects] = useState(initialProjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [repoOptions, setRepoOptions] = useState<RepoOption[]>([]);
  const [asanaProjectOptions, setAsanaProjectOptions] = useState<
    AsanaProjectOption[]
  >([]);

  useEffect(() => {
    fetch("/api/github/available-repos")
      .then((res) => res.json())
      .then((data: { repositories?: RepoOption[] }) =>
        setRepoOptions(data.repositories ?? []),
      )
      .catch(() => setRepoOptions([]));

    fetch("/api/asana/available-projects")
      .then((res) => res.json())
      .then((data: { projects?: AsanaProjectOption[] }) =>
        setAsanaProjectOptions(data.projects ?? []),
      )
      .catch(() => setAsanaProjectOptions([]));
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.key.trim() || !form.name.trim()) return;

    try {
      if (editingId) {
        const res = await fetch(`/api/projects/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setProjects((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)),
        );
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProjects((prev) => [...prev, { id: data.id, ...form }]);
      }
      startCreate();
    } catch (err) {
      await alert(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      );
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm("이 프로젝트 설정을 삭제할까요?", {
      title: "삭제",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) startCreate();
    } catch (err) {
      await alert(
        err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {dialog}
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
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className={`${tableCellClass} ${emptyStateClass}`}>
                  등록된 프로젝트가 없습니다. 아래에서 첫 매핑을 추가하세요.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className={tableRowClass}>
                  <td className={`${tableCellClass} whitespace-nowrap font-mono text-xs`}>
                    {p.key}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap`}>{p.name}</td>
                  <td className={`${tableCellClass} whitespace-nowrap`}>
                    {p.asanaProjectValue}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap font-mono text-xs`}>
                    {p.githubOwner}/{p.githubRepository}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap`}>
                    {p.defaultRef}
                  </td>
                  <td className={tableCellClass}>
                    <ActiveBadge active={p.isActive} />
                  </td>
                  <td className={tableCellClass}>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className={btnGhostClass}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className={`${btnDestructiveClass} px-2 py-1.5`}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`${cardClass} flex max-w-xl flex-col gap-4`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className={sectionTitleClass}>
            {editingId ? "프로젝트 설정 수정" : "프로젝트 설정 추가"}
          </h2>
          {editingId && (
            <button type="button" onClick={startCreate} className={btnGhostClass}>
              새로 추가
            </button>
          )}
        </div>

        <p className={helpTextClass}>
          여기 등록한다고 자동으로 이벤트가 오지 않습니다. Asana 프로젝트
          GID로 웹훅을 별도로 등록해야 실제로 연결됩니다.
        </p>

        {(
          [
            ["key", "프로젝트 키", "classroom"],
            ["name", "표시 이름", "Classroom"],
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
          <label htmlFor="asanaProject" className={fieldLabelClass}>
            Asana 프로젝트
          </label>
          {asanaProjectOptions.length > 0 ? (
            <Select
              value={form.asanaProjectValue || REPO_NONE}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  asanaProjectValue: value === REPO_NONE ? "" : value,
                }))
              }
            >
              <SelectTrigger id="asanaProject" className="h-9 w-full">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={REPO_NONE}>선택하세요</SelectItem>
                {asanaProjectOptions.map(({ gid, name }) => (
                  <SelectItem key={gid} value={gid}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <p className={helpTextClass}>
                프로젝트 목록을 못 불러와서 GID 직접 입력으로 대체합니다.
              </p>
              <input
                id="asanaProject"
                value={form.asanaProjectValue}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    asanaProjectValue: e.target.value,
                  }))
                }
                placeholder="1216772744613005"
                className={inputClass}
              />
            </>
          )}
        </div>

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
