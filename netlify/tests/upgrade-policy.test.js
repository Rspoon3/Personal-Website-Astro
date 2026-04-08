import { compareVersions, checkUpgrade } from '../helpers/upgrade_check.js';
import { handler } from '../functions/upgrade_policy.js';

const makeEvent = (method, params = {}) => ({
  httpMethod: method,
  queryStringParameters: params,
});

const appWithBoth = {
  minimumSupportedVersion: '2.0.0',
  minimumRecommendedVersion: '3.0.0',
  url: 'https://apps.apple.com/app/id123',
};

const appRecommendedOnly = {
  minimumRecommendedVersion: '2.0.0',
  url: 'https://apps.apple.com/app/id456',
};

describe('compareVersions', () => {
  test('equal versions return 0', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  test('less than returns -1', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('1.2.0', '1.3.0')).toBe(-1);
    expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
  });

  test('greater than returns 1', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.3.0', '1.2.0')).toBe(1);
  });

  test('handles different segment lengths', () => {
    expect(compareVersions('2', '2.0.0')).toBe(0);
    expect(compareVersions('1', '1.0.1')).toBe(-1);
    expect(compareVersions('2.0.0', '2')).toBe(0);
  });

  test('handles year-based versions', () => {
    expect(compareVersions('2021.3', '2025.4')).toBe(-1);
    expect(compareVersions('2025.4', '2021.3')).toBe(1);
    expect(compareVersions('2025.4', '2025.4')).toBe(0);
    expect(compareVersions('2025.3', '2025.4')).toBe(-1);
  });
});

describe('checkUpgrade', () => {
  test('returns null for null app', () => {
    expect(checkUpgrade(null, '1.0.0')).toBeNull();
  });

  test('returns null for undefined app', () => {
    expect(checkUpgrade(undefined, '1.0.0')).toBeNull();
  });

  // Forced upgrade tests
  test('returns forced when below minimumSupportedVersion', () => {
    const result = checkUpgrade(appWithBoth, '1.0.0');
    expect(result.type).toBe('forced');
    expect(result.minimumSupportedVersion).toBe('2.0.0');
    expect(result.minimumRecommendedVersion).toBe('3.0.0');
  });

  test('returns suggested when at minimumSupportedVersion but below recommended', () => {
    const result = checkUpgrade(appWithBoth, '2.0.0');
    expect(result.type).toBe('suggested');
  });

  test('returns null when at minimumRecommendedVersion', () => {
    expect(checkUpgrade(appWithBoth, '3.0.0')).toBeNull();
  });

  test('returns null when above minimumRecommendedVersion', () => {
    expect(checkUpgrade(appWithBoth, '4.0.0')).toBeNull();
  });

  // Recommended-only tests
  test('returns suggested when below recommended (no supported set)', () => {
    const result = checkUpgrade(appRecommendedOnly, '1.0.0');
    expect(result.type).toBe('suggested');
    expect(result.minimumSupportedVersion).toBeNull();
  });

  test('returns null when at recommended (no supported set)', () => {
    expect(checkUpgrade(appRecommendedOnly, '2.0.0')).toBeNull();
  });
});

describe('handler', () => {
  test('returns 200 for OPTIONS', async () => {
    const res = await handler(makeEvent('OPTIONS'));
    expect(res.statusCode).toBe(200);
  });

  test('returns 405 for POST', async () => {
    const res = await handler(makeEvent('POST'));
    expect(res.statusCode).toBe(405);
  });

  test('returns 400 when bundleId is missing', async () => {
    const res = await handler(makeEvent('GET', { currentVersion: '1.0.0' }));
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when currentVersion is missing', async () => {
    const res = await handler(makeEvent('GET', { bundleId: 'com.Math-Flash' }));
    expect(res.statusCode).toBe(400);
  });

  test('returns 204 for unknown bundle ID', async () => {
    const res = await handler(makeEvent('GET', { bundleId: 'com.unknown', currentVersion: '1.0.0' }));
    expect(res.statusCode).toBe(204);
  });

  test('returns suggested for Math Flash below recommended', async () => {
    const res = await handler(makeEvent('GET', { bundleId: 'com.Math-Flash', currentVersion: '2.0.0' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).type).toBe('suggested');
  });

  test('returns 204 for Math Flash at recommended', async () => {
    const res = await handler(makeEvent('GET', { bundleId: 'com.Math-Flash', currentVersion: '2.4.0' }));
    expect(res.statusCode).toBe(204);
  });
});
