# GitHub Actions 워크트리 가이드

역할: Tria 저장소 안에서 이슈 분석을 실행하는 GitHub Actions 워크플로를 만든다.

참고 문서: [../tria-production.md](../tria-production.md) 7.4(GitHub Actions), 14장(GitHub Actions 흐름), 8장(저장소 인증)

## 만들 파일

* `.github/workflows/analyze-issue.yml`

## 트리거와 payload

`repository_dispatch` 이벤트로 시작한다 (`Tria Web`이 자기 자신의 GitHub API에 dispatch를 보내는 구조 — 별도 저장소 아님).

```json
{
  "event_type": "analyze-issue",
  "client_payload": {
    "analysisRunId": "run_123",
    "projectKey": "admin",
    "repositoryOwner": "company",
    "repositoryName": "admin-web",
    "ref": "develop",
    "issueTitle": "담당자 변경 후 목록 미반영",
    "issueBody": "강의 담당자를 변경했지만 목록에는 반영되지 않습니다.",
    "callbackUrl": "https://tria.company.com/api/analysis/callback"
  }
}
```

## 워크플로가 해야 할 일 (순서)

```text
repository_dispatch (event_type: analyze-issue)
→ Tria 저장소 checkout (actions/checkout@v4)
→ pnpm 설치 + pnpm install
→ GitHub App 설치 토큰 생성 (client_payload.repositoryName 기준)
→ 대상 저장소를 target/ 에 checkout (생성한 토큰 사용)
→ env로 packages/runner 실행 계약값 주입 (아래 표) 후 packages/runner 실행
```

## packages/runner 실행 계약 (runner 트랙과 공유)

이 값은 고정 계약이다 — runner 트랙이 동시에 이 계약을 보고 구현한다. 실제 `packages/runner`가 아직 없어도 워크플로 YAML은 이 환경변수 이름 그대로 작성하면 된다.

```yaml
env:
  ANALYSIS_RUN_ID: ${{ github.event.client_payload.analysisRunId }}
  ISSUE_TITLE: ${{ github.event.client_payload.issueTitle }}
  ISSUE_BODY: ${{ github.event.client_payload.issueBody }}
  TARGET_REPOSITORY_PATH: ${{ github.workspace }}/target
  CALLBACK_URL: ${{ github.event.client_payload.callbackUrl }}
  CALLBACK_SECRET: ${{ secrets.TRIA_CALLBACK_SECRET }}
run: pnpm --filter runner start
```

## 대상 저장소 checkout

문서 8.2 방식(GitHub App)을 기준으로 작성한다. `repositoryOwner`는 Tria 저장소 자신의 owner와 다를 수 있다 (예: 개인 계정 Tria가 조직 소유 레포를 분석) — `TRIA_READER` App이 그 owner/repo에도 설치되어 있어야 한다.

* `actions/create-github-app-token` 액션으로 설치 토큰 생성 (App ID/Private Key는 `secrets.TRIA_READER_CLIENT_ID`, `secrets.TRIA_READER_PRIVATE_KEY`, `owner: client_payload.repositoryOwner`)
* 생성된 토큰으로 `actions/checkout@v4`를 `repository: client_payload.repositoryOwner/client_payload.repositoryName`, `path: target`, `persist-credentials: false`로 실행

`repositoryOwner`/`repositoryName`/`ref`를 그대로 믿지 말고, 실제로는 Tria 서버(web-api 트랙)가 프로젝트 설정에서 검증한 값만 보낸다는 전제로 주석에 남겨라 (워크플로 자체는 추가 검증 없이 받은 값을 사용).

## 건드리지 않을 것

* `packages/runner/**`, `apps/web/**` — 다른 트랙 담당

## 완료 기준

* `.github/workflows/analyze-issue.yml`이 YAML로서 유효하고 (`actionlint`나 GitHub 웹에서 문법 오류 없이 인식), 위 순서와 환경변수 계약을 그대로 반영한다.
* 실제 GitHub App/Secret이 없어 end-to-end 실행은 못 한다 — 이건 최종 wiring 단계에서 실제 Secret을 넣고 확인한다. 문서에 이 한계를 명시해둘 것.
