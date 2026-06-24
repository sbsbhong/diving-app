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
        syncTransport.activate()
    }

    func save(_ session: DiveSession) {
        let syncStatus = syncTransport.enqueue(session: session)
        sessions.insert(session.withSyncStatus(syncStatus), at: 0)
        persist()
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
