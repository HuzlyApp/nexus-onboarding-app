"use client";

import { useState, useEffect } from "react";
import ResumeReviewForm from "@/app/components/ResumeReviewForm";
import { ResumeSchema, type ResumeData } from "@/lib/resumeSchema";

export default function Step1ReviewPage() {
  const [data, setData] = useState<ResumeData | null>(null);

  useEffect(() => {
    // Replace with your real data source
    const load = async () => {
      // const result = await fetch... or from localStorage
      setData(ResumeSchema.parse({}));
    };
    load();
  }, []);

  if (!data) {
    return <div className="p-8 text-center">Loading resume data...</div>;
  }

  return <ResumeReviewForm initialData={data} />;
}