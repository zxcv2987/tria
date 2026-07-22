# Tria 운영형 제품 기획서

## 1. 문서 개요

* 제품명: Tria
* 대상 버전: 운영형 v1.0
* 제품 유형: AI 기반 이슈 트리아지 및 코드 조사 자동화 플랫폼
* 주요 연동: Asana, GitHub, GitHub Actions
* 웹 애플리케이션: Next.js
* 데이터베이스: PostgreSQL 또는 Supabase
* 분석 실행 환경: GitHub Actions 또는 전용 Worker
* 저장소 인증: GitHub App
* 코드 분석: Codex CLI
* 주요 사용자: 행정·운영 담당자, 개발자, 개발 관리자

---

# 2. 제품 정의

> Tria는 Asana에 등록된 서비스 이슈를 자동으로 수집하고 관련 GitHub 저장소를 코딩 에이전트로 분석하여, 개발자에게 코드 원인 후보와 추가 점검 항목을 제공하는 AI 이슈 트리아지 플랫폼이다.

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

개발자가 Asana 이슈를 처음 확인했을 때 다음 정보가 이미 준비돼 있는 상태를 만든다.

* 관련 프로젝트와 저장소
* 의심되는 코드 영역
* 관련 파일과 함수
* 이슈를 설명할 수 있는 코드 흐름
* 추가 확인이 필요한 API, 데이터, 인프라 항목
* 분석의 한계
* 부족한 이슈 정보

## 3.2 운영 목표

* 행정 담당자의 기존 Asana 업무 흐름을 유지한다.
* 개발자에게는 별도의 상세 분석 웹을 제공한다.
* 분석 작업을 비동기로 실행한다.
* 내부 비공개 저장소를 안전하게 읽는다.
* 중복 실행과 실패 상태를 관리한다.
* 분석 결과와 실행 이력을 저장한다.
* 향후 테스트 생성과 자동 수정으로 확장할 수 있게 한다.

---

# 4. 사용자

## 4.1 행정·운영 담당자

주요 행동:

* Asana에 이슈를 작성한다.
* 작성 완료 후 상태를 `AI 분석 요청`으로 변경한다.
* Asana에서 분석 상태와 요약을 확인한다.
* 추가 정보 요청이 있으면 내용을 보완한다.

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

# 5. Asana 워크플로

## 5.1 이슈 상태

Asana 사용자 정의 필드:

```text
이슈 상태
```

상태 목록:

| 상태       | 의미                    |
| -------- | --------------------- |
| 작성 중     | 행정 담당자가 이슈를 작성하고 있음   |
| AI 분석 요청 | 작성 완료 및 분석 요청         |
| AI 분석 중  | Tria가 분석 작업을 실행하고 있음  |
| 추가 정보 필요 | 분석에 필요한 정보가 부족함       |
| 개발 검토    | 분석 완료, 개발자 검토 필요      |
| 처리 중     | 개발자가 수정 또는 추가 조사를 진행함 |
| 분석 실패    | 시스템 오류로 분석 실패         |
| 해결 완료    | 이슈 수정 및 검증 완료         |

## 5.2 분석 시작 조건

다음 조건을 모두 만족할 때 분석을 시작한다.

* 현재 상태가 `AI 분석 요청`
* 대상 프로젝트가 설정됨
* 동일한 이슈 수정 버전에 대한 완료된 분석이 없음
* 현재 실행 중인 분석이 없음
* 지원되는 프로젝트에 해당함

## 5.3 상태 흐름

정상:

```text
작성 중
→ AI 분석 요청
→ AI 분석 중
→ 개발 검토
→ 처리 중
→ 해결 완료
```

정보 부족:

```text
AI 분석 요청
→ AI 분석 중
→ 추가 정보 필요
→ AI 분석 요청
```

실패:

```text
AI 분석 요청
→ AI 분석 중
→ 분석 실패
→ AI 분석 요청
```

---

# 6. 전체 시스템 흐름

```text
행정 담당자가 Asana 이슈 작성
    ↓
이슈 상태를 AI 분석 요청으로 변경
    ↓
Asana Webhook
    ↓
Tria Next.js 서버
- 웹훅 검증
- 최신 이슈 조회
- 이슈 동기화
- 분석 실행 생성
    ↓
GitHub repository_dispatch
    ↓
Tria Runner GitHub Actions
    ↓
대상 저장소 인증 및 checkout
    ↓
Codex CLI 코드 분석
    ↓
구조화된 분석 결과 생성
    ↓
Tria Callback API
    ↓
결과 검증 및 DB 저장
    ↓
Tria 상세 화면 갱신
    ↓
Asana 요약 댓글과 상태 갱신
```

---

# 7. 시스템 구성

## 7.1 Tria Web

기술:

* Next.js App Router
* TypeScript
* PostgreSQL 또는 Supabase
* 내부 사용자 인증

담당 역할:

* Asana 웹훅 수신
* 이슈 동기화
* 분석 작업 생성
* GitHub Actions 실행 요청
* 분석 결과 callback 수신
* 이슈 목록 및 상세 화면
* 재분석 기능
* Asana 댓글과 상태 변경
* 프로젝트 설정 관리

