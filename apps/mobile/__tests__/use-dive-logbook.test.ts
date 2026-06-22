import { diveLogEntryToMobileSession } from '../src/states/use-dive-logbook';
import type { DiveLogEntry } from '../src/types/dive-log-entry';
import { createBlankDiveLogEntry } from '../src/utils/create-dive-log-entry';

describe('diveLogEntryToMobileSession', () => {
  it('overlays manual context onto watch-backed compatibility sessions', () => {
    const entry: DiveLogEntry = {
      localId: 'watch:session-1:1781352600',
      source: 'watch',
      syncStatus: 'synced',
      createdAt: 1781353000,
      updatedAt: 1781354000,
      manual: {
        site: { siteId: 'manual-site', name: 'Manual Reef' },
        buddyIds: ['manual-buddy'],
        gearIds: ['manual-gear'],
        tags: ['manual-tag'],
        observedMarineLife: [],
        notes: 'Manual review note.',
        rating: 5,
        measuredValues: {
          diveMode: 'scuba',
          gasLabel: 'Manual gas note',
          maxDepthMeters: 99,
          averageDepthMeters: 88,
        },
      },
      mobile: {
        mediaPlaceholders: ['manual-photo'],
      },
      watchCapture: {
        importKey: 'session-1:1781352600',
        importedAt: 1781353000,
        session: {
          localSessionId: 'session-1',
          startedAt: 1781352000,
          endedAt: 1781352600,
          siteName: 'Watch Reef',
          notes: 'Watch note',
          tags: ['watch-tag'],
          buddyIds: ['watch-buddy'],
          gearIds: ['watch-gear'],
          rating: 2,
          diveMode: 'freedive',
          gasLabel: 'Watch gas',
          maxDepthMeters: 12,
          averageDepthMeters: 7,
          samples: [],
        },
        measuredValues: {
          startedAt: 1781352000,
          endedAt: 1781352600,
          durationSeconds: 600,
          maxDepthMeters: 12,
          averageDepthMeters: 7,
        },
        samples: [],
      },
      provenance: {},
    };

    expect(diveLogEntryToMobileSession(entry)).toMatchObject({
      siteId: 'manual-site',
      siteName: 'Manual Reef',
      notes: 'Manual review note.',
      tags: ['manual-tag'],
      buddyIds: ['manual-buddy'],
      gearIds: ['manual-gear'],
      rating: 5,
      diveMode: 'scuba',
      gasLabel: 'Manual gas note',
      maxDepthMeters: 12,
      averageDepthMeters: 7,
      mediaPlaceholders: ['manual-photo'],
    });
  });

  it('derives a manual compatibility session end time from manual duration', () => {
    const entry = createBlankDiveLogEntry({
      localId: 'manual-entry-1',
      now: 1781351000,
    });

    entry.manual.measuredValues = {
      startedAt: 1781352000,
      durationSeconds: 600,
      maxDepthMeters: 12,
    };

    expect(diveLogEntryToMobileSession(entry)).toMatchObject({
      startedAt: 1781352000,
      endedAt: 1781352600,
      maxDepthMeters: 12,
    });
  });
});
