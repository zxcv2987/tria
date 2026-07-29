---
name: Tria
description: 이슈를 접수해 GitHub 저장소를 AI로 분석하는 내부 트리아지 도구
colors:
  primary: "oklch(0.42 0.09 200)"
  primary-dark: "oklch(0.75 0.1 200)"
  neutral-bg: "oklch(0.97 0 0)"
  neutral-bg-dark: "oklch(0.145 0 0)"
  neutral-surface: "oklch(1 0 0)"
  neutral-surface-dark: "oklch(0.205 0 0)"
  neutral-text: "oklch(0.145 0 0)"
  neutral-text-dark: "oklch(0.985 0 0)"
  neutral-text-muted: "oklch(0.45 0 0)"
  neutral-text-muted-dark: "oklch(0.72 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  body:
    fontFamily: "Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  4xl: "26px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "oklch(0.98 0 0)"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.primary}, transparent 20%)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
  button-destructive:
    backgroundColor: "color-mix(in oklch, {colors.destructive}, transparent 90%)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Design System: Tria

## Overview

**Creative North Star: "The Restrained Diagnostic Console"**

Tria는 개발자가 이슈를 열자마자 무엇을 먼저 봐야 하는지 파악하게 돕는 내부 업무 도구다(Operate 모드). 표현보다 스캔 속도·신뢰도·다음 행동의 명확성이 우선이므로, 화면 대부분은 무채색(회색조 배경·카드·표)으로 조용히 있고, 딥 틸 액센트 하나만 "지금 눌러야 할 행동"(주 버튼, 링크, 포커스 링, 체크박스)에 집중적으로 쓰인다. 판정·상태 배지(호박/하늘/에메랄드/빨강/회색)는 액센트와 분리된 별도의 의미 어휘로, 절대 브랜드 색과 혼용하지 않는다.

라이트/다크 모두 시스템 설정을 따르며(`prefers-color-scheme`), 다크 모드에서는 카드·표에 그림자를 쓰지 않고 완전히 평평하게 유지한다(빛이 없는 화면이라는 전제).

**Key Characteristics:**
- 무채색 + 액센트 1개(Restrained) — 액센트는 주 행동에만, 장식엔 쓰지 않는다.
- 서체는 Pretendard 하나로 제목부터 표까지 전부 커버한다(디스플레이/본문 페어링 없음).
- 카드·표는 옅은 shadow-xs(라이트) / 무그림자(다크)로 평평함을 유지한다.
- 상태 배지 색(호박·하늘·에메랄드·빨강·회색)은 브랜드 액센트와 절대 겹치지 않는다.

## Colors

무채색 배경 위에 딥 틸 액센트 하나가 얹히는 Restrained 팔레트. 상태 배지는 별도의 고정 어휘로 취급한다.

### Primary
- **딥 틸** (`oklch(0.42 0.09 200)` 라이트 / `oklch(0.75 0.1 200)` 다크): 주 버튼, 링크, 포커스 링, 체크박스, 사이드바 강조 등 "지금 할 수 있는 주 행동"에만 쓴다. 호박(CODE_LIKELY)·하늘(CHECK_EXTERNAL/RUNNING)·에메랄드(SUCCEEDED)·빨강(FAILED) 상태색과 구분되도록 hue 200(cyan과 green 사이)을 의도적으로 선택했다.

### Neutral
- **배경** (`oklch(0.97 0 0)` 라이트 / `oklch(0.145 0 0)` 다크): 페이지 바탕.
- **표면(카드/팝오버)** (`oklch(1 0 0)` 라이트 / `oklch(0.205 0 0)` 다크): 카드, 표, 드롭다운.
- **본문 텍스트** (`oklch(0.145 0 0)` 라이트 / `oklch(0.985 0 0)` 다크): 제목, 본문, 라벨.
- **보조 텍스트** (`oklch(0.45 0 0)` 라이트 / `oklch(0.72 0 0)` 다크): 메타 정보, 도움말, 타임스탬프.

