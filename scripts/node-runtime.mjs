export function supportsNodeVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) return false;
  const [major, minor, patch] = version.split(".").map(Number);
  const minimum = new Map([
    [22, [23, 4]],
    [24, [22, 1]],
    [26, [12, 1]],
  ]).get(major);
  return !!minimum &&
    (minor > minimum[0] || (minor === minimum[0] && patch >= minimum[1]));
}

export function assertSupportedNodeVersion(version) {
  if (!supportsNodeVersion(version)) {
    throw new Error(`Node.js 22.23.4 / 24.22.1 / 26.12.1 以降の各対応系列が必要です（現在: ${version}）`);
  }
}
