import { describe, expect, it } from 'vitest';
import { fixtureServices } from '../test/fixtures';
import { searchServices } from './search';

describe('searchServices', () => {
  it('matches nothing for a blank query', () => {
    expect(searchServices(fixtureServices, '')).toEqual([]);
    expect(searchServices(fixtureServices, '   ')).toEqual([]);
  });

  it('matches names case-insensitively', () => {
    expect(searchServices(fixtureServices, 'LAMBDA')).toEqual(['lambda']);
  });

  it('matches taglines and full names', () => {
    expect(searchServices(fixtureServices, 'nosql')).toEqual(['ddb']);
    expect(searchServices(fixtureServices, 'amazon s3')).toEqual(['s3']);
  });

  it('requires every word to match', () => {
    expect(searchServices(fixtureServices, 'serverless code')).toEqual(['lambda']);
  });

  it('ranks name matches above tagline matches', () => {
    // Several taglines contain "s", but only S3's name starts with it
    expect(searchServices(fixtureServices, 's')[0]).toBe('s3');
  });

  it('ignores punctuation', () => {
    expect(searchServices(fixtureServices, 'api-gateway')).toEqual(['apigw']);
  });
});
