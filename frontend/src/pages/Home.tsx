import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Sesion } from '../lib/auth';
import { useStore } from '../store/useStore';
import AdminPanel from '../components/AdminPanel';

const MOTORES = [
  { id: 'crisp',     icon: '⚡', label: 'Reglas clásicas', desc: 'IF-THEN con certeza. Preciso y explicable.' },
  { id: 'difuso',    icon: '🌊', label: 'Lógica difusa',   desc: 'Conjuntos linguísticos. Maneja incertidumbre.' },
  { id: 'bayesiano', icon: '📊', label: 'Bayesiano',       desc: 'Probabilidades P(clase|evidencia). Aprende de datos.' },
] as const;

const EJEMPLOS = [

  // ── ⚡ REGLAS CLÁSICAS — Aprobación de préstamo bancario ─────
  // El banco evalúa si da o niega un crédito. Reglas fijas, blanco o negro.
  { nombre: 'Aprobación de Préstamo Bancario', tipo_motor: 'crisp', dominio: 'Finanzas',
    descripcion: 'El banco decide si aprobar, condicionar o rechazar un crédito según ingresos, deudas e historial',
    hechos_ejemplo: { ingresos: '5500', deudas: '1200', historial: 'limpio', antiguedad: '5' },
    variables: [
      { id: 'v1', nombre: 'ingresos',    label: 'Ingresos mensuales',  tipo: 'numerico',   unidad: 'S/',  conjuntos: [], opciones: [] },
      { id: 'v2', nombre: 'deudas',      label: 'Deudas actuales',     tipo: 'numerico',   unidad: 'S/',  conjuntos: [], opciones: [] },
      { id: 'v3', nombre: 'historial',   label: 'Historial crediticio',tipo: 'categorico', conjuntos: [], opciones: ['limpio','regular','moroso'] },
      { id: 'v4', nombre: 'antiguedad',  label: 'Años en el trabajo',  tipo: 'numerico',   unidad: 'años',conjuntos: [], opciones: [] },
    ],
    reglas: [
      // Cliente ideal: buen historial, ingresos altos, pocas deudas
      { id: 'r1', condiciones: [
          { var: 'historial', op: '==', val: 'limpio' },
          { var: 'ingresos',  op: '>=', val: '5000' },
          { var: 'deudas',    op: '<',  val: '2000' },
        ], conclusion: '✅ Aprobado automáticamente', peso: 0.97 },

      // Cliente aceptable: historial regular pero trabajo estable
      { id: 'r2', condiciones: [
          { var: 'historial',  op: '==', val: 'regular' },
          { var: 'ingresos',   op: '>=', val: '3000' },
          { var: 'antiguedad', op: '>=', val: '3' },
        ], conclusion: '⚠️ Aprobado con garantía', peso: 0.72 },

      // Riesgo por deudas altas vs ingresos bajos
      { id: 'r3', condiciones: [
          { var: 'deudas',   op: '>=', val: '5000' },
          { var: 'ingresos', op: '<',  val: '2000' },
        ], conclusion: '❌ Rechazado — capacidad de pago insuficiente', peso: 0.93 },

      // Moroso: rechazo directo
      { id: 'r4', condiciones: [
          { var: 'historial', op: '==', val: 'moroso' },
        ], conclusion: '❌ Rechazado — historial negativo', peso: 0.98 },

      // Ingresos bajos sin importar el resto
      { id: 'r5', condiciones: [
          { var: 'ingresos', op: '<', val: '1200' },
        ], conclusion: '❌ Rechazado — ingresos mínimos no cubiertos', peso: 0.90 },
    ],
    clases: [],
  },

  // ── 🌊 LÓGICA DIFUSA — Estrés laboral ───────────────────────
  // No hay un límite exacto entre "estresado" y "no estresado".
  // La lógica difusa maneja esa zona gris igual que un médico del trabajo.
  { nombre: 'Estrés Laboral del Trabajador', tipo_motor: 'difuso', dominio: 'Recursos Humanos',
    descripcion: 'Detecta nivel de burnout según horas extra, carga de trabajo y días sin vacaciones',
    hechos_ejemplo: { horas_extra: '22', carga: '9', dias_sin_vacaciones: '210' },
    variables: [
      { id: 'v1', nombre: 'horas_extra', label: 'Horas extra por semana', tipo: 'numerico', unidad: 'h',
        conjuntos: [
          { nombre: 'pocas',     tipo: 'trapezoidal', puntos: [0,  0,  4,  8 ] },
          { nombre: 'moderadas', tipo: 'triangular',  puntos: [5,  12, 20 ] },
          { nombre: 'muchas',    tipo: 'trapezoidal', puntos: [16, 22, 40, 40] },
        ], opciones: [] },
      { id: 'v2', nombre: 'carga', label: 'Carga de trabajo percibida (1–10)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'ligera',  tipo: 'trapezoidal', puntos: [1, 1, 3, 5 ] },
          { nombre: 'normal',  tipo: 'triangular',  puntos: [4, 6, 8 ] },
          { nombre: 'pesada',  tipo: 'trapezoidal', puntos: [7, 9, 10, 10] },
        ], opciones: [] },
      { id: 'v3', nombre: 'dias_sin_vacaciones', label: 'Días sin vacaciones', tipo: 'numerico', unidad: 'días',
        conjuntos: [
          { nombre: 'reciente',  tipo: 'trapezoidal', puntos: [0,  0,  30,  60 ] },
          { nombre: 'moderado',  tipo: 'triangular',  puntos: [45, 100, 160 ] },
          { nombre: 'excesivo',  tipo: 'trapezoidal', puntos: [130, 200, 365, 365] },
        ], opciones: [] },
    ],
    reglas: [
      { id: 'r1', condiciones: [{ var: 'horas_extra', conjunto: 'muchas' },    { var: 'carga', conjunto: 'pesada' }],     conclusion: '🔴 Burnout inminente — intervención urgente', peso: 0.95 },
      { id: 'r2', condiciones: [{ var: 'horas_extra', conjunto: 'moderadas' }, { var: 'dias_sin_vacaciones', conjunto: 'excesivo' }], conclusion: '🟠 Estrés crónico — programar descanso', peso: 0.80 },
      { id: 'r3', condiciones: [{ var: 'carga', conjunto: 'pesada' },          { var: 'dias_sin_vacaciones', conjunto: 'moderado' }], conclusion: '🟡 Vigilancia recomendada', peso: 0.70 },
      { id: 'r4', condiciones: [{ var: 'horas_extra', conjunto: 'pocas' },     { var: 'carga', conjunto: 'ligera' }],     conclusion: '🟢 Sin riesgo de estrés', peso: 0.90 },
    ],
    clases: [],
  },

  // ── 📊 BAYESIANO — Deserción universitaria ──────────────────
  // No hay una regla exacta para saber quién abandonará la universidad.
  // El motor bayesiano aprende de patrones históricos y calcula probabilidades.
  { nombre: 'Riesgo de Deserción Universitaria', tipo_motor: 'bayesiano', dominio: 'Educación',
    descripcion: 'Calcula la probabilidad de que un estudiante abandone la carrera basándose en patrones históricos',
    hechos_ejemplo: { promedio: '9.5', asistencia: '58', meses_deuda: '4', trabaja: 'true' },
    variables: [
      { id: 'v1', nombre: 'promedio',    label: 'Promedio del ciclo',   tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v2', nombre: 'asistencia',  label: 'Asistencia',          tipo: 'numerico', unidad: '%',   conjuntos: [], opciones: [] },
      { id: 'v3', nombre: 'meses_deuda', label: 'Meses sin pagar',     tipo: 'numerico', unidad: 'mes', conjuntos: [], opciones: [] },
      { id: 'v4', nombre: 'trabaja',     label: '¿Trabaja mientras estudia?',tipo: 'booleano', conjuntos: [], opciones: [] },
    ],
    reglas: [],
    clases: [
      // Perfil histórico de estudiantes que SÍ desertaron
      { id: 'c1', nombre: '🔴 Alto riesgo de deserción', prior: 0.28,
        probs: { 'trabaja_si': 0.71, 'trabaja_no': 0.29 },
        probs_gauss: {
          promedio:    { mu: 9.5,  sigma: 2.5 },
          asistencia:  { mu: 61,   sigma: 14  },
          meses_deuda: { mu: 3.2,  sigma: 1.8 },
        },
      },
      // Perfil histórico de estudiantes que continuaron
      { id: 'c2', nombre: '🟢 Bajo riesgo de deserción', prior: 0.72,
        probs: { 'trabaja_si': 0.35, 'trabaja_no': 0.65 },
        probs_gauss: {
          promedio:    { mu: 14.2, sigma: 2.1 },
          asistencia:  { mu: 86,   sigma: 8   },
          meses_deuda: { mu: 0.4,  sigma: 0.8 },
        },
      },
    ],
  },

  // ── ⚡ CONTABILIDAD — Riesgo Tributario en MYPES ─────────────
  { nombre: 'Riesgo Tributario en MYPES', tipo_motor: 'crisp', dominio: 'Contabilidad',
    descripcion: 'Clasifica el riesgo fiscal de una MYPE según declaraciones tardías, multas y ratio contable',
    hechos_ejemplo: { declaraciones_tarde: '4', ratio_compras_ventas: '113', multas_previas: '2', comprobantes: 'nunca', conciliacion: 'no' },
    variables: [
      { id: 'v1', nombre: 'declaraciones_tarde', label: 'Declaraciones fuera de plazo (año)', tipo: 'numerico', unidad: 'veces', conjuntos: [], opciones: [] },
      { id: 'v2', nombre: 'ratio_compras_ventas', label: 'Ratio compras / ventas', tipo: 'numerico', unidad: '%', conjuntos: [], opciones: [] },
      { id: 'v3', nombre: 'multas_previas', label: 'Multas previas de SUNAT', tipo: 'numerico', unidad: 'multas', conjuntos: [], opciones: [] },
      { id: 'v4', nombre: 'comprobantes', label: 'Uso de comprobantes de pago', tipo: 'categorico', conjuntos: [], opciones: ['siempre', 'a_veces', 'nunca'] },
      { id: 'v5', nombre: 'conciliacion', label: 'Conciliación bancaria al día', tipo: 'categorico', conjuntos: [], opciones: ['si', 'no'] },
    ],
    reglas: [
      { id: 'r1', condiciones: [
          { var: 'ratio_compras_ventas', op: '>=', val: '100' },
          { var: 'declaraciones_tarde',  op: '>=', val: '3' },
        ], conclusion: '🔴 Riesgo Crítico — irregularidad grave, posible evasión fiscal', peso: 0.95 },
      { id: 'r2', condiciones: [
          { var: 'declaraciones_tarde', op: '>=', val: '3' },
          { var: 'multas_previas',      op: '>=', val: '2' },
        ], conclusion: '🔴 Riesgo Alto — incumplimientos tributarios reiterados', peso: 0.88 },
      { id: 'r3', condiciones: [
          { var: 'comprobantes', op: '==', val: 'nunca' },
        ], conclusion: '🔴 Riesgo Alto — empresa sin comprobantes de pago', peso: 0.90 },
      { id: 'r4', condiciones: [
          { var: 'ratio_compras_ventas', op: '>=', val: '80' },
          { var: 'conciliacion',         op: '==', val: 'no' },
        ], conclusion: '🟠 Riesgo Moderado — revisar libros contables', peso: 0.75 },
      { id: 'r5', condiciones: [
          { var: 'declaraciones_tarde', op: '<=', val: '0' },
          { var: 'multas_previas',      op: '<=', val: '0' },
          { var: 'comprobantes',        op: '==', val: 'siempre' },
        ], conclusion: '🟢 Riesgo Bajo — cumplimiento tributario adecuado', peso: 0.92 },
    ],
    clases: [],
  },

  // ── 🌊 ADMINISTRACIÓN — Riesgo de Rotación Laboral ──────────
  { nombre: 'Riesgo de Rotación Laboral', tipo_motor: 'difuso', dominio: 'Administración',
    descripcion: 'Detecta la probabilidad de renuncia voluntaria integrando satisfacción, carga y reconocimiento',
    hechos_ejemplo: { satisfaccion: '2.5', carga_trabajo: '9.5', reconocimiento: '2', antiguedad: '1.2' },
    variables: [
      { id: 'v1', nombre: 'satisfaccion', label: 'Satisfacción laboral (1–10)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'muy_baja', tipo: 'trapezoidal', puntos: [1, 1, 3, 4.5] },
          { nombre: 'moderada', tipo: 'triangular',  puntos: [3.5, 5.5, 7.5] },
          { nombre: 'alta',     tipo: 'trapezoidal', puntos: [6.5, 8, 10, 10] },
        ], opciones: [] },
      { id: 'v2', nombre: 'carga_trabajo', label: 'Carga de trabajo percibida (1–10)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'normal',   tipo: 'trapezoidal', puntos: [1, 1, 4, 6] },
          { nombre: 'alta',     tipo: 'triangular',  puntos: [5, 7, 8.5] },
          { nombre: 'excesiva', tipo: 'trapezoidal', puntos: [7.5, 9, 10, 10] },
        ], opciones: [] },
      { id: 'v3', nombre: 'reconocimiento', label: 'Reconocimiento percibido (1–10)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'bajo',     tipo: 'trapezoidal', puntos: [1, 1, 3, 5] },
          { nombre: 'moderado', tipo: 'triangular',  puntos: [4, 6, 8] },
          { nombre: 'alto',     tipo: 'trapezoidal', puntos: [7, 9, 10, 10] },
        ], opciones: [] },
      { id: 'v4', nombre: 'antiguedad', label: 'Antigüedad en la empresa', tipo: 'numerico', unidad: 'años',
        conjuntos: [
          { nombre: 'nuevo',    tipo: 'trapezoidal', puntos: [0, 0, 1.5, 3] },
          { nombre: 'medio',    tipo: 'triangular',  puntos: [2, 5, 10] },
          { nombre: 'veterano', tipo: 'trapezoidal', puntos: [8, 15, 30, 30] },
        ], opciones: [] },
    ],
    reglas: [
      { id: 'r1', condiciones: [{ var: 'satisfaccion', conjunto: 'muy_baja' }, { var: 'carga_trabajo', conjunto: 'excesiva' }],
        conclusion: '🔴 Riesgo Crítico — intervención de RRHH urgente', peso: 0.95 },
      { id: 'r2', condiciones: [{ var: 'satisfaccion', conjunto: 'muy_baja' }, { var: 'reconocimiento', conjunto: 'bajo' }, { var: 'antiguedad', conjunto: 'nuevo' }],
        conclusion: '🔴 Riesgo Alto — candidato a renuncia en 6 meses', peso: 0.85 },
      { id: 'r3', condiciones: [{ var: 'carga_trabajo', conjunto: 'excesiva' }, { var: 'reconocimiento', conjunto: 'bajo' }],
        conclusion: '🟠 Riesgo Moderado — monitorear y entrevistar', peso: 0.75 },
      { id: 'r4', condiciones: [{ var: 'satisfaccion', conjunto: 'alta' }, { var: 'reconocimiento', conjunto: 'alto' }],
        conclusion: '🟢 Riesgo Bajo — colaborador estable y comprometido', peso: 0.90 },
    ],
    clases: [],
  },

  // ── 📊 ECONOMÍA — Riesgo de Morosidad Crediticia ────────────
  { nombre: 'Riesgo de Morosidad Crediticia', tipo_motor: 'bayesiano', dominio: 'Economía',
    descripcion: 'Clasifica la probabilidad de mora >90 días en microempresarios de cooperativas de crédito',
    hechos_ejemplo: { ingreso_mensual: '1100', endeudamiento_pct: '92', dias_atraso: '28', creditos_activos: '4' },
    variables: [
      { id: 'v1', nombre: 'ingreso_mensual',   label: 'Ingreso mensual neto',    tipo: 'numerico', unidad: 'S/',   conjuntos: [], opciones: [] },
      { id: 'v2', nombre: 'endeudamiento_pct', label: 'Nivel de endeudamiento',  tipo: 'numerico', unidad: '%',    conjuntos: [], opciones: [] },
      { id: 'v3', nombre: 'dias_atraso',       label: 'Días promedio de atraso', tipo: 'numerico', unidad: 'días', conjuntos: [], opciones: [] },
      { id: 'v4', nombre: 'creditos_activos',  label: 'Créditos activos',        tipo: 'numerico', unidad: 'créd', conjuntos: [], opciones: [] },
    ],
    reglas: [],
    clases: [
      { id: 'c1', nombre: '🔴 Riesgo Alto — mora probable en 90 días', prior: 0.25,
        probs: {},
        probs_gauss: {
          ingreso_mensual:   { mu: 1100, sigma: 380 },
          endeudamiento_pct: { mu: 89,   sigma: 18  },
          dias_atraso:       { mu: 24,   sigma: 12  },
          creditos_activos:  { mu: 3.2,  sigma: 1.1 },
        },
      },
      { id: 'c2', nombre: '🟢 Riesgo Bajo — buen perfil crediticio', prior: 0.75,
        probs: {},
        probs_gauss: {
          ingreso_mensual:   { mu: 3800, sigma: 900 },
          endeudamiento_pct: { mu: 32,   sigma: 12  },
          dias_atraso:       { mu: 1.5,  sigma: 2.5 },
          creditos_activos:  { mu: 1.1,  sigma: 0.7 },
        },
      },
    ],
  },

  // ── ⚡ EDUCACIÓN INICIAL — Alertas Pedagógicas Tempranas ─────
  { nombre: 'Alertas Pedagógicas — Desarrollo Infantil', tipo_motor: 'crisp', dominio: 'Educación Inicial',
    descripcion: 'Detecta rezagos en áreas del desarrollo en niños de 3–5 años para orientar a la docente',
    hechos_ejemplo: { lenguaje_oral: '2', motricidad_fina: '2', socializacion: '2', atencion: '2', regulacion_emocional: '2' },
    variables: [
      { id: 'v1', nombre: 'lenguaje_oral',         label: 'Lenguaje oral (rúbrica 1–5)',     tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v2', nombre: 'motricidad_fina',        label: 'Motricidad fina (1–5)',          tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v3', nombre: 'socializacion',          label: 'Socialización (1–5)',            tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v4', nombre: 'atencion',               label: 'Atención y concentración (1–5)', tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v5', nombre: 'regulacion_emocional',   label: 'Regulación emocional (1–5)',    tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
    ],
    reglas: [
      { id: 'r1', condiciones: [
          { var: 'lenguaje_oral', op: '<=', val: '1' },
        ], conclusion: '🔴 Derivar urgente — rezago severo en lenguaje oral', peso: 0.93 },
      { id: 'r2', condiciones: [
          { var: 'lenguaje_oral', op: '<=', val: '2' },
          { var: 'socializacion', op: '<=', val: '2' },
          { var: 'atencion',      op: '<=', val: '2' },
        ], conclusion: '🔴 Alerta Moderada — rezago convergente en 3 áreas', peso: 0.85 },
      { id: 'r3', condiciones: [
          { var: 'lenguaje_oral',   op: '<=', val: '2' },
          { var: 'motricidad_fina', op: '<=', val: '2' },
        ], conclusion: '🟠 Alerta Leve — estimulación psicomotriz y lenguaje', peso: 0.78 },
      { id: 'r4', condiciones: [
          { var: 'socializacion',        op: '<=', val: '2' },
          { var: 'regulacion_emocional', op: '<=', val: '2' },
        ], conclusion: '🟠 Alerta Leve — apoyo socioemocional recomendado', peso: 0.72 },
      { id: 'r5', condiciones: [
          { var: 'lenguaje_oral', op: '>=', val: '4' },
          { var: 'socializacion', op: '>=', val: '4' },
          { var: 'atencion',      op: '>=', val: '4' },
        ], conclusion: '🟢 Sin alerta — desarrollo esperado para la edad', peso: 0.90 },
    ],
    clases: [],
  },

  // ── 🌊 TURISMO — Recomendación de Rutas Turísticas ──────────
  { nombre: 'Recomendación de Rutas Turísticas', tipo_motor: 'difuso', dominio: 'Turismo',
    descripcion: 'Recomienda rutas en la región Cusco según presupuesto, intereses y perfil del viajero',
    hechos_ejemplo: { presupuesto: '3500', interes_cultural: '5', interes_aventura: '2', tolerancia_caminata: '5' },
    variables: [
      { id: 'v1', nombre: 'presupuesto', label: 'Presupuesto disponible', tipo: 'numerico', unidad: 'S/',
        conjuntos: [
          { nombre: 'bajo',     tipo: 'trapezoidal', puntos: [0,    0,    500,  900   ] },
          { nombre: 'moderado', tipo: 'triangular',  puntos: [700,  1500, 2500  ] },
          { nombre: 'premium',  tipo: 'trapezoidal', puntos: [2000, 3000, 10000, 10000] },
        ], opciones: [] },
      { id: 'v2', nombre: 'interes_cultural', label: 'Interés cultural e histórico (1–5)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'bajo',  tipo: 'trapezoidal', puntos: [1, 1, 2, 3.5] },
          { nombre: 'medio', tipo: 'triangular',  puntos: [2.5, 3.5, 4.5] },
          { nombre: 'alto',  tipo: 'trapezoidal', puntos: [3.5, 4.5, 5, 5] },
        ], opciones: [] },
      { id: 'v3', nombre: 'interes_aventura', label: 'Interés en aventura y trekking (1–5)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'bajo',  tipo: 'trapezoidal', puntos: [1, 1, 2, 3] },
          { nombre: 'medio', tipo: 'triangular',  puntos: [2, 3, 4] },
          { nombre: 'alto',  tipo: 'trapezoidal', puntos: [3.5, 4.5, 5, 5] },
        ], opciones: [] },
      { id: 'v4', nombre: 'tolerancia_caminata', label: 'Tolerancia a caminata', tipo: 'numerico', unidad: 'km/día',
        conjuntos: [
          { nombre: 'baja',  tipo: 'trapezoidal', puntos: [0,  0,  4,  8 ] },
          { nombre: 'media', tipo: 'triangular',  puntos: [6,  12, 18  ] },
          { nombre: 'alta',  tipo: 'trapezoidal', puntos: [15, 20, 25, 25] },
        ], opciones: [] },
    ],
    reglas: [
      { id: 'r1', condiciones: [{ var: 'interes_cultural', conjunto: 'alto' }, { var: 'presupuesto', conjunto: 'premium' }],
        conclusion: '🏛️ Ruta Premium: Cusco + Machu Picchu + Valle Sagrado', peso: 0.93 },
      { id: 'r2', condiciones: [{ var: 'interes_aventura', conjunto: 'alto' }, { var: 'tolerancia_caminata', conjunto: 'alta' }, { var: 'presupuesto', conjunto: 'moderado' }],
        conclusion: '🏔️ Trek Salkantay o Choquequirao — aventura completa', peso: 0.88 },
      { id: 'r3', condiciones: [{ var: 'interes_aventura', conjunto: 'bajo' }, { var: 'interes_cultural', conjunto: 'alto' }, { var: 'presupuesto', conjunto: 'moderado' }],
        conclusion: '🎭 Ruta Cultural Clásica: Cusco + Valle Sagrado sin trek', peso: 0.82 },
      { id: 'r4', condiciones: [{ var: 'presupuesto', conjunto: 'bajo' }, { var: 'tolerancia_caminata', conjunto: 'baja' }],
        conclusion: '🎒 Ruta Económica: Cusco ciudad + mercados + San Blas', peso: 0.78 },
    ],
    clases: [],
  },

  // ── 🌊 PSICOLOGÍA — Tamizaje de Estrés Académico ────────────
  { nombre: 'Tamizaje de Estrés Académico', tipo_motor: 'difuso', dominio: 'Psicología',
    descripcion: 'Clasifica el nivel de estrés en universitarios para priorizar derivación al psicólogo',
    hechos_ejemplo: { pss_score: '34', horas_sueno: '4', apoyo_social: '2.5', sintomas_fisicos: '4' },
    variables: [
      { id: 'v1', nombre: 'pss_score', label: 'Puntaje PSS — Estrés Percibido (0–40)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'bajo',     tipo: 'trapezoidal', puntos: [0,  0,  13, 18] },
          { nombre: 'moderado', tipo: 'triangular',  puntos: [14, 22, 28 ] },
          { nombre: 'alto',     tipo: 'trapezoidal', puntos: [25, 32, 40, 40] },
        ], opciones: [] },
      { id: 'v2', nombre: 'horas_sueno', label: 'Horas de sueño por noche', tipo: 'numerico', unidad: 'h',
        conjuntos: [
          { nombre: 'insuficiente', tipo: 'trapezoidal', puntos: [0, 0, 5, 6.5] },
          { nombre: 'aceptable',    tipo: 'triangular',  puntos: [5.5, 7, 8.5 ] },
          { nombre: 'adecuado',     tipo: 'trapezoidal', puntos: [7.5, 9, 12, 12] },
        ], opciones: [] },
      { id: 'v3', nombre: 'apoyo_social', label: 'Apoyo social percibido (1–10)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'bajo',  tipo: 'trapezoidal', puntos: [1, 1, 3.5, 5.5] },
          { nombre: 'medio', tipo: 'triangular',  puntos: [4, 6, 8 ] },
          { nombre: 'alto',  tipo: 'trapezoidal', puntos: [7, 8.5, 10, 10] },
        ], opciones: [] },
      { id: 'v4', nombre: 'sintomas_fisicos', label: 'Síntomas físicos (cefalea, fatiga… 0–5)', tipo: 'numerico', unidad: 'pts',
        conjuntos: [
          { nombre: 'pocos',    tipo: 'trapezoidal', puntos: [0, 0, 1, 2] },
          { nombre: 'moderados',tipo: 'triangular',  puntos: [1, 2.5, 4 ] },
          { nombre: 'muchos',   tipo: 'trapezoidal', puntos: [3, 4, 5, 5] },
        ], opciones: [] },
    ],
    reglas: [
      { id: 'r1', condiciones: [{ var: 'pss_score', conjunto: 'alto' }, { var: 'horas_sueno', conjunto: 'insuficiente' }, { var: 'sintomas_fisicos', conjunto: 'muchos' }],
        conclusion: '🔴 Nivel Severo — derivar a psicólogo urgente', peso: 0.92 },
      { id: 'r2', condiciones: [{ var: 'pss_score', conjunto: 'alto' }, { var: 'apoyo_social', conjunto: 'bajo' }],
        conclusion: '🟠 Nivel Alto — riesgo de burnout académico', peso: 0.84 },
      { id: 'r3', condiciones: [{ var: 'pss_score', conjunto: 'moderado' }, { var: 'horas_sueno', conjunto: 'insuficiente' }],
        conclusion: '🟡 Nivel Moderado — orientación y estrategias de afrontamiento', peso: 0.73 },
      { id: 'r4', condiciones: [{ var: 'pss_score', conjunto: 'bajo' }, { var: 'apoyo_social', conjunto: 'alto' }, { var: 'horas_sueno', conjunto: 'adecuado' }],
        conclusion: '🟢 Sin riesgo significativo — bienestar académico bueno', peso: 0.90 },
    ],
    clases: [],
  },

  // ── 🌊 LOGÍSTICA — Optimización de Rutas de Distribución ────
  { nombre: 'Optimización de Rutas de Distribución', tipo_motor: 'difuso', dominio: 'Logística',
    descripcion: 'Evalúa la eficiencia de una ruta de reparto según carga, paradas, distancia y puntualidad de entregas',
    hechos_ejemplo: { paradas: '14', distancia_km: '85', carga_pct: '35', entregas_puntual_pct: '52' },
    variables: [
      { id: 'v1', nombre: 'paradas', label: 'Número de paradas de entrega', tipo: 'numerico', unidad: 'paradas',
        conjuntos: [
          { nombre: 'pocas',     tipo: 'trapezoidal', puntos: [1,  1,  4,  7 ] },
          { nombre: 'moderadas', tipo: 'triangular',  puntos: [5,  9,  13 ] },
          { nombre: 'muchas',    tipo: 'trapezoidal', puntos: [11, 15, 25, 25] },
        ], opciones: [] },
      { id: 'v2', nombre: 'distancia_km', label: 'Distancia total del recorrido', tipo: 'numerico', unidad: 'km',
        conjuntos: [
          { nombre: 'corta',    tipo: 'trapezoidal', puntos: [0,  0,  25,  45 ] },
          { nombre: 'moderada', tipo: 'triangular',  puntos: [35, 65, 100 ] },
          { nombre: 'larga',    tipo: 'trapezoidal', puntos: [80, 120, 300, 300] },
        ], opciones: [] },
      { id: 'v3', nombre: 'carga_pct', label: 'Porcentaje de carga del vehículo', tipo: 'numerico', unidad: '%',
        conjuntos: [
          { nombre: 'baja',     tipo: 'trapezoidal', puntos: [0,  0,  35, 55 ] },
          { nombre: 'moderada', tipo: 'triangular',  puntos: [45, 65, 80 ] },
          { nombre: 'optima',   tipo: 'trapezoidal', puntos: [70, 88, 100, 100] },
        ], opciones: [] },
      { id: 'v4', nombre: 'entregas_puntual_pct', label: 'Entregas a tiempo', tipo: 'numerico', unidad: '%',
        conjuntos: [
          { nombre: 'baja',  tipo: 'trapezoidal', puntos: [0,  0,  50, 68 ] },
          { nombre: 'media', tipo: 'triangular',  puntos: [55, 75, 88 ] },
          { nombre: 'alta',  tipo: 'trapezoidal', puntos: [80, 93, 100, 100] },
        ], opciones: [] },
    ],
    reglas: [
      { id: 'r1', condiciones: [{ var: 'carga_pct', conjunto: 'baja' }, { var: 'paradas', conjunto: 'muchas' }],
        conclusion: '🔴 Ineficiente — muchas paradas con vehículo semivacío, consolidar cargas', peso: 0.92 },
      { id: 'r2', condiciones: [{ var: 'distancia_km', conjunto: 'larga' }, { var: 'entregas_puntual_pct', conjunto: 'baja' }],
        conclusion: '🟠 Reorganizar — ruta larga con alto incumplimiento, replanificar zonas', peso: 0.87 },
      { id: 'r3', condiciones: [{ var: 'carga_pct', conjunto: 'baja' }, { var: 'distancia_km', conjunto: 'larga' }],
        conclusion: '🟠 Ineficiente en costo — carga baja en ruta larga, agrupar pedidos', peso: 0.82 },
      { id: 'r4', condiciones: [{ var: 'carga_pct', conjunto: 'optima' }, { var: 'entregas_puntual_pct', conjunto: 'alta' }],
        conclusion: '🟢 Ruta Óptima — eficiencia máxima, mantener configuración', peso: 0.95 },
      { id: 'r5', condiciones: [{ var: 'paradas', conjunto: 'moderadas' }, { var: 'carga_pct', conjunto: 'moderada' }, { var: 'distancia_km', conjunto: 'moderada' }],
        conclusion: '🟡 Ruta Aceptable — margen de mejora agrupando zonas geográficas', peso: 0.74 },
    ],
    clases: [],
  },

  // ── 📊 OBSTETRICIA — Riesgo de Anemia en Gestantes ──────────
  { nombre: 'Riesgo de Anemia en Gestantes', tipo_motor: 'bayesiano', dominio: 'Obstetricia',
    descripcion: 'Clasifica riesgo de anemia ferropénica integrando hemoglobina, controles prenatales e IMC',
    hechos_ejemplo: { hemoglobina: '9.8', controles_prenatales: '2', edad_materna: '19', imc_pregestacional: '17.8' },
    variables: [
      { id: 'v1', nombre: 'hemoglobina',          label: 'Hemoglobina corregida por altitud', tipo: 'numerico', unidad: 'g/dL', conjuntos: [], opciones: [] },
      { id: 'v2', nombre: 'controles_prenatales', label: 'Controles prenatales realizados',   tipo: 'numerico', unidad: 'ctrl', conjuntos: [], opciones: [] },
      { id: 'v3', nombre: 'edad_materna',         label: 'Edad de la gestante',               tipo: 'numerico', unidad: 'años', conjuntos: [], opciones: [] },
      { id: 'v4', nombre: 'imc_pregestacional',   label: 'IMC pregestacional',                tipo: 'numerico', unidad: 'kg/m²',conjuntos: [], opciones: [] },
    ],
    reglas: [],
    clases: [
      { id: 'c1', nombre: '🔴 Caso Urgente — anemia moderada o severa', prior: 0.30,
        probs: {},
        probs_gauss: {
          hemoglobina:          { mu: 9.6,  sigma: 1.1 },
          controles_prenatales: { mu: 1.8,  sigma: 1.2 },
          edad_materna:         { mu: 19.5, sigma: 4.5 },
          imc_pregestacional:   { mu: 18.2, sigma: 2.2 },
        },
      },
      { id: 'c2', nombre: '🟢 Sin riesgo significativo de anemia', prior: 0.70,
        probs: {},
        probs_gauss: {
          hemoglobina:          { mu: 12.6, sigma: 0.9 },
          controles_prenatales: { mu: 6.5,  sigma: 2.1 },
          edad_materna:         { mu: 27,   sigma: 5.2 },
          imc_pregestacional:   { mu: 22.8, sigma: 2.5 },
        },
      },
    ],
  },

  // ── 🔗 CAPAS — Alertas Pedagógicas (Educación Inicial) ───────
  // Sistema con encadenamiento hacia adelante: 10 variables → 4 alertas dimensionales → alerta general.
  { nombre: 'Alertas Pedagógicas — Educación Inicial', tipo_motor: 'capas', dominio: 'Educación Inicial',
    descripcion: 'Evalúa 4 dimensiones del desarrollo infantil (comunicativa, motora, socioemocional, cognitiva) y genera una alerta pedagógica integrada',
    hechos_ejemplo: {
      lenguaje_oral: '2', motricidad_fina: '3', motricidad_gruesa: '4',
      socializacion: '2', autonomia: '3', atencion: '2',
      participacion: '2', regulacion_emocional: '2',
      seguimiento_instrucciones: '2', interaccion_docente: '3',
    },
    variables: [
      { id: 'v1',  nombre: 'lenguaje_oral',             label: 'Lenguaje oral',              tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v2',  nombre: 'motricidad_fina',           label: 'Motricidad fina',            tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v3',  nombre: 'motricidad_gruesa',         label: 'Motricidad gruesa',          tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v4',  nombre: 'socializacion',             label: 'Socialización',              tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v5',  nombre: 'autonomia',                 label: 'Autonomía',                  tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v6',  nombre: 'atencion',                  label: 'Atención',                   tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v7',  nombre: 'participacion',             label: 'Participación en aula',      tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v8',  nombre: 'regulacion_emocional',      label: 'Regulación emocional',       tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v9',  nombre: 'seguimiento_instrucciones', label: 'Seguimiento instrucciones',  tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
      { id: 'v10', nombre: 'interaccion_docente',       label: 'Interacción con la docente', tipo: 'numerico', unidad: 'pts', conjuntos: [], opciones: [] },
    ],
    reglas: [],
    clases: [],
    capas: [
      // CAPA 1 — Dimensión Comunicativa
      { id: 'comunicativa', nombre: 'Dimensión Comunicativa', color: '#818cf8', variable_salida: 'alerta_comunicativa',
        reglas: [
          { id: 'r1',  condiciones: [{ var: 'lenguaje_oral', op: '<=', val: '2' }, { var: 'participacion', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.90 },
          { id: 'r2',  condiciones: [{ var: 'lenguaje_oral', op: '<=', val: '2' }, { var: 'participacion', op: '<=', val: '3' }], conclusion: 'media', peso: 0.75 },
          { id: 'r3',  condiciones: [{ var: 'lenguaje_oral', op: '<=', val: '3' }, { var: 'participacion', op: '<=', val: '2' }], conclusion: 'media', peso: 0.72 },
          { id: 'r4',  condiciones: [{ var: 'lenguaje_oral', op: '>=', val: '4' }, { var: 'participacion', op: '>=', val: '4' }], conclusion: 'baja',  peso: 0.92 },
          { id: 'r5',  condiciones: [{ var: 'lenguaje_oral', op: '<=', val: '2' }, { var: 'interaccion_docente', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.88 },
          { id: 'r6',  condiciones: [{ var: 'lenguaje_oral', op: '>=', val: '3' }, { var: 'interaccion_docente', op: '>=', val: '4' }], conclusion: 'baja',  peso: 0.85 },
        ],
      },
      // CAPA 2 — Dimensión Motora
      { id: 'motora', nombre: 'Dimensión Motora', color: '#34d399', variable_salida: 'alerta_motora',
        reglas: [
          { id: 'r7',  condiciones: [{ var: 'motricidad_fina', op: '<=', val: '2' }, { var: 'autonomia', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.88 },
          { id: 'r8',  condiciones: [{ var: 'motricidad_fina', op: '<=', val: '2' }, { var: 'motricidad_gruesa', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.90 },
          { id: 'r9',  condiciones: [{ var: 'motricidad_fina', op: '>=', val: '4' }, { var: 'motricidad_gruesa', op: '>=', val: '4' }], conclusion: 'baja',  peso: 0.93 },
          { id: 'r10', condiciones: [{ var: 'motricidad_fina', op: '<=', val: '2' }, { var: 'motricidad_gruesa', op: '>=', val: '3' }], conclusion: 'media', peso: 0.70 },
          { id: 'r11', condiciones: [{ var: 'motricidad_fina', op: '<=', val: '3' }, { var: 'autonomia', op: '<=', val: '2' }], conclusion: 'media', peso: 0.68 },
          { id: 'r12', condiciones: [{ var: 'motricidad_fina', op: '>=', val: '3' }, { var: 'motricidad_gruesa', op: '>=', val: '3' }], conclusion: 'baja',  peso: 0.80 },
        ],
      },
      // CAPA 3 — Dimensión Socioemocional
      { id: 'socioemocional', nombre: 'Dimensión Socioemocional', color: '#f87171', variable_salida: 'alerta_socioemocional',
        reglas: [
          { id: 'r13', condiciones: [{ var: 'socializacion', op: '<=', val: '2' }, { var: 'regulacion_emocional', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.92 },
          { id: 'r14', condiciones: [{ var: 'socializacion', op: '<=', val: '2' }, { var: 'participacion', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.88 },
          { id: 'r15', condiciones: [{ var: 'socializacion', op: '>=', val: '4' }, { var: 'regulacion_emocional', op: '>=', val: '4' }], conclusion: 'baja',  peso: 0.93 },
          { id: 'r16', condiciones: [{ var: 'socializacion', op: '<=', val: '2' }, { var: 'regulacion_emocional', op: '<=', val: '3' }], conclusion: 'media', peso: 0.75 },
          { id: 'r17', condiciones: [{ var: 'socializacion', op: '>=', val: '3' }, { var: 'interaccion_docente', op: '>=', val: '3' }], conclusion: 'baja',  peso: 0.78 },
          { id: 'r18', condiciones: [{ var: 'socializacion', op: '<=', val: '3' }, { var: 'regulacion_emocional', op: '<=', val: '2' }], conclusion: 'media', peso: 0.72 },
        ],
      },
      // CAPA 4 — Dimensión Cognitiva-Conductual
      { id: 'cognitiva', nombre: 'Dimensión Cognitiva-Conductual', color: '#fbbf24', variable_salida: 'alerta_cognitiva',
        reglas: [
          { id: 'r19', condiciones: [{ var: 'atencion', op: '<=', val: '2' }, { var: 'seguimiento_instrucciones', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.91 },
          { id: 'r20', condiciones: [{ var: 'atencion', op: '<=', val: '2' }, { var: 'participacion', op: '<=', val: '2' }], conclusion: 'alta',  peso: 0.87 },
          { id: 'r21', condiciones: [{ var: 'atencion', op: '>=', val: '4' }, { var: 'seguimiento_instrucciones', op: '>=', val: '4' }], conclusion: 'baja',  peso: 0.93 },
          { id: 'r22', condiciones: [{ var: 'atencion', op: '<=', val: '2' }, { var: 'autonomia', op: '<=', val: '3' }], conclusion: 'media', peso: 0.73 },
          { id: 'r23', condiciones: [{ var: 'atencion', op: '<=', val: '3' }, { var: 'seguimiento_instrucciones', op: '<=', val: '2' }], conclusion: 'media', peso: 0.70 },
          { id: 'r24', condiciones: [{ var: 'atencion', op: '>=', val: '3' }, { var: 'seguimiento_instrucciones', op: '>=', val: '3' }], conclusion: 'baja',  peso: 0.82 },
        ],
      },
      // CAPA 5 — Integradora: Alerta Pedagógica General
      { id: 'general', nombre: 'Alerta Pedagógica General', color: '#c084fc', variable_salida: null,
        reglas: [
          { id: 'r25', condiciones: [{ var: 'alerta_comunicativa', op: '==', val: 'alta' }, { var: 'alerta_socioemocional', op: '==', val: 'alta' }], conclusion: '🔴 Alerta Pedagógica Muy Alta', peso: 0.93 },
          { id: 'r26', condiciones: [{ var: 'alerta_comunicativa', op: '==', val: 'alta' }, { var: 'alerta_cognitiva', op: '==', val: 'alta' }], conclusion: '🔴 Alerta Pedagógica Muy Alta', peso: 0.91 },
          { id: 'r27', condiciones: [{ var: 'alerta_socioemocional', op: '==', val: 'alta' }, { var: 'alerta_cognitiva', op: '==', val: 'alta' }], conclusion: '🔴 Alerta Pedagógica Muy Alta', peso: 0.90 },
          { id: 'r28', condiciones: [{ var: 'alerta_comunicativa', op: '==', val: 'alta' }, { var: 'alerta_motora', op: '==', val: 'alta' }, { var: 'alerta_cognitiva', op: '==', val: 'alta' }], conclusion: '🔴 Alerta Pedagógica Muy Alta', peso: 0.95 },
          { id: 'r29', condiciones: [{ var: 'alerta_comunicativa', op: '==', val: 'alta' }, { var: 'alerta_socioemocional', op: '==', val: 'media' }], conclusion: '🟠 Alerta Pedagógica Alta', peso: 0.82 },
          { id: 'r30', condiciones: [{ var: 'alerta_motora', op: '==', val: 'alta' }, { var: 'alerta_cognitiva', op: '==', val: 'alta' }], conclusion: '🟠 Alerta Pedagógica Alta', peso: 0.85 },
          { id: 'r31', condiciones: [{ var: 'alerta_comunicativa', op: '==', val: 'media' }, { var: 'alerta_socioemocional', op: '==', val: 'media' }, { var: 'alerta_cognitiva', op: '==', val: 'media' }], conclusion: '🟡 Alerta Pedagógica Media', peso: 0.75 },
          { id: 'r32', condiciones: [{ var: 'alerta_motora', op: '==', val: 'alta' }, { var: 'alerta_comunicativa', op: '==', val: 'baja' }], conclusion: '🟡 Alerta Pedagógica Media', peso: 0.72 },
          { id: 'r33', condiciones: [{ var: 'alerta_comunicativa', op: '==', val: 'baja' }, { var: 'alerta_socioemocional', op: '==', val: 'baja' }, { var: 'alerta_cognitiva', op: '==', val: 'baja' }], conclusion: '🟢 Alerta Pedagógica Baja', peso: 0.93 },
          { id: 'r34', condiciones: [{ var: 'alerta_motora', op: '==', val: 'baja' }, { var: 'alerta_comunicativa', op: '==', val: 'baja' }], conclusion: '🟢 Alerta Pedagógica Baja', peso: 0.88 },
        ],
      },
    ],
  },
];

export default function Home({ usuario, onCerrarSesion }: { usuario: Sesion; onCerrarSesion: () => void }) {
  const navigate = useNavigate();
  const { addModelo, setModeloActual, modelos } = useStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo_motor: 'crisp' as any, dominio: '' });
  const [errorNombre, setErrorNombre] = useState(false);
  const [adminPanel, setAdminPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aboutOpen,   setAboutOpen]   = useState(false);

  const crearModelo = () => {
    if (!form.nombre.trim()) { setErrorNombre(true); return; }
    setErrorNombre(false);
    const m = { ...form, id: crypto.randomUUID(), variables: [], reglas: [], clases: [] };
    addModelo(m);
    setModeloActual(m);
    navigate('/editor');
  };

  const abrirEjemplo = (ej: any) => {
    const m = { ...ej, id: crypto.randomUUID() };
    addModelo(m);
    setModeloActual(m);
    navigate('/editor');
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' as const,
  };
  const labelStyle = { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 5, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };

  const ECOSISTEMA = [
    { emoji: '🎓', label: 'Statia Go',     color: '#4fffb0', bg: 'rgba(79,255,176,',  url: 'https://statia-go.vercel.app' },
    { emoji: '🔬', label: 'Observa',       color: '#a5b4fc', bg: 'rgba(99,102,241,',  url: 'https://statia-observa.vercel.app' },
    { emoji: '📊', label: 'Statia Pro',    color: '#6699ff', bg: 'rgba(102,153,255,', url: 'https://statia-pro.vercel.app' },
    { emoji: '🌐', label: 'Statia Web',    color: '#38bdf8', bg: 'rgba(56,189,248,',  url: 'https://statiards.netlify.app' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f14', color: '#f1f5f9', fontFamily: 'DM Sans, sans-serif', display: 'flex' }}>

      {/* ── Barra lateral ── */}
      <aside style={{ width: sidebarOpen ? 210 : 0, minHeight: '100vh', flexShrink: 0, background: '#0b0d14', borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.07)' : 'none', display: 'flex', flexDirection: 'column', padding: sidebarOpen ? '20px 14px 16px' : '0', overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.3s cubic-bezier(0.4,0,0.2,1)', opacity: sidebarOpen ? 1 : 0 }}>
        {/* Logo */}
        <div style={{ marginBottom: 24, paddingLeft: 4, whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 18 }}>🏅</span> Statia Expert
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 3, paddingLeft: 1 }}>Inferencia · Reglas · Difuso · Bayes</div>
        </div>

        {/* Ecosistema */}
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, paddingLeft: 4, whiteSpace: 'nowrap' }}>🌐 Ecosistema Statia</div>

        {/* Expert — activo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 10, marginBottom: 4, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 13 }}>🏅</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fb923c' }}>Expert</div>
            <div style={{ fontSize: 9, color: 'rgba(251,146,60,0.5)' }}>activo</div>
          </div>
        </div>

        {/* Otras apps */}
        {ECOSISTEMA.map(app => (
          <a key={app.url} href={app.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: `${app.bg}0.06)`, border: `1px solid ${app.bg}0.18)`, borderRadius: 10, marginBottom: 4, textDecoration: 'none', transition: 'border-color 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${app.bg}0.45)`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = `${app.bg}0.18)`)}>
            <span style={{ fontSize: 13 }}>{app.emoji}</span>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: app.color, overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.label} →</div>
            </div>
          </a>
        ))}

        <div style={{ flex: 1 }} />

        {/* Acerca de */}
        <button onClick={() => setAboutOpen(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, marginBottom: 8, cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
          <span style={{ fontSize: 13 }}>ℹ️</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Acerca de</span>
        </button>

        {/* Usuario */}
        <div style={{ padding: '10px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>@{usuario.username}</div>
          {usuario.rol === 'super_admin' && (
            <button onClick={() => setAdminPanel(true)} style={{ width: '100%', marginBottom: 5, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 7, padding: '5px 0', cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
              ⊙ Admin
            </button>
          )}
          <button onClick={onCerrarSesion} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', borderRadius: 7, padding: '5px 0', cursor: 'pointer', fontSize: 10 }}>
            Salir
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
      <div style={{ padding: '36px 48px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(v => !v)}
              title={sidebarOpen ? 'Ocultar menú' : 'Menú'}
              style={{ background: sidebarOpen ? 'rgba(255,255,255,0.05)' : 'rgba(251,146,60,0.1)', border: `1px solid ${sidebarOpen ? 'rgba(255,255,255,0.1)' : 'rgba(251,146,60,0.35)'}`, color: sidebarOpen ? 'rgba(255,255,255,0.5)' : '#fb923c', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
              {sidebarOpen ? '◀' : '☰'}
            </button>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#f1f5f9' }}>
                Sistema de inferencia
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                Reglas clásicas · Lógica difusa · Bayesiano
              </div>
            </div>
          </div>
          <button onClick={() => setModal(true)}
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff',
                     borderRadius: 12, padding: '11px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Nuevo modelo
          </button>
        </div>

        {/* Motores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 40 }}>
          {MOTORES.map(m => (
            <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                      borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Mis modelos */}
        {modelos.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
              Mis modelos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
              {modelos.map(m => (
                <div key={m.id}
                  onClick={() => { setModeloActual(m); navigate('/editor'); }}
                  style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                           borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                           transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)')}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#c7d2fe', marginBottom: 4 }}>{m.nombre}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                    {m.tipo_motor} · {m.dominio || 'Sin dominio'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {m.variables.length} var · {m.reglas.length} reglas
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ejemplos */}
        <section>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Ejemplos listos para probar
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {EJEMPLOS.map((ej, i) => (
              <div key={i}
                onClick={() => abrirEjemplo(ej)}
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                         borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                         transition: 'background 0.2s, border-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                <div style={{ fontSize: 11, color: '#a5b4fc', marginBottom: 6 }}>
                  {(ej.tipo_motor as string) === 'crisp' ? '⚡' : (ej.tipo_motor as string) === 'difuso' ? '🌊' : '📊'} {ej.dominio}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{ej.nombre}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{ej.descripcion}</div>
                <div style={{ marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  {(ej as any).variables.length} variables · {(ej as any).reglas.length + (ej as any).clases.length} reglas/clases
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      </div>{/* fin contenido principal */}

      {/* Modal nuevo modelo */}
      {adminPanel && <AdminPanel onClose={() => setAdminPanel(false)} />}

      {/* Modal Acerca de */}
      {aboutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex',
                      alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}
          onClick={e => e.target === e.currentTarget && setAboutOpen(false)}>
          <div style={{ background: '#131720', borderRadius: '20px 20px 0 0', padding: '28px 24px 40px',
                        width: '100%', maxWidth: 480, borderTop: '1px solid rgba(251,146,60,0.25)',
                        animation: 'fadeUp 0.28s ease' }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ width: 62, height: 62, background: 'linear-gradient(135deg,#0d0f14,#131720)',
                            border: '1px solid rgba(251,146,60,0.35)', borderRadius: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 12px', boxShadow: '0 0 28px rgba(251,146,60,0.12)' }}>
                <span style={{ fontSize: 30 }}>🏅</span>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#f1f5f9' }}>
                Statia <span style={{ color: '#fb923c' }}>Expert</span>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Inferencia · Reglas · Lógica Difusa · Bayesiano
              </div>
            </div>

            {/* Desarrollador */}
            <div style={{ background: 'linear-gradient(135deg,rgba(251,146,60,0.09),rgba(251,146,60,0.03))',
                          border: '1px solid rgba(251,146,60,0.22)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(251,146,60,0.6)', letterSpacing: '0.1em',
                            textTransform: 'uppercase', marginBottom: 10 }}>Desarrollador</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(251,146,60,0.15)', border: '2px solid rgba(251,146,60,0.35)',
                              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 18, flexShrink: 0 }}>👨‍💻</div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>
                    José Luis Rodas Cobos
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                    Creador del ecosistema Statia · Perú 🇵🇪
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)',
                          textAlign: 'center', lineHeight: 1.8, marginBottom: 16 }}>
              Hecho con ❤️ para docentes y estudiantes universitarios<br/>
              <span style={{ color: 'rgba(251,146,60,0.4)' }}>© 2026 Jose Rodas — Statia Expert</span>
            </div>

            <button onClick={() => setAboutOpen(false)}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                       border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                       color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Mono, monospace',
                       fontSize: 12, cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: '#13161d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                        padding: '28px 28px', width: 400, maxWidth: '90vw' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, marginBottom: 22 }}>
              Nuevo modelo
            </div>

            <label style={labelStyle}>Nombre</label>
            <input
              style={{ ...inputStyle, marginBottom: 4, borderColor: errorNombre ? '#f87171' : 'rgba(255,255,255,0.1)' }}
              placeholder="Ej: Diagnóstico de riesgo laboral"
              value={form.nombre}
              onChange={e => { setErrorNombre(false); setForm(f => ({ ...f, nombre: e.target.value })); }} />
            {errorNombre && <div style={{ fontSize: 10, color: '#f87171', marginBottom: 10 }}>El nombre es obligatorio</div>}
            {!errorNombre && <div style={{ marginBottom: 10 }} />}

            <label style={labelStyle}>Motor de inferencia</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
              {MOTORES.map(m => (
                <button key={m.id} onClick={() => setForm(f => ({ ...f, tipo_motor: m.id }))}
                  style={{ padding: '10px 6px', borderRadius: 10, cursor: 'pointer', fontSize: 12,
                           background: form.tipo_motor === m.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                           border: `1px solid ${form.tipo_motor === m.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                           color: form.tipo_motor === m.id ? '#a5b4fc' : 'rgba(255,255,255,0.45)' }}>
                  {m.icon}<br />{m.label}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Dominio (opcional)</label>
            <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="Educación, Salud, RRHH..."
              value={form.dominio} onChange={e => setForm(f => ({ ...f, dominio: e.target.value }))} />

            <label style={labelStyle}>Descripción (opcional)</label>
            <input style={{ ...inputStyle, marginBottom: 22 }} placeholder="Describe qué decide este modelo..."
              value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                         color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={crearModelo}
                style={{ flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
                         color: '#fff', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Crear y abrir editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
