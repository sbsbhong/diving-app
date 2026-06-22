# 안전 규칙

## 요약

이 앱은 레크리에이션 다이빙 로그 companion 앱이다. Certified dive computer, 감압 컴퓨터, 의료기기, 비상 판단 시스템, certified dive equipment replacement가 아니다.

## 현재 상태

현재 앱 화면은 dive log 기록과 확인, 과거 기록 요약, watch에서 기록한 activity data import, 비중요 계획 알림과 Planbook 작성을 제공할 수 있다. Sensor data, 계획값, derived summary를 안전 판단의 근거처럼 표시하면 안 된다.

## 상세

이 앱을 다음처럼 설명하지 않는다.

- 감압 의무 계산
- 조직 loading 계산
- gas switching safety decision 제공
- life-critical underwater instruction 제공
- certified dive computer 또는 certified dive equipment 대체
- medical, legal, emergency recommendation 제공
- 검증되지 않은 Apple Watch sensor data를 authoritative safety data로 취급

허용되는 설명 방식은 다음과 같다.

- recreational dive logging
- companion recording
- post-dive review
- historical summary
- watch-captured activity sync
- non-certified planning reminder
- non-certified ascent/safety-stop assistant status

현재 watch/mobile 화면은 ascent, safety stop, surface interval, no-fly concept을 assistant, 확인 상태, 수동 계획 알림으로만 언급한다. Planbook의 planned max depth, planned duration, water condition, visibility expectation 같은 값은 사용자의 의도와 준비 메모이지 실제 측정값이나 안전 계산 결과가 아니다. 이 경계는 UI copy와 documentation에서 명시적으로 유지해야 한다.

실제 underwater Apple Watch sensor behavior는 공개 배포 전에 지원되는 hardware에서 수동 검증해야 한다. Simulator나 mock sensor behavior는 실제 underwater correctness의 증거가 아니다.

Decompression planning, air integration, tank pressure, emergency decision, certified dive-computer behavior는 별도 high-risk work다. 구현 전 명시적인 제품, 검증, 책임 범위 결정이 필요하다.

## 관련 문서

- [[overview]]
- [[architecture/watch-app]]
- [[architecture/mobile]]
- [[domains/dive-planning]]
- [[domains/dive-log]]
- [[questions/open-questions]]
