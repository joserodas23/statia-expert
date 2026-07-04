import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const TIPO: Record<string, { color: string; rgb: string; icon: string }> = {
  numerico:   { color: '#818cf8', rgb: '129,140,248', icon: '🔢' },
  booleano:   { color: '#34d399', rgb: '52,211,153',  icon: '✅' },
  categorico: { color: '#fbbf24', rgb: '251,191,36',  icon: '📋' },
};

export default function VariableNode({ data, selected }: NodeProps) {
  const cfg = TIPO[data.tipo as string] ?? TIPO.numerico;
  const val  = data.valorActual;
  const tieneValor = val !== undefined && val !== '' && val !== null;

  return (
    <div style={{
      background: '#0e1117',
      border: `1.5px solid ${
        selected ? cfg.color
        : tieneValor ? `rgba(${cfg.rgb},0.5)`
        : 'rgba(255,255,255,0.1)'
      }`,
      borderRadius: 16,
      padding: '12px 16px',
      minWidth: 190,
      boxShadow: tieneValor
        ? `0 0 24px rgba(${cfg.rgb},0.2), 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(${cfg.rgb},0.1)`
        : '0 4px 20px rgba(0,0,0,0.35)',
      transition: 'all 0.35s ease',
    }}>

      {/* Tipo badge */}
      <div style={{ fontSize: 9, color: cfg.color, textTransform: 'uppercase',
                    letterSpacing: '0.14em', marginBottom: 7, display: 'flex', gap: 5 }}>
        <span>{cfg.icon}</span>
        <span>Variable · {data.tipo as string}</span>
      </div>

      {/* Nombre */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: tieneValor ? 10 : 0, lineHeight: 1.3 }}>
        {data.label as string}
      </div>

      {/* Valor actual */}
      {tieneValor ? (
        <div style={{
          background: `rgba(${cfg.rgb},0.12)`,
          border: `1px solid rgba(${cfg.rgb},0.28)`,
          borderRadius: 10,
          padding: '7px 12px',
          textAlign: 'center',
          display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5,
        }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 900, color: cfg.color,
                         textShadow: `0 0 12px rgba(${cfg.rgb},0.5)` }}>
            {String(val)}
          </span>
          {!!data.unidad && (
            <span style={{ fontSize: 10, color: `rgba(${cfg.rgb},0.6)`, fontFamily: 'DM Mono, monospace' }}>
              {data.unidad as string}
            </span>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontStyle: 'italic' }}>
          sin valor aún
        </div>
      )}

      <Handle type="source" position={Position.Right}
        style={{ background: cfg.color, borderColor: cfg.color, width: 10, height: 10 }} />
    </div>
  );
}
