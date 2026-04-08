export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

export function checkUpgrade(app, currentVersion) {
  if (!app) return null;

  const { minimumSupportedVersion, minimumRecommendedVersion, url } = app;

  if (minimumSupportedVersion && compareVersions(currentVersion, minimumSupportedVersion) < 0) {
    return {
      type: 'forced',
      title: 'Update Required',
      message: 'This version is no longer supported. Please update to continue using the app.',
      url,
      minimumSupportedVersion,
      minimumRecommendedVersion: minimumRecommendedVersion || null,
    };
  }

  if (minimumRecommendedVersion && compareVersions(currentVersion, minimumRecommendedVersion) < 0) {
    return {
      type: 'suggested',
      title: 'Update Available',
      message: 'A new version is available with improvements and bug fixes.',
      url,
      minimumSupportedVersion: minimumSupportedVersion || null,
      minimumRecommendedVersion,
    };
  }

  return null;
}
