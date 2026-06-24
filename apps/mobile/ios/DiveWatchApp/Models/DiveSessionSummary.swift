import Foundation

struct DiveSessionSummary: Codable {
    let durationSeconds: TimeInterval
    let maxDepthMeters: Double
    let averageDepthMeters: Double
    let averageWaterTemperatureCelsius: Double?
    let sampleCount: Int
    let latestAscentRateMetersPerMinute: Double
    let maxAscentRateMetersPerMinute: Double

    init(session: DiveSession) {
        let endedAt = session.endedAt ?? Date()
        let durationSeconds = max(0, endedAt.timeIntervalSince(session.startedAt))
        let sampleCount = session.samples.count
        let maxDepthMeters = session.samples.map(\.depthMeters).max() ?? 0
        let averageDepthMeters = sampleCount == 0
            ? 0
            : session.samples.reduce(0) { $0 + $1.depthMeters } / Double(sampleCount)
        let temperatures = session.samples.map(\.waterTemperatureCelsius)
        let averageWaterTemperatureCelsius = temperatures.isEmpty
            ? nil
            : temperatures.reduce(0, +) / Double(temperatures.count)

        self.durationSeconds = durationSeconds
        self.maxDepthMeters = maxDepthMeters
        self.averageDepthMeters = averageDepthMeters
        self.averageWaterTemperatureCelsius = averageWaterTemperatureCelsius
        self.sampleCount = sampleCount
        self.latestAscentRateMetersPerMinute = DiveSessionSummary.ascentRate(
            from: session.samples.dropLast().last,
            to: session.samples.last
        )
        self.maxAscentRateMetersPerMinute = session.samples.indices.dropFirst().reduce(0) { maxRate, index in
            max(maxRate, DiveSessionSummary.ascentRate(from: session.samples[index - 1], to: session.samples[index]))
        }
    }

    private static func ascentRate(from previous: DepthSample?, to current: DepthSample?) -> Double {
        guard let previous, let current else { return 0 }
        let elapsed = current.timestamp.timeIntervalSince(previous.timestamp)
        guard elapsed > 0, current.depthMeters < previous.depthMeters else { return 0 }
        return (previous.depthMeters - current.depthMeters) / elapsed * 60
    }
}
