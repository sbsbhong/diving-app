import React from 'react';
import Providers from '../src/providers';
import { colors } from '../components/ui/gluestack-ui-provider/config';

const readSource = (...segments: string[]) => {
  const nodeRequire = eval('require') as (moduleName: string) => {
    readFileSync: (filePath: string, encoding: 'utf8') => string;
  };
  const fs = nodeRequire('fs');
  const cwd = (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();

  return fs.readFileSync(`${cwd}/${segments.join('/')}`, 'utf8');
};

describe('Apple design system mapping', () => {
  test('maps Gluestack semantic light tokens to the Apple-inspired palette', () => {
    expect(colors.light['--primary']).toBe('0 102 204');
    expect(colors.light['--primary-foreground']).toBe('255 255 255');
    expect(colors.light['--background']).toBe('245 245 247');
    expect(colors.light['--foreground']).toBe('29 29 31');
    expect(colors.light['--card']).toBe('255 255 255');
    expect(colors.light['--card-foreground']).toBe('29 29 31');
    expect(colors.light['--muted']).toBe('245 245 247');
    expect(colors.light['--muted-foreground']).toBe('122 122 122');
    expect(colors.light['--ring']).toBe('0 113 227');
  });

  test('uses light mode as the default mobile surface', () => {
    const root = Providers({ children: null }) as React.ReactElement<{
      children: React.ReactElement<{ mode?: string }>;
    }>;

    expect(root.props.children.props.mode).toBe('light');
  });

  test('keeps mobile screens within the Apple-style UI rules from DESIGN.md', () => {
    const source = [
      readSource('src', 'screens', 'home', 'screen.tsx'),
      readSource('src', 'screens', 'logbook', 'screen.tsx'),
      readSource('src', 'screens', 'planning', 'screen.tsx'),
      readSource('src', 'screens', 'memory', 'screen.tsx'),
      readSource('src', 'components', 'navigation', 'index.tsx'),
      readSource('src', 'components', 'ui', 'dive-summary-card.tsx'),
      readSource('src', 'components', 'ui', 'instrument.tsx'),
      readSource('src', 'components', 'ui', 'session-profile.tsx'),
    ].join('\n');

    expect(source).not.toMatch(/font-(mono|black|extrabold)/);
    expect(source).not.toMatch(/border-8/);
    expect(source).not.toMatch(/border border|border-t border|border-transparent/);
    expect(source).not.toMatch(/accent="(success|warning)"/);
    expect(source).not.toMatch(/tone="(success|warning)"/);
  });
});
