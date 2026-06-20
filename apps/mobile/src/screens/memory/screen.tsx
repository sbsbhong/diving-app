import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
import { SessionProfile } from '../../components/ui/session-profile';
import { diveTheme } from '../../components/ui/theme';
import type { MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDepth, formatDuration, formatRating } from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type MemoryScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
};

export default function MemoryScreen(props: MemoryScreenProps): React.JSX.Element {
  const session = props.sessions[0];
  const summary = session ? summarizeSession(session) : undefined;
  const totalDuration = props.sessions.reduce((sum, currentSession) => {
    return sum + summarizeSession(currentSession).durationSeconds;
  }, 0);
  const averageMaxDepth =
    props.sessions.length === 0
      ? undefined
      : props.sessions.reduce((sum, currentSession) => {
          return sum + summarizeSession(currentSession).maxDepthMeters;
        }, 0) / props.sessions.length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <VStack gap={14}>
        <VStack gap={7}>
          <HStack style={styles.headerRow}>
            <StatusPill label="Memory" />
            <StatusPill label="Static" tone="secondary" />
          </HStack>
          <Text style={styles.heading}>Share Card Preview</Text>
          <Text style={styles.muted}>Preview a recreational log story from watch data.</Text>
        </VStack>

        <DiveSummaryCard accent={diveTheme.colors.success}>
          <DiveSummaryCard.Header
            eyebrow="Static preview"
            title={session?.siteName ?? 'Import a dive'}
            right={<Text style={styles.dateText}>{formatDate(session?.startedAt)}</Text>}
          />
          <DiveSummaryCard.Body>
            <HStack gap={10}>
              <ShareMetric label="Max" value={formatDepth(summary?.maxDepthMeters)} />
              <ShareMetric label="Time" value={formatDuration(summary?.durationSeconds ?? 0)} />
            </HStack>
            <SessionProfile samples={session?.samples ?? []} kind="depth" title="Depth profile" />
            <HStack style={styles.shareFooter}>
              <Text style={styles.rating}>{formatRating(session?.rating)}</Text>
              <Text style={styles.tags}>{session?.tags?.join(' · ') ?? 'shore · calm · training'}</Text>
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent={diveTheme.colors.secondary}>
          <DiveSummaryCard.Header eyebrow="Export status" title="Future workflow" />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label="Image render" value="Placeholder" />
            <DiveSummaryCard.Metric label="Social sharing" value="Separate spec" />
            <DiveSummaryCard.Metric label="Media workflow" value={`${session?.mediaPlaceholders.length ?? 0} placeholders`} />
            <DiveSummaryCard.Metric label="Color correction" value="Research only" />
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent={diveTheme.colors.primary}>
          <DiveSummaryCard.Header eyebrow="Safe analytics" title="Review summaries" />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label="Logged dives" value={`${props.sessions.length}`} />
            <DiveSummaryCard.Metric label="Total bottom time" value={formatDuration(totalDuration)} />
            <DiveSummaryCard.Metric label="Avg max depth" value={formatDepth(averageMaxDepth)} />
            <DiveSummaryCard.Metric label="Favorite mode" value={session?.diveMode ?? 'Recreational'} />
          </DiveSummaryCard.Body>
          <DiveSummaryCard.Footer>
            <Text style={styles.muted}>Review-only summaries. Non-certified assistant.</Text>
          </DiveSummaryCard.Footer>
        </DiveSummaryCard>

        <VStack gap={10}>
          <InstrumentButton label="Save Preview" variant="primary" onPress={() => undefined} />
          <InstrumentButton label="Open Logbook" onPress={props.onOpenLogbook} />
        </VStack>

        <SafetyText>MEMORY REVIEW ONLY. NON-CERTIFIED ASSISTANT.</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function ShareMetric(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack gap={4} style={styles.shareMetric}>
      <Text style={styles.shareMetricLabel}>{props.label}</Text>
      <Text style={styles.shareMetricValue}>{props.value}</Text>
    </VStack>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: diveTheme.colors.background,
  },
  content: {
    padding: diveTheme.spacing.screen,
    paddingBottom: 18,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    color: diveTheme.colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  muted: {
    color: diveTheme.colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  dateText: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 12,
    fontWeight: '900',
  },
  shareMetric: {
    flex: 1,
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.control,
    backgroundColor: diveTheme.colors.surfaceRaised,
    padding: 12,
  },
  shareMetricLabel: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  shareMetricValue: {
    color: diveTheme.colors.text,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 22,
    fontWeight: '900',
  },
  shareFooter: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: {
    color: diveTheme.colors.warning,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 14,
    fontWeight: '900',
  },
  tags: {
    flex: 1,
    color: diveTheme.colors.mutedText,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'right',
  },
});
