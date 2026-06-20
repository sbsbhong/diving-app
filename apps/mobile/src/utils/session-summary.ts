import type { DiveSessionSummary, WatchDepthSample, WatchSession } from '../types/dive-session';

export const getSessionImportKey = (session: Pick<WatchSession, 'localSessionId' | 'endedAt'>) => {
  return `${session.localSessionId}:${session.endedAt ?? 'open'}`;
};

export const summarizeSession = (session: WatchSession): DiveSessionSummary => {
  const sampleCount = session.samples.length;
  const maxDepthMeters = session.maxDepthMeters ?? maxDepth(session.samples);
  const averageDepthMeters = session.averageDepthMeters ?? averageDepth(session.samples);
  const waterTemperatureCelsius = session.waterTemperatureCelsius ?? averageTemperature(session.samples);
  const durationSeconds = session.endedAt ? Math.max(0, session.endedAt - session.startedAt) : 0;

  return {
    durationSeconds,
    maxDepthMeters,
    averageDepthMeters,
    waterTemperatureCelsius,
    sampleCount,
  };
};

const maxDepth = (samples: WatchDepthSample[]) => {
  return samples.reduce((maxValue, sample) => Math.max(maxValue, sample.depthMeters), 0);
};

const averageDepth = (samples: WatchDepthSample[]) => {
  if (samples.length === 0) {
    return 0;
  }

  return samples.reduce((sum, sample) => sum + sample.depthMeters, 0) / samples.length;
};

const averageTemperature = (samples: WatchDepthSample[]) => {
  const temperatures = samples
    .map(sample => sample.waterTemperatureCelsius)
    .filter((value): value is number => value !== undefined);

  if (temperatures.length === 0) {
    return undefined;
  }

  return temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length;
};

