// Motor difuso — membresía trapezoidal/triangular + firing strength mínimo
// by Jose Rodas

function membership(value: number, conjunto: any): number {
  const tipo = conjunto.tipo ?? 'trapezoidal';
  const pts  = (conjunto.puntos ?? []).map(Number);

  if (tipo === 'triangular' && pts.length >= 3) {
    const [a, b, c] = pts;
    if (value <= a || value >= c) return 0;
    return value <= b ? (value - a) / (b - a) : (c - value) / (c - b);
  }

  if (tipo === 'trapezoidal' && pts.length >= 4) {
    const [a, b, c, d] = pts;
    if (value <= a || value >= d) return 0;
    if (value >= b && value <= c) return 1;
    return value < b ? (value - a) / (b - a) : (d - value) / (d - c);
  }

  return 0;
}

function membershipCat(value: string, conjunto: any): number {
  return String(value).toLowerCase() === String(conjunto.valor ?? '').toLowerCase() ? 1 : 0;
}

export function inferirFuzzy(
  hechos: Record<string, any>,
  variables: any[],
  reglas: any[],
): { conclusion: string; certeza: number; firing: number; explicacion: string }[] {
  const varMap = new Map(variables.map((v: any) => [v.nombre, v]));
  const resultados: { conclusion: string; certeza: number; firing: number; explicacion: string }[] = [];

  for (const r of reglas) {
    const grados: number[] = [];

    for (const cond of (r.condiciones ?? [])) {
      const varDef = varMap.get(cond.var);
      if (!varDef) { grados.push(0); continue; }

      const conjunto = (varDef.conjuntos ?? []).find((c: any) => c.nombre === cond.conjunto);
      if (!conjunto) { grados.push(0); continue; }

      const val = hechos[cond.var];
      if (val === undefined || val === '') { grados.push(0); continue; }

      grados.push(
        varDef.tipo === 'numerico'
          ? membership(parseFloat(val), conjunto)
          : membershipCat(String(val), conjunto),
      );
    }

    if (!grados.length) continue;
    const firing  = Math.min(...grados);
    const certeza = Math.round(firing * parseFloat(r.peso ?? 1.0) * 10000) / 10000;
    if (certeza > 0) {
      resultados.push({ conclusion: r.conclusion, certeza, firing: Math.round(firing * 10000) / 10000, explicacion: r.explicacion ?? '' });
    }
  }

  return resultados.sort((a, b) => b.certeza - a.certeza);
}
