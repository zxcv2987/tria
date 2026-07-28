# Tria 운영형 제품 기획서

## 1. 문서 개요

* 제품명: Tria
* 대상 버전: 운영형 v1.0
* 제품 유형: AI 기반 이슈 트리아지 및 코드 조사 자동화 플랫폼
* 주요 연동: GitHub, GitHub Actions (이슈 소스는 특정 도구에 고정하지 않음 — Tria가 정의한 접수 API로 연동)
* 웹 애플리케이션: Next.js
* 데이터베이스: PostgreSQL 또는 Supabase
* 분석 실행 환경: GitHub Actions 또는 전용 Worker
* 저장소 인증: GitHub App
* 코드 분석: Codex CLI 또는 Gemini API (환경변수 `ANALYSIS_PROVIDER`로 선택, 동급 provider)
* 주요 사용자: 행정·운영 담당자, 개발자, 개발 관리자

---

# 2. 제품 정의

> Tria는 어떤 도구에서 들어오든 이슈를 접수해 관련 GitHub 저장소를 코딩 에이전트로 분석하고, 개발자에게 코드 원인 후보와 추가 점검 항목을 제공하는 AI 이슈 트리아지 플랫폼이다.

이슈는 Tria가 정의한 접수 API(5장)를 통해 들어온다. Asana는 그 접수 API를 호출하는 여러 소스 중 하나일 뿐이며, 지금 당장 연동돼 있지 않아도 된다 — 언제든 얇은 어댑터로 다시 붙일 수 있다(5.4절).

Tria는 이슈를 자동으로 해결하는 제품이 아니다.

다음 업무를 자동화하는 제품이다.

* 이슈 내용 수집
* 대상 프로젝트 선택
* 관련 코드 탐색
* 원인 후보 정리
* 외부 점검 항목 생성
* 부족한 정보 요청
* 분석 결과 공유
* 분석 진행 상태 관리

---

# 3. 제품 목표

## 3.1 핵심 목표

개발자가 이슈를 처음 확인했을 때 다음 정보가 이미 준비돼 있는 상태를 만든다.

* 관련 프로젝트와 저장소
* 의심되는 코드 영역
* 관련 파일과 함수
* 이슈를 설명할 수 있는 코드 흐름
* 추가 확인이 필요한 API, 데이터, 인프라 항목
* 분석의 한계
* 부족한 이슈 정보

## 3.2 운영 목표

* 이슈 소스 도구(Asana, 사내 폼, 다른 이슈 트래커 등)를 특정하지 않고, 정해진 접수 API만 호출하면 연동되게 한다.
* 개발자에게는 별도의 상세 분석 웹을 제공한다.
* 분석 작업을 비동기로 실행한다.
* 내부 비공개 저장소를 안전하게 읽는다.
* 중복 실행과 실패 상태를 관리한다.
* 분석 결과와 실행 이력을 저장한다.
* 향후 테스트 생성과 자동 수정으로 확장할 수 있게 한다.

---

# 4. 사용자

## 4.1 행정·운영 담당자

행정 담당자는 평소 쓰던 이슈 도구(Asana 등)에 그대로 이슈를 작성한다. 그 도구가 Tria 접수 API를 호출하도록 연동돼 있으면(5장) 별도 행동 없이 분석이 시작된다. 연동에 결과 통보(`notifyUrl`, 5.1절)까지 포함돼 있으면 원래 쓰던 도구에서 분석 상태와 요약도 확인할 수 있다.

행정 담당자는 Tria의 코드 상세 화면을 필수로 사용하지 않는다.

## 4.2 개발자

주요 행동:

* Tria 이슈 목록을 확인한다.
* AI 분석 결과를 검토한다.
* 관련 파일과 함수부터 조사를 시작한다.
* 필요하면 재분석한다.
* 실제 원인을 확인하고 작업을 진행한다.
* 분석 결과에 피드백을 남긴다.

## 4.3 개발 관리자

주요 행동:

* 분석 대기와 실패 작업을 확인한다.
* 프로젝트별 이슈와 분석 결과를 관리한다.
* 반복적으로 발생하는 도메인과 원인을 확인한다.
* 분석 품질과 사용량을 확인한다.

---

# 5. 이슈 접수 프로토콜

