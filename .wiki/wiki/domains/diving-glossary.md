# Diving Glossary

## Summary

이 glossary는 current app에서 쓰는 durable domain term을 정의한다. 정의 범위는 recreational logging과 review이며, certified dive-computer behavior가 아니다.

## Current state

App은 watch capture, mobile review, planning reminder, sync contract에서 아래 term을 사용한다.

## Details

- Dive log: recreational dive session의 historical record.
- Watch capture: watch에서 기록한 session data. 현재 app에서는 mock depth sample 기반 flow가 active다.
- Depth sample: meter 단위 depth와 timestamp를 가진 measurement. Shared contract에서는 optional pressure와 water temperature를 포함할 수 있다.
- Bottom time: review용 elapsed session duration. Decompression calculation이 아니다.
- Max depth: session에서 기록된 가장 깊은 depth sample.
- Average depth: recorded depth sample의 arithmetic average.
- Water temperature: sample에 붙거나 review summary로 계산되는 temperature value.
- Ascent-rate reminder: depth sample 변화에서 파생되는 non-certified assistant state.
- Safety-stop assistant: shallow-depth stop window 주변의 non-certified reminder state. Mandatory safety guidance가 아니다.
- Surface interval: 이전 logged dive 이후 elapsed time. Planning context로만 사용한다.
- No-fly reminder: manual planning reminder. Medical 또는 certified aviation/diving recommendation이 아니다.
- Sync status: session이 `pending`, `synced`, `failed` 중 어디에 있는지 나타내는 local state.
- Dive mode: `scuba`, `freedive`, `snorkel`, `pool`, `unknown` 같은 session category.
- Water condition: `calm`, `mild`, `choppy`, `surge`, `current`, `unknown` 같은 subjective post-dive condition.

## Related pages

- [[domains/dive-log]]
- [[domains/safety-rules]]
- [[architecture/sync-flow]]
