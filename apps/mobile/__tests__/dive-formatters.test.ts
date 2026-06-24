import { formatDepth, formatLength, formatTemperature } from '../src/utils/dive-formatters';

describe('dive formatters', () => {
  it('rounds floating point display values at the third decimal place', () => {
    expect(formatDepth(0.29392323)).toBe('0.29 m');
    expect(formatDepth(18.995)).toBe('19.00 m');
    expect(formatLength(25.125)).toBe('25.13 m');
    expect(formatTemperature(21.236)).toBe('21.24 °C');
  });
});
