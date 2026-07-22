"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OwnContentMenu } from "@/components/OwnContentMenu";
import { portalHref } from "@/lib/paths";

type Props = {
  id: string;
  authorAnonId?: string | null;
  title: string;
  body: string;
};

/** Client island for report author edit/delete on a server-rendered page. */
export function ReportOwnControls({
  id,
  authorAnonId,
  title,
  body,
}: Props) {
  const router = useRouter();
  const [titleState, setTitleState] = useState(title);
  const [bodyState, setBodyState] = useState(body);

  return (
    <OwnContentMenu
      className="mt-4"
      endpoint={`/api/reports/${id}`}
      authorAnonId={authorAnonId}
      fields={{ title: titleState, body: bodyState }}
      labels={{ title: "Title", body: "Details" }}
      onUpdated={(data) => {
        const d = data as {
          report?: { title?: string; body?: string };
        };
        if (d.report?.title) setTitleState(d.report.title);
        if (d.report?.body) setBodyState(d.report.body);
        router.refresh();
      }}
      onDeleted={() => router.push(portalHref("/reports"))}
    />
  );
}
