import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

interface Modelo {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo_motor: 'crisp' | 'difuso' | 'bayesiano';
  dominio?: string;
  variables: any[];
  reglas: any[];
  clases: any[];
}

interface StoreState {
  modelos: Modelo[];
  modeloActual: Modelo | null;
  nodes: Node[];
  edges: Edge[];
  resultados: any[];
  setModeloActual: (m: Modelo) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  addModelo: (m: Modelo) => void;
  setResultados: (r: any[]) => void;
  updateVariable: (v: any) => void;
  addVariable: (v: any) => void;
  updateRegla: (r: any) => void;
  addRegla: (r: any) => void;
}

export const useStore = create<StoreState>((set, _get) => ({
  modelos: [],
  modeloActual: null,
  nodes: [],
  edges: [],
  resultados: [],

  setModeloActual: (m) => set({ modeloActual: m, nodes: [], edges: [], resultados: [] }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) => set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
  onEdgesChange: (changes) => set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),
  onConnect: (connection) => set((s) => ({ edges: addEdge({ ...connection, animated: true }, s.edges) })),
  addModelo: (m) => set((s) => ({ modelos: [...s.modelos, m] })),
  setResultados: (r) => set({ resultados: r }),
  updateVariable: (v) => set((s) => ({
    modeloActual: s.modeloActual ? {
      ...s.modeloActual,
      variables: s.modeloActual.variables.map(x => x.id === v.id ? v : x),
    } : null,
  })),
  addVariable: (v) => set((s) => ({
    modeloActual: s.modeloActual ? {
      ...s.modeloActual,
      variables: [...s.modeloActual.variables, v],
    } : null,
  })),
  updateRegla: (r) => set((s) => ({
    modeloActual: s.modeloActual ? {
      ...s.modeloActual,
      reglas: s.modeloActual.reglas.map(x => x.id === r.id ? r : x),
    } : null,
  })),
  addRegla: (r) => set((s) => ({
    modeloActual: s.modeloActual ? {
      ...s.modeloActual,
      reglas: [...s.modeloActual.reglas, r],
    } : null,
  })),
}));
