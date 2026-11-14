import type { Problem, TrackId } from "@/lib/types";
import { CODE_PROBLEMS } from "./problems-code";
import { SQL_MORE } from "./problems-sql-more";
import { PY_MORE } from "./problems-py-more";
import { CONCEPT_PROBLEMS } from "./problems-concept";
import { CASE_PROBLEMS } from "./problems-case";

export const PROBLEMS: Problem[] = [...CODE_PROBLEMS, ...SQL_MORE, ...PY_MORE, ...CONCEPT_PROBLEMS, ...CASE_PROBLEMS];

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
