import SwiftUI

struct RecordingView: View {
    @ObservedObject var store: DiveSessionStore
    let plan: PreDivePlan
    @StateObject private var recorder = DiveSessionRecorder(sensorProvider: MockDepthSensorProvider())
    @State private var completedSession: DiveSession?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Group {
            if let completedSession {
                SummaryView(
                    session: completedSession,
                    onSave: { session in
                        store.save(session)
                        dismiss()
                    },
                    onDiscard: {
                        dismiss()
                    }
                )
            } else {
                recordingContent
            }
        }
        .navigationBarBackButtonHidden(recorder.isRecording)
        .onAppear {
            recorder.startSession(plan: plan)
        }
        .onDisappear {
            if completedSession == nil {
                recorder.cancelSession()
            }
        }
    }

    private var recordingContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    StatusPill(title: "Active dive")
                    Spacer(minLength: 6)
                    Text(DiveFormatters.duration(recorder.elapsedTime))
                        .font(DiveWatchTheme.metricFont(size: 16, weight: .semibold))
                        .foregroundStyle(DiveWatchTheme.primary)
                        .monospacedDigit()
                }

                MetricCard(
                    title: "Current Depth",
                    value: DiveFormatters.depth(recorder.currentDepth),
                    footnote: "Live mock sensor capture",
                    prominent: true
                )

                MetricCard(
                    title: "Bottom Time",
                    value: DiveFormatters.duration(recorder.elapsedTime),
                    accent: DiveWatchTheme.secondary,
                    prominent: true
                )

                HStack(spacing: 8) {
                    MetricCard(title: "Max", value: DiveFormatters.depth(recorder.maxDepth), compact: true)
                    MetricCard(title: "Temp", value: DiveFormatters.temperature(recorder.waterTemperatureCelsius), compact: true)
                }

                AssistantBlock(
                    ascentRate: recorder.latestAscentRateMetersPerMinute,
                    ascentWarningActive: recorder.ascentWarningActive,
                    safetyStopActive: recorder.safetyStopActive,
                    safetyStopRemainingSeconds: recorder.safetyStopRemainingSeconds
                )

                Button(role: .destructive) {
                    completedSession = recorder.stopSession()
                } label: {
                    Label("End Dive", systemImage: "stop.fill")
                }
                .buttonStyle(DiveActionButtonStyle(kind: .destructive))

                DiveDisclaimer(text: "ASSISTANT ONLY. FOLLOW TRAINING AND A CERTIFIED DIVE COMPUTER.")
            }
            .padding(.horizontal, DiveWatchTheme.edgeMargin)
            .padding(.vertical, 10)
        }
        .background(DiveWatchTheme.background.ignoresSafeArea())
        .navigationTitle("Live Log")
    }
}

private struct AssistantBlock: View {
    let ascentRate: Double
    let ascentWarningActive: Bool
    let safetyStopActive: Bool
    let safetyStopRemainingSeconds: TimeInterval

    var body: some View {
        InstrumentCard(accent: ascentWarningActive ? DiveWatchTheme.warning : DiveWatchTheme.success) {
            VStack(alignment: .leading, spacing: 9) {
                HStack(alignment: .center, spacing: 10) {
                    SafetyStopRing(
                        remainingSeconds: safetyStopRemainingSeconds,
                        progress: safetyStopProgress,
                        active: safetyStopActive
                    )

                    VStack(alignment: .leading, spacing: 6) {
                        StatusPill(
                            title: ascentWarningActive ? "Slow down" : "Assistant steady",
                            color: ascentWarningActive ? DiveWatchTheme.warning : DiveWatchTheme.success
                        )

                        Text(ascentWarningActive ? "ASCENT REMINDER" : "SAFETY ASSISTANT")
                            .font(DiveWatchTheme.labelFont())
                            .foregroundStyle(DiveWatchTheme.mutedText)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)

                        Text(ascentWarningActive ? "Reduce ascent rate" : "Monitoring reminders")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(DiveWatchTheme.text)
                            .lineLimit(2)
                            .minimumScaleFactor(0.72)
                    }
                }

                SummaryRow(
                    title: "Ascent",
                    value: ascentWarningActive ? "Reminder active" : DiveFormatters.ascentRate(ascentRate),
                    accent: ascentWarningActive ? DiveWatchTheme.warning : nil
                )
                SummaryRow(
                    title: "Safety stop",
                    value: safetyStopActive ? DiveFormatters.duration(safetyStopRemainingSeconds) : "Planning reminder",
                    accent: safetyStopActive ? DiveWatchTheme.success : nil
                )
            }
        }
    }

    private var safetyStopProgress: Double {
        1 - max(0, min(180, safetyStopRemainingSeconds)) / 180
    }
}
