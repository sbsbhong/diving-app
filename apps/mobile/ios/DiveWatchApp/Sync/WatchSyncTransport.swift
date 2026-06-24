import Foundation
import WatchConnectivity

protocol WatchSyncTransporting: AnyObject {
    var onTransferStatusChanged: ((UUID, DiveSyncStatus) -> Void)? { get set }
    var onActivationCompleted: (() -> Void)? { get set }

    func activate()
    func enqueue(session: DiveSession) -> DiveSyncStatus
}

final class WatchSyncTransport: NSObject, WatchSyncTransporting, WCSessionDelegate {
    var onTransferStatusChanged: ((UUID, DiveSyncStatus) -> Void)?
    var onActivationCompleted: (() -> Void)?

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
            return .failed
        }

        do {
            let userInfo = try WatchSyncEnvelope.userInfo(for: diveSession)
            if connectivitySession.isReachable {
                connectivitySession.sendMessage(userInfo, replyHandler: nil) { _ in }
            }
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
    ) {
        guard error == nil, activationState == .activated else {
            return
        }

        notifyReadyToRetry()
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        guard session.isReachable else {
            return
        }

        notifyReadyToRetry()
    }

    private func notifyReadyToRetry() {
        DispatchQueue.main.async { [weak self] in
            self?.onActivationCompleted?()
        }
    }

    func session(
        _ session: WCSession,
        didFinish userInfoTransfer: WCSessionUserInfoTransfer,
        error: Error?
    ) {
        guard error != nil else {
            return
        }

        guard
            let localSessionId = userInfoTransfer.userInfo[WatchSyncEnvelope.localSessionIdKey] as? String,
            let sessionId = UUID(uuidString: localSessionId)
        else {
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.onTransferStatusChanged?(sessionId, .failed)
        }
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleAcknowledgement(userInfo: userInfo)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleAcknowledgement(userInfo: message)
    }

    private func handleAcknowledgement(userInfo: [String: Any]) {
        guard userInfo[WatchSyncEnvelope.kindKey] as? String == WatchSyncEnvelope.acknowledgementKind,
              let localSessionId = userInfo[WatchSyncEnvelope.localSessionIdKey] as? String,
              let sessionId = UUID(uuidString: localSessionId) else {
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.onTransferStatusChanged?(sessionId, .synced)
        }
    }
}
