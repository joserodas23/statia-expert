import math

def _gauss_pdf(x: float, mu: float, sigma: float) -> float:
    if sigma <= 0:
        return 1.0
    return (1.0 / (sigma * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((x - mu) / sigma) ** 2)


def inferir_bayesiano(hechos: dict, variables: list[dict], clases: list[dict]) -> list[dict]:
    var_map = {v["nombre"]: v for v in variables}
    scores = []

    for cl in clases:
        score = float(cl.get("prior", 0.1))
        probs       = cl.get("probs", {})       # discretas: {"fiebre_si": 0.85}
        probs_gauss = cl.get("probs_gauss", {}) # gaussianas: {"temperatura": {"mu":38.9,"sigma":0.5}}

        for var_nombre, val in hechos.items():
            if val is None or val == "":
                continue
            var_def = var_map.get(var_nombre)
            if not var_def:
                continue

            if var_def["tipo"] == "numerico":
                g = probs_gauss.get(var_nombre)
                if g and g.get("sigma", 0) > 0:
                    p = _gauss_pdf(float(val), float(g["mu"]), float(g["sigma"]))
                    score *= max(p, 1e-10)
            else:
                key = f"{var_nombre}_{str(val).lower()}"
                p = float(probs.get(key, 0.5))  # Laplace smoothing: 0.5 si no definido
                score *= max(p, 1e-10)

        scores.append({"nombre": cl["nombre"], "score": score})

    total = sum(s["score"] for s in scores)
    result = [
        {
            "conclusion": s["nombre"],
            "certeza":    round(s["score"] / total, 4) if total > 0 else 0.0,
        }
        for s in scores
    ]
    return sorted(result, key=lambda x: -x["certeza"])
