// Motores de inferencia — 100% cliente, sin backend
// by Jose Rodas
import { inferirCrisp    } from './inference/crisp';
import { inferirFuzzy    } from './inference/fuzzy';
import { inferirBayesiano } from './inference/bayesian';

export async function inferirCrispApi(hechos: Record<string, any>, reglas: any[]) {
  return { motor: 'crisp', resultados: inferirCrisp(hechos, reglas) };
}

export async function inferirFuzzyApi(hechos: Record<string, any>, variables: any[], reglas: any[]) {
  return { motor: 'difuso', resultados: inferirFuzzy(hechos, variables, reglas) };
}

export async function inferirBayesianoApi(hechos: Record<string, any>, variables: any[], clases: any[]) {
  return { motor: 'bayesiano', resultados: inferirBayesiano(hechos, variables, clases) };
}
