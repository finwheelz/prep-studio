import { notFound } from "next/navigation";
import { OA_SETS, oaSetById } from "@/data/oa";
import { OaRoom } from "./OaRoom";

export function generateStaticParams() {
  return OA_SETS.map((s) => ({ id: s.id }));
}

export default function Page({ params }: { params: { id: string } }) {
  if (!oaSetById(params.id)) notFound();
  return <OaRoom setId={params.id} />;
}
