import SwiftUI

struct HomeView: View {
    @ObservedObject var store: DiveSessionStore
    @State private var plan = PreDivePlan()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    HomeHeader(sessionCount: store.sessions.count)

                    if let latestSession = store.sessions.first {
                        LatestSessionCard(session: latestSession)
                    }

                    PreDivePlanForm(plan: $plan)

                    NavigationLink {
                        RecordingView(store: store, plan: plan)
                    } label: {
                        Label("Start Dive", systemImage: "play.fill")
                    }
                    .buttonStyle(DiveActionButtonStyle(kind: .primary))

                    NavigationLink {
                        SessionListView(store: store)
                    } label: {
                        Label("Saved Sessions", systemImage: "list.bullet")
                    }
                    .buttonStyle(DiveActionButtonStyle(kind: .secondary))

                    DiveDisclaimer()
                }
                .padding(.horizontal, DiveWatchTheme.edgeMargin)
                .padding(.vertical, 10)
            }
            .background(DiveWatchTheme.background.ignoresSafeArea())
            .navigationTitle("Dive Watch")
        }
    }
}

private struct HomeHeader: View {
    let sessionCount: Int

    var body: some View {
        InstrumentCard(accent: DiveWatchTheme.primary) {
            VStack(alignment: .leading, spacing: 7) {
                HStack(alignment: .center) {
                    StatusPill(title: "Watch assistant")
                    Spacer(minLength: 6)
                    Text("\(sessionCount)")
                        .font(DiveWatchTheme.metricFont(size: 18, weight: .semibold))
                        .foregroundStyle(DiveWatchTheme.primary)
                        .monospacedDigit()
                    Text("logs")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(DiveWatchTheme.mutedText)
                }

                Text("Dive Watch")
                    .font(DiveWatchTheme.metricFont(size: 25, weight: .semibold))
                    .foregroundStyle(DiveWatchTheme.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)

                Text("Recreational capture and review. Not a certified dive computer.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(DiveWatchTheme.mutedText)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
            }
        }
    }
}

private struct LatestSessionCard: View {
    let session: DiveSession

    private var summary: DiveSessionSummary {
        session.summary
    }

    var body: some View {
        InstrumentCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("LAST DIVE")
                            .font(DiveWatchTheme.labelFont())
                            .foregroundStyle(DiveWatchTheme.mutedText)
                        Text(DiveFormatters.sessionDate.string(from: session.startedAt))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(DiveWatchTheme.text)
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)
                    }

                    Spacer(minLength: 6)

                    StatusPill(title: session.syncStatus.label, color: DiveWatchTheme.secondary)
                }

                HStack(spacing: 8) {
                    LatestMetric(title: "Max", value: DiveFormatters.depth(summary.maxDepthMeters))
                    LatestMetric(title: "Time", value: DiveFormatters.duration(summary.durationSeconds))
                }
            }
        }
    }
}

private struct LatestMetric: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(DiveWatchTheme.mutedText)
            Text(value)
                .font(DiveWatchTheme.metricFont(size: 17, weight: .semibold))
                .foregroundStyle(DiveWatchTheme.text)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 2)
    }
}

private struct PreDivePlanForm: View {
    @Binding var plan: PreDivePlan

    var body: some View {
        InstrumentCard(accent: DiveWatchTheme.secondary) {
            VStack(alignment: .leading, spacing: 8) {
                Text("PRE-DIVE PLAN")
                    .font(DiveWatchTheme.labelFont())
                    .foregroundStyle(DiveWatchTheme.secondary)

                Picker("Mode", selection: $plan.diveMode) {
                    ForEach(DiveMode.allCases) { mode in
                        Text(mode.label).tag(mode)
                    }
                }
                .labelsHidden()
                .frame(height: 58)

                DiveTextField(title: "Gas label", text: $plan.gasLabel)
                DiveTextField(title: "Site", text: $plan.siteName)
                DiveTextField(title: "Buddy", text: $plan.buddyName)
                DiveTextField(title: "Quick note", text: $plan.quickNote)

                Stepper(value: $plan.plannedMaxDepthMeters, in: 3...40, step: 1) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("PLANNED MAX")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(DiveWatchTheme.mutedText)
                        Text("\(Int(plan.plannedMaxDepthMeters)) m")
                            .font(DiveWatchTheme.metricFont(size: 16, weight: .semibold))
                            .foregroundStyle(DiveWatchTheme.text)
                            .monospacedDigit()
                    }
                }
            }
        }
    }
}

private struct DiveTextField: View {
    let title: String
    @Binding var text: String

    var body: some View {
        TextField(title, text: $text)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(DiveWatchTheme.text)
            .padding(.horizontal, 8)
            .padding(.vertical, 7)
            .background(
                RoundedRectangle(cornerRadius: DiveWatchTheme.cardRadius, style: .continuous)
                    .fill(DiveWatchTheme.surfaceRaised.opacity(0.72))
            )
    }
}
