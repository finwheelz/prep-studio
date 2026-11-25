import { Suspense } from "react";
import { Mock } from "./Mock";

export const metadata = { title: "Mock rounds · Prep Studio" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Mock />
    </Suspense>
  );
}