Tria는 특정 이슈 도구의 웹훅을 직접 받지 않는다. 대신 Tria가 정의한 접수 API 하나만 두고, 모든 소스(Asana, 사내 폼, 다른 이슈 트래커, 사람이 직접 호출하는 스크립트 등)는 이 API를 호출하는 방식으로 연동한다. "이슈가 어떻게 들어왔는가"와 "분석을 어떻게 시작하는가"를 분리해, Tria 쪽이 특정 벤더의 상태값이나 웹훅 payload 형식을 알 필요가 없게 한다.

## 5.1 접수 API

```text
POST /api/issues
Authorization: Bearer <TRIA_INGEST_API_KEY>
```

요청 본문:

```ts
type IssueIntake = {
  title: string;
  description?: string;
  projectKey: string;          // project_configs.key

  environment?: string;
  occurredUrl?: string;
  reproductionSteps?: string;
  expectedResult?: string;
  actualResult?: string;

  source?: string;             // 표시용 라벨. 예: "asana", "manual". 기본값 "api"
  externalRef?: string;        // 소스 쪽 식별자. 있으면 재호출 시 같은 이슈로 upsert됨
  externalUrl?: string;        // "원본에서 보기" 링크

  notifyUrl?: string;          // 분석 완료/실패 시 이 주소로 결과를 POST (선택)
};
```

이 호출 자체가 "분석해달라"는 요청이다. 외부 도구의 상태 필드가 무엇으로 바뀌었는지를 Tria가 감시하는 방식은 쓰지 않는다 — 호출한 쪽이 언제 분석을 요청할지 책임진다.

## 5.2 분석 시작 조건

다음 조건을 모두 만족할 때 분석을 시작한다.

* `projectKey`가 가리키는 활성 프로젝트 설정이 존재함
* 같은 이슈에 대해 현재 실행 중(QUEUED/RUNNING)인 분석이 없음 — 있으면 새로 만들지 않고 그 실행 정보를 그대로 반환

과거처럼 "이슈 수정 버전"을 비교해 중복 여부를 판단하지 않는다. 소스마다 수정 시각 개념이 있을 수도 없을 수도 있어서, 그 판단은 호출하는 쪽(어댑터)의 책임으로 남긴다.

## 5.3 상태 흐름

이슈 상태는 더 이상 외부 도구의 커스텀 필드가 아니라, Tria가 실제로 아는 값인 분석 실행(`analysis_runs`) 상태로 표현한다.

```text
QUEUED → RUNNING → SUCCEEDED (CODE_LIKELY / CHECK_EXTERNAL / NEED_MORE_INFO)
                  → FAILED
```

정보가 부족해 보이거나(`NEED_MORE_INFO`) 실패한 경우, 재분석은 같은 이슈에 다시 `POST /api/issues`를 호출하거나 Tria 웹의 재분석 버튼으로 요청한다.

## 5.4 Asana를 다시 붙이려면

Asana는 core 도메인에서 완전히 분리돼 있다. 다시 연동하고 싶으면 Tria 자체를 고치는 게 아니라, 접수 API를 호출하는 얇은 어댑터를 하나 추가하면 된다. 이 어댑터는 Tria 저장소 안의 별도 route로 두거나(예: `apps/web/app/api/adapters/asana/webhook`), 완전히 별도 서비스로 둬도 무방하다 — Tria 쪽 계약(5.1절)만 지키면 된다.

어댑터가 해야 할 일:

1. **수신**: Asana 웹훅(핸드셰이크 + `X-Hook-Signature` 검증)을 받는다. 예전 `apps/web/app/api/webhooks/asana/route.ts`에 있던 서명 검증 로직을 그대로 재사용할 수 있다.
2. **조회**: 이벤트로 받은 task gid로 Asana API를 호출해 제목, 본문, 프로젝트 GID, permalink를 가져온다 (예전 `lib/asana.ts`의 `fetchAsanaTaskDetails`).
3. **매핑**: Asana 프로젝트 GID → Tria `projectKey` 매핑은 이제 Tria의 `project_configs`가 아니라 **어댑터 자신이** 들고 있는다 (환경변수나 어댑터 전용 작은 설정 파일). Tria core는 어떤 프로젝트가 어떤 Asana GID에 대응하는지 몰라도 된다.
4. **접수 호출**: 매핑된 정보로 Tria의 `POST /api/issues`를 호출한다.
   ```json
   {
     "title": "<task.name>",
     "description": "<task.notes>",
     "projectKey": "<매핑된 key>",
     "source": "asana",
     "externalRef": "<task.gid>",
     "externalUrl": "<task.permalink_url>",
     "notifyUrl": "https://<어댑터 주소>/api/adapters/asana/notify"
   }
   ```
