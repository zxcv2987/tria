# Tria MVP 기획서

## 1. 문서 개요

* 제품명: Tria
* 버전: MVP v0.1
* 개발 목표 시간: 3~4시간
* 제품 유형: AI 기반 이슈 코드 분석 도구
* 실행 형태: 로컬 또는 제한된 데모 환경
* 핵심 목표: 이슈 내용을 입력하면 지정된 GitHub 저장소를 코딩 에이전트가 탐색하고 관련 코드와 다음 점검 항목을 웹에 표시한다.

---

# 2. 제품 정의

> Tria MVP는 업무 이슈 내용을 바탕으로 지정된 코드 저장소를 분석하고, 개발자가 처음 확인해야 할 코드 위치와 원인 후보를 제공하는 웹 애플리케이션이다.

MVP에서는 전체 업무 자동화보다 다음 한 가지 가치를 검증한다.

> 이슈를 읽고 관련 코드를 찾는 개발자의 초기 조사 시간을 줄일 수 있는가?

---

# 3. 배경과 문제

행정·운영 담당자가 Asana에 이슈를 등록하면 개발자는 다음 작업을 반복한다.

1. 이슈 내용을 이해한다.
2. 관련 기능과 프로젝트를 찾는다.
3. 라우트, 화면, API 호출, 상태 관리 코드를 탐색한다.
4. 코드 문제인지 외부 문제인지 추론한다.
5. 추가로 확인할 정보를 정리한다.

Tria MVP는 이 과정 중 코드 탐색과 1차 정리를 자동화한다.

---

# 4. MVP 사용자

## 개발자

Tria MVP의 직접 사용자는 개발자다.

주요 행동:

* Asana 이슈 내용을 입력한다.
* 분석 버튼을 누른다.
* AI가 찾은 관련 코드와 원인 후보를 확인한다.
* 추가로 조사할 항목을 확인한다.

행정·운영 담당자는 MVP 웹을 직접 사용하지 않는다.

---

# 5. 핵심 사용자 흐름

```text
Tria 웹 접속
→ 이슈 내용 입력
→ 분석 버튼 클릭
→ 지정된 저장소를 Codex가 분석
→ 구조화된 결과 생성
→ 관련 코드와 다음 점검 항목 표시
```

Asana API 연동이 빠르게 구현될 경우 다음 흐름을 지원한다.

```text
Asana Task ID 또는 URL 입력
→ Asana API로 제목과 본문 조회
→ 코드 분석
→ 결과 표시
```

Asana 연동 구현이 지연될 경우 textarea 직접 입력을 기본으로 사용한다.

---

# 6. MVP 화면

## 6.1 단일 분석 화면

경로:

```text
/
```

화면 구성:

### 이슈 입력

* 이슈 제목
* 이슈 내용
* 분석 버튼

선택 기능:

* Asana Task ID
* Asana 이슈 불러오기

### 분석 상태

* 분석 대기
* 분석 중
* 분석 완료
* 분석 실패

### 분석 결과

* 판정
* 요약
* 관련 파일
* 관련성 설명
* 다음 확인 항목
* 분석 한계

---

# 7. 분석 결과 유형

MVP에서는 결과를 두 종류로 제한한다.

## 7.1 코드 원인 후보 발견

값:

```text
CODE_CANDIDATE
```

의미:

* 이슈 증상과 관련된 파일이 발견됐다.
* 코드 흐름이 증상을 설명할 가능성이 있다.
* 개발자가 우선 확인할 위치를 제시할 수 있다.

예시:

```text
판정: 코드 원인 후보 발견

요약:
강의 수정 후 목록 캐시가 갱신되지 않을 가능성이 있습니다.

관련 파일:
- src/features/course/hooks/useUpdateCourse.ts
- src/features/course/queries/courseKeys.ts

다음 확인:
- 수정 API 응답의 managerId
- 목록 조회 API 응답의 managerId
```

