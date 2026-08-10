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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  cardClass,
  emptyStateClass,
  fieldLabelClass,
  helpTextClass,
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
        { variant: "error" },
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
        { variant: "error" },
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
              <th className={tableHeadCellClass}>GitHub 저장소</th>
              <th className={tableHeadCellClass}>기본 브랜치</th>
              <th className={tableHeadCellClass}>활성화</th>
              <th className={tableHeadCellClass} />
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className={`${tableCellClass} ${emptyStateClass}`}
                >
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(p)}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(p.id)}
                      >
                        삭제
                      </Button>
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
            <Button type="button" variant="ghost" size="sm" onClick={startCreate}>
              새로 추가
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          여기 등록해도 자동으로 이벤트가 오지 않습니다. 이 키를
          `projectKey`로 지정해 <code>POST /api/issues</code>를 직접
          호출해야 실제로 연결됩니다.
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
            <Input
              id={field}
              value={form[field]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [field]: e.target.value }))
              }
              placeholder={placeholder}
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
                <Input
                  value={form.githubOwner}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, githubOwner: e.target.value }))
                  }
                  placeholder="tria-org"
                />
                <Input
                  value={form.githubRepository}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      githubRepository: e.target.value,
                    }))
                  }
                  placeholder="classroom-web"
                />
              </div>
            </>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="size-4 rounded border-input accent-primary focus:ring-2 focus:ring-ring/50"
          />
          활성화
        </label>

        <div className="flex flex-col gap-2">
          <label htmlFor="analysisPrompt" className={fieldLabelClass}>
            분석 프롬프트 설정
          </label>
          <Textarea
            id="analysisPrompt"
            value={form.analysisPrompt}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                analysisPrompt: e.target.value,
              }))
            }
            rows={4}
            className="resize-y"
          />
        </div>

        <Button type="submit" className="self-start">
          {editingId ? "저장" : "추가"}
        </Button>
      </form>
    </div>
  );
}