5. **통보 수신**: Tria가 분석을 끝내면 위 `notifyUrl`로 `CallbackPayload`(11장과 동일한 형태)를 POST한다. 어댑터는 이를 받아 Asana 댓글 작성과 상태 변경을 수행한다 (예전 `analysis/callback/route.ts`의 `syncAsana` 로직을 어댑터 쪽으로 옮기면 된다).

이렇게 하면 "Asana의 상태값이 뭔지", "Asana 웹훅 payload가 어떻게 생겼는지"를 아는 코드는 전부 어댑터 안에만 있고, Tria core는 소스가 Asana인지 다른 무엇인지 몰라도 동작한다. 나중에 Jira나 사내 폼을 붙이고 싶을 때도 같은 패턴(수신 → 조회 → 매핑 → 접수 호출 → 통보 수신)을 각자의 어댑터로 반복하면 된다.

---

# 6. 전체 시스템 흐름

```text
호출자(어댑터 또는 직접 API 호출)가 이슈 내용을 준비
    ↓
POST /api/issues (5.1절 접수 API)
    ↓
Tria Next.js 서버
- API 키 검증
- 이슈 upsert
- in-flight 확인 후 분석 실행 생성
    ↓
GitHub repository_dispatch
    ↓
Tria Runner GitHub Actions
    ↓
대상 저장소 인증 및 checkout
    ↓
Codex CLI 또는 Gemini API 코드 분석
    ↓
구조화된 분석 결과 생성
    ↓
Tria Callback API
    ↓
결과 검증 및 DB 저장
    ↓
Tria 상세 화면 갱신
    ↓
(notifyUrl이 있으면) 호출자에게 결과 통보
```

Asana를 소스로 쓰는 경우, "호출자"는 5.4절의 어댑터가 된다.

---

# 7. 시스템 구성

Tria 운영형은 웹 애플리케이션과 GitHub Actions Runner 코드를 하나의 저장소에서 관리하는 pnpm workspace 기반 모노레포로 구성한다.

웹 애플리케이션만 별도의 실행 환경에 배포하며, Runner는 상시 서버로 배포하지 않고 GitHub Actions 실행 시 사용한다.

```text
tria/
├─ apps/
│  └─ web/                         # 배포되는 Next.js 애플리케이션
│
├─ packages/
│  ├─ analysis/                    # 웹과 Runner가 공유하는 분석 계약
│  │  └─ src/
│  │     ├─ schema.ts
│  │     ├─ types.ts
│  │     ├─ callback-schema.ts
│  │     └─ validate-result.ts
│  │
│  └─ runner/                      # GitHub Actions 분석 실행 코드
│     ├─ src/
│     │  ├─ build-prompt.ts
│     │  ├─ validate-evidence.ts
│     │  └─ send-callback.ts
│     ├─ prompts/
│     │  └─ analyze-issue.md
│     └─ package.json
│
├─ .github/
│  └─ workflows/
│     └─ analyze-issue.yml
│
├─ package.json
├─ pnpm-workspace.yaml
├─ pnpm-lock.yaml
└─ tsconfig.base.json
```

초기 운영형에서는 pnpm workspace만 사용한다.

Turborepo는 다음 조건이 생길 때 도입을 검토한다.

* 배포 애플리케이션이 여러 개로 증가
* 공유 패키지가 증가
* 전체 빌드, 테스트, 타입 검사 시간이 길어짐
* 변경되지 않은 패키지의 작업을 생략해야 함
* CI 캐시 최적화가 필요함

## 7.1 Tria Web

경로:

```text
apps/web
```

기술:

* Next.js App Router
* TypeScript
* PostgreSQL 또는 Supabase
* 내부 사용자 인증

담당 역할:

* 이슈 접수 API 수신 (5장)
* 분석 실행 생성
* GitHub Actions 실행 요청
* 분석 결과 Callback 수신
* 분석 결과 검증 및 저장
* 이슈 목록과 상세 화면
* 재분석 기능
* notifyUrl로 결과 통보
* 프로젝트 설정 관리

Tria Web은 저장소 checkout이나 Codex 실행을 직접 수행하지 않는다.

