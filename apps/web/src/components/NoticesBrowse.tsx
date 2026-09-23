"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { portalHref } from "@/lib/paths";

type Notice = {
  id: string;
  title: string;
  description?: string | null;
  target?: string | null;
  signatures?: number;
};

export function NoticesBrowse() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load notices");
      setNotices((data.notices ?? []) as Notice[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy sm:text-4xl">
            Notices
          </h1>
          <p className="mt-2 text-sm text-muted">
            Public civic notices people can acknowledge.
          </p>
        </div>
        <Link
          href={portalHref("/notice/new")}
          className="inline-flex bg-amber px-4 py-2.5 text-sm font-semibold text-on-amber hover:bg-amber-bright"
        >
          Raise a notice
        </Link>
      </div>
      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : error ? (
        <p className="mt-10 text-sm text-danger">{error}</p>
      ) : notices.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No notices yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-t border-line">
          {notices.map((n) => (
            <li key={n.id} className="py-5">
              <Link
                href={portalHref(`/notice/${n.id}`)}
                className="font-display text-xl text-navy hover:text-link"
              >
                {n.title}
              </Link>
              {n.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {n.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                {(n.signatures ?? 0).toLocaleString("en-IN")} signatures
                {n.target ? ` · ${n.target}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
