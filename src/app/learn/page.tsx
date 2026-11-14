import { Suspense } from "react";
import { Syllabus } from "./Syllabus";

export const metadata = { title: "Learn · Prep Studio" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Syllabus />
    </Suspense>
  );
}
