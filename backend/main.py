"""
Statia Expert — Backend FastAPI
by Jose Rodas
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import InferCrispRequest, InferFuzzyRequest, InferBayesianRequest
from engines.crisp    import inferir_crisp
from engines.fuzzy    import inferir_difuso
from engines.bayesian import inferir_bayesiano

app = FastAPI(title="Statia Expert API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/infer/crisp")
def infer_crisp(req: InferCrispRequest):
    resultados = inferir_crisp(req.hechos, req.reglas)
    return {"motor": "crisp", "resultados": resultados}


@app.post("/infer/fuzzy")
def infer_fuzzy(req: InferFuzzyRequest):
    resultados = inferir_difuso(req.hechos, req.variables, req.reglas)
    return {"motor": "difuso", "resultados": resultados}


@app.post("/infer/bayesian")
def infer_bayesian(req: InferBayesianRequest):
    resultados = inferir_bayesiano(req.hechos, req.variables, req.clases)
    return {"motor": "bayesiano", "resultados": resultados}
