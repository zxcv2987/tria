function extractTaskGid(taskIdOrUrl: string): string {
  const trimmed = taskIdOrUrl.trim().split("?")[0];
  const segments = trimmed.split("/").filter((s) => /^\d+$/.test(s));
  if (segments.length > 0) return segments[segments.length - 1];
  return trimmed;
}

export async function fetchAsanaTask(
  taskIdOrUrl: string
): Promise<{ title: string; body: string }> {
  const pat = process.env.ASANA_PAT;
  if (!pat) throw new Error("ASANA_PAT 환경변수가 설정되지 않았습니다.");

  const taskGid = extractTaskGid(taskIdOrUrl);
  const res = await fetch(
    `https://app.asana.com/api/1.0/tasks/${taskGid}?opt_fields=name,notes`,
    { headers: { Authorization: `Bearer ${pat}` } }
  );

  if (!res.ok) {
    throw new Error(
      `Asana Task 조회 실패 (${res.status}): ${taskIdOrUrl}`
    );
  }

  const json = await res.json();
  return { title: json.data.name, body: json.data.notes ?? "" };
}
