import i18n, { resolveSupportedLanguage, supportedLanguages } from '../src/i18n';
import { formatDate, formatRating } from '../src/utils/dive-formatters';

describe('mobile i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ko');
  });

  test('uses Korean fallback and ships Korean and English resources', () => {
    expect(i18n.options.fallbackLng).toEqual(['ko']);
    expect(supportedLanguages).toEqual(['ko', 'en']);

    expect(i18n.t('navigation.logbook')).toBe('로그북');
    expect(i18n.getResource('en', 'translation', 'navigation.logbook')).toBe('Logbook');
  });

  test('resolves only supported device language codes', () => {
    expect(resolveSupportedLanguage('ko-KR')).toBe('ko');
    expect(resolveSupportedLanguage('en-US')).toBe('en');
    expect(resolveSupportedLanguage('ja-JP')).toBe('ko');
    expect(resolveSupportedLanguage()).toBe('ko');
  });

  test('formats fallback labels with the active translation copy', () => {
    expect(formatDate(undefined, i18n.language, i18n.t('formatters.unknownDate'))).toBe('알 수 없는 날짜');
    expect(formatRating(undefined, i18n.t('formatters.notRated'))).toBe('평가 없음');
  });
});
