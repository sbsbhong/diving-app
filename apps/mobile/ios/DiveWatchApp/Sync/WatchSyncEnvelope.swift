import Foundation

enum WatchSyncEnvelope {
    static let kind = "watchSyncMessage"
    static let acknowledgementKind = "watchSyncAcknowledgement"
    static let kindKey = "kind"
    static let payloadBase64Key = "payloadBase64"
    static let localSessionIdKey = "localSessionId"
    static let sentAtKey = "sentAt"
    static let acknowledgedAtKey = "acknowledgedAt"

    static func userInfo(for session: DiveSession, sentAt: Date = Date()) throws -> [String: Any] {
        let payloadData = try session.syncMessageData()

        return [
            kindKey: kind,
            payloadBase64Key: payloadData.base64EncodedString(),
            localSessionIdKey: session.id.uuidString,
            sentAtKey: sentAt.timeIntervalSince1970
        ]
    }
}
