# Safety Rules

## Summary

이 app은 recreational dive logging companion app이다. Certified dive computer, decompression computer, medical device, emergency system, certified dive equipment replacement가 아니다.

## Current state

현재 app surface는 dive log 기록과 review, historical summary display, watch-captured activity data import, non-critical planning reminder를 제공할 수 있다. Sensor data나 derived summary를 safety-critical truth로 표시하면 안 된다.

## Details

이 app을 다음처럼 설명하지 않는다.

- decompression obligation 계산
- tissue loading 계산
- gas switching safety decision 제공
- life-critical underwater instruction 제공
- certified dive computer 또는 certified dive equipment 대체
- medical, legal, emergency recommendation 제공
- 검증되지 않은 Apple Watch sensor data를 authoritative safety data로 취급

허용되는 framing은 다음과 같다.

- recreational dive logging
- companion recording
- post-dive review
- historical summary
- watch-captured activity sync
- non-certified planning reminder
- non-certified ascent/safety-stop assistant status

현재 watch/mobile surface는 ascent, safety stop, surface interval, no-fly concept을 assistant, review state, manual planning reminder로만 언급한다. 이 boundary는 UI copy와 documentation에서 명시적으로 유지해야 한다.

Real underwater Apple Watch sensor behavior는 public release 전에 supported hardware에서 manual validation해야 한다. Simulator나 mock sensor behavior는 real underwater correctness의 증거가 아니다.

Decompression planning, air integration, tank pressure, emergency decision, certified dive-computer behavior는 별도 high-risk work다. 구현 전 explicit product, validation, liability decision이 필요하다.

## Related pages

- [[overview]]
- [[architecture/watch-app]]
- [[architecture/mobile]]
- [[domains/dive-log]]
- [[questions/open-questions]]
