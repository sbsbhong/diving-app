import Foundation
import WatchConnectivity

extension Notification.Name {
  static let diveWatchSyncPayloadReceived = Notification.Name("DiveWatchSyncPayloadReceived")
}

final class WatchConnectivityInbox: NSObject, WCSessionDelegate {
  static let shared = WatchConnectivityInbox()

  private let connectivitySession: WCSession?
  private var isActivated = false
  private var pendingPayloads: [[String: Any]] = []

  private override init() {
    connectivitySession = WCSession.isSupported() ? WCSession.default : nil
    super.init()
    connectivitySession?.delegate = self
  }

  func activate() {
    guard !isActivated else {
      return
    }

    isActivated = true
    connectivitySession?.activate()
  }

  func drainPendingPayloads() -> [[String: Any]] {
    if Thread.isMainThread {
      return drainPendingPayloadsOnMainQueue()
    }

    return DispatchQueue.main.sync {
      drainPendingPayloadsOnMainQueue()
    }
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {}

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    guard let payload = makePayload(from: userInfo) else {
      return
    }

    DispatchQueue.main.async {
      self.pendingPayloads.append(payload)
      NotificationCenter.default.post(name: .diveWatchSyncPayloadReceived, object: self, userInfo: payload)
    }
  }

  private func makePayload(from userInfo: [String: Any]) -> [String: Any]? {
    guard userInfo[WatchConnectivityEnvelopeKey.kind] as? String == WatchConnectivityEnvelopeValue.kind,
          let payloadBase64 = userInfo[WatchConnectivityEnvelopeKey.payloadBase64] as? String,
          let payloadData = Data(base64Encoded: payloadBase64),
          let payloadJson = String(data: payloadData, encoding: .utf8) else {
      return nil
    }

    var payload: [String: Any] = [
      "payloadJson": payloadJson,
      "receivedAt": Date().timeIntervalSince1970
    ]

    if let localSessionId = userInfo[WatchConnectivityEnvelopeKey.localSessionId] as? String {
      payload["localSessionId"] = localSessionId
    }

    return payload
  }

  private func drainPendingPayloadsOnMainQueue() -> [[String: Any]] {
    let payloads = pendingPayloads
    pendingPayloads.removeAll()
    return payloads
  }
}

private enum WatchConnectivityEnvelopeKey {
  static let kind = "kind"
  static let payloadBase64 = "payloadBase64"
  static let localSessionId = "localSessionId"
}

private enum WatchConnectivityEnvelopeValue {
  static let kind = "watchSyncMessage"
}
