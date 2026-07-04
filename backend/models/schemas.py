from pydantic import BaseModel
from typing import Any, Optional

class InferCrispRequest(BaseModel):
    hechos:  dict[str, Any]
    reglas:  list[dict[str, Any]]

class InferFuzzyRequest(BaseModel):
    hechos:    dict[str, Any]
    variables: list[dict[str, Any]]
    reglas:    list[dict[str, Any]]

class InferBayesianRequest(BaseModel):
    hechos:    dict[str, Any]
    variables: list[dict[str, Any]]
    clases:    list[dict[str, Any]]
