import metadataRichFixture from '../../../../packages/contracts/fixtures/metadata-rich-watch-sync-message.json';
import type { WatchSyncMessage } from '../types/dive-session';
import { parseWatchSyncMessagesValue } from './watch-sync-message-validation';

const fixtureParseResult = parseWatchSyncMessagesValue([metadataRichFixture]);

if (!fixtureParseResult.ok) {
  throw new Error(`Invalid watch fixture payload: ${fixtureParseResult.error.message}`);
}

export const watchFixtureMessages: WatchSyncMessage[] = fixtureParseResult.messages;
