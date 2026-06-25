import type { WatchDepthSample, WatchSession, WatchSyncMessage } from '../types/dive-session';

export type WatchSyncMessageValidationError = {
  message: string;
  path: string;
};

export type WatchSyncMessageParseResult =
  | { ok: true; message: WatchSyncMessage }
  | { ok: false; error: WatchSyncMessageValidationError };

export type WatchSyncMessagesParseResult =
  | { ok: true; messages: WatchSyncMessage[] }
  | { ok: false; error: WatchSyncMessageValidationError };

const messageTypes = ['sessionCreated', 'sessionUpdated', 'sessionEnded'] as const;
const diveModes = ['scuba', 'freedive', 'snorkel', 'pool', 'unknown'] as const;
const syncStatuses = ['pending', 'synced', 'failed'] as const;
const waterConditions = ['calm', 'mild', 'choppy', 'surge', 'current', 'unknown'] as const;

const messageKeys = ['type', 'session'] as const;
const sessionKeys = [
  'localSessionId',
  'schemaVersion',
  'diveMode',
  'gasLabel',
  'siteId',
  'siteName',
  'sourcePlanLocalId',
  'planTitle',
  'buddyIds',
  'gearIds',
  'tags',
  'notes',
  'rating',
  'perceivedExertion',
  'visibilityRating',
  'waterCondition',
  'syncStatus',
  'entryLocation',
  'exitLocation',
  'startedAt',
  'endedAt',
  'maxDepthMeters',
  'averageDepthMeters',
  'waterTemperatureCelsius',
  'samples',
] as const;
const locationKeys = ['latitude', 'longitude', 'horizontalAccuracyMeters', 'capturedAt'] as const;
const sampleKeys = ['localSessionId', 'timestamp', 'depthMeters', 'pressureKPa', 'waterTemperatureCelsius'] as const;

type WatchLocation = NonNullable<WatchSession['entryLocation']>;

