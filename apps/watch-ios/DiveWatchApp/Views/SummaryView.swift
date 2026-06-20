import SwiftUI

struct SummaryView: View {
    let session: DiveSession
    let onSave: (DiveSession) -> Void
    let onDiscard: () -> Void
    @State private var rating = 4
    @State private var perceivedExertion = 2
    @State private var visibilityRating = 3
    @State private var waterCondition = WaterCondition.unknown
    @State private var notes = ""

    private var summary: DiveSessionSummary {
        session.summary
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                InstrumentCard(accent: DiveWatchTheme.success) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            StatusPill(title: "Dive captured", color: DiveWatchTheme.success)
                            Spacer(minLength: 6)
                            Text("\(summary.sampleCount)")
                                .font(DiveWatchTheme.metricFont(size: 15, weight: .bold))
                                .foregroundStyle(DiveWatchTheme.success)
                                .monospacedDigit()
                            Text("samples")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(DiveWatchTheme.mutedText)
                        }

                        Text("Dive Summary")
                            .font(DiveWatchTheme.metricFont(size: 24, weight: .bold))
                            .foregroundStyle(DiveWatchTheme.text)
                            .lineLimit(1)
                            .minimumScaleFactor(0.62)

                        DepthProfileSparkline(samples: session.samples, color: DiveWatchTheme.success)
                            .frame(height: 42)
                    }
                }

                HStack(spacing: 8) {
                    MetricCard(title: "Duration", value: DiveFormatters.duration(summary.durationSeconds), compact: true)
                    MetricCard(title: "Max Depth", value: DiveFormatters.depth(summary.maxDepthMeters), compact: true)
                }

                InstrumentCard {
                    VStack(spacing: 6) {
                        SummaryRow(title: "Average depth", value: DiveFormatters.depth(summary.averageDepthMeters))
                        SummaryRow(title: "Average temp", value: DiveFormatters.temperature(summary.averageWaterTemperatureCelsius))
                        SummaryRow(
                            title: "Ascent reminder max",
                            value: DiveFormatters.ascentRate(summary.maxAscentRateMetersPerMinute)
                        )
                    }
                }

                InstrumentCard(accent: DiveWatchTheme.secondary) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("POST-DIVE REVIEW")
                            .font(DiveWatchTheme.labelFont())
                            .foregroundStyle(DiveWatchTheme.secondary)

                        Picker("Rating", selection: $rating) {
                            ForEach(1...5, id: \.self) { value in
                                Text("\(value) ★").tag(value)
                            }
                        }
                        .labelsHidden()
                        .frame(height: 56)

                        Picker("Exertion", selection: $perceivedExertion) {
                            ForEach(1...5, id: \.self) { value in
                                Text("Effort \(value)").tag(value)
                            }
                        }
                        .labelsHidden()
                        .frame(height: 56)

                        Picker("Visibility", selection: $visibilityRating) {
                            ForEach(1...5, id: \.self) { value in
                                Text("Vis \(value)").tag(value)
                            }
                        }
                        .labelsHidden()
                        .frame(height: 56)

                        Picker("Water", selection: $waterCondition) {
                            ForEach(WaterCondition.allCases) { condition in
                                Text(condition.label).tag(condition)
                            }
                        }
                        .labelsHidden()
                        .frame(height: 56)

                        TextField("Quick note", text: $notes)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(DiveWatchTheme.text)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 7)
                            .background(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(DiveWatchTheme.surfaceRaised.opacity(0.72))
                            )
                    }
                }

                Button {
                    onSave(
                        session.applyingPostDive(
                            rating: rating,
                            perceivedExertion: perceivedExertion,
                            visibilityRating: visibilityRating,
                            waterCondition: waterCondition,
                            notes: notes.isEmpty ? session.notes : notes
                        )
                    )
                } label: {
                    Label("Save", systemImage: "tray.and.arrow.down.fill")
                }
                .buttonStyle(DiveActionButtonStyle(kind: .primary))

                Button(role: .destructive) {
                    onDiscard()
                } label: {
                    Label("Discard", systemImage: "trash")
                }
                .buttonStyle(DiveActionButtonStyle(kind: .secondary))

                DiveDisclaimer(text: "SAVED LOG ONLY. NON-CERTIFIED ASSISTANT.")
            }
            .padding(.horizontal, DiveWatchTheme.edgeMargin)
            .padding(.vertical, 10)
        }
        .background(DiveWatchTheme.background.ignoresSafeArea())
        .navigationTitle("Summary")
        .onAppear {
            rating = session.rating ?? rating
            perceivedExertion = session.perceivedExertion ?? perceivedExertion
            visibilityRating = session.visibilityRating ?? visibilityRating
            waterCondition = session.waterCondition
            notes = session.notes ?? ""
        }
    }
}
