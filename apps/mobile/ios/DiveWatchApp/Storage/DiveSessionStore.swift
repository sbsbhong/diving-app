import Combine
import Foundation

@MainActor
final class DiveSessionStore: ObservableObject {
    @Published private(set) var sessions: [DiveSession] = []

    private let storageKey = "savedDiveSessions"
    private let syncTransport: WatchSyncTransporting
    private let userDefaults: UserDefaults

    init(userDefaults: UserDefaults = .standard, syncTransport: WatchSyncTransporting = WatchSyncTransport()) {
        self.userDefaults = userDefaults
        self.syncTransport = syncTransport
        load()
        self.syncTransport.onTransferStatusChanged = { [weak self] sessionId, syncStatus in
            Task { @MainActor in
                self?.updateSyncStatus(for: sessionId, to: syncStatus)
            }
        }
        self.syncTransport.onActivationCompleted = { [weak self] in
            Task { @MainActor in
                self?.retryPendingSyncs()
            }
        }
        syncTransport.activate()
    }

    func save(_ session: DiveSession) {
        let syncStatus = syncTransport.enqueue(session: session)
        sessions.insert(session.withSyncStatus(syncStatus), at: 0)
        persist()
    }

    private func updateSyncStatus(for sessionId: UUID, to syncStatus: DiveSyncStatus) {
        guard let index = sessions.firstIndex(where: { $0.id == sessionId }) else {
            return
        }

        guard !(syncStatus == .failed && sessions[index].syncStatus == .synced) else {
            return
        }

        sessions[index] = sessions[index].withSyncStatus(syncStatus)
        persist()
    }

    private func retryPendingSyncs() {
        var didUpdate = false

        for index in sessions.indices {
            let session = sessions[index]
            guard session.syncStatus != .synced else {
                continue
            }

            let syncStatus = syncTransport.enqueue(session: session)
            if syncStatus != session.syncStatus {
                sessions[index] = session.withSyncStatus(syncStatus)
                didUpdate = true
            }
        }

        if didUpdate {
            persist()
        }
    }

    private func load() {
        guard let data = userDefaults.data(forKey: storageKey) else {
            sessions = []
            return
        }

        do {
            sessions = try JSONDecoder().decode([DiveSession].self, from: data)
                .sorted { $0.startedAt > $1.startedAt }
        } catch {
            sessions = []
            userDefaults.removeObject(forKey: storageKey)
        }
    }

    private func persist() {
        do {
            let data = try JSONEncoder().encode(sessions)
            userDefaults.set(data, forKey: storageKey)
        } catch {
            assertionFailure("Failed to save dive sessions: \(error)")
        }
    }
}
