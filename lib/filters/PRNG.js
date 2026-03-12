const PRNG = (items, multiplier = 1) => {
  let s = (items.reduce((acc, item) => acc + item.id, 0) * multiplier) >>> 0;
  const rand = () => {
    s = Math.imul(s ^ s >>> 15, 1 | s);
    s ^= s + Math.imul(s ^ s >>> 7, 61 | s);
    return ((s ^ s >>> 14) >>> 0) / 4294967296;
  };

  const colors = [1, 2, 3, 4, 5];
  const patterns = [1, 2, 3];
  let lastPair = [null, null];
  let lastPattern = null;

  return items.map(() => {
    const availablePrimary = colors.filter(v => !lastPair.includes(v));
    const primary = availablePrimary[Math.floor(rand() * availablePrimary.length)];

    const availableSecondary = colors.filter(v => v !== primary && !lastPair.includes(v));
    const secondary = availableSecondary[Math.floor(rand() * availableSecondary.length)];

    const availablePatterns = patterns.filter(p => p !== lastPattern);
    const pattern = availablePatterns[Math.floor(rand() * availablePatterns.length)];

    lastPair = [primary, secondary];
    lastPattern = pattern;

    return { primary, secondary, pattern };
  });
};

export default PRNG;