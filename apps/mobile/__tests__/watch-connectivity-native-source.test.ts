const readRepoFile = (path: string) => {
  const nodeRequire = require as (moduleName: string) => {
    readFileSync: (filePath: string, encoding: 'utf8') => string;
  };
  const fs = nodeRequire('fs');
  const cwd = (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();

  return fs.readFileSync(`${cwd}/../../${path}`, 'utf8');
};

describe('WatchConnectivity native source contract', () => {
  it('keeps received mobile payloads in a durable inbox until JS acknowledges them', () => {
    const inbox = readRepoFile('apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift');
    const module = readRepoFile('apps/mobile/ios/DiveMobile/WatchConnectivityModule.swift');
    const bridge = readRepoFile('apps/mobile/ios/DiveMobile/WatchConnectivityModuleBridge.m');

    expect(inbox).toContain('struct PendingWatchConnectivityPayload');
    expect(inbox).toContain('UserDefaults');
    expect(inbox).toContain('payloadId');
    expect(inbox).toContain('func acknowledge(payloadIds: [String])');
    expect(inbox).toContain('func acknowledgeImported(payloadIds: [String])');
    expect(inbox).toContain('didReceiveMessage message');
    expect(inbox).toContain('enqueuePendingPayload(from: message)');
    expect(inbox).toContain('sendMessage(acknowledgement');
    expect(inbox).toContain('watchSyncAcknowledgement');
    expect(module).toContain('@objc(acknowledgePayloads:resolver:rejecter:)');
    expect(module).toContain('@objc(acknowledgeImportedPayloads:resolver:rejecter:)');
    expect(bridge).toContain('acknowledgePayloads');
    expect(bridge).toContain('acknowledgeImportedPayloads');
  });

  it('updates saved watch session sync status when WatchConnectivity finishes a transfer', () => {
    const transport = readRepoFile('apps/mobile/ios/DiveWatchApp/Sync/WatchSyncTransport.swift');
    const envelope = readRepoFile('apps/mobile/ios/DiveWatchApp/Sync/WatchSyncEnvelope.swift');
    const store = readRepoFile('apps/mobile/ios/DiveWatchApp/Storage/DiveSessionStore.swift');

    expect(transport).toContain('onTransferStatusChanged');
    expect(transport).toContain('sendMessage(userInfo');
    expect(transport).toContain('connectivitySession.isReachable');
    expect(transport).toContain('sessionReachabilityDidChange');
    expect(transport).toContain('didFinish userInfoTransfer');
    expect(transport).toContain('didReceiveUserInfo userInfo');
    expect(transport).toContain('didReceiveMessage message');
    expect(transport).toContain('handleAcknowledgement(userInfo: message)');
    expect(envelope).toContain('watchSyncAcknowledgement');
    expect(transport).toContain('acknowledgementKind');
    expect(store).toContain('updateSyncStatus');
    expect(store).toContain('onTransferStatusChanged');
    expect(store).toContain('syncStatus == .failed && sessions[index].syncStatus == .synced');
  });

  it('re-enqueues unsynced watch sessions after loading persisted sessions', () => {
    const store = readRepoFile('apps/mobile/ios/DiveWatchApp/Storage/DiveSessionStore.swift');
    const transport = readRepoFile('apps/mobile/ios/DiveWatchApp/Sync/WatchSyncTransport.swift');

    expect(store).toContain('onActivationCompleted');
    expect(store).toContain('self?.retryPendingSyncs()');
    expect(store).toContain('retryPendingSyncs');
    expect(store).toContain('session.syncStatus != .synced');
    expect(store).toContain('syncTransport.enqueue(session: session)');
    expect(transport).toContain('onActivationCompleted');
    expect(transport).toContain('activationState == .activated');
  });

  it('embeds the watch companion inside the iPhone app bundle', () => {
    const project = readRepoFile('apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj');

    expect(project).toContain('name = "Embed Watch Content";');
    expect(project).toContain('dstPath = "$(CONTENTS_FOLDER_PATH)/Watch";');
  });
});