## 7.2 추가 점검 필요

값:

```text
NEED_MORE_CHECK
```

의미:

* 현재 저장소에서 증상을 직접 설명할 코드 근거를 찾지 못했다.
* 외부 API, 배포 환경, 데이터 또는 권한을 추가 확인해야 한다.
* 이슈 내용이 부족할 수도 있다.

예시:

```text
판정: 추가 점검 필요

요약:
현재 프론트엔드 저장소에서는 증상을 직접 설명할 근거를 찾지 못했습니다.

다음 확인:
- 실제 API 응답
- 운영 배포 버전
- 사용자 권한
- 사용자별 데이터
```

---

# 8. AI 출력 형식

```ts
type AnalysisResult = {
  result: "CODE_CANDIDATE" | "NEED_MORE_CHECK";
  summary: string;
  evidence: {
    path: string;
    reason: string;
  }[];
  nextChecks: string[];
  limitation: string;
};
```

예시:

```json
{
  "result": "CODE_CANDIDATE",
  "summary": "수정 후 목록 쿼리가 갱신되지 않을 가능성이 있습니다.",
  "evidence": [
    {
      "path": "src/features/course/hooks/useUpdateCourse.ts",
      "reason": "수정 성공 후 상세 쿼리만 무효화하고 있습니다."
    }
  ],
  "nextChecks": [
    "수정 API 응답을 확인하세요.",
    "목록 조회 API 응답을 확인하세요."
  ],
  "limitation": "운영 환경에서 직접 재현하지 않았습니다."
}
```

---

# 9. MVP 기술 구성

```text
Next.js
├─ 분석 입력 화면
├─ POST /api/analyze
├─ Codex CLI 실행
└─ 결과 표시

로컬 저장소
└─ 분석 대상 프로젝트

Codex CLI
└─ 저장소 읽기 및 분석
```

## 9.1 Next.js

담당 역할:

* 이슈 입력 UI
* 분석 요청 수신
* Codex CLI 실행
* 결과 JSON 파싱
* 결과 화면 렌더링

## 9.2 분석 대상 저장소

MVP에서는 저장소 하나만 지원한다.

환경변수 예시:

```env
TARGET_REPOSITORY_PATH=/Users/user/projects/admin-web
```

프로젝트 선택 기능은 구현하지 않는다.

## 9.3 Codex CLI

Next.js 서버에서 로컬 프로세스로 실행한다.

예시 흐름:

```text
POST /api/analyze
→ 분석 프롬프트 생성
→ codex exec 실행
→ analysis.json 생성
→ 결과 반환
```

MVP는 로컬 또는 장시간 프로세스 실행이 가능한 환경에서 사용한다.

---

# 10. 프로젝트 구조

```text
tria/
├─ app/
│  ├─ page.tsx
│  └─ api/
│     └─ analyze/
│        └─ route.ts
├─ components/
│  ├─ issue-form.tsx
│  ├─ analysis-loading.tsx
│  └─ analysis-result.tsx
├─ lib/
│  ├─ analyze-repository.ts
│  ├─ validate-result.ts
│  └─ schemas.ts
├─ prompts/
│  └─ analyze-issue.md
└─ tmp/
```

Asana 연동을 포함할 경우:

```text
lib/
└─ asana.ts
```

---

# 11. 최소 검증 규칙

AI 결과를 그대로 사용자에게 표시하지 않는다.

## 11.1 파일 존재 여부

AI가 제시한 파일이 실제 저장소에 존재하는지 확인한다.

```ts
const validEvidence = result.evidence.filter((evidence) => {
  const fullPath = path.resolve(repositoryPath, evidence.path);

  return (
    fullPath.startsWith(repositoryPath) &&
    fs.existsSync(fullPath)
  );
});
```

## 11.2 판정 보정

유효한 파일 근거가 없으면 코드 원인 후보 판정을 유지하지 않는다.

