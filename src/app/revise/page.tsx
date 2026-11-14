import { Suspense } from "react";
import { Revise } from "./Revise";

export const metadata = { title: "Revise · Prep Studio" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Revise />
    </Suspense>
  );
}