웹 배포 플랫폼에서는 `apps/web`을 애플리케이션 루트로 지정한다.

## 7.2 Analysis 공통 패키지

경로:

```text
packages/analysis
```

웹 애플리케이션과 Runner가 공유하는 분석 계약을 관리한다.

포함 항목:

* `AnalysisResult` 타입
* 분석 결과 Zod Schema 또는 JSON Schema
* Callback 요청 및 응답 스키마
* 분석 상태와 결과 상태
* 프로젝트 설정 타입
* 결과 검증 규칙

사용 위치:

```text
GitHub Actions Runner
→ Codex가 생성한 결과 검증

Tria Callback API
→ 전달받은 결과 재검증

Tria Web UI
→ 동일한 타입으로 결과 렌더링
```

Runner와 Web은 반드시 같은 분석 스키마 버전을 사용한다.

## 7.3 Tria Runner

경로:

```text
packages/runner
```

Tria Runner는 별도 GitHub 저장소 또는 별도 상시 서버가 아니다.

Tria 저장소에 포함된 실행 코드이며, 같은 저장소의 GitHub Actions가 시작될 때만 실행한다.

분석 엔진은 `packages/runner/src/providers`에 provider 인터페이스로 분리돼 있으며, `ANALYSIS_PROVIDER` 환경변수로 Codex CLI 또는 Gemini API 중 선택한다. 둘 중 하나를 기본값으로 못박지 않고 동급 provider로 취급한다.

담당 역할:

* GitHub Actions payload 검증
* 이슈 분석 프롬프트 생성
* 대상 저장소 checkout 이후 AI provider 실행 준비
* AI 분석 결과 JSON 파싱
* 실제 파일 경로 검증
* 분석 결과 판정 보정
* Tria Callback API 호출
* 실패 결과 전송

Runner가 사용하는 프롬프트와 분석 스키마는 Tria 웹 코드와 함께 버전 관리한다.

## 7.4 GitHub Actions

워크플로 경로:

```text
.github/workflows/analyze-issue.yml
```

실행 흐름:

```text
Tria Web
→ Tria 저장소 repository_dispatch
→ Tria 저장소 GitHub Actions 실행
→ Tria 저장소 checkout
→ 대상 저장소 인증
→ 대상 저장소를 target/에 checkout
→ packages/runner 실행
→ Codex 분석
→ 결과 검증
→ Tria Callback API 호출
```

GitHub Actions 작업 공간은 다음과 같이 구성한다.

```text
GITHUB_WORKSPACE/
├─ tria/                           # Tria 자체 코드
│  ├─ packages/analysis
│  └─ packages/runner
│
└─ target/                         # 분석 대상 저장소
   ├─ src/
   └─ package.json
```

대상 저장소에는 Tria 전용 워크플로 또는 분석 코드를 추가하지 않는다.

## 7.5 대상 저장소

예시:

* admin-web
* learner-web
* backend-api

대상 저장소는 Tria 서버에서 관리하는 허용 목록을 통해서만 선택한다.

```ts
const repositoryMap = {
  admin: {
    owner: "company",
    repository: "admin-web",
    ref: "develop",
  },
  learner: {
    owner: "company",
    repository: "learner-web",
    ref: "main",
  },
} as const;
```

이슈 접수 요청이나 GitHub Actions payload에서 임의 저장소 주소를 직접 지정할 수 없게 한다.

대상 저장소는 GitHub App 설치 토큰을 사용해 `target/` 디렉터리에 checkout한다.

## 7.6 데이터베이스

저장 대상:

* 접수된 이슈
* 분석 실행
* 분석 결과
* 프로젝트 설정
* 분석 피드백
* 분석 상태
* 실패 정보
* 대상 저장소 및 분석 커밋 SHA

---

# 8. 저장소 인증

## 8.1 초기 운영

초기에는 Fine-grained PAT를 사용할 수 있다.

권한:

* 선택된 대상 저장소만 접근
* Contents: Read-only
* Metadata: Read-only

GitHub Actions Secret:

```text
TARGET_REPO_TOKEN
```

Checkout:

```yaml
- uses: actions/checkout@v4
  with:
    repository: company/admin-web
    token: ${{ secrets.TARGET_REPO_TOKEN }}
    path: target
    persist-credentials: false
```

## 8.2 정식 운영

정식 운영에서는 GitHub App을 사용한다.