export function parseWatchSyncMessageJson(rawJson: string): WatchSyncMessageParseResult {
  try {
    return parseWatchSyncMessageValue(JSON.parse(rawJson) as unknown);
  } catch (error) {
    return failure('$', `Invalid watch sync JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseWatchSyncMessagesJson(rawJson: string): WatchSyncMessagesParseResult {
  try {
    return parseWatchSyncMessagesValue(JSON.parse(rawJson) as unknown);
  } catch (error) {
    return failure('$', `Invalid watch sync JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseWatchSyncMessagesValue(value: unknown): WatchSyncMessagesParseResult {
  if (!Array.isArray(value)) {
    return failure('$', 'Expected an array of watch sync messages');
  }

  const messages: WatchSyncMessage[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const result = parseWatchSyncMessageValue(value[index], `$[${index}]`);
    if (!result.ok) {
      return result;
    }
    messages.push(result.message);
  }

  return { ok: true, messages };
}

export function parseWatchSyncMessageValue(value: unknown, path = '$'): WatchSyncMessageParseResult {
  const objectResult = expectRecord(value, path);
  if (!objectResult.ok) {
    return objectResult;
  }

  const keyResult = expectAllowedKeys(objectResult.value, messageKeys, path);
  if (!keyResult.ok) {
    return keyResult;
  }

  const typeResult = readEnum(objectResult.value, 'type', messageTypes, path, { required: true });
  if (!typeResult.ok) {
    return typeResult;
  }
  if (typeResult.value === undefined) {
    return failure(joinPath(path, 'type'), `${joinPath(path, 'type')} is required`);
  }

  const sessionValue = objectResult.value.session;
  if (sessionValue === undefined) {
    return failure(joinPath(path, 'session'), 'session is required');
  }

  const sessionResult = parseWatchSession(sessionValue, joinPath(path, 'session'));
  if (!sessionResult.ok) {
    return sessionResult;
  }

  return {
    ok: true,
    message: {
      type: typeResult.value,
      session: sessionResult.value,
    },
  };
}

function parseWatchSession(value: unknown, path: string): ValidationResult<WatchSession> {
  const objectResult = expectRecord(value, path);
  if (!objectResult.ok) {
    return objectResult;
  }

  const keyResult = expectAllowedKeys(objectResult.value, sessionKeys, path);
  if (!keyResult.ok) {
    return keyResult;
  }

  const localSessionId = readString(objectResult.value, 'localSessionId', path, { required: true });
  if (!localSessionId.ok) {
    return localSessionId;
  }
  if (localSessionId.value === undefined) {
    return failure(joinPath(path, 'localSessionId'), `${joinPath(path, 'localSessionId')} is required`);
  }

  const startedAt = readNumber(objectResult.value, 'startedAt', path, { required: true });
  if (!startedAt.ok) {
    return startedAt;
  }
  if (startedAt.value === undefined) {
    return failure(joinPath(path, 'startedAt'), `${joinPath(path, 'startedAt')} is required`);
  }

  const samples = readArray(objectResult.value, 'samples', path, parseWatchDepthSample, { required: true });
  if (!samples.ok) {
    return samples;
  }
  if (samples.value === undefined) {
    return failure(joinPath(path, 'samples'), `${joinPath(path, 'samples')} is required`);
  }

  const session: WatchSession = {
    localSessionId: localSessionId.value,
    startedAt: startedAt.value,
    samples: samples.value,
  };

  const schemaVersion = readInteger(objectResult.value, 'schemaVersion', path, { min: 1 });
  if (!schemaVersion.ok) {
    return schemaVersion;
  }
  assignOptional(session, 'schemaVersion', schemaVersion.value);

  const diveMode = readEnum(objectResult.value, 'diveMode', diveModes, path);
  if (!diveMode.ok) {
    return diveMode;
  }
  assignOptional(session, 'diveMode', diveMode.value);

  for (const key of ['gasLabel', 'siteId', 'siteName', 'sourcePlanLocalId', 'planTitle', 'notes'] as const) {
    const result = readString(objectResult.value, key, path);
    if (!result.ok) {
      return result;
    }
    assignOptional(session, key, result.value);
  }

  for (const key of ['buddyIds', 'gearIds', 'tags'] as const) {
    const result = readStringArray(objectResult.value, key, path);
    if (!result.ok) {
      return result;
    }
    assignOptional(session, key, result.value);
  }

  for (const key of ['rating', 'perceivedExertion', 'visibilityRating'] as const) {
    const result = readInteger(objectResult.value, key, path, { min: 1, max: 5 });
    if (!result.ok) {
      return result;
    }
    assignOptional(session, key, result.value);
  }

  const waterCondition = readEnum(objectResult.value, 'waterCondition', waterConditions, path);
  if (!waterCondition.ok) {
    return waterCondition;
  }
  assignOptional(session, 'waterCondition', waterCondition.value);

  const syncStatus = readEnum(objectResult.value, 'syncStatus', syncStatuses, path);
  if (!syncStatus.ok) {
    return syncStatus;
  }
  assignOptional(session, 'syncStatus', syncStatus.value);

  for (const key of ['entryLocation', 'exitLocation'] as const) {
    const result = readObject(objectResult.value, key, path, parseWatchLocation);
    if (!result.ok) {
      return result;
    }
    assignOptional(session, key, result.value);
  }

  for (const key of ['endedAt', 'maxDepthMeters', 'averageDepthMeters', 'waterTemperatureCelsius'] as const) {
    const result = readNumber(objectResult.value, key, path);
    if (!result.ok) {
      return result;
    }
    assignOptional(session, key, result.value);
  }

  return { ok: true, value: session };
}

function parseWatchLocation(value: unknown, path: string): ValidationResult<WatchLocation> {
  const objectResult = expectRecord(value, path);
  if (!objectResult.ok) {
    return objectResult;
  }

  const keyResult = expectAllowedKeys(objectResult.value, locationKeys, path);
  if (!keyResult.ok) {
    return keyResult;
  }

  const latitude = readNumber(objectResult.value, 'latitude', path, { required: true });
  if (!latitude.ok) {
    return latitude;
  }
  if (latitude.value === undefined) {
    return failure(joinPath(path, 'latitude'), `${joinPath(path, 'latitude')} is required`);
  }

  const longitude = readNumber(objectResult.value, 'longitude', path, { required: true });
  if (!longitude.ok) {
    return longitude;
  }
  if (longitude.value === undefined) {
    return failure(joinPath(path, 'longitude'), `${joinPath(path, 'longitude')} is required`);
  }

  const location: WatchLocation = {
    latitude: latitude.value,
    longitude: longitude.value,
  };

  const horizontalAccuracyMeters = readNumber(objectResult.value, 'horizontalAccuracyMeters', path);
  if (!horizontalAccuracyMeters.ok) {
    return horizontalAccuracyMeters;
  }
  assignOptional(location, 'horizontalAccuracyMeters', horizontalAccuracyMeters.value);

  const capturedAt = readNumber(objectResult.value, 'capturedAt', path);
  if (!capturedAt.ok) {
    return capturedAt;
  }
  assignOptional(location, 'capturedAt', capturedAt.value);

  return { ok: true, value: location };
}

function parseWatchDepthSample(value: unknown, path: string): ValidationResult<WatchDepthSample> {
  const objectResult = expectRecord(value, path);
  if (!objectResult.ok) {
    return objectResult;
  }

  const keyResult = expectAllowedKeys(objectResult.value, sampleKeys, path);
  if (!keyResult.ok) {
    return keyResult;
  }

  const localSessionId = readString(objectResult.value, 'localSessionId', path, { required: true });
  if (!localSessionId.ok) {
    return localSessionId;
  }
  if (localSessionId.value === undefined) {
    return failure(joinPath(path, 'localSessionId'), `${joinPath(path, 'localSessionId')} is required`);
  }

  const timestamp = readNumber(objectResult.value, 'timestamp', path, { required: true });
  if (!timestamp.ok) {
    return timestamp;
  }
  if (timestamp.value === undefined) {
    return failure(joinPath(path, 'timestamp'), `${joinPath(path, 'timestamp')} is required`);
  }

  const depthMeters = readNumber(objectResult.value, 'depthMeters', path, { required: true });
  if (!depthMeters.ok) {
    return depthMeters;
  }
  if (depthMeters.value === undefined) {
    return failure(joinPath(path, 'depthMeters'), `${joinPath(path, 'depthMeters')} is required`);
  }

  const sample: WatchDepthSample = {
    localSessionId: localSessionId.value,
    timestamp: timestamp.value,
    depthMeters: depthMeters.value,
  };

  const pressureKPa = readNumber(objectResult.value, 'pressureKPa', path);
  if (!pressureKPa.ok) {
    return pressureKPa;
  }
  assignOptional(sample, 'pressureKPa', pressureKPa.value);

  const waterTemperatureCelsius = readNumber(objectResult.value, 'waterTemperatureCelsius', path);
  if (!waterTemperatureCelsius.ok) {
    return waterTemperatureCelsius;
  }
  assignOptional(sample, 'waterTemperatureCelsius', waterTemperatureCelsius.value);

  return { ok: true, value: sample };
}

type RecordValue = Record<string, unknown>;
type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: WatchSyncMessageValidationError };

function expectRecord(value: unknown, path: string): ValidationResult<RecordValue> {
  if (!isRecord(value)) {
    return failure(path, `${path} must be an object`);
  }

  return { ok: true, value };
}

function expectAllowedKeys(object: RecordValue, allowedKeys: readonly string[], path: string): ValidationResult<void> {
  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(object).find(key => !allowed.has(key));

  if (unknownKey) {
    const unknownPath = joinPath(path, unknownKey);
    return failure(unknownPath, `${unknownPath} is not allowed`);
  }

  return { ok: true, value: undefined };
}

function readString<Key extends string>(
  object: RecordValue,
  key: Key,
  path: string,
  options: { required?: boolean } = {},
): ValidationResult<string | undefined> {
  return readPrimitive(object, key, path, isString, 'string', options.required);
}

function readNumber<Key extends string>(
  object: RecordValue,
  key: Key,
  path: string,
  options: { required?: boolean } = {},
): ValidationResult<number | undefined> {
  return readPrimitive(object, key, path, isFiniteNumber, 'number', options.required);
}

function readInteger<Key extends string>(
  object: RecordValue,
  key: Key,
  path: string,
  options: { required?: boolean; min?: number; max?: number } = {},
): ValidationResult<number | undefined> {
  const result = readPrimitive(object, key, path, isIntegerNumber, 'integer', options.required);
  if (!result.ok || result.value === undefined) {
    return result;
  }

  const valuePath = joinPath(path, key);
  if (options.min !== undefined && result.value < options.min) {
    return failure(valuePath, `${valuePath} must be >= ${options.min}`);
  }
  if (options.max !== undefined && result.value > options.max) {
    return failure(valuePath, `${valuePath} must be <= ${options.max}`);
  }

  return result;
}

function readEnum<Key extends string, Value extends string>(
  object: RecordValue,
  key: Key,
  allowedValues: readonly Value[],
  path: string,
  options: { required?: boolean } = {},
): ValidationResult<Value | undefined> {
  const result = readString(object, key, path, options);
  if (!result.ok || result.value === undefined) {
    return result as ValidationResult<Value | undefined>;
  }

  if (!allowedValues.includes(result.value as Value)) {
    const valuePath = joinPath(path, key);
    return failure(valuePath, `${valuePath} must be one of ${allowedValues.join(', ')}`);
  }

  return { ok: true, value: result.value as Value };
}

function readStringArray<Key extends string>(
  object: RecordValue,
  key: Key,
  path: string,
): ValidationResult<string[] | undefined> {
  return readArray(object, key, path, (value, itemPath) => {
    if (!isString(value)) {
      return failure(itemPath, `${itemPath} must be a string`);
    }
    return { ok: true, value };
  });
}

function readObject<Key extends string, T>(
  object: RecordValue,
  key: Key,
  path: string,
  parser: (value: unknown, path: string) => ValidationResult<T>,
): ValidationResult<T | undefined> {
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    return { ok: true, value: undefined };
  }

  return parser(object[key], joinPath(path, key));
}

function readArray<Key extends string, T>(
  object: RecordValue,
  key: Key,
  path: string,
  parser: (value: unknown, path: string) => ValidationResult<T>,
  options: { required?: boolean } = {},
): ValidationResult<T[] | undefined> {
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    if (options.required) {
      const valuePath = joinPath(path, key);
      return failure(valuePath, `${valuePath} is required`);
    }
    return { ok: true, value: undefined };
  }

  const value = object[key];
  const valuePath = joinPath(path, key);
  if (!Array.isArray(value)) {
    return failure(valuePath, `${valuePath} must be an array`);
  }

  const items: T[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const itemResult = parser(value[index], `${valuePath}[${index}]`);
    if (!itemResult.ok) {
      return itemResult;
    }
    items.push(itemResult.value);
  }

  return { ok: true, value: items };
}

function readPrimitive<Key extends string, T>(
  object: RecordValue,
  key: Key,
  path: string,
  predicate: (value: unknown) => value is T,
  typeName: string,
  required = false,
): ValidationResult<T | undefined> {
  const valuePath = joinPath(path, key);
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    if (required) {
      return failure(valuePath, `${valuePath} is required`);
    }
    return { ok: true, value: undefined };
  }

  const value = object[key];
  if (!predicate(value)) {
    return failure(valuePath, `${valuePath} must be a ${typeName}`);
  }

  return { ok: true, value };
}

function assignOptional<T extends object, Key extends keyof T>(target: T, key: Key, value: T[Key] | undefined): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

function failure(path: string, message: string): { ok: false; error: WatchSyncMessageValidationError } {
  return {
    ok: false,
    error: {
      path,
      message,
    },
  };
}

function joinPath(path: string, key: string): string {
  return path === '$' ? key : `${path}.${key}`;
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIntegerNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}
