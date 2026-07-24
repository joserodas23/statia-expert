import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import VariableNode     from '../components/nodes/VariableNode';
import RuleNode         from '../components/nodes/RuleNode';
import OutputNode       from '../components/nodes/OutputNode';
import IntermediateNode from '../components/nodes/IntermediateNode';
import { useStore } from '../store/useStore';
import type { Sesion } from '../lib/auth';
import { inferirCrispApi, inferirFuzzyApi, inferirBayesianoApi } from '../api';
import AdminPanel from '../components/AdminPanel';

const nodeTypes = { variable: VariableNode, regla: RuleNode, output: OutputNode, intermedio: IntermediateNode };

// Evalúa qué reglas dispararon (crisp: exacto; difuso/bayesiano: por conclusión)
function detectarReglasFired(
  reglas: any[],
  hechos: Record<string, any>,
  resultados: any[],
  tipoMotor: string,
): Map<string, number> {
  const firedMap = new Map<string, number>(); // ruleId → firingStrength

  if (tipoMotor === 'crisp') {
    const OPS: Record<string, (a: any, b: any) => boolean> = {
      '>':  (a, b) => parseFloat(a) > parseFloat(b),
      '<':  (a, b) => parseFloat(a) < parseFloat(b),
      '>=': (a, b) => parseFloat(a) >= parseFloat(b),
      '<=': (a, b) => parseFloat(a) <= parseFloat(b),
      '==': (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
      '!=': (a, b) => String(a).toLowerCase() !== String(b).toLowerCase(),
    };
    reglas.forEach((r: any) => {
      const fired = r.condiciones.every((c: any) => OPS[c.op]?.(hechos[c.var], c.val) ?? false);
      if (fired) firedMap.set(r.id, r.peso ?? 1.0);
    });
  } else {
    // difuso/bayesiano: si la conclusión está en resultados, la regla contribuyó
    const resMap = new Map(resultados.map((r: any) => [r.conclusion, r.certeza ?? r.firing ?? 0]));
    reglas.forEach((r: any) => {
      const strength = resMap.get(r.conclusion);
      if (strength !== undefined && strength > 0) firedMap.set(r.id, strength);
    });
  }
  return firedMap;
}

// Inferencia pura en cliente para modelos con capas (forward chaining)
function inferirCapas(
  hechosIniciales: Record<string, any>,
  capas: any[],
): { intermedios: Record<string, string>; resultados: any[]; firedByLayer: Map<string, Map<string, number>> } {
  const OPS: Record<string, (a: any, b: any) => boolean> = {
    '>':  (a, b) => parseFloat(a) > parseFloat(b),
    '<':  (a, b) => parseFloat(a) < parseFloat(b),
    '>=': (a, b) => parseFloat(a) >= parseFloat(b),
    '<=': (a, b) => parseFloat(a) <= parseFloat(b),
    '==': (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
    '!=': (a, b) => String(a).toLowerCase() !== String(b).toLowerCase(),
  };
  const hechos = { ...hechosIniciales };
  const intermedios: Record<string, string> = {};
  const firedByLayer = new Map<string, Map<string, number>>();
  const dimCapas = capas.slice(0, -1);
  const integCapa = capas[capas.length - 1];

  for (const capa of dimCapas) {
    const fired = new Map<string, number>();
    let bestPeso = -1; let bestConclusion = '';
    for (const r of capa.reglas) {
      const ok = r.condiciones.every((c: any) => OPS[c.op]?.(hechos[c.var], c.val) ?? false);
      if (ok) {
        fired.set(r.id, r.peso ?? 1.0);
        if ((r.peso ?? 1.0) > bestPeso) { bestPeso = r.peso ?? 1.0; bestConclusion = r.conclusion; }
      }
    }
    firedByLayer.set(capa.id, fired);
    if (bestConclusion) { intermedios[capa.variable_salida] = bestConclusion; hechos[capa.variable_salida] = bestConclusion; }
  }

  const integFired = new Map<string, number>();
  const certezaMap = new Map<string, number>();
  for (const r of integCapa.reglas) {
    const ok = r.condiciones.every((c: any) => OPS[c.op]?.(hechos[c.var], c.val) ?? false);
    if (ok) {
      integFired.set(r.id, r.peso ?? 1.0);
      const curr = certezaMap.get(r.conclusion) ?? 0;
      if ((r.peso ?? 1.0) > curr) certezaMap.set(r.conclusion, r.peso ?? 1.0);
    }
  }
  firedByLayer.set(integCapa.id, integFired);
  const resultados = [...certezaMap.entries()].map(([conclusion, certeza]) => ({ conclusion, certeza }));
  return { intermedios, resultados, firedByLayer };
}

export default function Editor({ usuario, onCerrarSesion }: { usuario: Sesion; onCerrarSesion: () => void }) {
  const { modeloActual, nodes, edges, onNodesChange, onEdgesChange, onConnect,
          setNodes, setEdges, resultados, setResultados } = useStore();
  const [hechos, setHechosState] = useState<Record<string, string>>(() => (modeloActual as any)?.hechos_ejemplo ?? {});
  const [cargando, setCargando]  = useState(false);
  const [panelAbierto, setPanelAbierto] = useState<'variables' | 'reglas' | 'consulta' | null>('consulta');
  const [inferenciaDone, setInferenciaDone] = useState(false);
  const [adminPanel, setAdminPanel] = useState(false);

  if (!modeloActual) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
      ← Selecciona un modelo desde el inicio
    </div>
  );

  const sincronizarNodos = useCallback((
    hechosActual: Record<string, any> = {},
    firedMap: Map<string, number>     = new Map(),
    resultadosActual: any[]           = [],
  ) => {
    const vars   = modeloActual.variables || [];
    const reglas = modeloActual.reglas    || [];

    const COL = { v: 40, r: 420, o: 820 };
    const GAP = { v: 170, r: 200, o: 160 };

    // ── Variable nodes — centrados verticalmente ──
    const totalVarH = Math.max(vars.length * GAP.v, reglas.length * GAP.r);
    const varStartY = (totalVarH - (vars.length - 1) * GAP.v) / 2;

    const varNodes: Node[] = vars.map((v: any, i: number) => ({
      id: `var-${v.id}`,
      type: 'variable',
      position: { x: COL.v, y: Math.max(40, varStartY) + i * GAP.v },
      data: { ...v, valorActual: hechosActual[v.nombre] },
    }));

    // ── Rule nodes ──
    const ruleNodes: Node[] = reglas.map((r: any, i: number) => {
      const strength = firedMap.get(r.id);
      return {
        id: `rule-${r.id}`,
        type: 'regla',
        position: { x: COL.r, y: 40 + i * GAP.r },
        data: { ...r, fired: strength !== undefined, firingStrength: strength },
      };
    });

    // ── Output labels ──
    let outLabels: string[] = [];
    if (modeloActual.tipo_motor === 'bayesiano') {
      outLabels = (modeloActual.clases || []).map((c: any) => c.nombre);
    } else {
      outLabels = [...new Set(reglas.map((r: any) => r.conclusion as string))];
    }

    // Posición Y de cada output = promedio Y de las reglas que apuntan a él
    const ruleYs = reglas.map((_: any, i: number) => 40 + i * GAP.r);
    const outYMap = new Map<string, number>();
    outLabels.forEach((label: string) => {
      const linkedYs = reglas
        .map((r: any, i: number) => (r.conclusion === label ? ruleYs[i] : null))
        .filter((y): y is number => y !== null);
      const avg = linkedYs.length > 0 ? linkedYs.reduce((a, b) => a + b, 0) / linkedYs.length : 40;
      outYMap.set(label, avg);
    });

    // Separar outputs que colisionen (min 170px entre sí)
    const sortedLabels = [...outLabels].sort((a, b) => (outYMap.get(a) ?? 0) - (outYMap.get(b) ?? 0));
    sortedLabels.forEach((label, i) => {
      if (i > 0) {
        const prev = outYMap.get(sortedLabels[i - 1]) ?? 0;
        const curr = outYMap.get(label) ?? 0;
        if (curr - prev < 170) outYMap.set(label, prev + 170);
      }
    });

    const maxCerteza = resultadosActual.length > 0
      ? Math.max(...resultadosActual.map((r: any) => r.certeza ?? r.firing ?? 0))
      : -1;

    const outNodes: Node[] = outLabels.map((label: string) => {
      const res     = resultadosActual.find((r: any) => r.conclusion === label);
      const certeza = res ? (res.certeza ?? res.firing ?? 0) : undefined;
      return {
        id: `out-${label}`,
        type: 'output',
        position: { x: COL.o, y: outYMap.get(label) ?? 40 },
        data: { label, certeza, esGanador: certeza !== undefined && certeza === maxCerteza && certeza > 0 },
      };
    });

    // ── Edges ──
    const newEdges: Edge[] = [];

    vars.forEach((v: any) => {
      reglas.forEach((r: any) => {
        if (!r.condiciones.some((c: any) => c.var === v.nombre)) return;
        const fired = firedMap.has(r.id);
        newEdges.push({
          id: `e-v${v.id}-r${r.id}`,
          source: `var-${v.id}`,
          target: `rule-${r.id}`,
          type: 'default',
          animated: fired,
          style: { stroke: fired ? '#818cf8' : 'rgba(99,102,241,0.18)', strokeWidth: fired ? 2.5 : 1 },
        });
      });
    });

    reglas.forEach((r: any) => {
      const fired = firedMap.has(r.id);
      newEdges.push({
        id: `e-r${r.id}-o${r.conclusion}`,
        source: `rule-${r.id}`,
        target: `out-${r.conclusion}`,
        type: 'default',
        animated: fired,
        style: { stroke: fired ? '#4fffb0' : 'rgba(79,255,176,0.12)', strokeWidth: fired ? 3 : 1 },
      });
    });

    setNodes([...varNodes, ...ruleNodes, ...outNodes]);
    setEdges(newEdges);
  }, [modeloActual, setNodes, setEdges]);

  const sincronizarNodosCapas = useCallback((
    hechosActual: Record<string, any> = {},
    intermediosActual: Record<string, string> = {},
    firedByLayer: Map<string, Map<string, number>> = new Map(),
    resultadosActual: any[] = [],
  ) => {
    const capas: any[] = (modeloActual as any).capas || [];
    const vars         = modeloActual.variables || [];
    const dimCapas     = capas.slice(0, -1);
    const integCapa    = capas[capas.length - 1];
    if (!integCapa) return;

    const COL = { v: 40, dimR: 310, inter: 620, intR: 910, out: 1210 };
    const GAP_V = 68;
    const GAP_R = 50;
    const GAP_S = 20;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Columna 1: variables de entrada
    vars.forEach((v: any, i: number) => {
      newNodes.push({
        id: `var-${v.id}`, type: 'variable',
        position: { x: COL.v, y: i * GAP_V },
        data: { ...v, valorActual: hechosActual[v.nombre] ?? '' },
      });
    });

    // Columnas 2+3: reglas de dimensión + nodos intermedios
    let secY = 0;
    dimCapas.forEach((capa: any) => {
      const capaFired = firedByLayer.get(capa.id) || new Map();
      capa.reglas.forEach((r: any, ri: number) => {
        const fired = capaFired.has(r.id);
        newNodes.push({
          id: `rule-${r.id}`, type: 'regla',
          position: { x: COL.dimR, y: secY + ri * GAP_R },
          data: { ...r, fired, firingStrength: fired ? (r.peso ?? 1.0) : undefined },
        });
        r.condiciones.forEach((c: any) => {
          const varDef = vars.find((v: any) => v.nombre === c.var);
          if (!varDef) return;
          const eid = `e-v${varDef.id}-r${r.id}-${c.var}`;
          if (!newEdges.find(e => e.id === eid))
            newEdges.push({ id: eid, source: `var-${varDef.id}`, target: `rule-${r.id}`, type: 'default', animated: fired,
              style: { stroke: fired ? '#818cf8' : 'rgba(99,102,241,0.15)', strokeWidth: fired ? 2 : 1 } });
        });
        newEdges.push({ id: `e-r${r.id}-inter${capa.id}`, source: `rule-${r.id}`, target: `inter-${capa.id}`,
          type: 'default', animated: fired,
          style: { stroke: fired ? '#f59e0b' : 'rgba(245,158,11,0.12)', strokeWidth: fired ? 2.5 : 1 } });
      });
      const interY = secY + ((capa.reglas.length - 1) * GAP_R) / 2;
      newNodes.push({
        id: `inter-${capa.id}`, type: 'intermedio',
        position: { x: COL.inter, y: interY },
        data: { nombre: capa.nombre, variable: capa.variable_salida, valor: intermediosActual[capa.variable_salida] ?? '' },
      });
      secY += capa.reglas.length * GAP_R + GAP_S;
    });

    // Columna 4: reglas integradoras
    const totalH   = secY - GAP_S;
    const iCount   = integCapa.reglas.length;
    const iStartY  = Math.max(0, (totalH - (iCount - 1) * (GAP_R + 6)) / 2);
    const integFired = firedByLayer.get(integCapa.id) || new Map();

    integCapa.reglas.forEach((r: any, ri: number) => {
      const fired = integFired.has(r.id);
      newNodes.push({
        id: `rule-${r.id}`, type: 'regla',
        position: { x: COL.intR, y: iStartY + ri * (GAP_R + 6) },
        data: { ...r, fired, firingStrength: fired ? (r.peso ?? 1.0) : undefined },
      });
      r.condiciones.forEach((c: any) => {
        const dimCapa = dimCapas.find((cap: any) => cap.variable_salida === c.var);
        if (!dimCapa) return;
        const eid = `e-inter${dimCapa.id}-r${r.id}-${c.var}`;
        if (!newEdges.find(e => e.id === eid))
          newEdges.push({ id: eid, source: `inter-${dimCapa.id}`, target: `rule-${r.id}`, type: 'default', animated: fired,
            style: { stroke: fired ? '#f59e0b' : 'rgba(245,158,11,0.12)', strokeWidth: fired ? 2.5 : 1 } });
      });
    });

    // Columna 5: nodos de salida final
    const outLabels = [...new Set<string>(integCapa.reglas.map((r: any) => r.conclusion))];
    const outIdMap  = new Map<string, string>(outLabels.map((label, i) => [label, `out-cap-${i}`]));
    const maxCert   = Math.max(0, ...resultadosActual.map((r: any) => r.certeza ?? 0));
    const oGap      = (GAP_R + 6) * 1.9;
    const oStartY   = iStartY + Math.max(0, ((iCount - outLabels.length) / 2) * (GAP_R + 6));

    outLabels.forEach((label: string, i: number) => {
      const res       = resultadosActual.find((r: any) => r.conclusion === label);
      const certeza   = res?.certeza;
      const esGanador = certeza !== undefined && certeza === maxCert && certeza > 0;
      const nodeId    = outIdMap.get(label)!;
      newNodes.push({ id: nodeId, type: 'output', position: { x: COL.out, y: oStartY + i * oGap }, data: { label, certeza, esGanador } });
      integCapa.reglas.filter((r: any) => r.conclusion === label).forEach((r: any) => {
        const fired = integFired.has(r.id);
        newEdges.push({ id: `e-r${r.id}-${nodeId}`, source: `rule-${r.id}`, target: nodeId, type: 'default', animated: fired,
          style: { stroke: fired ? '#4fffb0' : 'rgba(79,255,176,0.12)', strokeWidth: fired ? 3 : 1 } });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [modeloActual, setNodes, setEdges]);

  const ejecutarConsulta = async () => {
    if (!modeloActual) return;
    setCargando(true);
    try {
      const hechosNum: Record<string, any> = {};
      for (const [k, v] of Object.entries(hechos)) {
        const varDef = modeloActual.variables.find((x: any) => x.nombre === k);
        hechosNum[k] = varDef?.tipo === 'numerico' ? parseFloat(v) : v;
      }

      if ((modeloActual as any).capas) {
        const { intermedios, resultados: res, firedByLayer } = inferirCapas(hechosNum, (modeloActual as any).capas);
        setResultados(res);
        setInferenciaDone(true);
        sincronizarNodosCapas(hechosNum, intermedios, firedByLayer, res);
      } else {
        let res: any;
        if (modeloActual.tipo_motor === 'crisp') {
          res = await inferirCrispApi(hechosNum, modeloActual.reglas);
        } else if (modeloActual.tipo_motor === 'difuso') {
          res = await inferirFuzzyApi(hechosNum, modeloActual.variables, modeloActual.reglas);
        } else {
          res = await inferirBayesianoApi(hechosNum, modeloActual.variables, modeloActual.clases || []);
        }
        let nuevosResultados: any[] = res.resultados || [];
        if ((modeloActual as any).usar_mycin && modeloActual.tipo_motor === 'crisp') {
          const m = new Map<string, { certeza: number; explicacion: string }>();
          for (const r of nuevosResultados) {
            if (!m.has(r.conclusion)) {
              m.set(r.conclusion, { certeza: r.certeza, explicacion: r.explicacion ?? '' });
            } else {
              const p = m.get(r.conclusion)!;
              p.certeza = p.certeza + r.certeza * (1 - p.certeza);
              if (r.explicacion) p.explicacion = p.explicacion ? `${p.explicacion}; ${r.explicacion}` : r.explicacion;
            }
          }
          nuevosResultados = [...m.entries()]
            .map(([conclusion, v]) => ({ conclusion, certeza: parseFloat(v.certeza.toFixed(4)), explicacion: v.explicacion }))
            .sort((a: any, b: any) => b.certeza - a.certeza);
        }
        setResultados(nuevosResultados);
        setInferenciaDone(true);
        const firedMap = detectarReglasFired(modeloActual.reglas || [], hechosNum, nuevosResultados, modeloActual.tipo_motor);
        sincronizarNodos(hechosNum, firedMap, nuevosResultados);
      }

    } catch {
      alert('Error al ejecutar la inferencia. Revisa los datos ingresados.');
    } finally {
      setCargando(false);
    }
  };

  // Inicializar canvas de capas y auto-ejecutar si hay hechos pre-cargados
  useEffect(() => {
    if ((modeloActual as any).capas) sincronizarNodosCapas();
    if (Object.keys(hechos).length > 0) ejecutarConsulta();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-ejecutar automáticamente cuando cambian los hechos (solo si ya se ejecutó una vez)
  useEffect(() => {
    if (!inferenciaDone || Object.keys(hechos).length === 0) return;
    const t = setTimeout(() => ejecutarConsulta(), 200);
    return () => clearTimeout(t);
  }, [hechos]); // eslint-disable-line react-hooks/exhaustive-deps

  const motorLabel: Record<string, string> = {
    crisp: '⚡ Reglas clásicas', difuso: '🌊 Lógica difusa', bayesiano: '📊 Bayesiano', capas: '🔗 Capas encadenadas',
  };

  // Resultado ganador para el banner
  const ganador = resultados.length > 0
    ? resultados.reduce((a: any, b: any) => ((a.certeza ?? a.firing ?? 0) >= (b.certeza ?? b.firing ?? 0) ? a : b))
    : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0f14' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0f14', flexShrink: 0 }}>
        <button onClick={() => window.history.back()}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#a5b4fc',
                   borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>←</button>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>
            🧠 {modeloActual.nombre}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            {motorLabel[modeloActual.tipo_motor]} · {modeloActual.dominio || 'General'}
          </div>
        </div>

        {/* Banner resultado ganador */}
        {ganador && (
          <div style={{
            marginLeft: 16,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 10,
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Resultado</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{ganador.conclusion}</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#a5b4fc', fontFamily: 'DM Mono' }}>
              {Math.round((ganador.certeza ?? ganador.firing ?? 0) * 100)}%
            </span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>@{usuario.username}</span>
          {usuario.rol === 'super_admin' && (
            <button onClick={() => setAdminPanel(true)} style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc', fontWeight: 600,
            }}>⊙ Admin</button>
          )}
          <button onClick={onCerrarSesion} title="Cerrar sesión"
            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                     background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                     color: 'rgba(255,255,255,0.35)' }}>Salir</button>
          {(['variables', 'reglas', 'consulta'] as const).map(tab => (
            <button key={tab} onClick={() => setPanelAbierto(panelAbierto === tab ? null : tab)}
              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                       background: panelAbierto === tab ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                       border: `1px solid ${panelAbierto === tab ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                       color: panelAbierto === tab ? '#a5b4fc' : 'rgba(255,255,255,0.5)' }}>
              {tab === 'variables' ? '📥 Variables' : tab === 'reglas' ? '⚡ Reglas' : '▶ Consultar'}
            </button>
          ))}
          <button onClick={() => (modeloActual as any).capas ? sincronizarNodosCapas() : sincronizarNodos()} title="Regenerar canvas"
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                     background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                     color: 'rgba(255,255,255,0.5)' }}>🔄</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Panel lateral */}
        {panelAbierto && (
          <div style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.06)',
                        background: '#0d0f14', overflowY: 'auto', padding: 16, flexShrink: 0 }}>
            {panelAbierto === 'variables' && <VariablesPanel modelo={modeloActual} />}
            {panelAbierto === 'reglas'    && <ReglasPanel    modelo={modeloActual} />}
            {panelAbierto === 'consulta'  && (
              <ConsultaPanel
                modelo={modeloActual}
                hechos={hechos}
                setHechos={setHechosState}
                resultados={resultados}
                onEjecutar={ejecutarConsulta}
                cargando={cargando}
                inferenciaDone={inferenciaDone}
              />
            )}
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            nodeTypes={nodeTypes} fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={22} color="rgba(255,255,255,0.03)" />
            <Controls />
            <MiniMap style={{ background: '#13161d', border: '1px solid rgba(255,255,255,0.07)' }}
              nodeColor="#6366f1" maskColor="rgba(0,0,0,0.6)" />
          </ReactFlow>

          {nodes.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', pointerEvents: 'none', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 42 }}>🕸️</div>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Ingresa valores y ejecuta la inferencia</div>
              <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>el canvas se genera automáticamente</div>
            </div>
          )}
        </div>
      </div>
      {adminPanel && <AdminPanel onClose={() => setAdminPanel(false)} />}
    </div>
  );
}

/* ── Paneles laterales ─────────────────────────────────── */

function VariablesPanel({ modelo }: { modelo: any }) {
  const { addVariable } = useStore();
  const [form, setForm] = useState({ nombre: '', label: '', tipo: 'numerico', unidad: '' });

  const guardar = () => {
    if (!form.nombre || !form.label) return;
    addVariable({ ...form, id: crypto.randomUUID(), conjuntos: [], opciones: [] });
    setForm({ nombre: '', label: '', tipo: 'numerico', unidad: '' });
  };

  const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: '#f1f5f9', fontSize: 12, boxSizing: 'border-box' as const };
  const lbl = { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };

  return (
    <div>
      <div style={{ fontSize: 10, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>📥 Variables</div>
      {(modelo.variables || []).map((v: any) => (
        <div key={v.id} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '8px 12px', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#c7d2fe' }}>{v.label}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{v.nombre} · {v.tipo}{v.unidad ? ` (${v.unidad})` : ''}</div>
        </div>
      ))}
      <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>+ Nueva variable</div>
        <label style={lbl}>Clave</label>
        <input style={{ ...inp, marginBottom: 8 }} placeholder="asistencia" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        <label style={lbl}>Etiqueta</label>
        <input style={{ ...inp, marginBottom: 8 }} placeholder="Asistencia (%)" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
        <label style={lbl}>Tipo</label>
        <select style={{ ...inp, marginBottom: 8 }} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
          <option value="numerico">Numérico</option>
          <option value="booleano">Booleano</option>
          <option value="categorico">Categórico</option>
        </select>
        {form.tipo === 'numerico' && (
          <><label style={lbl}>Unidad</label><input style={{ ...inp, marginBottom: 8 }} placeholder="%, pts…" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} /></>
        )}
        <button onClick={guardar} style={{ width: '100%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12 }}>+ Añadir</button>
      </div>
    </div>
  );
}

function ReglasPanel({ modelo }: { modelo: any }) {
  const { addRegla } = useStore();
  const [conds, setConds] = useState<any[]>([{ var: '', op: '>', val: '' }]);
  const [conclusion, setConclusion] = useState('');
  const [peso, setPeso] = useState('0.9');
  const inp = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', color: '#f1f5f9', fontSize: 11 };

  const guardar = () => {
    if (!conclusion || conds.some(c => !c.var)) return;
    addRegla({ id: crypto.randomUUID(), condiciones: conds, conclusion, peso: parseFloat(peso) || 0.9 });
    setConds([{ var: '', op: '>', val: '' }]);
    setConclusion(''); setPeso('0.9');
  };

  return (
    <div>
      <div style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>⚡ Reglas</div>
      {(modelo.reglas || []).map((r: any) => (
        <div key={r.id} style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10, padding: '8px 12px', marginBottom: 8, fontSize: 11 }}>
          {(r.condiciones || []).map((c: any, i: number) => (
            <div key={i} style={{ color: 'rgba(255,255,255,0.5)' }}>
              {i > 0 && <span style={{ color: '#6366f1' }}>Y </span>}
              <span style={{ color: '#c7d2fe' }}>{c.var}</span> {c.op || 'ES'} <span style={{ color: '#fbbf24' }}>{c.val ?? c.conjunto}</span>
            </div>
          ))}
          <div style={{ color: '#4fffb0', marginTop: 4 }}>→ {r.conclusion} ({Math.round((r.peso || 1) * 100)}%)</div>
        </div>
      ))}
      <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>+ Nueva regla</div>
        {conds.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 55px 1fr', gap: 5, marginBottom: 5 }}>
            <select style={inp} value={c.var} onChange={e => setConds(cs => cs.map((x, j) => j === i ? { ...x, var: e.target.value } : x))}>
              <option value="" style={{ background: '#1e2130', color: '#f1f5f9' }}>Variable</option>
              {(modelo.variables || []).map((v: any) => (
                <option key={v.id} value={v.nombre} style={{ background: '#1e2130', color: '#f1f5f9' }}>{v.label}</option>
              ))}
            </select>
            <select style={inp} value={c.op} onChange={e => setConds(cs => cs.map((x, j) => j === i ? { ...x, op: e.target.value } : x))}>
              {['>', '<', '>=', '<=', '==', '!='].map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <input style={inp} placeholder="valor" value={c.val} onChange={e => setConds(cs => cs.map((x, j) => j === i ? { ...x, val: e.target.value } : x))} />
          </div>
        ))}
        <button onClick={() => setConds(cs => [...cs, { var: '', op: '>', val: '' }])} style={{ ...inp, cursor: 'pointer', width: '100%', marginBottom: 8, padding: '5px', textAlign: 'center' as const }}>+ Y condición</button>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>ENTONCES →</div>
        <input style={{ ...inp, width: '100%', marginBottom: 8, boxSizing: 'border-box' as const }} placeholder="Conclusión" value={conclusion} onChange={e => setConclusion(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Peso</span>
          <input style={{ ...inp, width: 60 }} type="number" min="0" max="1" step="0.05" value={peso} onChange={e => setPeso(e.target.value)} />
        </div>
        <button onClick={guardar} style={{ width: '100%', background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#c4b5fd', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12 }}>+ Añadir regla</button>
      </div>
    </div>
  );
}

function ConsultaPanel({ modelo, hechos, setHechos, resultados, onEjecutar, cargando, inferenciaDone }: any) {
  const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' as const };

  const ganador = resultados.length > 0
    ? resultados.reduce((a: any, b: any) => ((a.certeza ?? a.firing ?? 0) >= (b.certeza ?? b.firing ?? 0) ? a : b))
    : null;

  return (
    <div>
      <div style={{ fontSize: 10, color: '#4fffb0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
        ▶ Ingresa los datos del caso
      </div>

      {(modelo.variables || []).map((v: any) => (
        <div key={v.id} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
            <span>{v.label}</span>
            {v.unidad && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{v.unidad}</span>}
          </div>
          {v.tipo === 'numerico' ? (
            <input style={inp} type="number" placeholder="valor numérico"
              value={hechos[v.nombre] || ''} onChange={e => setHechos((h: any) => ({ ...h, [v.nombre]: e.target.value }))} />
          ) : v.tipo === 'booleano' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {['si', 'no'].map(opt => (
                <button key={opt} onClick={() => setHechos((h: any) => ({ ...h, [v.nombre]: opt }))}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                           background: hechos[v.nombre] === opt ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                           border: `1px solid ${hechos[v.nombre] === opt ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                           color: hechos[v.nombre] === opt ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}>
                  {opt.toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <select style={inp} value={hechos[v.nombre] || ''} onChange={e => setHechos((h: any) => ({ ...h, [v.nombre]: e.target.value }))}>
              <option value=""    style={{ background: '#1e2130', color: '#f1f5f9' }}>-- seleccionar --</option>
              {(v.opciones || []).map((o: string) => (
                <option key={o} value={o} style={{ background: '#1e2130', color: '#f1f5f9' }}>{o}</option>
              ))}
            </select>
          )}
        </div>
      ))}

      <button onClick={onEjecutar} disabled={cargando}
        style={{ width: '100%', marginTop: 8, background: cargando ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(139,92,246,0.4))',
                 border: '1px solid rgba(99,102,241,0.5)', color: '#a5b4fc', borderRadius: 10,
                 padding: '12px', cursor: 'pointer', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>
        {cargando ? '⏳ Calculando...' : '▶ Ejecutar inferencia'}
      </button>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Resultados {inferenciaDone && '· canvas actualizado ↗'}
          </div>

          {/* Ganador destacado */}
          {ganador && (
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#a5b4fc', marginBottom: 4 }}>🏆 Resultado principal</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>{ganador.conclusion}</div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${Math.round((ganador.certeza ?? ganador.firing ?? 0) * 100)}%`, transition: '0.7s', borderRadius: 99 }} />
              </div>
              <div style={{ textAlign: 'right', marginTop: 4, fontSize: 18, fontWeight: 900, color: '#a5b4fc', fontFamily: 'DM Mono' }}>
                {Math.round((ganador.certeza ?? ganador.firing ?? 0) * 100)}%
              </div>
            </div>
          )}

          {/* Todos los resultados */}
          {resultados.map((r: any, i: number) => {
            const pct = Math.round((r.certeza ?? r.firing ?? 0) * 100);
            const col = pct >= 70 ? '#f87171' : pct >= 40 ? '#fbbf24' : '#4fffb0';
            const esG = r === ganador;
            if (esG) return null;
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{r.conclusion}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: 'DM Mono' }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                  <div style={{ height: '100%', background: col, width: `${pct}%`, borderRadius: 99, transition: '0.6s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