## 7.2 Tria Runner

별도 GitHub 저장소:

```text
tria-runner
```

담당 역할:

* `repository_dispatch` 수신
* 대상 저장소 인증
* 대상 저장소 checkout
* Codex CLI 실행
* 결과 JSON 검증
* Tria Callback API 호출

## 7.3 대상 저장소

예시:

* admin-web
* learner-web
* backend-api

대상 저장소에는 Tria 전용 워크플로를 넣지 않는다.

Tria Runner가 런타임에 대상 저장소를 checkout한다.

## 7.4 데이터베이스

저장 대상:

* Asana 이슈
* 분석 실행
* 분석 결과
* 프로젝트 설정
* 분석 피드백
* 상태 변경 및 실패 정보

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
* Asana 상태
* 분석 상태
* AI 판정
* 등록 시각
* 최근 분석 시각
* Asana 링크

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
* Asana 링크

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
* Asana에서 열기
* 결과 복사
* 분석 피드백
* 실행 로그 확인

## 9.3 프로젝트 설정

경로:

```text
/settings/projects
```

설정 항목:

* 프로젝트 키
* 표시 이름
* Asana 프로젝트 값
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
  asanaTaskGid: string;
  asanaUrl: string;

  title: string;
  description: string;

  projectKey: string;
  environment: string | null;
  occurredUrl: string | null;
  reproductionSteps: string | null;
  expectedResult: string | null;
  actualResult: string | null;

  asanaStatus: string;
  sourceModifiedAt: Date;

  createdAt: Date;
  updatedAt: Date;
};
```

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

  asanaProjectValue: string;
  githubOwner: string;
  githubRepository: string;
  defaultRef: string;

  isActive: boolean;
};
```

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

## Asana 웹훅

```text
POST /api/webhooks/asana
```

담당 역할:

* 웹훅 핸드셰이크
* 요청 서명 검증
* 변경된 태스크 식별
* 최신 태스크 조회
* 분석 시작 조건 검증
* 분석 실행 생성

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
→ Tria Runner checkout
→ GitHub App 토큰 생성
→ 대상 저장소를 target/에 checkout
→ 이슈 프롬프트 생성
→ Codex 실행
→ analysis.json 생성
→ 파일 경로 검증
→ Tria callback
```

Payload 예시:

```json
{
  "analysisRunId": "run_123",
  "repository": "company/admin-web",
  "ref": "develop",
  "issueTitle": "담당자 변경 후 목록 미반영",
  "issueBody": "강의 담당자를 변경했지만 목록에는...",
  "callbackUrl": "https://tria.company.com/api/analysis/callback"
}
```

저장소 값은 사용자 입력이 아니라 Tria 서버의 허용 목록에서 선택한다.

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

# 16. Asana 결과 표시

Asana에는 비개발자도 이해할 수 있는 요약만 남긴다.

예시:

```text
🤖 Tria 1차 분석 완료

판정: 프론트엔드 코드 확인 필요

요약:
강의 수정 후 목록 데이터 갱신 흐름에서 확인이 필요한
코드 후보가 발견됐습니다.

상세 분석:
https://tria.company.com/issues/{issueId}
```

코드 파일과 내부 구현 세부 사항은 Tria 웹에서 제공한다.

---

# 17. 보안

## 웹 인증

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

## Asana 웹훅

* 핸드셰이크 secret 저장
* HMAC 서명 검증
* 웹훅 수신 후 최신 태스크를 API로 재조회

## AI 실행

* 읽기 전용 sandbox
* 저장소 수정 금지
* 외부 입력의 명령 무시
* 비밀 파일 접근 차단
* 결과 로그에서 민감 정보 제거

---

# 18. 중복 및 동시 실행

중복 기준:

```text
asanaTaskGid
+ sourceModifiedAt
```

권장 DB 제약:

```text
UNIQUE(issueId, sourceModifiedAt)
```

동일 이슈의 분석이 실행 중이면 새 분석을 시작하지 않는다.

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
* Asana 상태 `분석 실패`

## Codex 실패

* JSON 생성 실패 저장
* GitHub Actions 실행 링크 제공
* 재분석 버튼 제공

## Callback 실패

* GitHub Actions 재시도
* idempotency key 사용
* 완료되지 않은 실행 감지 작업 추가

## Asana API 실패

* 분석 결과는 DB에 우선 저장
* Asana 갱신 작업 재시도
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
Asana 이슈 작성
→ AI 분석 요청
→ 웹훅 수신
→ 이슈 DB 동기화
→ GitHub Actions 실행
→ 대상 비공개 저장소 인증 및 checkout
→ Codex 분석
→ 결과 검증
→ Callback
→ Tria 웹 결과 표시
→ Asana 요약 댓글
→ 개발 검토 상태 변경
```

운영형 Tria의 성공은 모든 이슈의 원인을 맞히는 것이 아니다.

다음 상태를 만드는 것이 성공이다.

> 개발자가 이슈를 확인하는 시점에 관련 코드와 조사 방향, 추가 확인 항목이 이미 준비돼 있다.
