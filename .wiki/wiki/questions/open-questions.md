# Open Questions

## Summary

이 page는 completed behavior로 쓰면 안 되는 durable unknown과 unimplemented area를 기록한다.

## Current state

- Real Apple Watch underwater sensor behavior는 구현되거나 검증되지 않았다. `RealDepthSensorProvider`는 placeholder이고, 현재 recording flow는 mock sample을 사용한다.
- WatchConnectivity pairing, entitlement setup, phone transport는 구현되지 않았다.
- Supabase schema, RLS policy, auth, repository, cloud backup은 구현되지 않았다.
- Mobile imported session은 React state에만 보관된다. Production persistence와 migration behavior는 결정되지 않았다.
- Generated Swift contract는 존재하지만 active watch Xcode project에서 참조되지 않는다.
- `apps/watch-ios/Sources`에는 earlier standalone Swift file이 남아 있으나 current Xcode project에서 참조되지 않는다. Future cleanup 또는 migration ownership은 결정되지 않았다.
- `apps/mobile/AGENTS.md`의 stack 설명은 별도 UI/styling framework가 없다고 쓰지만, current mobile code는 Gluestack UI v4/NativeWind stack을 사용한다. 이 guide 불일치의 정리 방식은 아직 결정되지 않았다.

## Details

위 항목을 resolved로 옮기기 전에는 관련 code를 직접 확인하고 linked architecture/domain page를 함께 update한다.

## Related pages

- [[architecture/watch-app]]
- [[architecture/mobile]]
- [[architecture/supabase]]
- [[architecture/sync-flow]]
- [[domains/safety-rules]]