### 상태 시맨틱 (Named Rules 아래 참고)
- 판정/분석 상태 배지는 브랜드 팔레트가 아닌 고정된 Tailwind 팔레트를 쓴다: 호박(CODE_LIKELY), 하늘(CHECK_EXTERNAL, RUNNING), 에메랄드(SUCCEEDED, 활성), 빨강(FAILED), 회색(NEED_MORE_INFO, QUEUED, 비활성). `components/status-badges.tsx`가 유일한 정의처다.

### Named Rules
**The One Accent Rule.** 딥 틸은 화면당 주 버튼 1~2개, 활성 상태, 포커스 링에만 나타난다. 카드·표·네비게이션 같은 큰 표면을 액센트로 채우지 않는다 — 조용함이 이 도구의 신뢰도다.

## Typography

**Body/Display Font:** Pretendard Variable (with Apple SD Gothic Neo, Malgun Gothic, sans-serif fallback)
**Mono Font:** Geist Mono (코드 조각, 파일 경로, 커밋 SHA 전용)

**Character:** 제목부터 표까지 서체 하나로 통일한다 — Operate 화면은 디스플레이/본문 페어링이 필요 없다. Pretendard의 가변 굵기로 위계를 만든다.

### Hierarchy
- **Heading** (600, 1.375rem→sm:1.5rem, line-height 1.3): 페이지 제목(`PageHeader`).
- **Section title** (600, 1rem, line-height 1.375): 카드/섹션 제목.
- **Body** (400, 0.9375rem, line-height 1.65, letter-spacing -0.01em): 본문, 필드 값. 한글은 `word-break: keep-all`로 단어 단위 줄바꿈.
- **Label** (500, 0.75rem~0.875rem, tracking-wide): 필드 라벨, 메타 라벨, 브레드크럼, 표 헤더.
- **Mono** (Geist Mono, 0.75rem): 파일 경로, 프로젝트 키, 커밋 SHA — letter-spacing 0.

### Named Rules
**The Single Face Rule.** Operate 화면에 두 번째 서체를 들이지 않는다. 코드/식별자 표시에만 Geist Mono를 쓴다.

## Layout

`pageShellClass` 기준 `mx-auto px-6 py-10 sm:px-8` 컨테이너, 폭은 용도별로 `narrow(max-w-2xl)` / `medium(max-w-3xl)` / `wide(max-w-6xl)` 세 단계만 쓴다. 세로 리듬은 `gap-8`(섹션 간) / `gap-5~6`(카드 내부) / `gap-2~3`(필드 간)로 좁아진다. 커스텀 spacing 토큰은 없고 Tailwind 기본 4px 배수 스케일을 그대로 쓴다. 헤더는 `sticky top-0`, `h-12`, `backdrop-blur-md`로 스크롤 시에도 네비게이션을 유지한다.

## Elevation & Depth

라이트 모드는 카드·표에 `shadow-xs`(아주 옅은 그림자)만 쓰고, 다크 모드는 그림자를 완전히 제거한다(`dark:shadow-none`) — 어두운 화면에서 그림자는 광원의 거짓말이라고 보고 대신 `border`와 배경 대비로 깊이를 표현한다.

### Named Rules
**The Flat-in-Dark Rule.** 다크 모드에서 그림자를 쓰지 않는다. 깊이는 `border-border`와 표면색 대비로만 표현한다.

## Shapes

기준 radius `10px`(`--radius`)에서 파생: `sm 6px`(작은 아이콘 버튼) / `md 8px`(네비 활성 링크) / `lg 10px`(버튼·인풋·셀렉트 기본) / `xl 14px`(카드·표 래퍼) / `4xl 26px`(배지 pill — `h-5` 배지를 완전히 캡슐 형태로 만든다). 테두리는 `border-border` 하나로 통일, 색상별 테두리를 쓰지 않는다.

## Components

