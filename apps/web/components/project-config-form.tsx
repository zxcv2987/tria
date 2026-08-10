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
import { ConsoleSectionHeader, MetaRow, PaperStrip } from "@/components/ui/workbench";

const REPO_NONE = "__none__";

type RepoOption = { owner: string; repo: string };

type SyncResponse = {
  inserted: (Omit<ProjectConfig, "isActive" | "analysisPrompt">)[];
  deactivatedIds: string[];
  conflicts: {
    githubOwner: string;
    githubRepository: string;
    conflictingKey: string;
  }[];
  errors: { githubOwner: string; githubRepository: string; message: string }[];
};

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
  const [repoState, setRepoState] = useState<"loading" | "ready" | "error">("loading");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/github/available-repos")
      .then((res) => res.json())
      .then((data: { repositories?: RepoOption[] }) => {
        setRepoOptions(data.repositories ?? []);
        setRepoState("ready");
      })
      .catch(() => {
        setRepoOptions([]);
        setRepoState("error");
      });
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

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/projects/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse & { error?: string };
      if (!res.ok) throw new Error(data.error);

      const deactivatedIds = new Set(data.deactivatedIds);
      setProjects((prev) => [
        ...prev.map((project) =>
          deactivatedIds.has(project.id)
            ? { ...project, isActive: false }
            : project,
        ),
        ...data.inserted.map((project) => ({
          ...project,
          isActive: true,
          analysisPrompt: "",
        })),
      ]);

      let message = `${data.inserted.length}개 추가, ${data.deactivatedIds.length}개 비활성화`;
      if (data.conflicts.length > 0) {
        const conflictSummary = data.conflicts
          .map(
            (conflict) =>
              `${conflict.githubOwner}/${conflict.githubRepository} (키 "${conflict.conflictingKey}" 중복)`,
          )
          .join(", ");
        message += `\n${data.conflicts.length}개 충돌(수동 처리 필요): ${conflictSummary}`;
      }
      if (data.errors.length > 0) {
        const errorSummary = data.errors
          .map((e) => `${e.githubOwner}/${e.githubRepository} (${e.message})`)
          .join(", ");
        message += `\n${data.errors.length}개 추가 실패: ${errorSummary}`;
      }
      await alert(message, {
        variant: data.conflicts.length > 0 || data.errors.length > 0 ? "error" : undefined,
      });
    } catch (err) {
      await alert(
        err instanceof Error ? err.message : "동기화 중 오류가 발생했습니다.",
        { variant: "error" },
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      {dialog}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={syncing}
        onClick={handleSync}
        className="self-start"
      >
        {syncing ? "동기화 중..." : "GitHub에서 동기화"}
      </Button>
      <div className="space-y-2 md:hidden">
        <ConsoleSectionHeader className="border border-console-line bg-console-muted p-3" title="저장소 매핑 스트립" description="접수 키와 조사 저장소를 관리합니다." />
        {projects.length === 0 ? <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">등록된 프로젝트가 없습니다.</p> : projects.map((p) => (
          <PaperStrip asChild key={p.id} className="p-4"><article>
            <div className="flex items-center justify-between gap-3"><code className="text-xs font-semibold">{p.key}</code><ActiveBadge active={p.isActive} /></div>
            <h3 className="mt-3 text-sm font-semibold">{p.name}</h3>
            <dl className="mt-2 space-y-1 text-xs"><MetaRow label="저장소" valueClassName="truncate">{p.githubOwner}/{p.githubRepository}</MetaRow><MetaRow label="기본 브랜치">{p.defaultRef}</MetaRow></dl>
            <div className="mt-4 grid grid-cols-2 gap-2"><Button className="h-11" type="button" variant="outline" onClick={() => startEdit(p)}>수정</Button><Button className="h-11" type="button" variant="destructive" onClick={() => handleDelete(p.id)}>삭제</Button></div>
          </article></PaperStrip>
        ))}
      </div>
      <div className={`${tableWrapClass} hidden min-h-[420px] min-w-0 md:block`}>
        <table className={`${tableClass} min-w-[48rem]`}>
          <caption className="border-b border-console-line bg-console-muted px-3 py-3 text-left">
            <span className="block text-sm font-semibold text-white">저장소 매핑 스트립</span>
            <span className="mt-1 block text-xs text-white/70">접수 키가 어떤 저장소와 기준 브랜치를 조사할지 정의합니다.</span>
          </caption>
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
                  <td className={`${tableCellClass} whitespace-nowrap text-xs`}>
                    {p.key}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap`}>{p.name}</td>
                  <td className={`${tableCellClass} whitespace-nowrap text-xs`}>
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
        className={`${cardClass} flex flex-col gap-4 lg:sticky lg:top-16`}
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
          <code>projectKey</code>로 지정해 <code>POST /api/issues</code>를 직접
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
          {repoState === "loading" ? (
            <p className={helpTextClass} role="status">설치된 저장소 목록을 불러오는 중입니다.</p>
          ) : repoOptions.length > 0 ? (
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
                {repoState === "error" ? "저장소 목록을 불러오지 못했습니다. 직접 입력하세요." : "설치된 저장소가 없습니다. 저장소를 직접 입력하세요."}
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
