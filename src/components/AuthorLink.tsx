import Link from "next/link";

type Props = {
  anonId?: string | null;
  label?: string | null;
  className?: string;
};

/** Clickable public anonymity ID (never a phone number). */
export function AuthorLink({ anonId, label, className }: Props) {
  const text = label || (anonId ? `Anon ${anonId}` : "Anonymous citizen");
  if (!anonId) {
    return <span className={className}>{text}</span>;
  }
  return (
    <Link
      href={`/u/${anonId}`}
      className={className ?? "text-amber hover:underline"}
      title={`View anonymous profile ${anonId}`}
    >
      {text}
    </Link>
  );
}
