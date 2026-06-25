import Foundation
import WatchConnectivity

extension Notification.Name {
  static let diveWatchSyncPayloadReceived = Notification.Name("DiveWatchSyncPayloadReceived")
}

final class WatchConnectivityInbox: NSObject, WCSessionDelegate {
  static let shared = WatchConnectivityInbox()

  private static let storageKey = "watchConnectivityPendingPayloads"
  private static let plannedDivesContextStorageKey = "watchConnectivityLatestPlannedDivesJson"

  private let connectivitySession: WCSession?
  private let userDefaults: UserDefaults
  private var isActivated = false
  private var pendingPayloads: [PendingWatchConnectivityPayload] = []
  private var pendingPlannedDivesJson: String?

  private override init() {
    connectivitySession = WCSession.isSupported() ? WCSession.default : nil
    userDefaults = .standard
    super.init()
    pendingPayloads = Self.loadPendingPayloads(from: userDefaults)
    pendingPlannedDivesJson = userDefaults.string(forKey: Self.plannedDivesContextStorageKey)
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

  func updatePlannedDives(json plannedDivesJson: String) {
    if Thread.isMainThread {
      updatePlannedDivesOnMainQueue(json: plannedDivesJson)
      return
    }

    DispatchQueue.main.sync {
      updatePlannedDivesOnMainQueue(json: plannedDivesJson)
    }
  }

  func linkedWatchInfo() -> [String: Any] {
    if Thread.isMainThread {
      return linkedWatchInfoOnMainQueue()
    }

    return DispatchQueue.main.sync {
      linkedWatchInfoOnMainQueue()
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

    DispatchQueue.main.async { [weak self] in
      self?.flushPendingPlannedDivesContextOnMainQueue()
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    guard session.isReachable else {
      return
    }

    DispatchQueue.main.async { [weak self] in
      self?.flushPendingPlannedDivesContextOnMainQueue()
    }
  }

  func sessionWatchStateDidChange(_ session: WCSession) {
    DispatchQueue.main.async { [weak self] in
      self?.flushPendingPlannedDivesContextOnMainQueue()
    }
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

  private func updatePlannedDivesOnMainQueue(json plannedDivesJson: String) {
    pendingPlannedDivesJson = plannedDivesJson
    userDefaults.set(plannedDivesJson, forKey: Self.plannedDivesContextStorageKey)
    flushPendingPlannedDivesContextOnMainQueue()
  }

  private func flushPendingPlannedDivesContextOnMainQueue() {
    guard let connectivitySession,
          connectivitySession.activationState == .activated,
          let plannedDivesJson = pendingPlannedDivesJson else {
      return
    }

    let context: [String: Any] = [
      WatchConnectivityEnvelopeKey.kind: WatchConnectivityEnvelopeValue.plannedDivesKind,
      WatchConnectivityEnvelopeKey.plannedDivesJson: plannedDivesJson,
      WatchConnectivityEnvelopeKey.updatedAt: Date().timeIntervalSince1970
    ]

    if connectivitySession.isReachable {
      connectivitySession.sendMessage(context, replyHandler: nil) { _ in }
    }
    connectivitySession.transferUserInfo(context)

    do {
      try connectivitySession.updateApplicationContext(context)
    } catch {
      assertionFailure("Failed to update watch planned dives: \(error)")
    }
  }

  private func linkedWatchInfoOnMainQueue() -> [String: Any] {
    guard WCSession.isSupported(),
          let connectivitySession else {
      return [
        "nativeBridgeAvailable": true,
        "isSupported": false,
        "isPaired": false,
        "isWatchAppInstalled": false,
        "isReachable": false
      ]
    }

    var info: [String: Any] = [
      "nativeBridgeAvailable": true,
      "isSupported": true,
      "isPaired": connectivitySession.isPaired,
      "isWatchAppInstalled": connectivitySession.isWatchAppInstalled,
      "isReachable": connectivitySession.isReachable
    ]

    if connectivitySession.isPaired {
      info["name"] = "Apple Watch"
    }

    return info
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
  static let plannedDivesJson = "plannedDivesJson"
  static let updatedAt = "updatedAt"
}

private enum WatchConnectivityEnvelopeValue {
  static let kind = "watchSyncMessage"
  static let acknowledgementKind = "watchSyncAcknowledgement"
  static let plannedDivesKind = "watchPlannedDives"
}
