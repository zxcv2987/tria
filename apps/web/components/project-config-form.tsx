"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ProjectConfig } from "./mock-data";

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
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2 font-medium">키</th>
              <th className="px-3 py-2 font-medium">표시 이름</th>
              <th className="px-3 py-2 font-medium">Asana 프로젝트</th>
              <th className="px-3 py-2 font-medium">GitHub 저장소</th>
              <th className="px-3 py-2 font-medium">기본 브랜치</th>
              <th className="px-3 py-2 font-medium">활성화</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="px-3 py-2 font-mono text-xs">{p.key}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.asanaProjectValue}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {p.githubOwner}/{p.githubRepository}
                </td>
                <td className="px-3 py-2">{p.defaultRef}</td>
                <td className="px-3 py-2">{p.isActive ? "활성" : "비활성"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="text-sm underline-offset-2 hover:underline"
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
        className="flex max-w-xl flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {editingId ? "프로젝트 수정" : "프로젝트 추가"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="text-sm text-zinc-500 underline-offset-2 hover:underline"
            >
              새로 추가
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500">
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
          <div key={field} className="flex flex-col gap-1">
            <label
              htmlFor={field}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {label}
            </label>
            <input
              id={field}
              value={form[field]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [field]: e.target.value }))
              }
              placeholder={placeholder}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="asanaProject"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Asana 프로젝트
          </label>
          {asanaProjectOptions.length > 0 ? (
            <select
              id="asanaProject"
              value={form.asanaProjectValue}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  asanaProjectValue: e.target.value,
                }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">선택하세요</option>
              {asanaProjectOptions.map(({ gid, name }) => (
                <option key={gid} value={gid}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <p className="text-xs text-zinc-500">
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
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="githubRepo"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            GitHub 저장소
          </label>
          {repoOptions.length > 0 ? (
            <select
              id="githubRepo"
              value={
                form.githubOwner && form.githubRepository
                  ? `${form.githubOwner}/${form.githubRepository}`
                  : ""
              }
              onChange={(e) => handleRepoSelect(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">선택하세요 (App이 설치된 저장소만 표시)</option>
              {repoOptions.map(({ owner, repo }) => (
                <option key={`${owner}/${repo}`} value={`${owner}/${repo}`}>
                  {owner}/{repo}
                </option>
              ))}
            </select>
          ) : (
            <>
              <p className="text-xs text-zinc-500">
                설치된 저장소 목록을 못 불러와서 직접 입력으로 대체합니다.
              </p>
              <div className="flex gap-2">
                <input
                  value={form.githubOwner}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, githubOwner: e.target.value }))
                  }
                  placeholder="tria-org"
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
                  className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isActive: e.target.checked }))
            }
          />
          활성화
        </label>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="analysisPrompt"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
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
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {editingId ? "저장" : "추가"}
        </button>
      </form>
    </div>
  );
}