GitHub App 권한:

```text
Repository permissions
- Contents: Read-only
- Metadata: Read-only
```

설치 대상:

* Tria가 분석해야 하는 저장소만 선택 설치

실행 흐름:

```text
GitHub App Private Key
→ Installation Token 생성
→ 대상 저장소 checkout
→ 분석 종료 후 토큰 폐기
```

장점:

* 개인 계정 토큰에 의존하지 않음
* 저장소별 설치 관리
* 짧은 수명의 토큰
* 최소 권한 적용
* 조직 운영에 적합

---

# 9. 웹 화면

## 9.1 이슈 목록

경로:

```text
/issues
```

표시 정보:

* 이슈 제목
* 프로젝트
* 원본 소스 라벨 (예: asana, manual, api)
* 분석 상태
* AI 판정
* 등록 시각
* 최근 분석 시각
* 원본 링크 (있는 경우)

필터:

* 프로젝트
* 분석 상태
* AI 판정
* 검색

상단 지표:

* 분석 대기
* 분석 중
* 개발 검토
* 추가 정보 필요
* 분석 실패

## 9.2 이슈 상세

경로:

```text
/issues/[id]
```

원본 이슈:

* 제목
* 본문
* 재현 절차
* 기대 결과
* 실제 결과
* 발생 URL
* 환경
* 첨부파일
* 원본 링크 (있는 경우)

분석 결과:

* 판정
* 요약
* 의심 영역
* 관련 파일
* 관련 함수 또는 심볼
* 코드 근거
* 추가 점검 항목
* 누락 정보
* 분석 한계
* 분석 대상 저장소와 커밋
* GitHub Actions 실행 링크

사용자 액션:

* 재분석
* 원본에서 열기 (원본 링크가 있는 경우)
* 결과 복사
* 분석 피드백
* 실행 로그 확인

## 9.3 프로젝트 설정

경로:

```text
/settings/projects
```

설정 항목:

* 프로젝트 키 (접수 API의 `projectKey`와 매칭)
* 표시 이름
* GitHub 저장소
* 기본 브랜치
* 활성화 여부
* 분석 프롬프트 설정

---

# 10. 분석 결과 유형

## 10.1 코드 원인 유력

값:

```text
CODE_LIKELY
```

조건:

* 실제 파일 근거가 하나 이상 있음
* 코드 흐름이 증상을 설명할 수 있음
* 원인을 확정하지 않고 가능성으로 표현함

## 10.2 외부 점검 권장

값:

```text
CHECK_EXTERNAL
```

조건:

* 프론트엔드 코드에서 직접적인 원인을 찾지 못함
* API, 데이터, 배포, 캐시, 권한, 브라우저 등을 확인해야 함

## 10.3 추가 정보 필요

값:

```text
NEED_MORE_INFO
```

조건:

* 이슈 내용만으로 화면이나 기능을 특정할 수 없음
* 기대 결과 또는 재현 절차가 부족함
* 프로젝트 선택이 누락됨

---

# 11. AI 분석 출력

```ts
type AnalysisResult = {
  result:
    | "CODE_LIKELY"
    | "CHECK_EXTERNAL"
    | "NEED_MORE_INFO";

  summary: string;
  suspectedArea: string | null;

  evidence: {
    path: string;
    symbol?: string;
    reason: string;
  }[];

  externalChecks: string[];
  missingInformation: string[];
  limitations: string[];
};
```

---

# 12. 데이터 모델

## 12.1 Issue

```ts
type Issue = {
  id: string;

  source: string;              // 표시용 라벨. 예: "asana", "manual", "api"
  externalRef: string | null;  // 소스 쪽 식별자 (있으면 upsert 키)
  externalUrl: string | null;  // "원본에서 보기" 링크

  title: string;
  description: string;

  projectKey: string;
  environment: string | null;
  occurredUrl: string | null;
  reproductionSteps: string | null;
  expectedResult: string | null;
  actualResult: string | null;

  createdAt: Date;
  updatedAt: Date;
};
```

이슈 자체에는 더 이상 외부 상태 텍스트(`asanaStatus`)를 두지 않는다. 목록/상세 화면의 상태 표시는 해당 이슈의 최신 `AnalysisRun.status`/`resultType`에서 파생한다 (12.2절).

## 12.2 AnalysisRun

