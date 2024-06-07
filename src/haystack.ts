// Detect refs using @ prefix
export function isRef(value: string): boolean {
  return value.startsWith('@');
}

// Converts a string into ref components by detecting the first space. Assumes format `@id "dis"`
export function parseRef(value: string): { id: string; dis: string | null } {
  let id = value;
  let dis: string | null = null;
  const spaceIndex = value.indexOf(' ');

  if (spaceIndex > -1) {
    // Display name exists
    id = value.substring(0, spaceIndex);
    // Cut off leading and trailing quotes
    dis = value.substring(spaceIndex + 2, value.length - 1);
  }
  return { id: id, dis: dis };
}