### Buttons (`@/components/ui/button.tsx`)
- **Shape:** `rounded-lg`(10px), `h-8` 기본 / `h-7` sm / `h-9` lg.
- **Primary (`default`):** `bg-primary text-primary-foreground hover:bg-primary/80` — 화면당 1~2개만.
- **Outline:** 투명 배경 + `border-border`, hover 시 `bg-muted`. 보조 행동(원본 보기, 결과 복사, 실행 로그).
- **Ghost:** 배경 없음, hover 시만 `bg-muted`. 표 안 인라인 행동(수정, 새로 추가).
- **Destructive:** `bg-destructive/10 text-destructive hover:bg-destructive/20` — 삭제 전용, 항상 이 하나의 스타일만 쓴다(레드 리터럴을 인라인으로 다시 만들지 않는다).
- **Link:** `text-primary underline-offset-4 hover:underline`.

### Inputs / Fields (`@/components/ui/input.tsx`, `textarea.tsx`)
- **Style:** `border-input`, 투명 배경, `rounded-lg`.
- **Focus:** `border-ring` + `ring-3 ring-ring/50`(딥 틸 톤).
- **Invalid:** `aria-invalid`에서 `border-destructive` + `ring-destructive/20`.
- 체크박스는 네이티브 `accent-primary`로 틴트(직접 커스텀 체크박스를 만들지 않는다).

### Chips / Badges (`@/components/status-badges.tsx`, `@/components/ui/badge.tsx`)
- **Style:** `rounded-4xl`(pill), `h-5`, 상태별 고정 팔레트(호박/하늘/에메랄드/빨강/회색) — Colors 섹션의 상태 시맨틱 참고.
- 새 상태를 추가할 때도 이 다섯 색 팔레트 밖으로 나가지 않는다.

### Cards / Containers
- **Corner Style:** `rounded-xl`(14px).
- **Background:** `bg-card` (표면 토큰).
- **Border:** `border-border`.
- **Shadow:** Elevation 섹션 참고(라이트만 옅게, 다크는 없음).
- **Internal Padding:** `p-5`.

### Tables
- 래퍼는 카드와 동일한 `rounded-xl border-border bg-card`.
- 헤더 행: `bg-muted/50`, `text-muted-foreground`, `text-xs tracking-wide`.
- 바디 행 구분선: `border-border/60`, 마지막 행은 `border-0`.

### Navigation (`@/components/app-nav.tsx`)
- `sticky` 상단바, `border-border/80` 하단 경계, `bg-background/90 backdrop-blur-md`.
- 활성 탭: `bg-muted text-foreground rounded-md`. 비활성: `text-muted-foreground`, hover 시 `bg-muted/60`.
- 액센트 색을 네비게이션에 쓰지 않는다 — 활성 상태는 무채색 강조로만 표현한다(One Accent Rule과 일관).

## Do's and Don'ts

### Do:
- **Do** 주 행동에만 `bg-primary`(딥 틸)를 쓴다 — 화면당 1~2개.
- **Do** 삭제 행동은 항상 `<Button variant="destructive">`를 쓴다. 인라인으로 빨간 텍스트/배경을 새로 만들지 않는다.
- **Do** 새 입력 필드는 `@/components/ui/input.tsx` 또는 `textarea.tsx`를 쓴다.
- **Do** 다크 모드에서 카드·표는 그림자 없이 `border-border`로만 구분한다.

### Don't:
- **Don't** 상태 배지의 팔레트(호박/하늘/에메랄드/빨강/회색)를 브랜드 액센트나 다른 UI 요소에 재사용하지 않는다.
- **Don't** `zinc-*` 같은 리터럴 Tailwind 색 클래스를 새로 추가하지 않는다 — 항상 `bg-card`/`text-foreground`/`border-border` 같은 테마 토큰을 쓴다.
- **Don't** 버튼을 다시 손으로 만들지 않는다(`btnPrimaryClass` 같은 중복 클래스는 통합 과정에서 제거됨) — 항상 `<Button>` 컴포넌트를 쓴다.
- **Don't** 카드/표/네비게이션 같은 큰 표면을 액센트 색으로 채우지 않는다.
