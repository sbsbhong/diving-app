import Foundation

public final class MockDepthSensorProvider: DepthSensorProvider {
    public var onSample: ((DepthSample) -> Void)?

    private let queue = DispatchQueue(label: "com.diveapp.mock-depth-sensor")
    private var timer: DispatchSourceTimer?
    private var tick: Int = 0

    private let sampleIntervalSeconds: TimeInterval = 1
    private let cycleDurationSeconds: TimeInterval = 120
    private let maxDepthMeters: Double = 18
    private let surfacePressureKPa: Double = 101.325
    private let pressureIncreasePerMeterKPa: Double = 9.80665

    public init() {}

    public func start() {
        guard timer == nil else { return }

        tick = 0
        let timer = DispatchSource.makeTimerSource(queue: queue)
        timer.schedule(deadline: .now(), repeating: sampleIntervalSeconds)
        timer.setEventHandler { [weak self] in
            self?.emitSample()
        }

        self.timer = timer
        timer.resume()
    }

    public func stop() {
        timer?.cancel()
        timer = nil
    }

    private func emitSample() {
        let elapsed = Double(tick) * sampleIntervalSeconds
        let phase = (elapsed.truncatingRemainder(dividingBy: cycleDurationSeconds)) / cycleDurationSeconds

        // sin(0 -> pi): surface(0m) -> max depth -> surface(0m)
        let depthFactor = max(0, sin(phase * .pi))
        let depthMeters = depthFactor * maxDepthMeters
        let pressureKPa = surfacePressureKPa + depthMeters * pressureIncreasePerMeterKPa
        let waterTemperatureCelsius = 24.0 - (depthMeters * 0.12) + (sin(phase * 2 * .pi) * 0.35)

        let sample = DepthSample(
            localSessionId: "mock-session",
            timestamp: Date().timeIntervalSince1970,
            depthMeters: depthMeters,
            pressureKPa: pressureKPa,
            waterTemperatureCelsius: waterTemperatureCelsius
        )

        tick += 1

        let callback = onSample
        DispatchQueue.main.async {
            callback?(sample)
        }
    }
}
