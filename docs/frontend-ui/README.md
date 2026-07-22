# Frontend UI 워크트리 가이드

역할: 이슈 입력 화면, 분석 상태 표시, 결과 카드 UI. Mock 데이터로 완결시키고, 실제 API 연동은 자리만 남겨둔다.

참고 문서: [../tria-mvp.md](../tria-mvp.md) 6장(MVP 화면), 11.3(표현 원칙)

## 만들 파일

* `app/page.tsx`
* `components/issue-form.tsx`
* `components/analysis-loading.tsx`
* `components/analysis-result.tsx`

## 공유 계약

`lib/schemas.ts` 의 `AnalysisResult`, `AnalysisStatus` 타입을 import해서 사용한다. 이 파일은 이미 완성되어 있고 다른 워크트리와 공유하는 계약이므로 수정하지 않는다.

```ts
export type AnalysisResult = {
  result: "CODE_CANDIDATE" | "NEED_MORE_CHECK";
  summary: string;
  evidence: { path: string; reason: string }[];
  nextChecks: string[];
  limitation: string;
};

export type AnalysisStatus = "idle" | "loading" | "success" | "error";
```

## 구현 방향

* `issue-form`: 이슈 제목 입력, 이슈 내용 textarea, 분석 버튼. 제출 시 상위(`page.tsx`)로 `{ title, body }` 전달.
* `page.tsx`: `AnalysisStatus` state 관리. 분석 버튼 클릭 시 `loading` → mock `AnalysisResult`를 `setTimeout`으로 흉내내어 `success` 처리. 실제 연동 지점은 `// TODO: POST /api/analyze 연동`으로 표시하고 fetch 호출 한 줄만 남겨둔다.
* `analysis-loading`: "분석 중" 표시. 화려할 필요 없음.
* `analysis-result`: `AnalysisResult`를 받아 판정 배지(`CODE_CANDIDATE`/`NEED_MORE_CHECK`), 요약, 관련 파일 목록(`evidence`의 `path` + `reason`), 다음 확인 항목(`nextChecks`), 분석 한계(`limitation`)를 렌더링.
* 오류 상태: 분석 실패 시 에러 메시지 표시.

## Mock 데이터

문서 7장의 예시 JSON을 그대로 mock으로 사용하면 된다.

## 건드리지 않을 것

* `app/api/analyze/route.ts` — codex-runner 워크트리 담당
* `lib/analyze-repository.ts`, `lib/validate-result.ts` — 다른 워크트리 담당

## 완료 기준

* 이슈 제목/내용 입력 → 분석 버튼 클릭 → mock 결과가 화면에 표시된다.
* 대기/분석중/완료/실패 4가지 상태가 모두 시각적으로 구분된다.