```ts
type AnalysisRun = {
  id: string;
  issueId: string;

  status:
    | "QUEUED"
    | "RUNNING"
    | "SUCCEEDED"
    | "FAILED";

  resultType:
    | "CODE_LIKELY"
    | "CHECK_EXTERNAL"
    | "NEED_MORE_INFO"
    | null;

  targetRepository: string;
  targetRef: string;
  targetCommitSha: string | null;

  summary: string | null;
  suspectedArea: string | null;

  evidence: AnalysisEvidence[];
  externalChecks: string[];
  missingInformation: string[];
  limitations: string[];

  workflowRunUrl: string | null;
  failureReason: string | null;

  notifyUrl: string | null;    // 완료/실패 시 결과를 통보할 주소 (접수 API에서 받은 값)

  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
};
```

## 12.3 ProjectConfig

```ts
type ProjectConfig = {
  id: string;
  key: string;
  name: string;

  githubOwner: string;
  githubRepository: string;
  defaultRef: string;

  isActive: boolean;
};
```

외부 이슈 트래커의 프로젝트 식별자(예: Asana 프로젝트 GID)는 여기서 관리하지 않는다. 그 매핑은 각 소스의 어댑터가 자기 쪽에서 들고 있는다 (5.4절).

## 12.4 AnalysisFeedback

```ts
type AnalysisFeedback = {
  id: string;
  analysisRunId: string;

  result:
    | "CORRECT"
    | "PARTIALLY_HELPFUL"
    | "NOT_HELPFUL"
    | "WRONG";

  comment: string | null;
  createdAt: Date;
};
```

---

# 13. API 설계

## 이슈 접수

```text
POST /api/issues
```

담당 역할 (5.1절):

* API 키 검증
* 이슈 upsert (`externalRef` 있으면 갱신, 없으면 신규)
* in-flight 확인 후 분석 실행 생성

## 수동 분석 및 재분석

```text
POST /api/issues/[id]/analyze
```

## 분석 결과 callback

```text
POST /api/analysis/callback
```

## 분석 상태 갱신

```text
POST /api/analysis/[runId]/status
```

필요한 경우 Runner가 `RUNNING` 상태를 알리는 용도로 사용한다.

---

# 14. GitHub Actions 흐름

```text
repository_dispatch
→ Tria 저장소 checkout
→ pnpm 의존성 설치
→ GitHub App 설치 토큰 생성
→ 대상 저장소를 target/에 checkout
→ packages/runner에서 분석 프롬프트 생성
→ Codex 또는 Gemini 실행
→ analysis.json 생성
→ packages/analysis 스키마로 결과 검증
→ 실제 파일 경로 검증
→ Tria Callback API 호출
```

Payload 예시:

```json
{
  "analysisRunId": "run_123",
  "projectKey": "admin",
  "repositoryOwner": "company",
  "repositoryName": "admin-web",
  "ref": "develop",
  "issueTitle": "담당자 변경 후 목록 미반영",
  "issueBody": "강의 담당자를 변경했지만 목록에는 반영되지 않습니다.",
  "callbackUrl": "https://tria.company.com/api/analysis/callback"
}
```

`repositoryName`과 `ref`는 Tria 서버의 프로젝트 설정에서 선택한다.

사용자가 입력한 GitHub 저장소 주소를 payload에 그대로 전달하지 않는다.

GitHub Actions는 프로젝트 설정과 GitHub App 설치 범위가 일치하는지 확인한 후 checkout을 수행한다.

---

# 15. 결과 검증

## 파일 검증

* 저장소 루트 기준 상대 경로만 허용
* 실제 존재하는 파일만 근거로 인정
* 저장소 외부 경로 차단
* 생성물과 비밀 파일 제외

## 판정 검증

```ts
if (
  result.result === "CODE_LIKELY" &&
  validEvidence.length === 0
) {
  result.result = "CHECK_EXTERNAL";
}
```

## 출력 검증

* JSON Schema 검증
* 최대 문자열 길이 제한
* HTML 및 Markdown 정제
* 실행 결과에 비밀값이 포함되지 않았는지 확인

---

# 16. 결과 통보 (notifyUrl)

접수 시(5.1절) `notifyUrl`을 받은 분석 실행은 완료/실패 시 그 주소로 `CallbackPayload`(11장과 동일 형태)를 best-effort POST한다. Tria core는 그 주소가 어떤 시스템인지 모른다 — 비개발자도 이해할 수 있는 요약으로 가공해 원본 도구(예: Asana 댓글)에 남기는 일은 호출자(어댑터) 쪽 책임이다.

