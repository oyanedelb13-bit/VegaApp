function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function levenshteinSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

export function fuzzyMatch(input, options, threshold = 0.6) {
  const normalized = normalize(input);

  const scores = options.map(opt => {
    const optNormalized = normalize(opt);
    let bestScore = 0;

    if (optNormalized.includes(normalized) || normalized.includes(optNormalized)) {
      bestScore = Math.max(bestScore, 0.9);
    }

    if (optNormalized.startsWith(normalized)) {
      bestScore = Math.max(bestScore, 0.95);
    }

    const similarity = levenshteinSimilarity(normalized, optNormalized);
    bestScore = Math.max(bestScore, similarity);

    return { option: opt, score: bestScore };
  });

  const sorted = scores
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return sorted.length > 0 ? sorted[0].option : null;
}

export function findMatchingProduct(input, productos) {
  const allNames = [];

  productos.forEach(p => {
    allNames.push(p.nombre);
    if (p.nombreVariantes) {
      allNames.push(...p.nombreVariantes);
    }
  });

  const matched = fuzzyMatch(input, allNames, 0.5);

  if (matched) {
    return productos.find(p =>
      p.nombre === matched ||
      (p.nombreVariantes && p.nombreVariantes.includes(matched))
    );
  }

  return null;
}
