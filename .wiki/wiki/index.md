# Dive App Wiki

## Summary

이 wiki는 `diving-app` monorepo의 durable project knowledge를 기록한다. 현재 architecture, app boundary, sync contract, safety rule, open question을 구현된 사실과 계획이 섞이지 않게 정리하는 것이 목적이다.

## Current state

- [[overview]]는 project-level snapshot을 담는다.
- [[architecture/monorepo]]는 workspace layout, package responsibility, root command를 설명한다.
- [[architecture/mobile]]은 React Native mobile app의 현재 구조를 설명한다.
- [[architecture/watch-app]]은 active watchOS app과 Xcode project 상태를 설명한다.
- [[architecture/sync-flow]]는 watch-to-mobile contract와 import flow를 설명한다.
- [[architecture/supabase]]는 현재 Supabase 부재와 future boundary를 기록한다.
- [[domains/dive-log]]는 현재 dive log data model을 정리한다.
- [[domains/diving-glossary]]는 앱에서 쓰는 durable diving term을 정의한다.
- [[domains/safety-rules]]는 product safety boundary를 기록한다.
- [[decisions/adr-index]]는 accepted ADR이 생기면 index 역할을 한다.
- [[questions/open-questions]]는 구현되지 않았거나 불확실한 영역을 추적한다.
- [[log]]는 wiki update history를 기록한다.

## Details

wiki update는 explicit user instruction과 current code를 우선 source로 삼는다. Architecture, contract, app boundary, sync behavior, Supabase behavior, domain meaning, safety language가 바뀌면 가장 작은 관련 page만 수정하고 [[log]]에 factual entry를 추가한다.

## Related pages

- [[overview]]
- [[architecture/monorepo]]
- [[domains/safety-rules]]
