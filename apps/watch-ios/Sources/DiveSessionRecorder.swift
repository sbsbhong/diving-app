import Foundation

public struct DiveSessionSummary: Codable {
    public let localSessionId: String
    public let startedAt: TimeInterval
    public let endedAt: TimeInterval
    public let durationSeconds: TimeInterval
    public let sampleCount: Int
    public let maxDepthMeters: Double
    public let averageDepthMeters: Double
    public let averageWaterTemperatureCelsius: Double?
}

public final class DiveSessionRecorder {
    private let sensorProvider: DepthSensorProvider

    public private(set) var localSessionId: String?
    public private(set) var startedAt: TimeInterval?
    public private(set) var endedAt: TimeInterval?
    public private(set) var samples: [DepthSample] = []

    public private(set) var currentDepth: Double = 0
    public private(set) var maxDepth: Double = 0

    public var elapsedTime: TimeInterval {
        guard let startedAt else { return 0 }
        let end = endedAt ?? Date().timeIntervalSince1970
        return max(0, end - startedAt)
    }

    public init(sensorProvider: DepthSensorProvider) {
        self.sensorProvider = sensorProvider
    }

    public func startSession() {
        let now = Date().timeIntervalSince1970

        localSessionId = UUID().uuidString
        startedAt = now
        endedAt = nil
        samples = []
        currentDepth = 0
        maxDepth = 0

        sensorProvider.onSample = { [weak self] sample in
            self?.appendSample(sample)
        }

        sensorProvider.start()
    }

    @discardableResult
    public func stopSession() -> DiveSessionSummary? {
        guard let startedAt, let localSessionId else {
            sensorProvider.stop()
            return nil
        }

        sensorProvider.stop()
        endedAt = Date().timeIntervalSince1970

        return makeSummary(
            localSessionId: localSessionId,
            startedAt: startedAt,
            endedAt: endedAt ?? startedAt
        )
    }

    public func summary() -> DiveSessionSummary? {
        guard let startedAt, let localSessionId, let endedAt else {
            return nil
        }

        return makeSummary(localSessionId: localSessionId, startedAt: startedAt, endedAt: endedAt)
    }

    private func appendSample(_ sample: DepthSample) {
        guard let localSessionId else { return }

        let normalizedSample = DepthSample(
            localSessionId: localSessionId,
            timestamp: sample.timestamp,
            depthMeters: sample.depthMeters,
            pressureKPa: sample.pressureKPa,
            waterTemperatureCelsius: sample.waterTemperatureCelsius
        )

        samples.append(normalizedSample)
        currentDepth = normalizedSample.depthMeters
        maxDepth = max(maxDepth, normalizedSample.depthMeters)
    }

    private func makeSummary(
        localSessionId: String,
        startedAt: TimeInterval,
        endedAt: TimeInterval
    ) -> DiveSessionSummary {
        let averageDepthMeters = samples.isEmpty
            ? 0
            : samples.reduce(0) { $0 + $1.depthMeters } / Double(samples.count)

        let temperatures = samples.compactMap(\.waterTemperatureCelsius)
        let averageWaterTemperatureCelsius = temperatures.isEmpty
            ? nil
            : temperatures.reduce(0, +) / Double(temperatures.count)

        return DiveSessionSummary(
            localSessionId: localSessionId,
            startedAt: startedAt,
            endedAt: endedAt,
            durationSeconds: max(0, endedAt - startedAt),
            sampleCount: samples.count,
            maxDepthMeters: maxDepth,
            averageDepthMeters: averageDepthMeters,
            averageWaterTemperatureCelsius: averageWaterTemperatureCelsius
        )
    }
}
