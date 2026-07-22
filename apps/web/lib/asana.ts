function extractTaskGid(taskIdOrUrl: string): string {
  const trimmed = taskIdOrUrl.trim().split("?")[0];
  const segments = trimmed.split("/").filter((s) => /^\d+$/.test(s));
  if (segments.length > 0) return segments[segments.length - 1];
  return trimmed;
}

type AsanaEnumOption = { gid: string; name: string };

type AsanaCustomField = {
  gid?: string;
  name?: string;
  display_value?: string | null;
  enum_value?: { name?: string } | null;
  enum_options?: AsanaEnumOption[];
};

type AsanaTaskData = {
  gid: string;
  name: string;
  notes?: string;
  permalink_url?: string;
  modified_at?: string;
  custom_fields?: AsanaCustomField[];
  projects?: { gid: string }[];
};

export type AsanaTaskDetails = {
  gid: string;
  title: string;
  body: string;
  asanaUrl: string;
  modifiedAt: string;
  asanaStatus: string;
  projectGids: string[];
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
    "custom_fields.gid",
    "custom_fields.name",
    "custom_fields.display_value",
    "custom_fields.enum_value.name",
    "custom_fields.enum_options.gid",
    "custom_fields.enum_options.name",
    "projects.gid",
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
  };
}

export async function fetchAsanaTask(
  taskIdOrUrl: string
): Promise<{ title: string; body: string }> {
  const task = await fetchAsanaTaskDetails(taskIdOrUrl);
  return { title: task.title, body: task.body };
}

async function findStatusFieldMapping(
  taskGid: string,
  pat: string
): Promise<{ fieldGid: string; options: AsanaEnumOption[] } | null> {
  const res = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGid}?opt_fields=custom_fields.gid,custom_fields.name,custom_fields.enum_options.gid,custom_fields.enum_options.name`,
    { headers: { Authorization: `Bearer ${pat}` } }
  );
  if (!res.ok) {
    throw new Error(`Asana Task 조회 실패 (${res.status}): ${taskGid}`);
  }
  const json = (await res.json()) as {
    data: { custom_fields?: AsanaCustomField[] };
  };
  const field = (json.data.custom_fields ?? []).find(
    (f) => typeof f.name === "string" && /이슈\s*상태/.test(f.name)
  );
  if (!field?.gid) return null;
  return { fieldGid: field.gid, options: field.enum_options ?? [] };
}

/** "이슈 상태" 커스텀 필드를 지정한 라벨(예: "개발 검토")로 갱신한다 (문서 5.1/5.3). */
export async function updateAsanaTaskStatus(
  taskIdOrUrl: string,
  statusLabel: string
): Promise<void> {
  const pat = process.env.ASANA_PAT;
  if (!pat) throw new Error("ASANA_PAT 환경변수가 설정되지 않았습니다.");

  const taskGid = extractTaskGid(taskIdOrUrl);
  const mapping = await findStatusFieldMapping(taskGid, pat);
  if (!mapping) {
    throw new Error('"이슈 상태" 커스텀 필드를 찾지 못했습니다.');
  }

  const option = mapping.options.find((o) => o.name === statusLabel);
  if (!option) {
    throw new Error(`"이슈 상태"에 "${statusLabel}" 옵션이 없습니다.`);
  }

  const res = await fetch(`https://app.asana.com/api/1.0/tasks/${taskGid}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: { custom_fields: { [mapping.fieldGid]: option.gid } },
    }),
  });
  if (!res.ok) {
    throw new Error(`Asana 상태 갱신 실패 (${res.status}): ${taskIdOrUrl}`);
  }
}

/** 태스크에 댓글(스토리)을 추가한다 (문서 16장 — Asana 결과 표시). */
export async function addAsanaComment(
  taskIdOrUrl: string,
  text: string
): Promise<void> {
  const pat = process.env.ASANA_PAT;
  if (!pat) throw new Error("ASANA_PAT 환경변수가 설정되지 않았습니다.");

  const taskGid = extractTaskGid(taskIdOrUrl);
  const res = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGid}/stories`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { text } }),
    }
  );
  if (!res.ok) {
    throw new Error(`Asana 댓글 작성 실패 (${res.status}): ${taskIdOrUrl}`);
  }
}
