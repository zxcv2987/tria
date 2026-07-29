---
target: 이슈 목록 (/issues)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-29T02-53-37Z
slug: apps-web-app-issues-page-tsx
---
Method: dual-agent (A: a4324bef3c29f3d35 · B: a6bf368dc12ddaecf)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 배지는 명확하나 `app/issues/`에 loading.tsx/error.tsx 없음 |
| 2 | Match System / Real World | 3 | 도메인 용어 일관 |
| 3 | User Control and Freedom | 2 | 필터가 useState뿐이라 새로고침/뒤로가기에 유실됨 |
| 4 | Consistency and Standards | 2 | 지표 타일 "개발 검토" vs 배지·필터 "코드 원인 유력" 용어 불일치 |
| 5 | Error Prevention | 3 | 파괴적 액션 없음, 위험 낮음 |
| 6 | Recognition Rather Than Recall | 2 | 타일→필터 매핑을 기억해야 함(클릭 연동 없음) |
| 7 | Flexibility and Efficiency | 1 | 정렬 없음, 타일 클릭 없음, 저장된 뷰 없음 |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained 팔레트가 라이트/다크 모두 깔끔하게 구현됨 |
| 9 | Error Recovery | 3 | FAILED 행에 사유/재시도 없음(상세 페이지에서 다루면 괜찮음) |
| 10 | Help and Documentation | 3 | 학습된 내부 사용자 기준으로는 충분 |
| **Total** | | **26/40** | **Acceptable (Good 경계 바로 아래)** |

**인지 부하: 8개 중 5개 실패 (Critical)** — chunking(행당 9개 데이터포인트), visual hierarchy(5개 타일이 긴급도 무관 동일 스타일), minimal choices, working memory(타일/배지 용어 이중화), progressive disclosure(모바일에서도 7열 전부 무조건 렌더) 실패.

## Design Specificity Verdict

**LLM 평가(A)**: 분석 상태·AI 판정 같은 실제 도메인 개념은 잘 반영됐지만, 이 화면은 근본적으로 "데이터 테이블 + 필터 3개 + 지표 타일" 범용 템플릿이다. PRODUCT.md가 이 화면의 존재 이유로 못 박은 "어디부터 봐야 하는지" 질문에 답하는 요소가 없다 — 정렬은 createdAt 고정이고, 지표 타일 5개는 클릭이 안 되는 `<div>`라 실제로는 장식이며, 심지어 "개발 검토" 타일 라벨이 같은 화면 배지·필터의 "코드 원인 유력" 라벨과 다르다.

**결정론적 스캔(B)**: 정적 `detect.mjs`는 6개 파일 모두 clean. 라이브 주입 detector가 3건 발견: `cramped-padding`(overflow-x-auto 래퍼 안쪽 여백 없음), `single-font`(Pretendard 하나만 사용 — 이건 DESIGN.md의 "Single Face Rule"을 지킨 결과라 실제로는 의도된 사항, 문제 아님), `nested-cards`(카드 안에 카드).

**시각/측정 증거**: 배지 대비는 라이트/다크 전부 WCAG AA(4.5:1) 통과(라이트 모드 빨강 배지가 6.85:1로 AAA 7:1에 가장 근접). 768px/390px 모두 테이블이 `overflow-x-auto`로 가로 스크롤되는데 스크롤바/엣지 힌트가 전혀 없고, 첫 컬럼(이슈 제목) 고정이 없어 스크롤하면 "이 행이 뭐였는지" 문맥을 잃는다. 390px에서는 분석 상태·AI 판정·등록 시각·최근 분석 시각 4개 컬럼이 기본 화면 밖으로 완전히 밀려남 — 스크롤해야 보임.

## Overall Impression

토큰/팔레트 실행은 깔끔하다(A: 4/4 미니멀 점수, B: 대비 전부 AA 통과). 진짜 문제는 표현이 아니라 **이 화면이 실제로 트리아지를 돕지 않는다**는 것: 지표 타일은 숫자만 보여주고 필터링은 안 되고, 같은 상태를 화면 안에서 두 가지 이름으로 부르고, 모바일에서는 판정 정보 자체가 스크롤 밖으로 사라진다.

## What's Working

- 상태/판정 배지가 고정된 5색 시맨틱 체계를 예외 없이 따름 — "확정 표현 금지" 원칙과 일치.
- 다크모드까지 포함해 대비가 라이트 6.85~9.50:1, 다크 11.12~12.05:1로 전부 WCAG AA 이상(측정값 기준).
- 필터/검색이 즉시 클라이언트 재렌더 — 내비게이션 지연 없음, 포커스 링도 전 단계에서 확인됨.

## Priority Issues

**[P0] 모바일에서 핵심 두 컬럼(분석 상태/AI 판정)이 스크롤 밖으로 사라짐**
- Why: 390px 실측 결과 기본 화면엔 이슈 제목/프로젝트/원본만 보이고, "이 이슈를 열어야 하나?"를 답하는 분석 상태·AI 판정은 가로 스크롤해야만 보임. 스크롤 힌트(그림자/화살표)도 없음.
- Fix: `sm` 미만에서 `issue-list-table.tsx`를 7열 테이블 대신 카드형 행(제목+분석상태+AI판정 항상 노출, 나머지는 보조 줄)으로 전환.
- Suggested command: `/impeccable layout`

