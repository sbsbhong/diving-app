# Dive App Wiki

## 요약

이 wiki는 `diving-app` monorepo에서 오래 유지해야 할 프로젝트 지식을 기록한다. 현재 구조, 앱 경계, 동기화 계약, 안전 규칙, 열린 질문을 구현된 사실과 계획이 섞이지 않게 정리하는 것이 목적이다.

## 현재 상태

- [[overview]]는 프로젝트 수준의 현재 모습을 담는다.
- [[architecture/monorepo]]는 workspace 구조, package 책임, root command를 설명한다.
- [[architecture/mobile]]은 React Native 모바일 앱의 현재 구조를 설명한다.
- [[architecture/mobile-logbook-roadmap]]은 local-first 모바일 로그북과 future Supabase sync의 승인된 구현 순서를 기록한다.
- [[architecture/watch-app]]은 현재 동작하는 watchOS 앱과 Xcode project 상태를 설명한다.
- [[architecture/sync-flow]]는 watch-to-mobile 동기화 계약과 import 흐름을 설명한다.
- [[architecture/supabase]]는 현재 Supabase가 없다는 사실과 향후 경계를 기록한다.
- [[domains/dive-log]]는 현재 dive log 데이터 모델을 정리한다.
- [[domains/dive-planning]]은 모바일 Planbook의 계획값, 로그 전환, 안전 경계를 정리한다.
- [[domains/diving-glossary]]는 앱에서 오래 유지할 다이빙 용어를 정의한다.
- [[domains/safety-rules]]는 제품 안전 경계를 기록한다.
- [[design/mobile-watch-ui-language]]는 모바일과 watchOS에 적용할 공통 UI look and feel을 기록한다.
- [[decisions/adr-index]]는 승인된 ADR 목록 역할을 한다.
- [[questions/open-questions]]는 구현되지 않았거나 불확실한 영역을 추적한다.
- [[log]]는 wiki 수정 이력을 기록한다.

## 상세

wiki를 수정할 때는 명시적인 사용자 지시와 현재 코드를 우선 근거로 삼는다. 구조, 계약, 앱 경계, 동기화 동작, Supabase 동작, domain 의미, 안전 문구가 바뀌면 가장 작은 관련 문서만 수정하고 [[log]]에 사실 중심 기록을 추가한다.

## 관련 문서

- [[overview]]
- [[architecture/monorepo]]
- [[domains/dive-planning]]
- [[domains/safety-rules]]
- [[design/mobile-watch-ui-language]]
