import SwiftUI

struct SessionListView: View {
    @ObservedObject var store: DiveSessionStore

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                if store.sessions.isEmpty {
                    EmptySessionsView()
                } else {
                    ForEach(store.sessions) { session in
                        NavigationLink {
                            SessionDetailView(session: session)
                        } label: {
                            SessionRow(session: session)
                        }
                        .buttonStyle(.plain)
                    }
                }

                DiveDisclaimer(text: "LOG REVIEW ONLY. NON-CERTIFIED ASSISTANT.")
            }
            .padding(.horizontal, DiveWatchTheme.edgeMargin)
            .padding(.vertical, 10)
        }
        .background(DiveWatchTheme.background.ignoresSafeArea())
        .navigationTitle("Sessions")
    }
}

private struct EmptySessionsView: View {
    var body: some View {
        InstrumentCard(accent: DiveWatchTheme.secondary) {
            VStack(alignment: .leading, spacing: 7) {
                StatusPill(title: "No logs", color: DiveWatchTheme.secondary)
                Text("No saved sessions")
                    .font(DiveWatchTheme.metricFont(size: 20, weight: .semibold))
                    .foregroundStyle(DiveWatchTheme.text)
                Text("Start a recreational capture to create a watch log.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(DiveWatchTheme.mutedText)
            }
        }
    }
}

private struct SessionRow: View {
    let session: DiveSession

    private var summary: DiveSessionSummary {
        session.summary
    }

    var body: some View {
        InstrumentCard {
            HStack(alignment: .center, spacing: 9) {
                DepthProfileSparkline(samples: session.samples, color: profileColor)
                    .frame(width: 44, height: 38)

                VStack(alignment: .leading, spacing: 4) {
                    Text(DiveFormatters.sessionDate.string(from: session.startedAt))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(DiveWatchTheme.text)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)

                    HStack(spacing: 5) {
                        StatusPill(title: session.diveMode.label, color: profileColor)
                        Text(session.syncStatus.label)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(DiveWatchTheme.mutedText)
                            .lineLimit(1)
                            .minimumScaleFactor(0.62)
                    }
                }

                Spacer(minLength: 4)

                VStack(alignment: .trailing, spacing: 3) {
                    Text(DiveFormatters.depth(summary.maxDepthMeters))
                        .font(DiveWatchTheme.metricFont(size: 16, weight: .bold))
                        .foregroundStyle(profileColor)
                        .monospacedDigit()
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    Text(DiveFormatters.duration(summary.durationSeconds))
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(DiveWatchTheme.mutedText)
                        .monospacedDigit()
                }
            }
        }
    }

    private var profileColor: Color {
        if summary.maxDepthMeters >= 20 {
            return DiveWatchTheme.secondary
        }

        if summary.maxDepthMeters >= 10 {
            return DiveWatchTheme.primary
        }

        return DiveWatchTheme.success
    }
}