**[P1] 지표 타일 라벨과 배지/필터 라벨이 같은 상태를 다르게 부름**
- Why: `metricFor()`가 CODE_LIKELY를 "개발 검토"로, `RESULT_TYPE_LABEL`(배지·필터에 쓰임)은 같은 값을 "코드 원인 유력"으로 표기 — 일관성·인식 휴리스틱 위반, 한 화면에서 이름을 두 개 외워야 함.
- Fix: 타일 라벨을 `RESULT_TYPE_LABEL.CODE_LIKELY` 재사용으로 통일, 임시 문자열 제거.
- Suggested command: `/impeccable clarify`

**[P1] 지표 타일이 숫자만 보여줄 뿐 실제로는 장식**
- Why: 5개 타일이 `onClick` 없는 `<div>`라, 정확히 하루에 몇 번씩 이 화면을 훑는 개발자가 원하는 "그 상태만 필터링" 지름길이 안 됨 — 지금은 같은 걸 보려면 드롭다운을 다시 조작해야 함.
- Fix: 타일을 필터 토글로(`aria-pressed`, 분석상태/AI판정 state 연동), 해당 배지 색을 얇은 좌측 보더로 표시.
- Suggested command: `/impeccable bolder`

**[P2] 카드 안에 카드 중첩 (`nested-cards`, 라이브 디텍터 확인)**
- Why: `overflow-x-auto` 래퍼(`tableWrapClass`) 안쪽 여백 없이 카드가 카드에 바로 붙음(`cramped-padding`) — craft-floor의 "중첩 카드는 항상 잘못" 기준에 해당.
- Fix: 중첩 카드 구조를 평평하게 하거나 안쪽 패딩 추가.
- Suggested command: `/impeccable polish`

**[P2] 트리아지 긴급도를 반영하는 정렬이 없음**
- Why: 행이 createdAt 순 고정이라, 일주일 전 FAILED와 오늘 NEED_MORE_INFO가 아무 우선순위 없이 섞임 — "조사 시간 단축"이라는 제품 성공 지표와 어긋남.
- Fix: FAILED/CODE_LIKELY 같은 실행 가능한 상태를 기본 상단 정렬하거나 정렬 가능한 컬럼 헤더 추가.
- Suggested command: `/impeccable distill`

## Persona Red Flags

**Alex(파워유저, 하루 여러 번 방문)**: 지표 타일이 정확히 자기가 필터링하고 싶은 값을 보여주면서도 클릭이 안 됨. 필터 선택이 React state뿐이라 새로고침/재방문 시 "AI 판정=코드 원인 유력" 필터가 매번 초기화됨. 정렬 없어 "지금 처리할 것"을 매번 전체 재스캔해야 함.

**Casey(모바일 사용자)**: 390px에서 분석 상태/AI 판정 컬럼이 스크롤바·힌트 없이 화면 밖으로 사라짐(측정: scrollWidth 896 vs clientWidth 687). 지표 타일 5개가 세로로 ~450px를 차지해 테이블이 폴드 아래로 밀림. "프로젝트 설정" 헤더 액션이 제목 아래 별개 줄로 떨어짐(측정상 정렬 자체는 어긋나지 않음 — 버튼 내부 패딩 때문에 그렇게 보일 뿐, 실제 오정렬 아님으로 확인).

## Minor Observations

- 원본 컬럼("api", "manual-test")이 프로젝트 컬럼과 나란히 있어 시각적으로 구분이 약함.
- 긴 제목("프로젝트 계획 업데이트 사항 검토 및 승인")이 좁은 화면에서 2줄로 줄바꿈되며 그 행만 높이가 달라짐(말줄임 없음).
- 세 개의 셀렉트("전체 프로젝트/전체 분석 상태/전체 AI 판정") 모양이 거의 동일해 아이콘 등 구분 요소 없이 오클릭 유발 가능.
- `app/issues/`에 loading.tsx/error.tsx 없음 — Supabase 조회가 느리거나 실패할 때 정의된 UI 상태 없음.
- 타임스탬프가 초 단위까지 표시(오후 5:54:52) — 스캔 작업엔 "3일 전" 같은 상대 시간이 더 빠름.
- single-font 감지(Pretendard만 사용)는 문제 아님 — DESIGN.md의 "Single Face Rule"을 그대로 지킨 결과.

## Questions to Consider

1. 지표 타일이 클릭도 안 되고 배지와 다른 이름을 쓴다면, AI 판정 드롭다운이 이미 더 잘하는 일을 타일이 따로 하는 이유는 뭘까?
2. 제품의 성공 지표가 "조사 시간 단축"이라면, 지금의(createdAt만 반영하는) 정렬이 실제로 가장 처리해야 할 이슈를 먼저 찾게 도와주나?
3. Casey가 실제로 테스트된 페르소나라면, 7열 테이블을 가로 스크롤로 욱여넣는 게 폰 화면에 맞는 형태일까, 아니면 브레이크포인트 아래에서 완전히 다른(카드) 레이아웃을 써야 할까?
