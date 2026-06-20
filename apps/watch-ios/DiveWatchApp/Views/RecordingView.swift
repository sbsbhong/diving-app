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

                LiveDepthPanel(
                    depth: DiveFormatters.depth(recorder.currentDepth),
                    elapsed: DiveFormatters.duration(recorder.elapsedTime),
                    maxDepth: DiveFormatters.depth(recorder.maxDepth)
                )

                HStack(spacing: 8) {
                    CompactMetric(title: "Temp", value: DiveFormatters.temperature(recorder.waterTemperatureCelsius))
                    CompactMetric(title: "Mode", value: plan.diveMode.label)
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

private struct LiveDepthPanel: View {
    let depth: String
    let elapsed: String
    let maxDepth: String

    var body: some View {
        InstrumentCard {
            VStack(alignment: .leading, spacing: 9) {
                Text("CURRENT DEPTH")
                    .font(DiveWatchTheme.labelFont())
                    .foregroundStyle(DiveWatchTheme.mutedText)

                Text(depth)
                    .font(DiveWatchTheme.metricFont(size: 40, weight: .semibold))
                    .foregroundStyle(DiveWatchTheme.primary)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.45)

                HStack(spacing: 10) {
                    LiveDepthStat(title: "Time", value: elapsed)
                    LiveDepthStat(title: "Max", value: maxDepth)
                }
            }
        }
    }
}

private struct LiveDepthStat: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(DiveWatchTheme.mutedText)
            Text(value)
                .font(DiveWatchTheme.metricFont(size: 15, weight: .semibold))
                .foregroundStyle(DiveWatchTheme.text)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.58)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct CompactMetric: View {
    let title: String
    let value: String

    var body: some View {
        InstrumentCard {
            VStack(alignment: .leading, spacing: 3) {
                Text(title.uppercased())
                    .font(DiveWatchTheme.labelFont())
                    .foregroundStyle(DiveWatchTheme.mutedText)
                    .lineLimit(1)
                Text(value)
                    .font(DiveWatchTheme.metricFont(size: 16, weight: .semibold))
                    .foregroundStyle(DiveWatchTheme.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
            }
        }
    }
}

private struct AssistantBlock: View {
    let ascentRate: Double
    let ascentWarningActive: Bool
    let safetyStopActive: Bool
    let safetyStopRemainingSeconds: TimeInterval

    var body: some View {
        InstrumentCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .center, spacing: 8) {
                    StatusPill(title: ascentWarningActive ? "Ascent reminder" : "Assistant steady")

                    Spacer(minLength: 4)

                    Text(safetyStopActive ? DiveFormatters.duration(safetyStopRemainingSeconds) : "REVIEW")
                        .font(DiveWatchTheme.metricFont(size: 15, weight: .semibold))
                        .foregroundStyle(DiveWatchTheme.primary)
                        .monospacedDigit()
                        .lineLimit(1)
                        .minimumScaleFactor(0.58)
                }

                Text(ascentWarningActive ? "Review ascent rate with certified equipment." : "Reminder review from watch logs only.")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(DiveWatchTheme.text)
                    .lineLimit(2)
                    .minimumScaleFactor(0.72)

                SummaryRow(
                    title: "Ascent",
                    value: ascentWarningActive ? "Reminder active" : DiveFormatters.ascentRate(ascentRate),
                    accent: ascentWarningActive ? DiveWatchTheme.primary : nil
                )
                SummaryRow(
                    title: "Safety stop",
                    value: safetyStopActive ? DiveFormatters.duration(safetyStopRemainingSeconds) : "Planning reminder",
                    accent: safetyStopActive ? DiveWatchTheme.primary : nil
                )
            }
        }
    }
}
