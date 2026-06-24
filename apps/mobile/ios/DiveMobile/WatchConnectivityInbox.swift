import Foundation
import WatchConnectivity

extension Notification.Name {
  static let diveWatchSyncPayloadReceived = Notification.Name("DiveWatchSyncPayloadReceived")
}

final class WatchConnectivityInbox: NSObject, WCSessionDelegate {
  static let shared = WatchConnectivityInbox()

  private static let storageKey = "watchConnectivityPendingPayloads"

  private let connectivitySession: WCSession?
  private let userDefaults: UserDefaults
  private var isActivated = false
  private var pendingPayloads: [PendingWatchConnectivityPayload] = []

  private override init() {
    connectivitySession = WCSession.isSupported() ? WCSession.default : nil
    userDefaults = .standard
    super.init()
    pendingPayloads = Self.loadPendingPayloads(from: userDefaults)
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

  func acknowledge(payloadIds: [String]) {
    if Thread.isMainThread {
      acknowledgeOnMainQueue(payloadIds: payloadIds)
      return
    }

    DispatchQueue.main.sync {
      acknowledgeOnMainQueue(payloadIds: payloadIds)
    }
  }

  func acknowledgeImported(payloadIds: [String]) {
    if Thread.isMainThread {
      acknowledgeImportedOnMainQueue(payloadIds: payloadIds)
      return
    }

    DispatchQueue.main.sync {
      acknowledgeImportedOnMainQueue(payloadIds: payloadIds)
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
    enqueuePendingPayload(from: userInfo)
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    enqueuePendingPayload(from: message)
  }

  private func enqueuePendingPayload(from userInfo: [String: Any]) {
    guard let payload = makePendingPayload(from: userInfo) else {
      return
    }

    DispatchQueue.main.async {
      self.pendingPayloads.append(payload)
      self.persistPendingPayloads()
      NotificationCenter.default.post(name: .diveWatchSyncPayloadReceived, object: self, userInfo: payload.dictionary)
    }
  }

  private func makePendingPayload(from userInfo: [String: Any]) -> PendingWatchConnectivityPayload? {
    guard userInfo[WatchConnectivityEnvelopeKey.kind] as? String == WatchConnectivityEnvelopeValue.kind,
          let payloadBase64 = userInfo[WatchConnectivityEnvelopeKey.payloadBase64] as? String,
          let payloadData = Data(base64Encoded: payloadBase64),
          let payloadJson = String(data: payloadData, encoding: .utf8) else {
      return nil
    }

    return PendingWatchConnectivityPayload(
      payloadId: UUID().uuidString,
      payloadJson: payloadJson,
      localSessionId: userInfo[WatchConnectivityEnvelopeKey.localSessionId] as? String,
      receivedAt: Date().timeIntervalSince1970
    )
  }

  private func drainPendingPayloadsOnMainQueue() -> [[String: Any]] {
    pendingPayloads.map(\.dictionary)
  }

  private func acknowledgeOnMainQueue(payloadIds: [String]) {
    let payloadIdSet = Set(payloadIds)
    guard !payloadIdSet.isEmpty else {
      return
    }

    pendingPayloads.removeAll { payloadIdSet.contains($0.payloadId) }
    persistPendingPayloads()
  }

  private func acknowledgeImportedOnMainQueue(payloadIds: [String]) {
    let payloadIdSet = Set(payloadIds)
    guard !payloadIdSet.isEmpty else {
      return
    }

    let localSessionIds = pendingPayloads
      .filter { payloadIdSet.contains($0.payloadId) }
      .compactMap(\.localSessionId)

    enqueueImportAcknowledgements(localSessionIds: localSessionIds)
    acknowledgeOnMainQueue(payloadIds: payloadIds)
  }

  private func enqueueImportAcknowledgements(localSessionIds: [String]) {
    guard let connectivitySession else {
      return
    }

    let acknowledgedAt = Date().timeIntervalSince1970
    for localSessionId in Set(localSessionIds) {
      let acknowledgement: [String: Any] = [
        WatchConnectivityEnvelopeKey.kind: WatchConnectivityEnvelopeValue.acknowledgementKind,
        WatchConnectivityEnvelopeKey.localSessionId: localSessionId,
        WatchConnectivityEnvelopeKey.acknowledgedAt: acknowledgedAt
      ]

      if connectivitySession.isReachable {
        connectivitySession.sendMessage(acknowledgement, replyHandler: nil) { _ in }
      }
      connectivitySession.transferUserInfo(acknowledgement)
    }
  }

  private func persistPendingPayloads() {
    do {
      let data = try JSONEncoder().encode(pendingPayloads)
      userDefaults.set(data, forKey: Self.storageKey)
    } catch {
      assertionFailure("Failed to persist watch connectivity payloads: \(error)")
    }
  }

  private static func loadPendingPayloads(from userDefaults: UserDefaults) -> [PendingWatchConnectivityPayload] {
    guard let data = userDefaults.data(forKey: storageKey) else {
      return []
    }

    do {
      return try JSONDecoder().decode([PendingWatchConnectivityPayload].self, from: data)
    } catch {
      userDefaults.removeObject(forKey: storageKey)
      return []
    }
  }
}

private struct PendingWatchConnectivityPayload: Codable {
  let payloadId: String
  let payloadJson: String
  let localSessionId: String?
  let receivedAt: TimeInterval

  var dictionary: [String: Any] {
    var payload: [String: Any] = [
      "payloadId": payloadId,
      "payloadJson": payloadJson,
      "receivedAt": receivedAt
    ]

    if let localSessionId {
      payload["localSessionId"] = localSessionId
    }

    return payload
  }
}

private enum WatchConnectivityEnvelopeKey {
  static let kind = "kind"
  static let payloadBase64 = "payloadBase64"
  static let localSessionId = "localSessionId"
  static let acknowledgedAt = "acknowledgedAt"
}

private enum WatchConnectivityEnvelopeValue {
  static let kind = "watchSyncMessage"
  static let acknowledgementKind = "watchSyncAcknowledgement"
}
