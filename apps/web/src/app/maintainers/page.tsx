import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { MaintainerApplyForm } from "@/components/MaintainerApplyForm";
import {
  fill,
  getMaintainersForm,
  publicLink,
  sys,
  templates,
} from "@/lib/config";
import { IconGithub } from "@/components/Icons";

const brand = templates.brand();
const form = getMaintainersForm();
const layout = sys.landing();
const githubHref = publicLink("github");

export const metadata = {
  title: fill(form.metaTitle, { name: brand.name }),
  description: fill(form.metaDescription, { name: brand.name }),
};

export default function MaintainersPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-line/80 bg-chrome text-on-chrome">
        <div
          className="mx-auto flex items-center justify-between gap-4 px-5 sm:px-8"
          style={{
            maxWidth: layout.maxWidthPx,
            height: `${layout.headerHeightRem}rem`,
          }}
        >
          <Link href="/" aria-label={brand.name}>
            <BrandLogo size="md" withWordmark onDark priority />
          </Link>
          {githubHref ? (
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-on-chrome/85 transition hover:border-amber-bright/40 hover:bg-white/10 hover:text-amber-bright"
              aria-label={templates.landing().githubAriaLabel}
            >
              <IconGithub className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </header>

      <main
        className="mx-auto w-full flex-1 px-5 py-10 sm:px-8 sm:py-12"
        style={{ maxWidth: 720 }}
      >
        <Link
          href="/"
          className="text-sm text-muted transition hover:text-navy"
        >
          {form.backHome}
        </Link>
        <h1 className="font-display mt-4 text-3xl tracking-tight text-navy sm:text-4xl">
          {fill(form.pageTitle, { name: brand.name })}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {fill(form.pageIntro, { name: brand.name })}
        </p>
        <div className="mt-8">
          <MaintainerApplyForm />
        </div>
      </main>
    </div>
  );
}
