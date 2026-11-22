import type { Problem, TrackId } from "@/lib/types";
import { CODE_PROBLEMS } from "./problems-code";
import { SQL_MORE } from "./problems-sql-more";
import { PY_MORE } from "./problems-py-more";
import { CONCEPT_PROBLEMS } from "./problems-concept";
import { CASE_PROBLEMS } from "./problems-case";
import { P1_PROBLEMS } from "./problems-p1";
import { P1_CORE_PROBLEMS } from "./problems-p1-core";
import { P1_DSA_PROBLEMS } from "./problems-p1-dsa";
import { P1_NUMPY_PROBLEMS } from "./problems-p1-numpy";
import { P1_PANDAS_PROBLEMS } from "./problems-p1-pandas";
import { P1_PLOT_PROBLEMS } from "./problems-p1-plot";
import { P1_SKLEARN_PROBLEMS } from "./problems-p1-sklearn";
import { P1_TORCH_PROBLEMS } from "./problems-p1-torch";

export const PROBLEMS: Problem[] = [...CODE_PROBLEMS, ...SQL_MORE, ...PY_MORE, ...CONCEPT_PROBLEMS, ...CASE_PROBLEMS, ...P1_PROBLEMS, ...P1_CORE_PROBLEMS, ...P1_DSA_PROBLEMS, ...P1_NUMPY_PROBLEMS, ...P1_PANDAS_PROBLEMS, ...P1_PLOT_PROBLEMS, ...P1_SKLEARN_PROBLEMS, ...P1_TORCH_PROBLEMS];

export const problemById = (id: string) => PROBLEMS.find((p) => p.id === id);
export const problemsByPillar = (pillar: string) => PROBLEMS.filter((p) => p.pillar === pillar);
export const problemsByTrack = (t: TrackId) => PROBLEMS.filter((p) => p.tracks.includes(t));

export const KIND_LABEL: Record<Problem["kind"], string> = {
  sql: "SQL",
  python: "Python",
  concept: "Concept lab",
  rca: "RCA case",
  guesstimate: "Guesstimate",
  open: "Product case",
};
