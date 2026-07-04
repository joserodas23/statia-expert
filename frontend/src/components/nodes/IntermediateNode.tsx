import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const VALOR_CFG: Record<string, { color: string; rgb: string }> = {
  alta:  { color: '#f87171', rgb: '248,113,113' },
  media: { color: '#fbbf24', rgb: '251,191,36'  },
  baja:  { color: '#4fffb0', rgb: '79,255,176'  },
};

export default function IntermediateNode({ data }: NodeProps) {
  const valor  = data.valor as string | undefined;
  const nombre = data.nombre as string;
  const hasVal = !!valor;
  const cfg    = hasVal ? (VALOR_CFG[valor!] ?? VALOR_CFG.media) : null;

  return (
    <div style={{
      background: '#0e1117',
      border: `2px solid ${hasVal && cfg ? `rgba(${cfg.rgb},0.55)` : 'rgba(245,158,11,0.3)'}`,
      borderRadius: 16,
      padding: '12px 16px',
      minWidth: 175,
      boxShadow: hasVal && cfg
        ? `0 0 22px rgba(${cfg.rgb},0.2), 0 4px 20px rgba(0,0,0,0.4)`
        : '0 4px 20px rgba(0,0,0,0.35)',
      transition: 'all 0.35s ease',
    }}>

      <div style={{ fontSize: 9, color: '#f59e0b', textTransform: 'uppercase',
                    letterSpacing: '0.13em', marginBottom: 6 }}>
        🔗 Alerta dimensional
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3,
                    color: hasVal && cfg ? cfg.color : '#fcd34d',
                    marginBottom: hasVal ? 10 : 0 }}>
        {nombre}
      </div>

      {hasVal && cfg ? (
        <div style={{
          background: `rgba(${cfg.rgb},0.12)`,
          border: `1px solid rgba(${cfg.rgb},0.3)`,
          borderRadius: 10, padding: '5px 12px', textAlign: 'center',
        }}>
          <span style={{
            fontSize: 17, fontWeight: 900, color: cfg.color,
            fontFamily: 'DM Mono, monospace',
            textShadow: `0 0 10px rgba(${cfg.rgb},0.5)`,
            textTransform: 'uppercase',
          }}>
            {valor}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontStyle: 'italic' }}>
          sin evaluar
        </div>
      )}

      <Handle type="target" position={Position.Left}
        style={{ background: '#f59e0b', borderColor: '#f59e0b', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right}
        style={{ background: hasVal && cfg ? cfg.color : '#f59e0b',
                 borderColor: hasVal && cfg ? cfg.color : '#f59e0b', width: 10, height: 10 }} />
    </div>
  );
}
