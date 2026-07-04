import math

def _membership(value: float, conjunto: dict) -> float:
    tipo = conjunto.get("tipo", "trapezoidal")
    pts  = conjunto.get("puntos", [])
    v    = float(value)

    if tipo == "triangular" and len(pts) >= 3:
        a, b, c = float(pts[0]), float(pts[1]), float(pts[2])
        if v <= a or v >= c: return 0.0
        return (v - a) / (b - a) if v <= b else (c - v) / (c - b)

    if tipo == "trapezoidal" and len(pts) >= 4:
        a, b, c, d = float(pts[0]), float(pts[1]), float(pts[2]), float(pts[3])
        if v <= a or v >= d: return 0.0
        if b <= v <= c:      return 1.0
        return (v - a) / (b - a) if v < b else (d - v) / (d - c)

    return 0.0


def _membership_cat(value: str, conjunto: dict) -> float:
    return 1.0 if str(value).lower() == str(conjunto.get("valor", "")).lower() else 0.0


def inferir_difuso(hechos: dict, variables: list[dict], reglas: list[dict]) -> list[dict]:
    var_map = {v["nombre"]: v for v in variables}
    resultados = []

    for r in reglas:
        grados = []
        for cond in r.get("condiciones", []):
            var_def = var_map.get(cond["var"])
            if not var_def:
                grados.append(0.0)
                continue
            conjunto = next((c for c in var_def.get("conjuntos", []) if c["nombre"] == cond["conjunto"]), None)
            if not conjunto:
                grados.append(0.0)
                continue
            val = hechos.get(cond["var"])
            if val is None:
                grados.append(0.0)
                continue
            if var_def["tipo"] == "numerico":
                grados.append(_membership(float(val), conjunto))
            else:
                grados.append(_membership_cat(str(val), conjunto))

        if not grados:
            continue
        firing = min(grados)
        certeza = round(firing * float(r.get("peso", 1.0)), 4)
        if certeza > 0:
            resultados.append({
                "conclusion":  r["conclusion"],
                "certeza":     certeza,
                "firing":      round(firing, 4),
                "explicacion": r.get("explicacion", ""),
            })

    return sorted(resultados, key=lambda x: -x["certeza"])
