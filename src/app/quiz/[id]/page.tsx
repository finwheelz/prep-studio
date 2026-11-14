import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TOPICS, TRACK_META, topicById } from "@/data/syllabus";
import { QuizRunner } from "./QuizRunner";

const MIX = ["mix-all", ...TRACK_META.map((t) => `mix-${t.id}`)];

export function generateStaticParams() {
  return [...TOPICS.map((t) => ({ id: t.id })), ...MIX.map((id) => ({ id }))];
}

export default function Page({ params }: { params: { id: string } }) {
  if (!topicById(params.id) && !MIX.includes(params.id)) notFound();
  return (
    <Suspense fallback={null}>
      <QuizRunner id={params.id} />
    </Suspense>
  );
}
