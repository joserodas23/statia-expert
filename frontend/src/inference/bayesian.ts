// Motor bayesiano — Naive Bayes con PDF gaussiana para variables numéricas
// by Jose Rodas

function gaussPdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 1.0;
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

export function inferirBayesiano(
  hechos: Record<string, any>,
  variables: any[],
  clases: any[],
): { conclusion: string; certeza: number }[] {
  const varMap = new Map(variables.map((v: any) => [v.nombre, v]));
  const scores: { nombre: string; score: number }[] = [];

  for (const cl of clases) {
    let score = parseFloat(cl.prior ?? 0.1);
    const probs      = cl.probs       ?? {};  // discretas: { "fiebre_si": 0.85 }
    const probsGauss = cl.probs_gauss ?? {};  // gaussianas: { "temp": { mu, sigma } }

    for (const [nombre, val] of Object.entries(hechos)) {
      if (val === undefined || val === '') continue;
      const varDef = varMap.get(nombre);
      if (!varDef) continue;

      if (varDef.tipo === 'numerico') {
        const g = probsGauss[nombre];
        if (g && parseFloat(g.sigma) > 0) {
          const p = gaussPdf(parseFloat(val as string), parseFloat(g.mu), parseFloat(g.sigma));
          score *= Math.max(p, 1e-10);
        }
      } else {
        const key = `${nombre}_${String(val).toLowerCase()}`;
        const p = parseFloat(probs[key] ?? 0.5);
        score *= Math.max(p, 1e-10);
      }
    }

    scores.push({ nombre: cl.nombre, score });
  }

  const total = scores.reduce((s, x) => s + x.score, 0);
  const result = scores.map(s => ({
    conclusion: s.nombre,
    certeza:    total > 0 ? Math.round((s.score / total) * 10000) / 10000 : 0,
  }));

  return result.sort((a, b) => b.certeza - a.certeza);
}
