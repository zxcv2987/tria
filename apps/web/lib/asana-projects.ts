export type AsanaProjectRef = { gid: string; name: string };

/** ASANA_PAT이 접근 가능한 모든 워크스페이스의 프로젝트 목록. */
export async function listAsanaProjects(): Promise<AsanaProjectRef[]> {
  const pat = process.env.ASANA_PAT;
  if (!pat) throw new Error("ASANA_PAT 환경변수가 설정되지 않았습니다.");

  const headers = { Authorization: `Bearer ${pat}` };

  const meRes = await fetch(
    "https://app.asana.com/api/1.0/users/me?opt_fields=workspaces.gid",
    { headers }
  );
  if (!meRes.ok) {
    throw new Error(`Asana 사용자 조회 실패 (${meRes.status})`);
  }
  const me = (await meRes.json()) as {
    data: { workspaces?: { gid: string }[] };
  };
  const workspaceGids = (me.data.workspaces ?? []).map((w) => w.gid);

  const projects: AsanaProjectRef[] = [];
  for (const workspaceGid of workspaceGids) {
    const res = await fetch(
      `https://app.asana.com/api/1.0/workspaces/${workspaceGid}/projects?opt_fields=name&limit=100`,
      { headers }
    );
    if (!res.ok) continue;
    const data = (await res.json()) as {
      data: { gid: string; name: string }[];
    };
    for (const p of data.data) {
      projects.push({ gid: p.gid, name: p.name });
    }
  }

  return projects;
}
