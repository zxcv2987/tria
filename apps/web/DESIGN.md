---
name: Tria
description: 검증된 저장소 근거를 운반하는 개발자용 이슈 조사 작업대
colors:
  warm-field: "oklch(0.955 0.012 84)"
  warm-paper: "oklch(0.93 0.025 85)"
  raised-paper: "oklch(0.975 0.018 85)"
  charcoal-ink: "oklch(0.205 0.018 158)"
  charcoal-console: "oklch(0.19 0.024 158)"
  charcoal-console-muted: "oklch(0.25 0.028 158)"
  console-line: "oklch(0.42 0.036 158)"
  operational-teal: "oklch(0.42 0.075 178)"
  amber-signal: "oklch(0.7 0.135 65)"
  muted-ink: "oklch(0.47 0.02 158)"
  structural-border: "oklch(0.76 0.018 84)"
  destructive: "oklch(0.56 0.18 28)"
typography:
  headline:
    fontFamily: "Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "clamp(1.25rem, 1.8vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.008em"
  label:
    fontFamily: "Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  identifier:
    fontFamily: "Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  clipped: "0px"
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "6px"
spacing:
  hairline: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.operational-teal}"
    textColor: "{colors.raised-paper}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "32px"
  input-console:
    backgroundColor: "{colors.charcoal-console}"
    textColor: "{colors.raised-paper}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "32px"
  issue-strip:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.clipped}"
    padding: "12px"
  console-panel:
    backgroundColor: "{colors.charcoal-console}"
    textColor: "{colors.raised-paper}"
    rounded: "{rounded.clipped}"
    padding: "12px"
---

# Design System: Tria

## Overview

**Creative North Star: "The Flight Progress Strip Desk"**

Tria는 AI 대시보드가 아니라 개발자의 조사 작업대다. 증거가 운영 스트립을 따라 이동한다는 관점으로, 숯빛 콘솔 위에 따뜻한 종이 스트립을 쌓아 이슈 큐와 저장소 근거의 순서를 드러낸다. 화면의 주된 이야기는 큐를 훑고, 사건을 열고, 검증된 저장소 근거를 확인하고, 다음 행동을 고르는 것이다.

밀도는 높지만 역할은 조용히 분리한다. 콘솔은 구조와 제어를 맡고, 종이 스트립은 사람이 읽고 판단할 정보를 운반한다. 틸은 조작 가능한 상태와 순서 표식에, 앰버는 주의를 부르는 신호에만 나타난다. 잘린 우상단 모서리와 세로 그리드는 이 세계의 반복 가능한 서명이다.

**Key Characteristics:**
- 숯빛 운영 콘솔과 따뜻한 종이 스트립의 강한 재료 대비
- 이슈 큐와 근거를 같은 스트립 문법으로 연결하는 증거 흐름
- 틸 제어, 앰버 신호, 얇은 구조선으로 제한된 기능색
- 거의 평평한 표면, 작은 반경, 잘린 우상단 모서리
- 제목·본문·라벨·기술 식별자까지 Pretendard 하나로 통일한 안정적인 한글 조판

## Colors

따뜻한 종이와 녹색 기가 도는 숯빛 콘솔이 기본 세계를 만들고, 틸과 앰버가 서로 다른 기능을 맡는다.

### Primary
- **Operational Teal:** 버튼, 활성 필터, 포커스 외곽선, 근거 순번처럼 사용자가 조작하거나 따라갈 수 있는 지점에만 쓴다.

### Secondary
- **Amber Signal:** AI 판정의 점 표시와 텍스트 선택처럼 주의를 모으는 순간에 쓴다. 주 행동 버튼의 대체색이 아니다.

### Neutral
- **Charcoal Console / Muted Console:** 운영 보드, 도구막대, 제어 원장과 보조 패널의 기반이다.
- **Warm Field:** 일반 설정·로그인 화면과 콘솔 바깥의 페이지 바탕이다.
- **Warm Paper / Raised Paper:** 이슈 스트립, 근거 스트립, 원본 이슈 기록을 담는다.
- **Console Line / Structural Border:** 표면을 띄우지 않고 구획하는 얇은 구조선이다.
- **Charcoal Ink / Muted Ink:** 종이 위의 본문과 보조 정보에 사용한다.

