import { LocalDiveLogRepository } from '../src/repositories/local-dive-log-repository';
import { diveLogbookQueryKeys, getDiveLogbookQueryScope } from '../src/states/use-dive-logbook-queries';

describe('dive logbook query keys', () => {
  it('automatically scopes default keys by repository instance', () => {
    const firstRepository = new LocalDiveLogRepository();
    const secondRepository = new LocalDiveLogRepository();

    const firstScope = getDiveLogbookQueryScope(firstRepository);
    const secondScope = getDiveLogbookQueryScope(secondRepository);

    expect(firstScope).not.toBe(secondScope);
    expect(diveLogbookQueryKeys.list(firstRepository)).toEqual(['diveLogbook', firstScope, 'list']);
    expect(diveLogbookQueryKeys.list(secondRepository)).toEqual(['diveLogbook', secondScope, 'list']);
  });

  it('allows an explicit query scope when a caller needs stable ownership', () => {
    const repository = new LocalDiveLogRepository();

    expect(diveLogbookQueryKeys.list(repository, 'custom-scope')).toEqual(['diveLogbook', 'custom-scope', 'list']);
    expect(diveLogbookQueryKeys.detail('entry-1', repository, 'custom-scope')).toEqual([
      'diveLogbook',
      'custom-scope',
      'detail',
      'entry-1',
    ]);
  });
});
