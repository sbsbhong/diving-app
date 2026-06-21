import type { WatchSession } from '../src/types/dive-session';
import { watchSessionToDiveLogEntry } from '../src/utils/watch-session-to-dive-log-entry';

describe('watchSessionToDiveLogEntry', () => {
  const baseSession: WatchSession = {
    localSessionId: 'watch-session-1',
    schemaVersion: 1,
    diveMode: 'scuba',
    gasLabel: 'Air',
    siteId: 'site-1',
    siteName: 'Moon Island',
    buddyIds: ['buddy-1'],
    gearIds: ['mask-1'],
    tags: ['training'],
    notes: 'Calm recreational review dive.',
    rating: 4,
    syncStatus: 'synced',
    startedAt: 1781352000,
    endedAt: 1781352600,
    maxDepthMeters: 12.4,
    averageDepthMeters: 7.1,
    waterTemperatureCelsius: 24.5,
    samples: [
      {
        localSessionId: 'watch-session-1',
        timestamp: 1781352000,
        depthMeters: 0,
        waterTemperatureCelsius: 25,
      },
      {
        localSessionId: 'watch-session-1',
        timestamp: 1781352300,
        depthMeters: 12.4,
        waterTemperatureCelsius: 24,
      },
    ],
  };

  it.each(['pending', 'synced', 'failed'] as const)('preserves watch sync status %s', syncStatus => {
    const entry = watchSessionToDiveLogEntry({
      session: { ...baseSession, syncStatus },
      now: 1781353000,
    });

    expect(entry.syncStatus).toBe(syncStatus);
  });

  it('maps a watch session into a watch-sourced log entry without losing the raw payload', () => {
    const entry = watchSessionToDiveLogEntry({
      session: baseSession,
      now: 1781353000,
    });

    expect(entry.localId).toBe('watch:watch-session-1:1781352600');
    expect(entry.watchCapture?.importKey).toBe('watch-session-1:1781352600');
    expect(entry.source).toBe('watch');
    expect(entry.syncStatus).toBe('synced');
    expect(entry.createdAt).toBe(1781353000);
    expect(entry.updatedAt).toBe(1781353000);
    expect(entry.watchCapture?.session).toBe(baseSession);

    expect(entry.manual).toMatchObject({
      site: { siteId: 'site-1', name: 'Moon Island' },
      buddyIds: ['buddy-1'],
      gearIds: ['mask-1'],
      tags: ['training'],
      notes: 'Calm recreational review dive.',
      rating: 4,
      measuredValues: {
        diveMode: 'scuba',
        gasLabel: 'Air',
      },
    });

    expect(entry.watchCapture?.measuredValues).toMatchObject({
      startedAt: 1781352000,
      endedAt: 1781352600,
      durationSeconds: 600,
      maxDepthMeters: 12.4,
      averageDepthMeters: 7.1,
      waterTemperatureCelsius: 24.5,
    });
    expect(entry.watchCapture?.samples).toEqual(baseSession.samples);

    expect(entry.provenance).toMatchObject({
      startedAt: 'watch',
      endedAt: 'watch',
      durationSeconds: 'watch',
      maxDepthMeters: 'watch',
      averageDepthMeters: 'watch',
      waterTemperatureCelsius: 'watch',
      depthSamples: 'watch',
      site: 'manual',
      buddyIds: 'manual',
      gearIds: 'manual',
      tags: 'manual',
      notes: 'manual',
      rating: 'manual',
      measuredValues: 'manual',
    });
  });
});