Asana 어댑터(5.4절)라면 이런 형태로 가공해 댓글을 남기게 된다:

```text
🤖 Tria 1차 분석 완료

판정: 프론트엔드 코드 확인 필요

요약:
강의 수정 후 목록 데이터 갱신 흐름에서 확인이 필요한
코드 후보가 발견됐습니다.

상세 분석:
https://tria.company.com/issues/{issueId}
```

코드 파일과 내부 구현 세부 사항은 Tria 웹에서만 제공하고, notifyUrl로 나가는 통보에는 포함하지 않는다.

---

# 17. 보안

## 웹 인증

현재는 단일 세션 쿠키 기반 임시 게이트(`middleware.ts`)로 `/issues`, `/settings`와 관련 쓰기 API만 막고 있다. 정식 SSO 붙이기 전까지의 임시 방어선이며, 정식 인증은 로드맵 항목으로 남겨둔다.

목표(로드맵):

* 회사 Google 계정 또는 SSO
* 내부 사용자만 접근
* 프로젝트별 접근 권한 고려

## GitHub

* GitHub App 사용
* Contents Read-only
* 선택 저장소에만 설치
* `persist-credentials: false`
* 대상 저장소 allowlist

## Callback

* 공유 secret 또는 서명 방식
* 재전송 공격 방지를 위한 timestamp와 nonce
* 완료된 실행에 대한 중복 callback 방지

## 이슈 접수 API

* `TRIA_INGEST_API_KEY` 공유 secret으로 호출자 인증
* Asana 등 외부 웹훅의 핸드셰이크/서명 검증은 core가 아니라 각 소스 어댑터(5.4절)가 담당

## AI 실행

* 읽기 전용 sandbox
* 저장소 수정 금지
* 외부 입력의 명령 무시
* 비밀 파일 접근 차단
* 결과 로그에서 민감 정보 제거

---

# 18. 중복 및 동시 실행

과거처럼 "이슈 수정 버전(`sourceModifiedAt`)"을 비교해 자동 중복을 막지 않는다 — 접수 API 호출 자체가 명시적 분석 요청이므로, 언제 다시 호출할지는 호출자(어댑터)의 책임이다.

Tria가 직접 막는 건 다음 하나뿐이다.

* 동일 이슈에 대해 QUEUED/RUNNING 상태인 실행이 이미 있으면 새 분석을 시작하지 않고 그 실행 정보를 반환한다 (in-flight 체크, 5.2절).

프로젝트별 동시 실행 제한을 둔다.

예시:

```text
프로젝트당 최대 2개
전체 최대 5개
```

향후 GitHub Actions 대신 작업 큐와 전용 Worker를 사용할 수 있다.

---

# 19. 운영 실패 처리

## 저장소 Checkout 실패

* 분석 상태 `FAILED`
* 접근 권한 및 저장소 설정 오류 표시
* notifyUrl이 있으면 실패로 통보

## Codex/Gemini 실패

* JSON 생성 실패 저장
* GitHub Actions 실행 링크 제공
* 재분석 버튼 제공

## Callback 실패

* GitHub Actions 재시도
* idempotency key 사용
* 완료되지 않은 실행 감지 작업 추가

## notifyUrl 통보 실패

* 분석 결과는 DB에 우선 저장 (통보 실패가 결과 저장을 막지 않음)
* best-effort — 재시도는 호출자(어댑터) 쪽에서 필요하면 상태 폴링으로 보완
* 웹에서는 분석 완료 상태 유지

---

# 20. 운영 지표

## 사용량

* 분석 요청 수
* 프로젝트별 분석 수
* 성공률
* 실패율
* 재분석률

## 효율

* 이슈 등록부터 개발 검토까지 걸린 시간
* 개발자의 초기 조사 시간
* 추가 질문 횟수
* 코드 근거 발견 비율

## 품질

* 적중
* 일부 도움
* 도움 안 됨
* 잘못된 분석

## 비용

* 이슈당 입력 토큰
* 이슈당 출력 토큰
* 프로젝트별 월간 비용
* 평균 분석 시간
* GitHub Actions 사용 시간

---

# 21. 운영 로드맵

## 인증 전환 (우선순위 높음)

