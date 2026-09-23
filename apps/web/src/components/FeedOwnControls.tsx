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

export function FeedOwnControls({
  id,
  authorAnonId,
  title,
  body,
}: Props) {
  const router = useRouter();
  const [fields, setFields] = useState({ title, body });

  return (
    <OwnContentMenu
      className="mt-4"
      endpoint={`/api/feed/${id}`}
      authorAnonId={authorAnonId}
      fields={fields}
      labels={{ title: "Title", body: "Post" }}
      onUpdated={(data) => {
        const d = data as {
          post?: { title?: string; body?: string; excerpt?: string };
        };
        if (d.post) {
          setFields({
            title: d.post.title ?? fields.title,
            body: d.post.body ?? d.post.excerpt ?? fields.body,
          });
        }
        router.refresh();
      }}
      onDeleted={() => router.push(portalHref("/"))}
    />
  );
}
