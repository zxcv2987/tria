---
target: 이슈 상세 (/issues/[id])
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-29T02-29-51Z
slug: apps-web-app-issues-id-page-tsx
---
Method: dual-agent (A: a11969e99b616ea34 · B: aedd6be0033ff93a7)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | 재분석 버튼에 로딩/비활성 상태 없음 |
| 2 | Match System / Real World | 3 | 한국어 카피, 판정 용어가 문서 표현 원칙과 일치 |
| 3 | User Control and Freedom | 2 | 삭제만 확인 다이얼로그 있음, 재분석 취소/실행취소·이전-다음 이슈 이동 없음 |
| 4 | Consistency and Standards | 3 | Field/StringList, 버튼 variant 일관 적용 |
| 5 | Error Prevention | 2 | 재분석에 디바운스/중복 클릭 방지 없음 |
| 6 | Recognition Rather Than Recall | 3 | 모든 값이 라벨과 함께 미리 표시됨 |
| 7 | Flexibility and Efficiency | 1 | 이슈 간 이동, 단축키, 접기 등 파워유저 기능 전무 |
| 8 | Aesthetic and Minimalist Design | 2 | 팔레트는 정돈됐으나 두 카드 각 9~10개 필드 평면 나열로 판정이 희석됨 |
| 9 | Error Recovery | 1 | 실제 실행 중 백엔드 원문 에러("...project_key=tria-demo")가 성공과 동일한 알림창으로 노출 확인 |
| 10 | Help and Documentation | 1 | 판정/의심 영역/코드 근거 구분에 대한 설명 전무 |
| **Total** | | **20/40** | **Acceptable (20-27 구간)** |

**인지 부하: 8개 항목 중 5개 실패 (Critical 구간, 4+)** — single focus, chunking(≤4/그룹), visual hierarchy, one-thing-at-a-time, progressive disclosure 모두 실패. 그룹핑·선택지 수·작업기억 3개는 통과.

## Design Specificity Verdict

**LLM 평가(Assessment A)**: 이 화면은 "속성 많은 레코드의 상세 페이지" 범용 템플릿에 도메인 카피만 입힌 상태다. `Field`/`StringList`가 사용자가 입력한 원본 텍스트와 AI가 낸 판정을 완전히 동일한 라벨-값 패턴으로 렌더링해서 구분이 없다. PRODUCT.md에 따르면 이 제품의 존재 이유가 그 판정인데, 실제 화면에서는 `ResultBadge`("코드 원인 유력")가 원본 이슈 필드 9개를 스크롤해서 지나야 나오는 두 번째 카드 중간에 있다. 이건 "속성 많은 레코드"의 IA이지, "AI 판정을 빠르게 신뢰하고 다음 행동을 정하는 트리아지 화면"의 IA가 아니다.

**결정론적 스캔(Assessment B)**: `detect.mjs`가 `apps/web/app/issues/[id]/page.tsx:32`의 브레드크럼 이슈ID(`text-[0.7rem]`)와 `button.tsx:27`의 sm 사이즈(`text-[0.8rem]`)를 DESIGN.md 타이포 스케일 밖 리터럴 폰트 크기로 지적(advisory). 라이브 페이지에 주입한 detector도 동일한 브레드크럼 span에서 "tiny-text: 11.2px body text" 1건을 잡아 정확히 교차 검증됨. 그 외 `issue-detail-card.tsx`/`status-badges.tsx`/`ui/styles.ts`는 findings 없음.

**시각 오버레이**: 라이브 서버 주입으로 확인된 오버레이가 브레드크럼 ID 위에 "tiny body text" 배지로 표시됨(스크린샷 상 확인, 세션 종료).

## Overall Impression

색·서체 토큰은 잘 자리잡았고(호박/하늘/에메랄드/빨강 상태색이 틸 액센트와 절대 안 섞임 — DESIGN.md의 One Accent Rule을 잘 지킴), 컴포넌트 일관성도 양호하다. 하지만 이 화면의 진짜 문제는 색이 아니라 **정보 우선순위**다: 개발자가 열자마자 봐야 할 "판정"이 원본 이슈 텍스트 9개 필드 뒤에 숨어 있고, 재분석 버튼은 로딩 상태도 없이 실제 에러 시 원문 그대로("project_key=tria-demo") 성공과 똑같은 알림창에 뜬다. 가장 큰 기회는 레이아웃 재배치(판정을 최상단으로) + 에러 처리 강화.

## What's Working

- `Field`/`StringList` 패턴이 두 카드 전체에서 예측 가능한 단일 스캔 패턴을 만든다 — 한 번 배우면 어디서든 같은 방식으로 값을 찾는다.
- 상태/판정 배지 색이 브랜드 액센트(틸)와 완전히 분리되어 있다 — 지난 토큰 작업이 실제로 지켜지고 있음을 라이브에서 확인.
- 빈 값 방어 처리가 전 필드에 일관 적용(`evidence.length === 0 ? "-" : ...`) — undefined/크래시 위험 없음.

