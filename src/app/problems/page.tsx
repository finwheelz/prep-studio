import { Suspense } from "react";
import { ProblemList } from "./ProblemList";

export const metadata = { title: "Problems · Prep Studio" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProblemList />
    </Suspense>
  );
}
