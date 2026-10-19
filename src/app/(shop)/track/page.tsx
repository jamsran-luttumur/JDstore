import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/Section";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = {
  title: "Захиалга шалгах",
  description: "Утасны дугаар болон захиалгын дугаараараа захиалгын төлөвөө шалгаарай.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <>
      <PageHeader title="Захиалга шалгах">
        <Breadcrumbs items={[{ label: "Захиалга шалгах" }]} />
      </PageHeader>
      <div className="container-x py-8">
        <TrackForm />
      </div>
    </>
  );
}