### Named Rules
**The Material Assignment Rule.** 콘솔은 제어와 구조, 종이는 이슈와 증거를 담는다. 두 재료의 역할을 뒤집지 않는다.

**The Two-Signal Rule.** 틸은 조작과 진행, 앰버는 주의 신호다. 같은 상태에 두 색을 함께 쓰지 않는다.

## Typography

**Display/Body Font:** Pretendard Variable (Apple SD Gothic Neo, Malgun Gothic, sans-serif fallback)

**Identifier Font:** Pretendard Variable (본문과 동일)

**Character:** Pretendard 하나로 한글 이슈 제목, 설명, 상태, 제어 라벨과 기술 식별자를 모두 표시한다. 문자 체계가 바뀌어도 폭과 기준선이 튀지 않도록 모노스페이스 서체를 사용하지 않는다.

### Hierarchy
- **Headline** (600, `clamp(1.25rem, 1.8vw, 1.5rem)`, 1.25): 페이지 제목과 사건 제목.
- **Section title** (600, 0.875rem, tight): 근거 영역과 제어 원장의 제목.
- **Body** (400, 0.875rem, 1.55): 기본 UI 카피. 긴 판정 요약은 1rem과 relaxed line-height를 쓴다.
- **Label** (Pretendard, 600, 0.75rem, letter-spacing 0): 브레드크럼, 표 헤더, 필터 제어, 한글 메타데이터.
- **Identifier** (Pretendard, 500, 0.75rem, letter-spacing 0): 파일 경로, 이슈 ID, 저장소와 커밋 기준.

### Named Rules
**The Single-Typeface Rule.** 모든 UI 카피와 기술 식별자에 Pretendard를 쓴다. 모노스페이스 서체를 사용하지 않는다.

## Layout

페이지는 최대 1600px의 작업대이며 좌우 16px, 작은 화면 24px, 큰 화면 32px의 여백을 쓴다. 상단 내비게이션은 48px 높이로 고정되고, 본문은 24px 간격의 수직 흐름을 유지한다. 큐는 데스크톱에서 이슈·프로젝트·상태·판정·최근 실행의 5열로, 모바일에서는 한 스트립 안의 라벨형 스택으로 전환된다.

상세 작업대는 큰 화면에서 `minmax(0, 1fr) / 300px` 두 열이다. 왼쪽의 증거 시퀀스가 지배적이고 오른쪽 제어 원장은 조용한 고정 폭을 유지한다. 1024px 아래에서는 한 열로 쌓인다. 콘솔 그리드는 24px 세로 간격이며 장식이 아니라 스트립 정렬의 기준선으로 취급한다.

## Elevation & Depth

기본 깊이는 그림자가 아니라 재료 대비, 1px 구조선, 배경 톤의 층으로 만든다. 작업대·스트립·카드에는 그림자를 쓰지 않는다. 팝오버와 대화상자처럼 실제로 다른 레이어에 떠야 하는 일시적 UI만 기존 `shadow-md` 또는 얇은 링을 허용한다.

### Named Rules
**The Bench-Stays-Flat Rule.** 지속되는 작업 표면은 뜨지 않는다. 콘솔 선과 종이 대비만으로 계층을 만든다.

## Shapes

형태는 산업적이고 각이 작다. 기본 반경은 2–6px이며 버튼과 필드는 2px, 팝오버는 최대 4px, 대화상자는 6px를 쓴다. 핵심 스트립은 둥글지 않고 우상단 10px를 대각선으로 잘라낸다: `polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)`. 작은 정사각형 점, 순번 블록, 얇은 테두리가 원형 장식 대신 상태와 구조를 표시한다.

## Components

### Buttons
- **Shape:** 2px 모서리, 기본 높이 32px, 작은 크기 28px.
- **Primary:** Operational Teal 바탕과 밝은 종이색 텍스트. 재분석처럼 직접적인 다음 행동에 사용한다.
- **Outline:** 투명 바탕과 구조선. 콘솔 위에서는 밝은 텍스트와 Console Line을 사용한다.
- **Hover / Focus:** hover는 배경 톤만 바꾸고, focus-visible은 틸 계열 2px 링으로 표시한다.
- **Destructive:** Destructive 색의 10% 배경과 본색 텍스트. 삭제에만 사용한다.

