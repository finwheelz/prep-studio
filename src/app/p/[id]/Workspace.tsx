"use client";

import { problemById } from "@/data/problems";
import { ProblemStudio } from "@/components/studio/ProblemStudio";
import { ConceptCanvas } from "@/components/ml/ConceptCanvas";
import { RcaStudio } from "@/components/cases/RcaStudio";
import { GuesstimateStudio } from "@/components/cases/GuesstimateStudio";
import { OpenStudio } from "@/components/cases/OpenStudio";

/** One route, one workspace per problem kind. `key` resets all local state when the problem changes. */
export function Workspace({ id }: { id: string }) {
  const p = problemById(id)!;
  switch (p.kind) {
    case "sql":
    case "python":
      return <ProblemStudio key={p.id} problem={p} />;
    case "concept":
      return <ConceptCanvas key={p.id} problem={p} />;
    case "rca":
      return <RcaStudio key={p.id} problem={p} />;
    case "guesstimate":
      return <GuesstimateStudio key={p.id} problem={p} />;
    case "open":
      return <OpenStudio key={p.id} problem={p} />;
  }
}
