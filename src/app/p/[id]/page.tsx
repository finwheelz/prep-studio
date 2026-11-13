import { notFound } from "next/navigation";
import { PROBLEMS, problemById } from "@/data/problems";
import { Workspace } from "./Workspace";

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const p = problemById(params.id);
  return { title: p ? `${p.title} · Prep Studio` : "Prep Studio" };
}

export default function Page({ params }: { params: { id: string } }) {
  if (!problemById(params.id)) notFound();
  return <Workspace id={params.id} />;
}