```ts
if (
  result.result === "CODE_CANDIDATE" &&
  validEvidence.length === 0
) {
  result.result = "NEED_MORE_CHECK";
}
```

## 11.3 표현 원칙

금지:

* 원인이 확실합니다.
* 반드시 이 코드 때문입니다.
* 인프라 문제입니다.

허용:

* 원인 후보로 보입니다.
* 우선 확인할 필요가 있습니다.
* 현재 코드에서 직접적인 근거를 찾지 못했습니다.

---

# 12. MVP 포함 범위

* Next.js 단일 분석 화면
* 이슈 제목과 내용 입력
* 분석 버튼
* 고정된 저장소 하나 분석
* Codex CLI 실행
* 구조화 JSON 결과
* 파일 경로 검증
* 분석 결과 표시
* 로딩 상태
* 오류 상태
* 직접 입력 방식

시간이 남을 경우:

* Asana Task ID로 이슈 불러오기
* 분석 결과 복사
* Asana 원본 링크 표시

---

# 13. MVP 제외 범위

* Asana 웹훅
* Asana 상태 자동 변경
* Asana 댓글 자동 작성
* GitHub Actions
* GitHub App
* 여러 저장소 지원
* Supabase 및 분석 이력
* 사용자 로그인
* 이슈 목록
* 재분석 기록
* 실시간 분석 로그
* Sentry 및 서버 로그
* 배포 커밋 분석
* 토큰 절감
* 코드 수정
* 테스트 생성
* Pull Request 생성

---

# 14. 구현 순서

## 1단계: 화면 구현

* 이슈 제목 입력
* 이슈 내용 입력
* 분석 버튼
* 분석 결과 카드
* Mock 데이터 연결

## 2단계: Codex 실행

* 분석 프롬프트 작성
* 출력 JSON Schema 작성
* `codex exec` 실행
* 결과 파일 읽기

## 3단계: 검증

* 파일 존재 여부 확인
* 잘못된 경로 제거
* 결과 판정 보정

## 4단계: 실제 이슈 테스트

* 실제 이슈 2~3건 분석
* 프롬프트 조정
* 결과 문구 정리

## 5단계: 선택적 Asana 조회

* Asana PAT 설정
* Task ID로 제목과 본문 조회
* 직접 입력 fallback 유지

---

# 15. 시간 배분

| 시간       | 작업                     |
| -------- | ---------------------- |
| 0~30분    | Next.js 생성 및 기본 화면     |
| 30~60분   | 결과 UI와 Mock 데이터        |
| 60~120분  | Codex CLI 실행 및 JSON 출력 |
| 120~165분 | 파일 검증과 오류 처리           |
| 165~210분 | 실제 이슈 테스트 및 프롬프트 보정    |
| 남는 시간    | Asana API 조회 또는 화면 개선  |

Asana API 연동이 30분 이상 지연되면 즉시 제외한다.

---

# 16. 완료 기준

다음 흐름이 실제로 동작하면 MVP를 완료한 것으로 본다.

```text
이슈 내용 입력
→ 분석하기
→ 지정된 코드 저장소 탐색
→ 실제 존재하는 관련 파일 발견
→ 원인 후보 또는 추가 점검 항목 표시
```

최소 데모 결과:

* 실제 파일이 하나 이상 표시된다.
* 해당 파일이 이슈와 관련된 이유가 표시된다.
* 다음 조사 항목이 표시된다.
* 코드 근거가 없을 때 잘못된 확정 판정을 하지 않는다.

---

# 17. MVP 데모 문장

> Tria는 업무 이슈를 입력하면 관련 프로젝트를 코딩 에이전트가 탐색하고, 개발자가 우선 확인할 코드와 다음 조사 항목을 알려주는 도구입니다.

MVP에서는 자동화된 업무 연동보다 **코드 조사 시작점을 실제로 찾을 수 있는지**를 검증한다.
