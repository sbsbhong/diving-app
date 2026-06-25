// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let watchSyncMessage = try WatchSyncMessage(json)

import Foundation

// MARK: - WatchSyncMessage
public struct WatchSyncMessage: Codable {
    public let session: WatchSession
    public let type: TypeEnum

    public init(session: WatchSession, type: TypeEnum) {
        self.session = session
        self.type = type
    }
}

// MARK: WatchSyncMessage convenience initializers and mutators

public extension WatchSyncMessage {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(WatchSyncMessage.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        session: WatchSession? = nil,
        type: TypeEnum? = nil
    ) -> WatchSyncMessage {
        return WatchSyncMessage(
            session: session ?? self.session,
            type: type ?? self.type
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - WatchSession
public struct WatchSession: Codable {
    public let averageDepthMeters: Double?
    public let buddyIds: [String]?
    public let diveMode: DiveMode?
    /// Unix timestamp in seconds
    public let endedAt: Double?
    public let entryLocation, exitLocation: WatchLocation?
    public let gasLabel: String?
    public let gearIds: [String]?
    public let localSessionId: String
    public let maxDepthMeters: Double?
    public let notes: String?
    public let perceivedExertion: Int?
    public let planTitle: String?
    public let rating: Int?
    public let samples: [WatchDepthSample]
    public let schemaVersion: Int?
    public let siteId, siteName, sourcePlanLocalId: String?
    /// Unix timestamp in seconds
    public let startedAt: Double
    public let syncStatus: SyncStatus?
    public let tags: [String]?
    public let visibilityRating: Int?
    public let waterCondition: WaterCondition?
    public let waterTemperatureCelsius: Double?

    public init(averageDepthMeters: Double?, buddyIds: [String]?, diveMode: DiveMode?, endedAt: Double?, entryLocation: WatchLocation?, exitLocation: WatchLocation?, gasLabel: String?, gearIds: [String]?, localSessionId: String, maxDepthMeters: Double?, notes: String?, perceivedExertion: Int?, planTitle: String?, rating: Int?, samples: [WatchDepthSample], schemaVersion: Int?, siteId: String?, siteName: String?, sourcePlanLocalId: String?, startedAt: Double, syncStatus: SyncStatus?, tags: [String]?, visibilityRating: Int?, waterCondition: WaterCondition?, waterTemperatureCelsius: Double?) {
        self.averageDepthMeters = averageDepthMeters
        self.buddyIds = buddyIds
        self.diveMode = diveMode
        self.endedAt = endedAt
        self.entryLocation = entryLocation
        self.exitLocation = exitLocation
        self.gasLabel = gasLabel
        self.gearIds = gearIds
        self.localSessionId = localSessionId
        self.maxDepthMeters = maxDepthMeters
        self.notes = notes
        self.perceivedExertion = perceivedExertion
        self.planTitle = planTitle
        self.rating = rating
        self.samples = samples
        self.schemaVersion = schemaVersion
        self.siteId = siteId
        self.siteName = siteName
        self.sourcePlanLocalId = sourcePlanLocalId
        self.startedAt = startedAt
        self.syncStatus = syncStatus
        self.tags = tags
        self.visibilityRating = visibilityRating
        self.waterCondition = waterCondition
        self.waterTemperatureCelsius = waterTemperatureCelsius
    }
}

// MARK: WatchSession convenience initializers and mutators

public extension WatchSession {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(WatchSession.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        averageDepthMeters: Double?? = nil,
        buddyIds: [String]?? = nil,
        diveMode: DiveMode?? = nil,
        endedAt: Double?? = nil,
        entryLocation: WatchLocation?? = nil,
        exitLocation: WatchLocation?? = nil,
        gasLabel: String?? = nil,
        gearIds: [String]?? = nil,
        localSessionId: String? = nil,
        maxDepthMeters: Double?? = nil,
        notes: String?? = nil,
        perceivedExertion: Int?? = nil,
        planTitle: String?? = nil,
        rating: Int?? = nil,
        samples: [WatchDepthSample]? = nil,
        schemaVersion: Int?? = nil,
        siteId: String?? = nil,
        siteName: String?? = nil,
        sourcePlanLocalId: String?? = nil,
        startedAt: Double? = nil,
        syncStatus: SyncStatus?? = nil,
        tags: [String]?? = nil,
        visibilityRating: Int?? = nil,
        waterCondition: WaterCondition?? = nil,
        waterTemperatureCelsius: Double?? = nil
    ) -> WatchSession {
        return WatchSession(
            averageDepthMeters: averageDepthMeters ?? self.averageDepthMeters,
            buddyIds: buddyIds ?? self.buddyIds,
            diveMode: diveMode ?? self.diveMode,
            endedAt: endedAt ?? self.endedAt,
            entryLocation: entryLocation ?? self.entryLocation,
            exitLocation: exitLocation ?? self.exitLocation,
            gasLabel: gasLabel ?? self.gasLabel,
            gearIds: gearIds ?? self.gearIds,
            localSessionId: localSessionId ?? self.localSessionId,
            maxDepthMeters: maxDepthMeters ?? self.maxDepthMeters,
            notes: notes ?? self.notes,
            perceivedExertion: perceivedExertion ?? self.perceivedExertion,
            planTitle: planTitle ?? self.planTitle,
            rating: rating ?? self.rating,
            samples: samples ?? self.samples,
            schemaVersion: schemaVersion ?? self.schemaVersion,
            siteId: siteId ?? self.siteId,
            siteName: siteName ?? self.siteName,
            sourcePlanLocalId: sourcePlanLocalId ?? self.sourcePlanLocalId,
            startedAt: startedAt ?? self.startedAt,
            syncStatus: syncStatus ?? self.syncStatus,
            tags: tags ?? self.tags,
            visibilityRating: visibilityRating ?? self.visibilityRating,
            waterCondition: waterCondition ?? self.waterCondition,
            waterTemperatureCelsius: waterTemperatureCelsius ?? self.waterTemperatureCelsius
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum DiveMode: String, Codable {
    case freedive = "freedive"
    case scuba = "scuba"
}

// MARK: - WatchLocation
public struct WatchLocation: Codable {
    /// Unix timestamp in seconds
    public let capturedAt: Double?
    public let horizontalAccuracyMeters: Double?
    public let latitude, longitude: Double

    public init(capturedAt: Double?, horizontalAccuracyMeters: Double?, latitude: Double, longitude: Double) {
        self.capturedAt = capturedAt
        self.horizontalAccuracyMeters = horizontalAccuracyMeters
        self.latitude = latitude
        self.longitude = longitude
    }
}

// MARK: WatchLocation convenience initializers and mutators

public extension WatchLocation {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(WatchLocation.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        capturedAt: Double?? = nil,
        horizontalAccuracyMeters: Double?? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil
    ) -> WatchLocation {
        return WatchLocation(
            capturedAt: capturedAt ?? self.capturedAt,
            horizontalAccuracyMeters: horizontalAccuracyMeters ?? self.horizontalAccuracyMeters,
            latitude: latitude ?? self.latitude,
            longitude: longitude ?? self.longitude
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - WatchDepthSample
public struct WatchDepthSample: Codable {
    public let depthMeters: Double
    public let localSessionId: String
    public let pressureKPa: Double?
    /// Unix timestamp in seconds
    public let timestamp: Double
    public let waterTemperatureCelsius: Double?

    public init(depthMeters: Double, localSessionId: String, pressureKPa: Double?, timestamp: Double, waterTemperatureCelsius: Double?) {
        self.depthMeters = depthMeters
        self.localSessionId = localSessionId
        self.pressureKPa = pressureKPa
        self.timestamp = timestamp
        self.waterTemperatureCelsius = waterTemperatureCelsius
    }
}

// MARK: WatchDepthSample convenience initializers and mutators

public extension WatchDepthSample {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(WatchDepthSample.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        depthMeters: Double? = nil,
        localSessionId: String? = nil,
        pressureKPa: Double?? = nil,
        timestamp: Double? = nil,
        waterTemperatureCelsius: Double?? = nil
    ) -> WatchDepthSample {
        return WatchDepthSample(
            depthMeters: depthMeters ?? self.depthMeters,
            localSessionId: localSessionId ?? self.localSessionId,
            pressureKPa: pressureKPa ?? self.pressureKPa,
            timestamp: timestamp ?? self.timestamp,
            waterTemperatureCelsius: waterTemperatureCelsius ?? self.waterTemperatureCelsius
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

public enum SyncStatus: String, Codable {
    case failed = "failed"
    case pending = "pending"
    case synced = "synced"
}

public enum WaterCondition: String, Codable {
    case calm = "calm"
    case choppy = "choppy"
    case current = "current"
    case mild = "mild"
    case surge = "surge"
    case unknown = "unknown"
}

public enum TypeEnum: String, Codable {
    case sessionCreated = "sessionCreated"
    case sessionEnded = "sessionEnded"
    case sessionUpdated = "sessionUpdated"
}

// MARK: - Helper functions for creating encoders and decoders

func newJSONDecoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        decoder.dateDecodingStrategy = .iso8601
    }
    return decoder
}

func newJSONEncoder() -> JSONEncoder {
    let encoder = JSONEncoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        encoder.dateEncodingStrategy = .iso8601
    }
    return encoder
}
