import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const source = [
  'DiveWatchApp/Views/DiveFormatters.swift',
  'DiveWatchApp/Views/RecordingView.swift',
  'DiveWatchApp/Views/SummaryView.swift',
  'DiveWatchApp/Views/SessionDetailView.swift',
  'DiveWatchApp/Views/SessionListView.swift',
  'DiveWatchApp/Views/HomeView.swift',
]
  .map(file => readFileSync(join(root, file), 'utf8'))
  .join('\n');

const checks = [
  {
    name: 'watch surfaces avoid decorative card borders',
    pattern: /DiveWatchTheme\.outline|borderColor|\.stroke\(color\.opacity\(0\.65\)/,
  },
  {
    name: 'recording keeps one prominent live metric',
    pattern: /MetricCard\(\s*title:\s*"Bottom Time"[\s\S]*prominent:\s*true/,
  },
  {
    name: 'ascent copy stays reminder/review-only, not an instruction',
    pattern: /Slow down|Reduce ascent rate/,
  },
  {
    name: 'watch UI does not use success or warning as visual brand states',
    pattern: /DiveWatchTheme\.(success|warning)/,
  },
];

const failures = checks.filter(check => check.pattern.test(source));

if (failures.length > 0) {
  console.error('Watch UI language check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}
