# Web UI 워크트리 가이드

역할: 개발자가 쓰는 이슈 목록/상세, 프로젝트 설정 화면을 만든다. Mock 데이터로 완결시키고, 실제 API 연동은 자리만 남겨둔다 (MVP 때 frontend-ui 트랙과 동일한 패턴).

참고 문서: [../tria-production.md](../tria-production.md) 9장(웹 화면)

## 만들 파일

* `apps/web/app/issues/page.tsx` (이슈 목록, 경로 `/issues`)
* `apps/web/app/issues/[id]/page.tsx` (이슈 상세, 경로 `/issues/[id]`)
* `apps/web/app/settings/projects/page.tsx` (프로젝트 설정, 경로 `/settings/projects`)
* 필요한 만큼 `apps/web/components/`에 하위 컴포넌트 추가 (예: `issue-list-table.tsx`, `issue-detail-card.tsx`, `project-config-form.tsx`)

## 공유 계약

`@tria/analysis`의 `AnalysisResult` 타입을 결과 표시에 그대로 쓴다. 이미 있는 `apps/web/components/analysis-result.tsx` (MVP 단일 분석 화면용)를 참고하되 직접 수정하지 말고, 필요하면 새 컴포넌트를 만들어라.

## 9.1 이슈 목록 (`/issues`)

표시: 이슈 제목, 프로젝트, Asana 상태, 분석 상태, AI 판정, 등록 시각, 최근 분석 시각, Asana 링크
필터: 프로젝트, 분석 상태, AI 판정, 검색
상단 지표: 분석 대기 / 분석 중 / 개발 검토 / 추가 정보 필요 / 분석 실패 건수

## 9.2 이슈 상세 (`/issues/[id]`)

원본 이슈: 제목, 본문, 재현 절차, 기대 결과, 실제 결과, 발생 URL, 환경, Asana 링크
분석 결과: 판정, 요약, 의심 영역, 관련 파일, 관련 함수/심볼, 코드 근거, 추가 점검 항목, 누락 정보, 분석 한계, 분석 대상 저장소와 커밋, GitHub Actions 실행 링크
액션: 재분석 버튼, Asana에서 열기, 결과 복사, 분석 피드백(적중/일부 도움/도움 안 됨/잘못된 분석), 실행 로그 확인 링크

## 9.3 프로젝트 설정 (`/settings/projects`)

목록 + 추가/수정 폼: 프로젝트 키, 표시 이름, Asana 프로젝트 값, GitHub 저장소, 기본 브랜치, 활성화 여부, 분석 프롬프트 설정

## Mock 데이터

문서 12장의 타입(`Issue`, `AnalysisRun`, `ProjectConfig`) 형태로 각 화면마다 2~3개씩 mock 배열을 만들어 렌더링한다. 실제 API 연동 지점은 `// TODO: /api/... 연동`으로 표시해두고, 나중에 web-api 트랙 결과와 연결한다.

## 건드리지 않을 것

* `apps/web/app/api/**`, `apps/web/lib/**` — web-api 트랙 담당
* `apps/web/app/page.tsx`, `apps/web/components/issue-form.tsx`, `analysis-loading.tsx`, `analysis-result.tsx` — MVP 단일 분석 화면, 건드리지 않는다
* `packages/**`, `.github/**` — 다른 트랙 담당

## 완료 기준

* `/issues`, `/issues/[id]`, `/settings/projects` 세 화면이 mock 데이터로 렌더링되고, 문서 9장에 나열된 표시 항목/액션이 화면에 다 보인다.
* lint/typecheck/build 통과, 브라우저로 실제 렌더링 확인.
