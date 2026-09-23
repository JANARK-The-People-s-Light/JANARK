"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OwnContentMenu } from "@/components/OwnContentMenu";
import { portalHref } from "@/lib/paths";

type Props = {
  id: string;
  authorAnonId?: string | null;
  title: string;
  ask: string;
  body: string;
};

export function PetitionOwnControls({
  id,
  authorAnonId,
  title,
  ask,
  body,
}: Props) {
  const router = useRouter();
  const [fields, setFields] = useState({ title, ask, body });

  return (
    <OwnContentMenu
      className="mt-4"
      endpoint={`/api/demands/${id}`}
      authorAnonId={authorAnonId}
      fields={fields}
      labels={{ title: "Title", ask: "Ask", body: "Details" }}
      onUpdated={(data) => {
        const d = data as {
          demand?: { title?: string; ask?: string; body?: string };
        };
        if (d.demand) {
          setFields({
            title: d.demand.title ?? fields.title,
            ask: d.demand.ask ?? fields.ask,
            body: d.demand.body ?? fields.body,
          });
        }
        router.refresh();
      }}
      onDeleted={() => router.push(portalHref("/petitions"))}
    />
  );
}
