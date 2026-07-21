import Link from "next/link";
import type { Metadata } from "next";
import { getDashboardData } from "@/lib/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "National Dashboard",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const maxVotes = Math.max(
    data.topIssues[0]?.voteCount ?? 0,
    data.topReports[0]?.upvotes ?? 0,
    data.topDemands[0]?.supportCount ?? 0,
    1,
  );
  const empty =
    data.topIssues.length === 0 &&
    data.topReports.length === 0 &&
    data.topDemands.length === 0 &&
    data.trends.length === 0 &&
    data.activity.length === 0 &&
    data.states.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        National signal
      </p>
      <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">National signal</h1>
      <p className="mt-3 max-w-2xl text-muted">
        What citizens are elevating right now. Empty until people post, vote,
        or support.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
        {[
          ["Citizens", data.stats.citizens],
          ["Proposals", data.stats.activeProposals],
          ["Votes", data.stats.votes],
          ["Notices", data.stats.notices],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="font-display text-2xl text-navy sm:text-3xl">
              {Number(value).toLocaleString("en-IN")}
            </p>
            <p className="text-xs uppercase tracking-wider text-muted">
              {label}
            </p>
          </div>
        ))}
      </div>

      {empty ? (
        <p className="mt-12 text-muted">
          No signal yet.{" "}
          <Link href="/demands/new" className="text-amber hover:underline">
            Raise a demand
          </Link>{" "}
          or{" "}
          <Link href="/reports/new" className="text-amber hover:underline">
            report a problem
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            {data.topIssues.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">Top issues</h2>
                <ul className="mt-6 space-y-4">
                  {data.topIssues.map((issue, i) => (
                    <li key={issue.slug}>
                      <Link
                        href={`/issues/${issue.slug}`}
                        className="group block"
                      >
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-navy group-hover:text-amber">
                            {issue.title}
                          </span>
                          <span className="text-muted">
                            {issue.voteCount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden bg-sand">
                          <div
                            className="bar-fill h-full bg-navy-mid"
                            style={{
                              width: `${(issue.voteCount / maxVotes) * 100}%`,
                              animationDelay: `${i * 0.06}s`,
                            }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.topReports.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">Top reports</h2>
                <ul className="mt-6 space-y-4">
                  {data.topReports.map((r, i) => (
                    <li key={r.id}>
                      <Link href={r.href} className="group block">
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-navy group-hover:text-amber">
                            {r.title}
                          </span>
                          <span className="text-muted">{r.upvotes}</span>
                        </div>
                        <div className="h-3 overflow-hidden bg-sand">
                          <div
                            className="bar-fill h-full bg-amber"
                            style={{
                              width: `${(r.upvotes / maxVotes) * 100}%`,
                              animationDelay: `${i * 0.06}s`,
                            }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.topDemands.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">Top demands</h2>
                <ul className="mt-6 space-y-4">
                  {data.topDemands.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={d.href}
                        className="flex justify-between border-b border-line py-3 text-sm text-navy hover:text-amber"
                      >
                        <span>{d.title}</span>
                        <span className="text-muted">{d.supportCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.states.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">
                  State signals
                </h2>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {data.states.map((s) => (
                    <li
                      key={s.state}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div>
                        <p className="font-medium text-navy">{s.state}</p>
                        <p className="text-sm text-muted">{s.topIssue}</p>
                      </div>
                      <p className="text-amber">
                        {"★".repeat(Math.round(s.rating))}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {data.trends.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-navy">Live trends</h2>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                {data.trends.map((t) => (
                  <Link
                    key={t.term}
                    href="/feed"
                    className="py-1 text-sm text-muted transition hover:text-amber"
                  >
                    {t.term}{" "}
                    <span className="text-[11px] tabular-nums opacity-50">
                      {t.score}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.activity.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-navy">Recent activity</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {data.activity.map((a) => (
                  <li key={a.id} className="py-3">
                    {a.href ? (
                      <Link
                        href={a.href}
                        className="text-sm text-navy hover:text-amber"
                      >
                        <span className="text-xs uppercase tracking-wider text-muted">
                          {a.kind}
                        </span>{" "}
                        — {a.summary}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">{a.summary}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
