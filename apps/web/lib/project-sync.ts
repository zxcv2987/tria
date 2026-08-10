import assert from "node:assert";

export type RemoteRepo = {
  owner: string;
  repo: string;
  defaultBranch: string;
};

export type ExistingProject = {
  id: string;
  key: string;
  githubOwner: string;
  githubRepository: string;
  isActive: boolean;
};

export type NewProject = {
  key: string;
  name: string;
  githubOwner: string;
  githubRepository: string;
  defaultRef: string;
};

export type Conflict = {
  githubOwner: string;
  githubRepository: string;
  conflictingKey: string;
};

export type SyncPlan = {
  toInsert: NewProject[];
  toDeactivateIds: string[];
  conflicts: Conflict[];
};

function repoId(owner: string, repo: string): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

export function planProjectSync(
  remoteRepos: RemoteRepo[],
  existingProjects: ExistingProject[],
): SyncPlan {
  const existingByRepo = new Map(
    existingProjects.map((p) => [
      repoId(p.githubOwner, p.githubRepository),
      p,
    ]),
  );
  const existingKeys = new Set(existingProjects.map((p) => p.key));
  const remoteRepoIds = new Set(
    remoteRepos.map((r) => repoId(r.owner, r.repo)),
  );

  const toInsert: NewProject[] = [];
  const conflicts: Conflict[] = [];

  for (const r of remoteRepos) {
    // 활성/비활성 상관없이 손대지 않는다 — false는 사람이 의도적으로 껐을 수
    // 있어서, 재설치돼도 여기서 자동으로 다시 켜지 않는다 (문서 7.5.1절).
    if (existingByRepo.has(repoId(r.owner, r.repo))) continue;

    if (existingKeys.has(r.repo)) {
      conflicts.push({
        githubOwner: r.owner,
        githubRepository: r.repo,
        conflictingKey: r.repo,
      });
      continue;
    }
    toInsert.push({
      key: r.repo,
      name: r.repo,
      githubOwner: r.owner,
      githubRepository: r.repo,
      defaultRef: r.defaultBranch,
    });
  }

  const toDeactivateIds = existingProjects
    .filter(
      (p) =>
        p.isActive &&
        !remoteRepoIds.has(repoId(p.githubOwner, p.githubRepository)),
    )
    .map((p) => p.id);

  return { toInsert, toDeactivateIds, conflicts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const remote = (repo: string, owner = "tria", defaultBranch = "main") => ({
    owner,
    repo,
    defaultBranch,
  });
  const existing = (
    id: string,
    key: string,
    repo: string,
    isActive: boolean,
    githubOwner = "tria",
  ) => ({
    id,
    key,
    githubOwner,
    githubRepository: repo,
    isActive,
  });

  assert.deepStrictEqual(planProjectSync([remote("new")], []), {
    toInsert: [
      {
        key: "new",
        name: "new",
        githubOwner: "tria",
        githubRepository: "new",
        defaultRef: "main",
      },
    ],
    toDeactivateIds: [],
    conflicts: [],
  });
  assert.deepStrictEqual(
    planProjectSync([remote("active")], [existing("1", "active", "active", true)]),
    { toInsert: [], toDeactivateIds: [], conflicts: [] },
  );
  assert.deepStrictEqual(
    planProjectSync([], [existing("2", "removed", "removed", true)]),
    { toInsert: [], toDeactivateIds: ["2"], conflicts: [] },
  );
  assert.deepStrictEqual(
    planProjectSync(
      [remote("disabled")],
      [existing("3", "disabled", "disabled", false)],
    ),
    { toInsert: [], toDeactivateIds: [], conflicts: [] },
  );
  assert.deepStrictEqual(
    planProjectSync([], [existing("4", "disabled", "disabled", false)]),
    { toInsert: [], toDeactivateIds: [], conflicts: [] },
  );
  assert.deepStrictEqual(
    planProjectSync(
      [remote("shared", "other")],
      [existing("5", "shared", "original", true)],
    ),
    {
      toInsert: [],
      toDeactivateIds: ["5"],
      conflicts: [
        {
          githubOwner: "other",
          githubRepository: "shared",
          conflictingKey: "shared",
        },
      ],
    },
  );
  assert.deepStrictEqual(
    planProjectSync(
      [
        remote("new", "tria", "develop"),
        remote("kept"),
        remote("disabled"),
        remote("collision", "other"),
      ],
      [
        existing("kept-id", "kept", "kept", true),
        existing("removed-id", "removed", "removed", true),
        existing("disabled-id", "disabled", "disabled", false),
        existing("collision-id", "collision", "original", false),
      ],
    ),
    {
      toInsert: [
        {
          key: "new",
          name: "new",
          githubOwner: "tria",
          githubRepository: "new",
          defaultRef: "develop",
        },
      ],
      toDeactivateIds: ["removed-id"],
      conflicts: [
        {
          githubOwner: "other",
          githubRepository: "collision",
          conflictingKey: "collision",
        },
      ],
    },
  );

  console.log("project sync self-check passed");
}
