import SwiftUI

struct SessionDetailView: View {
    let session: DiveSession

    private var summary: DiveSessionSummary {
        session.summary
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                InstrumentCard(accent: DiveWatchTheme.primary) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            StatusPill(title: session.diveMode.label)
                            Spacer(minLength: 6)
                            Text(session.syncStatus.label)
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(DiveWatchTheme.mutedText)
                                .lineLimit(1)
                                .minimumScaleFactor(0.62)
                        }

                        Text(DiveFormatters.sessionDate.string(from: session.startedAt))
                            .font(DiveWatchTheme.metricFont(size: 20, weight: .semibold))
                            .foregroundStyle(DiveWatchTheme.text)
                            .lineLimit(2)
                            .minimumScaleFactor(0.55)

                        DepthProfileSparkline(samples: session.samples)
                            .frame(height: 44)
                    }
                }

                HStack(spacing: 8) {
                    MetricCard(title: "Max Depth", value: DiveFormatters.depth(summary.maxDepthMeters), compact: true)
                    MetricCard(title: "Duration", value: DiveFormatters.duration(summary.durationSeconds), compact: true)
                }

                InstrumentCard {
                    VStack(spacing: 6) {
                        SummaryRow(title: "Average depth", value: DiveFormatters.depth(summary.averageDepthMeters))
                        SummaryRow(title: "Average temp", value: DiveFormatters.temperature(summary.averageWaterTemperatureCelsius))
                        SummaryRow(title: "Samples", value: "\(summary.sampleCount)")
                        SummaryRow(title: "Ascent reminder max", value: DiveFormatters.ascentRate(summary.maxAscentRateMetersPerMinute))
                    }
                }

                InstrumentCard(accent: DiveWatchTheme.secondary) {
                    VStack(spacing: 6) {
                        SummaryRow(title: "Gas", value: session.gasLabel ?? "Not set")
                        SummaryRow(title: "Site", value: session.siteName ?? "Not set")
                        SummaryRow(title: "Rating", value: DiveFormatters.rating(session.rating))
                        SummaryRow(title: "Visibility", value: session.visibilityRating.map(String.init) ?? "Not set")
                        SummaryRow(title: "Water", value: session.waterCondition.label)
                    }
                }

                InstrumentCard {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("NOTE")
                            .font(DiveWatchTheme.labelFont())
                            .foregroundStyle(DiveWatchTheme.mutedText)
                        Text(session.notes ?? "No note")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(DiveWatchTheme.text)
                            .multilineTextAlignment(.leading)
                            .lineLimit(5)
                    }
                }

                DiveDisclaimer(text: "LOG REVIEW ONLY. NON-CERTIFIED ASSISTANT.")
            }
            .padding(.horizontal, DiveWatchTheme.edgeMargin)
            .padding(.vertical, 10)
        }
        .background(DiveWatchTheme.background.ignoresSafeArea())
        .navigationTitle("Details")
    }
}
