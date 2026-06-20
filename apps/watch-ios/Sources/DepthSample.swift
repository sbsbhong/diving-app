import Foundation

public struct DepthSample: Codable {
    public let localSessionId: String
    public let timestamp: TimeInterval
    public let depthMeters: Double
    public let pressureKPa: Double?
    public let waterTemperatureCelsius: Double?

    public init(
        localSessionId: String,
        timestamp: TimeInterval,
        depthMeters: Double,
        pressureKPa: Double? = nil,
        waterTemperatureCelsius: Double? = nil
    ) {
        self.localSessionId = localSessionId
        self.timestamp = timestamp
        self.depthMeters = depthMeters
        self.pressureKPa = pressureKPa
        self.waterTemperatureCelsius = waterTemperatureCelsius
    }
}
