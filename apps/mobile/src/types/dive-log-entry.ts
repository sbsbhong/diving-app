import type { WatchDepthSample, WatchSession } from './dive-session';

export type DiveLogSource = 'manual' | 'watch';
export type DiveFieldSource = 'manual' | 'mobile' | 'watch';
export type DiveLogSyncStatus = 'localOnly' | 'pending' | 'synced' | 'failed';

export type DiveLogSite = {
  siteId?: string;
  name?: string;
};

export type DiveLogManualMeasuredValues = {
  startedAt?: number;
  endedAt?: number;
  durationSeconds?: number;
  maxDepthMeters?: number;
  averageDepthMeters?: number;
  waterTemperatureCelsius?: number;
  diveMode?: WatchSession['diveMode'];
  gasLabel?: string;
  perceivedExertion?: number;
  visibilityRating?: number;
  waterCondition?: WatchSession['waterCondition'];
};

export type DiveLogManualFields = {
  site: DiveLogSite;
  buddyIds: string[];
  gearIds: string[];
  tags: string[];
  observedMarineLife: string[];
  notes?: string;
  rating?: number;
  measuredValues: DiveLogManualMeasuredValues;
};

export type DiveLogMobileFields = {
  mediaPlaceholders: string[];
};

export type DiveLogWatchMeasuredValues = {
  startedAt: number;
  endedAt?: number;
  durationSeconds: number;
  maxDepthMeters: number;
  averageDepthMeters: number;
  waterTemperatureCelsius?: number;
};

export type DiveLogWatchCapture = {
  importKey: string;
  importedAt: number;
  session: WatchSession;
  measuredValues: DiveLogWatchMeasuredValues;
  samples: WatchDepthSample[];
};

export type DiveLogFieldProvenance = Partial<
  Record<
    | 'site'
    | 'buddyIds'
    | 'gearIds'
    | 'tags'
    | 'observedMarineLife'
    | 'notes'
    | 'rating'
    | 'measuredValues'
    | 'mediaPlaceholders'
    | 'startedAt'
    | 'endedAt'
    | 'durationSeconds'
    | 'maxDepthMeters'
    | 'averageDepthMeters'
    | 'waterTemperatureCelsius'
    | 'depthSamples',
    DiveFieldSource
  >
>;

export type DiveLogEntry = {
  localId: string;
  remoteId?: string;
  ownerUserId?: string;
  source: DiveLogSource;
  syncStatus: DiveLogSyncStatus;
  createdAt: number;
  updatedAt: number;
  manual: DiveLogManualFields;
  mobile: DiveLogMobileFields;
  watchCapture?: DiveLogWatchCapture;
  provenance: DiveLogFieldProvenance;
};
