function extractTaskGid(taskIdOrUrl: string): string {
  const trimmed = taskIdOrUrl.trim().split("?")[0];
  const segments = trimmed.split("/").filter((s) => /^\d+$/.test(s));
  if (segments.length > 0) return segments[segments.length - 1];
  return trimmed;
}

type AsanaCustomField = {
  name?: string;
  display_value?: string | null;
  enum_value?: { name?: string } | null;
};

type AsanaTaskData = {
  gid: string;
  name: string;
  notes?: string;
  permalink_url?: string;
  modified_at?: string;
  custom_fields?: AsanaCustomField[];
  projects?: { gid: string; name: string }[];
};

export type AsanaTaskDetails = {
  gid: string;
  title: string;
  body: string;
  asanaUrl: string;
  modifiedAt: string;
  asanaStatus: string;
  projectGids: string[];
  projectNames: string[];
};

function pickAsanaStatus(fields: AsanaCustomField[] | undefined): string {
  if (!fields) return "";
  const statusField = fields.find(
    (f) => typeof f.name === "string" && /이슈\s*상태/.test(f.name)
  );
  if (!statusField) return "";
  return (
    statusField.enum_value?.name ??
    statusField.display_value ??
    ""
  );
}

export async function fetchAsanaTaskDetails(
  taskIdOrUrl: string
): Promise<AsanaTaskDetails> {
  const pat = process.env.ASANA_PAT;
  if (!pat) throw new Error("ASANA_PAT 환경변수가 설정되지 않았습니다.");

  const taskGid = extractTaskGid(taskIdOrUrl);
  const optFields = [
    "name",
    "notes",
    "permalink_url",
    "modified_at",
    "custom_fields.name",
    "custom_fields.display_value",
    "custom_fields.enum_value.name",
    "projects.gid",
    "projects.name",
  ].join(",");

  const res = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGid}?opt_fields=${optFields}`,
    { headers: { Authorization: `Bearer ${pat}` } }
  );

  if (!res.ok) {
    throw new Error(
      `Asana Task 조회 실패 (${res.status}): ${taskIdOrUrl}`
    );
  }

  const json = (await res.json()) as { data: AsanaTaskData };
  const data = json.data;
  return {
    gid: data.gid,
    title: data.name,
    body: data.notes ?? "",
    asanaUrl: data.permalink_url ?? `https://app.asana.com/0/0/${data.gid}`,
    modifiedAt: data.modified_at ?? new Date().toISOString(),
    asanaStatus: pickAsanaStatus(data.custom_fields),
    projectGids: (data.projects ?? []).map((p) => p.gid),
    projectNames: (data.projects ?? []).map((p) => p.name),
  };
}

export async function fetchAsanaTask(
  taskIdOrUrl: string
): Promise<{ title: string; body: string }> {
  const task = await fetchAsanaTaskDetails(taskIdOrUrl);
  return { title: task.title, body: task.body };
}
