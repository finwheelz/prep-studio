import { Suspense } from "react";
import { Roadmap } from "./Roadmap";

export const metadata = { title: "Roadmaps · Prep Studio" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Roadmap />
    </Suspense>
  );
}