## Priority Issues

**[P0] 판정이 원본 이슈 텍스트 뒤에 묻힘**
- Why: PRODUCT.md의 핵심 원칙("스캔 속도·판정 신뢰도·다음 행동 명확성 우선")과 정면으로 어긋남.
- Fix: "분석 결과"(최소 판정+요약+근거)를 최상단으로 재배치하고, "원본 이슈"는 기본 접힘(collapse) 상태로.
- Suggested command: `/impeccable layout`

**[P1] 에러 알림이 백엔드 원문을 그대로 노출, 성공과 동일한 스타일**
- Why: 실제 재분석 클릭 시 "활성 프로젝트 설정이 없습니다 (project_key=tria-demo)."가 성공 알림과 똑같은 중립 다이얼로그로 뜸 — 성공/실패 구분이 안 되고 내부 키 이름까지 노출.
- Fix: `useAlertDialog`에 에러 variant 추가, 캐치한 에러 메시지를 사용자 행동 가능한 문구로 재작성 후 표시.
- Suggested command: `/impeccable harden`

**[P1] 재분석 버튼에 로딩/중복 클릭 방지 없음**
- Why: 요청 중에도 버튼이 계속 클릭 가능 — GitHub Actions 중복 트리거 위험.
- Fix: 요청 중 disable + 라벨 변경.
- Suggested command: `/impeccable polish`

**[P2] 이슈 간 이전/다음 이동 없음**
- Why: 큐를 순회하며 트리아지하는 개발자가 매번 목록으로 돌아가야 함.
- Fix: `PageHeader`에 prev/next 컨트롤(단축키 포함) 추가.
- Suggested command: `/impeccable optimize`

**[P2] DESIGN.md 타이포 스케일 밖 리터럴 폰트 크기 2건**
- Why: `page.tsx:32`의 `text-[0.7rem]`(브레드크럼 이슈ID), `button.tsx:27`의 `text-[0.8rem]`(sm 버튼) — 디텍터(정적/라이브 둘 다)가 확인. 디자인 시스템 드리프트의 시작점.
- Fix: Tailwind 표준 스케일(`text-xs` 등)로 교체하거나, 의도적 축소라면 DESIGN.md 타이포 섹션에 명시적으로 추가.
- Suggested command: `/impeccable typeset`

**[P3] 재현 절차 필드에서 `\n`이 줄바꿈이 아닌 문자 그대로 렌더링**
- Why: `whitespace-pre-wrap`을 걸어도 이스케이프된 `\n` 문자열 자체가 그대로 보임("1. Open login\n2. Submit").
- Fix: 렌더 전에 이스케이프된 개행을 정규화.
- Suggested command: `/impeccable harden`

## Persona Red Flags

**Alex (파워 유저)**: 이슈 간 큐 이동/키보드 없음 — 매번 목록으로 왕복. 재분석 중복 제출 가드 없음. "결과 복사"가 라벨링이 일관되지 않은 텍스트 덤프를 만들어서(일부 줄만 "의심 영역:" 식 접두어) Slack/PR에 붙이기 전에 손으로 다듬어야 함.

**Sam (접근성 의존 사용자)**: `Field`/`StringList`가 모든 라벨을 `<h3>`로 렌더링 — 9개 필드 카드 하나가 스크린리더 헤딩 탐색에 스푸리어스 헤딩 9개를 만듦(폼 라벨에 헤딩 시맨틱 오용). 상태 배지들이 동일한 pill 모양에 파스텔 색+텍스트만으로 구분(저색각 사용자용 아이콘 백업 없음). GitHub Actions/원본 링크가 `target="_blank"`인데 새 탭 알림이 없음.

## Minor Observations

- "코드 근거" StringList가 "관련 파일" 아래 아이템별 `.reason`과 동일한 텍스트를 중복 표시.
- 브레드크럼의 이슈 ID가 사람이 읽기엔 가치 낮은 원본 UUID 그대로 mono로 노출.
- 필드 행 사이 내부 gap 값이 세 군데서 다름(`gap-1.5`/`gap-2`/`gap-3`) — 시각적으로 유사한 라벨+값 스택인데 리듬이 미세하게 어긋남.
- 기본 버튼 높이(`h-8`, 32px)가 터치 타깃 44px 기준보다 작음 — 데스크톱 전용 내부 도구라 우선순위는 낮음.

## Questions to Consider

1. AI 판정이 이 제품의 전부라면, 왜 레이아웃은 개발자가 이미 원본 도구에서 읽은 텍스트를 다시 스크롤하게 만든 뒤에야 그걸 보여줄까?
2. "원본 이슈"가 기본으로 펼쳐져 있어야 할까, 아니면 다시 읽고 싶을 때만 펼치는 게 맞을까?
3. 이 화면은 20개 이슈를 연달아 트리아지하는 사람을 위한 걸까, 아니면 이슈 하나 열고 나가는 사람을 위한 걸까?
