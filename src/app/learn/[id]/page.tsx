import { notFound } from "next/navigation";
import { TOPICS, topicById } from "@/data/syllabus";
import { TopicPage } from "./TopicPage";

export function generateStaticParams() {
  return TOPICS.map((t) => ({ id: t.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const t = topicById(params.id);
  return { title: t ? `${t.title} · Prep Studio` : "Prep Studio" };
}

export default function Page({ params }: { params: { id: string } }) {
  if (!topicById(params.id)) notFound();
  return <TopicPage id={params.id} />;
}
