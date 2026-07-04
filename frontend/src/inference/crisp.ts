// Motor crisp — reglas clásicas (AND de condiciones exactas)
// by Jose Rodas

const OPS: Record<string, (a: any, b: any) => boolean> = {
  '>':  (a, b) => parseFloat(a) > parseFloat(b),
  '<':  (a, b) => parseFloat(a) < parseFloat(b),
  '>=': (a, b) => parseFloat(a) >= parseFloat(b),
  '<=': (a, b) => parseFloat(a) <= parseFloat(b),
  '==': (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
  '!=': (a, b) => String(a).toLowerCase() !== String(b).toLowerCase(),
};

export function inferirCrisp(
  hechos: Record<string, any>,
  reglas: any[],
): { conclusion: string; certeza: number; explicacion: string }[] {
  const resultados: { conclusion: string; certeza: number; explicacion: string }[] = [];

  for (const r of reglas) {
    const activada = (r.condiciones || []).every(
      (c: any) => OPS[c.op]?.(hechos[c.var] ?? '', c.val) ?? false,
    );
    if (activada) {
      resultados.push({
        conclusion:  r.conclusion,
        certeza:     parseFloat(r.peso ?? 1.0),
        explicacion: r.explicacion ?? '',
      });
    }
  }

  return resultados.sort((a, b) => b.certeza - a.certeza);
}
