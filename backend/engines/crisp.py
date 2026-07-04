from typing import Any

OPS = {
    ">":  lambda a, b: float(a) > float(b),
    "<":  lambda a, b: float(a) < float(b),
    ">=": lambda a, b: float(a) >= float(b),
    "<=": lambda a, b: float(a) <= float(b),
    "==": lambda a, b: str(a).lower() == str(b).lower(),
    "!=": lambda a, b: str(a).lower() != str(b).lower(),
}

def inferir_crisp(hechos: dict, reglas: list[dict]) -> list[dict]:
    resultados = []
    for r in reglas:
        activada = all(
            OPS.get(c["op"], lambda a, b: False)(hechos.get(c["var"], ""), c["val"])
            for c in r.get("condiciones", [])
        )
        if activada:
            resultados.append({
                "conclusion":  r["conclusion"],
                "certeza":     float(r.get("peso", 1.0)),
                "explicacion": r.get("explicacion", ""),
            })
    return sorted(resultados, key=lambda x: -x["certeza"])
