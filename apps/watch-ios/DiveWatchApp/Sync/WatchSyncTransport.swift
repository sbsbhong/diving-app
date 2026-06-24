import Foundation
import WatchConnectivity

protocol WatchSyncTransporting {
    func activate()
    func enqueue(session: DiveSession) -> DiveSyncStatus
}

final class WatchSyncTransport: NSObject, WatchSyncTransporting, WCSessionDelegate {
    private let connectivitySession: WCSession?

    override init() {
        connectivitySession = WCSession.isSupported() ? WCSession.default : nil
        super.init()
        connectivitySession?.delegate = self
    }

    func activate() {
        connectivitySession?.activate()
    }

    func enqueue(session diveSession: DiveSession) -> DiveSyncStatus {
        guard let connectivitySession else {
            return .pending
        }

        do {
            let userInfo = try WatchSyncEnvelope.userInfo(for: diveSession)
            connectivitySession.transferUserInfo(userInfo)
            return .pending
        } catch {
            return .failed
        }
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {}
}
