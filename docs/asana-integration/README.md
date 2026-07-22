# Asana Integration 워크트리 가이드 (선택 기능)

역할: Asana Task ID로 이슈 제목/본문을 가져오는 선택 기능. MVP 완료 기준에는 포함되지 않는다 — 시간이 남을 때만 다른 워크트리 결과물에 병합한다.

참고 문서: [../tria-mvp.md](../tria-mvp.md) 5장(핵심 사용자 흐름), 9.2(분석 대상 저장소), 14장 5단계(선택적 Asana 조회)

## 만들 파일

* `lib/asana.ts`

## 구현 방향

* Asana Personal Access Token(PAT)을 환경변수 `ASANA_PAT`로 읽는다.
* Task ID 또는 URL을 받아 Asana API(`GET /tasks/{task_gid}`)로 `name`(제목), `notes`(본문)을 조회한다.
* 조회 실패 시 예외를 던진다. 직접 입력으로의 fallback은 호출하는 쪽(issue-form)의 책임이며, 여기서는 조회 함수만 제공한다.

## 인터페이스

```ts
export async function fetchAsanaTask(taskIdOrUrl: string): Promise<{
  title: string;
  body: string;
}>;
```

## 건드리지 않을 것

* 다른 모든 파일. `issue-form`에 Task ID 입력 필드를 추가하는 작업은 이 함수가 완성된 뒤 최종 wiring 단계에서 진행한다.

## 완료 기준

* 실제 Asana Task ID로 `fetchAsanaTask`를 호출하면 제목/본문이 정상 반환된다.
* 잘못된 Task ID를 넣으면 명확한 에러를 던진다.