### Inputs / Fields
- **Style:** 2px 모서리, 1px 테두리, 32–36px 높이. 콘솔 필터는 Charcoal Console 바탕과 밝은 텍스트를 사용한다.
- **Focus:** Ring 색의 테두리와 3px 반투명 링.
- **Invalid:** Destructive 테두리와 반투명 링. disabled는 입력과 포인터를 막고 50% 불투명도로 낮춘다.

### Chips / Badges
- **Style:** 20px 높이의 작은 캡슐형 상태 표식. 분석 상태는 기존 앰버·스카이·에메랄드·레드·징크 시맨틱 팔레트를 유지한다.
- **State:** 배지는 판정과 실행 상태를 빠르게 구분하는 보조 어휘다. 브랜드 틸 버튼이나 앰버 신호점을 대체하지 않는다.

### Cards / Containers
- **Console panel:** Charcoal Console, 1px Console Line, 반경 없음. 도구막대와 보조 블록은 Muted Console로 한 단계 올린다.
- **Paper strip:** Warm Paper, 우상단 10px 클립, 12–20px 패딩. hover 가능한 스트립만 Raised Paper로 변한다.
- **Standard card:** 설정 화면에서는 Warm Field 위 Card 색, 1px Structural Border, 16px 패딩을 쓴다.

### Navigation
- 48px 높이의 Charcoal Console 바. 브랜드와 운영 링크는 밝은 종이색으로, 비활성 링크는 60% 흰색으로 표시한다.
- 활성 링크는 2px Operational Teal 하단선으로 표시하며, 아이콘과 텍스트의 수평 구조를 유지한다.

### Issue and Evidence Strips
- 이슈 큐와 검증된 근거는 같은 잘린 종이 실루엣을 공유한다. 이 반복이 접수된 사건에서 저장소 증거로 이어지는 제품 이야기를 만든다.
- 초기 진입 모션은 360ms `cubic-bezier(.16,1,.3,1)`로 왼쪽에서 스트립 폭이 펼쳐진다. `prefers-reduced-motion`에서는 실행하지 않는다.

### Workbench Primitives
- **PaperStrip:** 이슈, 판정 요약, 코드 근거와 모바일 프로젝트 매핑에 쓰는 Warm Paper 컨테이너. `asChild`로 링크·섹션·아티클의 의미론을 보존한다.
- **MetaRow:** 원장과 모바일 카드에서 라벨과 값을 양끝 정렬하는 `dt`/`dd` 행. 값 말줄임처럼 필요한 차이만 `valueClassName`으로 허용한다.
- **ConsoleSectionHeader:** 콘솔 표면의 제목, 설명과 우측 보조 정보에 쓰는 헤더. 도메인별 행동이나 데이터 로직은 포함하지 않는다.

## Do's and Don'ts

### Do:
- **Do** 이슈와 검증된 근거를 Warm Paper 스트립에 담아 증거 흐름을 유지한다.
- **Do** 제어, 필터, 실행 메타데이터는 Charcoal Console 계열 표면에 둔다.
- **Do** 틸은 조작 가능한 요소와 포커스, 앰버는 주의 신호에만 사용한다.
- **Do** 모바일에서 표를 억지로 축소하지 말고 각 스트립을 라벨형 스택으로 전환한다.
- **Do** 긴 한글 설명부터 경로와 식별자까지 Pretendard와 역할별 굵기로 표시한다.
- **Do** 한글 라벨은 최소 0.75rem, 읽어야 하는 한글 본문은 최소 0.875rem으로 유지한다.

### Don't:
- **Don't** 둥근 흰 카드, 큰 차트, 그라디언트 영웅 영역을 조합한 일반적인 AI 대시보드로 되돌리지 않는다.
- **Don't** 지속되는 작업 표면에 그림자를 추가하지 않는다.
- **Don't** 종이 스트립을 제어막대로, 숯빛 콘솔을 긴 판정 본문으로 사용하지 않는다.
- **Don't** 틸과 앰버를 장식용으로 넓게 채우거나 서로의 의미를 바꾸지 않는다.
- **Don't** 스트립의 잘린 모서리를 임의의 큰 radius로 부드럽게 만들지 않는다.
- **Don't** 모노스페이스 서체를 UI에 추가하지 않는다.
