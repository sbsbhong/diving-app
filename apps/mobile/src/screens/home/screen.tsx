import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
import { SessionProfile } from '../../components/ui/session-profile';
import { diveTheme } from '../../components/ui/theme';
import type { MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDepth, formatDuration } from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type HomeScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
  onOpenPlanning: () => void;
  onOpenMemory: () => void;
};

export default function HomeScreen(props: HomeScreenProps): React.JSX.Element {
  const recentSession = props.sessions[0];
  const recentSummary = recentSession ? summarizeSession(recentSession) : undefined;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <DiveSummaryCard accent={diveTheme.colors.primary}>
        <HStack style={styles.headerRow}>
          <StatusPill label="Watch assistant" />
          <HStack gap={4} style={styles.logCount}>
            <Text style={styles.logCountValue}>{props.sessions.length}</Text>
            <Text style={styles.logCountLabel}>logs</Text>
          </HStack>
        </HStack>
        <VStack gap={6}>
          <Text style={styles.heading}>DiveMobile</Text>
          <Text style={styles.description}>Recreational watch log review. Non-certified assistant.</Text>
        </VStack>
      </DiveSummaryCard>

      <DiveSummaryCard accent={diveTheme.colors.primary}>
        <DiveSummaryCard.Header
          eyebrow="Latest watch import"
          title={recentSession?.siteName ?? 'Import a watch dive'}
          right={<StatusPill label={recentSession?.syncStatus ?? 'pending'} tone="secondary" />}
        />
        <DiveSummaryCard.Body>
          <DiveSummaryCard.Metric label="Date" value={formatDate(recentSession?.startedAt)} />
          <SessionProfile samples={recentSession?.samples ?? []} kind="depth" title="Depth profile" />
        </DiveSummaryCard.Body>
      </DiveSummaryCard>

      <HStack gap={12}>
        <MetricTile label="Max depth" value={formatDepth(recentSummary?.maxDepthMeters)} />
        <MetricTile label="Bottom time" value={formatDuration(recentSummary?.durationSeconds ?? 0)} />
      </HStack>

      <DiveSummaryCard accent={diveTheme.colors.success}>
        <HStack gap={14} style={styles.assistantLayout}>
          <AssistantRing />
          <VStack gap={7} style={styles.assistantText}>
            <StatusPill label="Assistant steady" tone="success" />
            <Text style={styles.sectionLabel}>Safety assistant</Text>
            <Text style={styles.description}>Monitoring reminders from watch logs.</Text>
          </VStack>
        </HStack>
        <DiveSummaryCard.Metric label="Ascent" value="Review only" />
        <DiveSummaryCard.Metric label="Safety stop" value="Planning reminder" />
      </DiveSummaryCard>

      <VStack gap={10}>
        <InstrumentButton label="Open Logbook" variant="primary" onPress={props.onOpenLogbook} />
        <InstrumentButton label="Plan Next Dive" onPress={props.onOpenPlanning} />
        <InstrumentButton label="Preview Memory" onPress={props.onOpenMemory} />
      </VStack>

      <SafetyText>RECREATIONAL USE ONLY. NON-CERTIFIED ASSISTANT.</SafetyText>
    </ScrollView>
  );
}

function MetricTile(props: { label: string; value: string }): React.JSX.Element {
  return (
    <DiveSummaryCard style={styles.metricTile}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </DiveSummaryCard>
  );
}

function AssistantRing(): React.JSX.Element {
  return (
    <VStack style={styles.ring}>
      <Text style={styles.ringValue}>OK</Text>
      <Text style={styles.ringLabel}>ASSIST</Text>
    </VStack>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: diveTheme.colors.background,
  },
  container: {
    gap: 14,
    paddingHorizontal: diveTheme.spacing.screen,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logCount: {
    alignItems: 'baseline',
  },
  logCountValue: {
    color: diveTheme.colors.primary,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 22,
    fontWeight: '900',
  },
  logCountLabel: {
    color: diveTheme.colors.mutedText,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heading: {
    color: diveTheme.colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  description: {
    color: diveTheme.colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  metricTile: {
    flex: 1,
  },
  metricLabel: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: diveTheme.colors.text,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 24,
    fontWeight: '900',
  },
  assistantLayout: {
    alignItems: 'center',
  },
  assistantText: {
    flex: 1,
  },
  sectionLabel: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    borderWidth: 7,
    borderColor: diveTheme.colors.success,
    borderRadius: 38,
    backgroundColor: diveTheme.colors.surfaceRaised,
  },
  ringValue: {
    color: diveTheme.colors.success,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 20,
    fontWeight: '900',
  },
  ringLabel: {
    color: diveTheme.colors.mutedText,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
