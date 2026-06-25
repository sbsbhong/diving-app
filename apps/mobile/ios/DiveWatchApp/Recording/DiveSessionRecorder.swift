import Combine
import Foundation

@MainActor
final class DiveSessionRecorder: ObservableObject {
    @Published private(set) var samples: [DepthSample] = []
    @Published private(set) var currentDepth: Double = 0
    @Published private(set) var maxDepth: Double = 0
    @Published private(set) var waterTemperatureCelsius: Double?
    @Published private(set) var elapsedTime: TimeInterval = 0
    @Published private(set) var latestAscentRateMetersPerMinute: Double = 0
    @Published private(set) var safetyStopRemainingSeconds: TimeInterval = 180
    @Published private(set) var safetyStopActive = false
    @Published private(set) var ascentWarningActive = false
    @Published private(set) var isRecording = false

    private let sensorProvider: DepthSensorProvider
    private var startedAt: Date?
    private var activePlan = PreDivePlan()
    private var elapsedTimer: Timer?
    private let recommendedAscentRateMetersPerMinute: Double = 9

    init(sensorProvider: DepthSensorProvider) {
        self.sensorProvider = sensorProvider
    }

    func startSession(plan: PreDivePlan = PreDivePlan()) {
        guard !isRecording else { return }

        samples = []
        currentDepth = 0
        maxDepth = 0
        waterTemperatureCelsius = nil
        elapsedTime = 0
        latestAscentRateMetersPerMinute = 0
        safetyStopRemainingSeconds = 180
        safetyStopActive = false
        ascentWarningActive = false
        activePlan = plan
        startedAt = Date()
        isRecording = true

        sensorProvider.onSample = { [weak self] sample in
            Task { @MainActor in
                self?.append(sample)
            }
        }
        sensorProvider.start()

        elapsedTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateElapsedTime()
            }
        }
    }

    func stopSession() -> DiveSession? {
        guard isRecording, let startedAt else { return nil }

        sensorProvider.stop()
        sensorProvider.onSample = nil
        elapsedTimer?.invalidate()
        elapsedTimer = nil
        updateElapsedTime()
        isRecording = false
        let sourcePlanLocalId = activePlan.sourcePlanLocalId
        var sessionTags = activePlan.tags
        if let sourcePlanLocalId, !sessionTags.contains("plan-\(sourcePlanLocalId)") {
            sessionTags.append("plan-\(sourcePlanLocalId)")
        }

        return DiveSession(
            diveMode: activePlan.diveMode,
            gasLabel: activePlan.gasLabel,
            siteName: activePlan.siteName.isEmpty ? nil : activePlan.siteName,
            sourcePlanLocalId: activePlan.sourcePlanLocalId,
            planTitle: activePlan.title.isEmpty ? nil : activePlan.title,
            buddyIds: activePlan.buddyIds,
            gearIds: activePlan.gearIds,
            tags: sessionTags,
            notes: activePlan.quickNote.isEmpty ? nil : activePlan.quickNote,
            syncStatus: .pending,
            startedAt: startedAt,
            endedAt: Date(),
            samples: samples
        )
    }

    func cancelSession() {
        sensorProvider.stop()
        sensorProvider.onSample = nil
        elapsedTimer?.invalidate()
        elapsedTimer = nil
        isRecording = false
    }

    private func append(_ sample: DepthSample) {
        let previousSample = samples.last
        samples.append(sample)
        currentDepth = sample.depthMeters
        maxDepth = max(maxDepth, sample.depthMeters)
        waterTemperatureCelsius = sample.waterTemperatureCelsius
        latestAscentRateMetersPerMinute = ascentRate(from: previousSample, to: sample)
        ascentWarningActive = latestAscentRateMetersPerMinute > recommendedAscentRateMetersPerMinute
        updateSafetyStop(with: sample, previousSample: previousSample)
    }

    private func updateElapsedTime() {
        guard let startedAt else {
            elapsedTime = 0
            return
        }

        elapsedTime = max(0, Date().timeIntervalSince(startedAt))
    }

    private func ascentRate(from previous: DepthSample?, to current: DepthSample) -> Double {
        guard let previous else { return 0 }
        let elapsed = current.timestamp.timeIntervalSince(previous.timestamp)
        guard elapsed > 0, current.depthMeters < previous.depthMeters else { return 0 }
        return (previous.depthMeters - current.depthMeters) / elapsed * 60
    }

    private func updateSafetyStop(with sample: DepthSample, previousSample: DepthSample?) {
        let shouldTrackSafetyStop = maxDepth >= 10
        let isInSafetyStopWindow = sample.depthMeters >= 3 && sample.depthMeters <= 6
        safetyStopActive = shouldTrackSafetyStop && isInSafetyStopWindow && safetyStopRemainingSeconds > 0

        guard safetyStopActive, let previousSample else { return }
        let elapsed = max(0, sample.timestamp.timeIntervalSince(previousSample.timestamp))
        safetyStopRemainingSeconds = max(0, safetyStopRemainingSeconds - elapsed)
    }
}