* 임시 세션 쿠키 게이트를 회사 Google 계정 또는 SSO로 교체 (17장)

## v1.1 비용 절감

* 저장소 사전 인덱싱
* 프로젝트 구조 지도
* 변경 파일만 재분석
* 관련 파일 우선 탐색
* 탐색 단계 및 파일 수 제한
* 분석 결과 캐시
* 유사 이슈 재사용

## v1.2 운영 증거 연동

* Sentry
* 배포 커밋 SHA
* 최근 Pull Request
* 서버 로그
* API 오류율
* 환경변수 변경 이력

## v1.3 테스트 자동화

* 테스트 가능 여부 판단
* 회귀 테스트 시나리오 생성
* Playwright 테스트 생성
* 관련 테스트 실행
* 과거 이슈와 테스트 연결

## v2.0 수정 제안

* 코드 수정안 생성
* 임시 브랜치 생성
* 테스트 실행
* Draft Pull Request 생성
* 개발자 승인 후 반영

---

# 22. 운영형 완료 기준

다음 전체 흐름이 안정적으로 동작해야 한다.

```text
POST /api/issues 호출 (5.1절)
→ 이슈 upsert
→ GitHub Actions 실행
→ 대상 비공개 저장소 인증 및 checkout
→ Codex/Gemini 분석
→ 결과 검증
→ Callback
→ Tria 웹 결과 표시
→ (notifyUrl이 있으면) 호출자에게 결과 통보
```

Asana를 소스로 쓰는 경우 이 흐름의 시작은 5.4절 어댑터가 대신한다.

운영형 Tria의 성공은 모든 이슈의 원인을 맞히는 것이 아니다.

다음 상태를 만드는 것이 성공이다.

> 개발자가 이슈를 확인하는 시점에 관련 코드와 조사 방향, 추가 확인 항목이 이미 준비돼 있다.

---

# 23. 운영형 전환 절차

MVP가 완료된 뒤 다음 순서로 운영형 구조로 전환한다.

## 1단계: pnpm workspace 구성

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

현재 Next.js 프로젝트를 `apps/web`으로 이동한다.

이 단계에서는 기존 기능을 변경하지 않는다.

## 2단계: 공통 분석 계약 분리

현재 Next.js 프로젝트에 있는 다음 코드를 `packages/analysis`로 이동한다.

* 분석 결과 타입
* 분석 결과 스키마
* 상태값
* 결과 검증 함수

## 3단계: 로컬 Codex 실행 코드 분리

다음 코드를 `packages/runner`로 이동한다.

* 프롬프트 생성
* Codex 실행 입력 생성
* 결과 파일 파싱
* 파일 존재 여부 검증
* 판정 보정

## 4단계: GitHub Actions 추가

Tria 저장소에 다음 워크플로를 추가한다.

```text
.github/workflows/analyze-issue.yml
```

워크플로는 Tria 자체 저장소와 분석 대상 저장소를 각각 checkout한다.

## 5단계: 실행 방식을 비동기로 변경

```text
MVP
Next.js API
→ 로컬 Codex 실행
→ HTTP 응답으로 결과 반환

운영형
Next.js API
→ AnalysisRun 생성
→ GitHub Actions 실행
→ 즉시 QUEUED 응답
→ Callback으로 결과 수신
```

## 6단계: 웹 배포 범위 지정

웹 배포 플랫폼의 애플리케이션 루트를 다음으로 설정한다.

```text
apps/web
```

GitHub Actions 워크플로와 Runner 패키지는 웹 서버로 별도 배포하지 않는다.

---

# 24. 운영형 저장소 구성 결정

Tria의 초기 운영형은 다음 구성을 기본으로 한다.

```text
단일 GitHub 저장소
+ pnpm workspace
+ apps/web
+ packages/analysis
+ packages/runner
+ 동일 저장소 GitHub Actions
```

Runner는 웹과 다른 실행 환경을 사용하지만, 별도의 저장소로 분리하지 않는다.

향후 다음 조건이 발생할 때만 Runner 저장소 분리를 검토한다.

* Runner와 Web의 관리 조직이 달라짐
* 분석용 Secret을 저장소 수준에서 격리해야 함
* 여러 서비스가 동일 Runner를 공통으로 사용함
* 웹과 분석 파이프라인의 배포 주기가 완전히 달라짐
* 보안 정책상 GitHub Actions 코드와 제품 코드를 분리해야 함
