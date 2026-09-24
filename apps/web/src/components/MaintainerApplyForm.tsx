"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { fill, getMaintainersForm, templates } from "@/lib/config";

type ProjectEntry = { url: string; role: string };
type ExtraLink = { label: string; url: string };
type EducationEntry = {
  school: string;
  degree: string;
  years: string;
  notes: string;
};
type WorkEntry = {
  org: string;
  title: string;
  years: string;
  notes: string;
};
type SectionId =
  | "oss"
  | "skills"
  | "education"
  | "work"
  | "profiles"
  | "availability"
  | "extra";

type DetailsPayload = {
  oss?: {
    significantRepo?: string;
    projects?: ProjectEntry[];
    notes?: string;
  };
  skills?: { chips?: string[]; yearsExperience?: number | null };
  education?: EducationEntry[];
  work?: WorkEntry[];
  profiles?: {
    linkedin?: string;
    bitbucket?: string;
    website?: string;
    extraLinks?: ExtraLink[];
  };
  availability?: {
    weeklyHours?: string;
    location?: string;
    notes?: string;
  };
  extra?: { notes?: string };
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/70 focus:border-amber/50 focus:ring-2 focus:ring-amber/20";

function emptyProject(defaultRole: string): ProjectEntry {
  return { url: "", role: defaultRole };
}

function emptyEducation(): EducationEntry {
  return { school: "", degree: "", years: "", notes: "" };
}

function emptyWork(): WorkEntry {
  return { org: "", title: "", years: "", notes: "" };
}

export function MaintainerApplyForm() {
  const form = getMaintainersForm();
  const brand = templates.brand();
  const core = form.core;
  const maxWhy = form.motivationMaxLength;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [whyJanark, setWhyJanark] = useState("");

  const [openSections, setOpenSections] = useState<SectionId[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnId = useId();

  const [significantRepo, setSignificantRepo] = useState("");
  const [ossProjects, setOssProjects] = useState<ProjectEntry[]>([]);
  const [ossNotes, setOssNotes] = useState("");

  const [skillChips, setSkillChips] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");

  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>(
    [],
  );
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);

  const [linkedin, setLinkedin] = useState("");
  const [bitbucket, setBitbucket] = useState("");
  const [website, setWebsite] = useState("");
  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>([]);

  const [weeklyHours, setWeeklyHours] = useState("");
  const [location, setLocation] = useState("");
  const [availabilityNotes, setAvailabilityNotes] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultRole = form.oss.roles[0] ?? "Maintainer";

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function addSection(id: SectionId) {
    setOpenSections((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setMenuOpen(false);
  }

  function removeSection(id: SectionId) {
    setOpenSections((prev) => prev.filter((s) => s !== id));
  }

  function addSkillChip(raw: string) {
    const chip = raw.trim();
    if (!chip) return;
    setSkillChips((prev) =>
      prev.some((c) => c.toLowerCase() === chip.toLowerCase())
        ? prev
        : [...prev, chip],
    );
    setSkillDraft("");
  }

  function onSkillKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkillChip(skillDraft);
    } else if (e.key === "Backspace" && !skillDraft && skillChips.length) {
      setSkillChips((prev) => prev.slice(0, -1));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setErrors({});

    const details: DetailsPayload = {};
    if (openSections.includes("oss")) {
      details.oss = {
        significantRepo: significantRepo.trim() || undefined,
        projects: ossProjects.filter((p) => p.url.trim()),
        notes: ossNotes.trim() || undefined,
      };
    }
    if (openSections.includes("skills")) {
      details.skills = {
        chips: skillChips,
        yearsExperience: yearsExperience ? Number(yearsExperience) : null,
      };
    }
    if (openSections.includes("education")) {
      details.education = educationEntries.filter(
        (e) => e.school || e.degree || e.years || e.notes,
      );
    }
    if (openSections.includes("work")) {
      details.work = workEntries.filter(
        (e) => e.org || e.title || e.years || e.notes,
      );
    }
    if (openSections.includes("profiles")) {
      details.profiles = {
        linkedin: linkedin.trim() || undefined,
        bitbucket: bitbucket.trim() || undefined,
        website: website.trim() || undefined,
        extraLinks: extraLinks.filter((l) => l.label || l.url),
      };
    }
    if (openSections.includes("availability")) {
      details.availability = {
        weeklyHours: weeklyHours || undefined,
        location: location.trim() || undefined,
        notes: availabilityNotes.trim() || undefined,
      };
    }
    if (openSections.includes("extra")) {
      details.extra = { notes: extraNotes.trim() || undefined };
    }

    try {
      const res = await fetch("/api/maintainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName,
          email,
          githubUrl,
          whyJanark,
          details,
          [form.honeypotField]: "",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.error ?? form.errorGeneric);
        return;
      }
      setDone(true);
    } catch {
      setFormError(form.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-cream/60 px-6 py-10 text-center">
        <h2 className="font-display text-2xl text-navy">{form.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {form.successBody}
        </p>
      </div>
    );
  }

  const availableMenu = form.sections.filter(
    (s) => !openSections.includes(s.id as SectionId),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <input
        type="text"
        name={form.honeypotField}
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden
        value=""
        readOnly
      />

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {form.basicHeading}
        </h2>
        <div className="mt-4 space-y-4">
          <Field
            id="fullName"
            label={core.fullName.label}
            required
            error={errors.fullName}
          >
            <input
              id="fullName"
              className={inputClass}
              autoComplete={core.fullName.autoComplete}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Field>
          <Field
            id="email"
            label={core.email.label}
            required
            error={errors.email}
          >
            <input
              id="email"
              type="email"
              className={inputClass}
              autoComplete={core.email.autoComplete}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field
            id="githubUrl"
            label={core.githubUrl.label}
            required
            error={errors.githubUrl}
          >
            <input
              id="githubUrl"
              type="url"
              className={inputClass}
              placeholder={core.githubUrl.placeholder}
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              required
            />
          </Field>
          <Field
            id="whyJanark"
            label={fill(core.whyJanark.label, { name: brand.name })}
            required
            error={errors.whyJanark}
          >
            <textarea
              id="whyJanark"
              rows={4}
              maxLength={maxWhy}
              className={inputClass}
              placeholder={core.whyJanark.placeholder}
              value={whyJanark}
              onChange={(e) => setWhyJanark(e.target.value.slice(0, maxWhy))}
              required
            />
            <p className="mt-1 text-right text-xs tabular-nums text-muted">
              {whyJanark.length} / {maxWhy}
            </p>
          </Field>
        </div>
      </section>

      {openSections.includes("oss") ? (
        <OptionalSection
          title={form.sections.find((s) => s.id === "oss")!.title}
          onRemove={() => removeSection("oss")}
          removeLabel={form.removeSection}
        >
          <Field id="significantRepo" label={form.oss.significantRepo.label}>
            <input
              id="significantRepo"
              type="url"
              className={inputClass}
              placeholder={form.oss.significantRepo.placeholder}
              value={significantRepo}
              onChange={(e) => setSignificantRepo(e.target.value)}
            />
          </Field>
          <ProjectList
            label={form.oss.projectsLabel}
            addLabel={form.oss.addProject}
            removeLabel={form.oss.removeProject}
            urlLabel={form.oss.projectUrl}
            roleLabel={form.oss.projectRole}
            roles={form.oss.roles}
            projects={ossProjects}
            onChange={setOssProjects}
            defaultRole={defaultRole}
          />
          <Field id="ossNotes" label={form.oss.notes.label}>
            <textarea
              id="ossNotes"
              rows={3}
              className={inputClass}
              placeholder={form.oss.notes.placeholder}
              value={ossNotes}
              onChange={(e) => setOssNotes(e.target.value)}
            />
          </Field>
        </OptionalSection>
      ) : null}

      {openSections.includes("skills") ? (
        <OptionalSection
          title={form.sections.find((s) => s.id === "skills")!.title}
          onRemove={() => removeSection("skills")}
          removeLabel={form.removeSection}
        >
          <div>
            <p className="text-sm font-medium text-navy">
              {form.skills.chipsLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skillChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setSkillChips((prev) => prev.filter((c) => c !== chip))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-cream px-3 py-1 text-xs font-medium text-navy hover:border-danger/40"
                >
                  {chip}
                  <span aria-hidden>×</span>
                </button>
              ))}
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={onSkillKey}
                onBlur={() => addSkillChip(skillDraft)}
                placeholder={form.skills.chipPlaceholder}
                className="min-w-[7rem] flex-1 rounded-full border border-dashed border-line bg-white px-3 py-1 text-xs outline-none focus:border-amber/50"
                list="maintainer-skill-suggestions"
              />
              <datalist id="maintainer-skill-suggestions">
                {form.skills.suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.skills.suggestions
                .filter(
                  (s) =>
                    !skillChips.some(
                      (c) => c.toLowerCase() === s.toLowerCase(),
                    ),
                )
                .slice(0, 6)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkillChip(s)}
                    className="rounded-full bg-sand/50 px-2.5 py-1 text-[11px] text-muted hover:bg-sand hover:text-navy"
                  >
                    {s}
                  </button>
                ))}
            </div>
          </div>
          <Field id="years" label={form.skills.yearsLabel}>
            <select
              id="years"
              className={inputClass}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
            >
              <option value="">—</option>
              {form.skills.yearsOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </OptionalSection>
      ) : null}

      {openSections.includes("education") ? (
        <OptionalSection
          title={form.sections.find((s) => s.id === "education")!.title}
          onRemove={() => removeSection("education")}
          removeLabel={form.removeSection}
        >
          <div className="space-y-3">
            {educationEntries.map((entry, i) => (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-line bg-white p-3"
              >
                <Field
                  id={`edu-school-${i}`}
                  label={form.education.school.label}
                >
                  <input
                    id={`edu-school-${i}`}
                    className={inputClass}
                    placeholder={form.education.school.placeholder}
                    value={entry.school}
                    onChange={(e) =>
                      setEducationEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, school: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field
                  id={`edu-degree-${i}`}
                  label={form.education.degree.label}
                >
                  <input
                    id={`edu-degree-${i}`}
                    className={inputClass}
                    placeholder={form.education.degree.placeholder}
                    value={entry.degree}
                    onChange={(e) =>
                      setEducationEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, degree: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field id={`edu-years-${i}`} label={form.education.years.label}>
                  <input
                    id={`edu-years-${i}`}
                    className={inputClass}
                    placeholder={form.education.years.placeholder}
                    value={entry.years}
                    onChange={(e) =>
                      setEducationEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, years: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field id={`edu-notes-${i}`} label={form.education.notes.label}>
                  <input
                    id={`edu-notes-${i}`}
                    className={inputClass}
                    placeholder={form.education.notes.placeholder}
                    value={entry.notes}
                    onChange={(e) =>
                      setEducationEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, notes: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-danger"
                  onClick={() =>
                    setEducationEntries((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  {form.education.removeEntry}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-medium text-link hover:underline"
              onClick={() =>
                setEducationEntries((prev) => [...prev, emptyEducation()])
              }
            >
              {form.education.addEntry}
            </button>
          </div>
        </OptionalSection>
      ) : null}

      {openSections.includes("work") ? (
        <OptionalSection
          title={form.sections.find((s) => s.id === "work")!.title}
          onRemove={() => removeSection("work")}
          removeLabel={form.removeSection}
        >
          <div className="space-y-3">
            {workEntries.map((entry, i) => (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-line bg-white p-3"
              >
                <Field id={`work-org-${i}`} label={form.work.org.label}>
                  <input
                    id={`work-org-${i}`}
                    className={inputClass}
                    placeholder={form.work.org.placeholder}
                    value={entry.org}
                    onChange={(e) =>
                      setWorkEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, org: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field id={`work-title-${i}`} label={form.work.title.label}>
                  <input
                    id={`work-title-${i}`}
                    className={inputClass}
                    placeholder={form.work.title.placeholder}
                    value={entry.title}
                    onChange={(e) =>
                      setWorkEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, title: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field id={`work-years-${i}`} label={form.work.years.label}>
                  <input
                    id={`work-years-${i}`}
                    className={inputClass}
                    placeholder={form.work.years.placeholder}
                    value={entry.years}
                    onChange={(e) =>
                      setWorkEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, years: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field id={`work-notes-${i}`} label={form.work.notes.label}>
                  <textarea
                    id={`work-notes-${i}`}
                    rows={2}
                    className={inputClass}
                    placeholder={form.work.notes.placeholder}
                    value={entry.notes}
                    onChange={(e) =>
                      setWorkEntries((prev) =>
                        prev.map((row, idx) =>
                          idx === i ? { ...row, notes: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-danger"
                  onClick={() =>
                    setWorkEntries((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  {form.work.removeEntry}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-medium text-link hover:underline"
              onClick={() =>
                setWorkEntries((prev) => [...prev, emptyWork()])
              }
            >
              {form.work.addEntry}
            </button>
          </div>
        </OptionalSection>
      ) : null}

      {openSections.includes("profiles") ? (
        <OptionalSection
          title={form.sections.find((s) => s.id === "profiles")!.title}
          onRemove={() => removeSection("profiles")}
          removeLabel={form.removeSection}
        >
          <Field id="linkedin" label={form.profiles.linkedin.label}>
            <input
              id="linkedin"
              type="url"
              className={inputClass}
              placeholder={form.profiles.linkedin.placeholder}
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </Field>
          <Field id="bitbucket" label={form.profiles.bitbucket.label}>
            <input
              id="bitbucket"
              type="url"
              className={inputClass}
              placeholder={form.profiles.bitbucket.placeholder}
              value={bitbucket}
              onChange={(e) => setBitbucket(e.target.value)}
            />
          </Field>
          <Field id="personalWeb" label={form.profiles.website.label}>
            <input
              id="personalWeb"
              type="url"
              className={inputClass}
              placeholder={form.profiles.website.placeholder}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </Field>
          <div className="space-y-3">
            {extraLinks.map((link, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-cream/40 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    placeholder={form.profiles.extraLabel}
                    value={link.label}
                    onChange={(e) =>
                      setExtraLinks((prev) =>
                        prev.map((l, idx) =>
                          idx === i ? { ...l, label: e.target.value } : l,
                        ),
                      )
                    }
                  />
                  <input
                    type="url"
                    className={inputClass}
                    placeholder={form.profiles.extraUrl}
                    value={link.url}
                    onChange={(e) =>
                      setExtraLinks((prev) =>
                        prev.map((l, idx) =>
                          idx === i ? { ...l, url: e.target.value } : l,
                        ),
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs text-muted hover:text-danger"
                  onClick={() =>
                    setExtraLinks((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  {form.profiles.removeLink}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-medium text-link hover:underline"
              onClick={() =>
                setExtraLinks((prev) => [...prev, { label: "", url: "" }])
              }
            >
              {form.profiles.addLink}
            </button>
          </div>
        </OptionalSection>
      ) : null}

      {openSections.includes("availability") ? (
        <OptionalSection
          title={form.sections.find((s) => s.id === "availability")!.title}
          onRemove={() => removeSection("availability")}
          removeLabel={form.removeSection}
        >
          <fieldset>
            <legend className="text-sm font-medium text-navy">
              {form.availability.hoursLabel}
            </legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {form.availability.hoursOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                    weeklyHours === opt.id
                      ? "border-amber bg-amber/15 text-navy"
                      : "border-line text-muted hover:border-navy/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="weeklyHours"
                    className="sr-only"
                    checked={weeklyHours === opt.id}
                    onChange={() => setWeeklyHours(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field id="location" label={form.availability.location.label}>
            <input
              id="location"
              className={inputClass}
              placeholder={form.availability.location.placeholder}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
          <Field id="availNotes" label={form.availability.notes.label}>
            <textarea
              id="availNotes"
              rows={2}
              className={inputClass}
              placeholder={form.availability.notes.placeholder}
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
            />
          </Field>
        </OptionalSection>
      ) : null}

      {openSections.includes("extra") ? (
        <OptionalSection
          title={form.sections.find((s) => s.id === "extra")!.title}
          onRemove={() => removeSection("extra")}
          removeLabel={form.removeSection}
        >
          <Field id="extraNotes" label={form.extra.notes.label}>
            <textarea
              id="extraNotes"
              rows={3}
              className={inputClass}
              placeholder={form.extra.notes.placeholder}
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
            />
          </Field>
        </OptionalSection>
      ) : null}

      {availableMenu.length > 0 ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            id={menuBtnId}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="text-sm font-medium text-link hover:underline"
          >
            {form.addMenu.closedLabel}
          </button>
          {menuOpen ? (
            <div
              role="menu"
              aria-labelledby={menuBtnId}
              className="absolute left-0 z-20 mt-2 min-w-[16rem] rounded-xl border border-line bg-white py-2 shadow-lg"
            >
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {form.addMenu.openLabel}
              </p>
              {availableMenu.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm text-navy hover:bg-sand/60"
                  onClick={() => addSection(s.id as SectionId)}
                >
                  ＋ {s.menuLabel}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {formError ? (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-line pt-6">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-xl bg-amber px-6 py-3.5 text-sm font-semibold text-on-amber transition hover:bg-amber-bright disabled:opacity-60"
        >
          {busy ? form.submittingLabel : form.submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function OptionalSection({
  title,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-cream/30 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-line/70 pb-3">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-muted hover:text-danger"
        >
          {removeLabel}
        </button>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ProjectList({
  label,
  addLabel,
  removeLabel,
  urlLabel,
  roleLabel,
  roles,
  projects,
  onChange,
  defaultRole,
}: {
  label: string;
  addLabel: string;
  removeLabel: string;
  urlLabel: string;
  roleLabel: string;
  roles: string[];
  projects: ProjectEntry[];
  onChange: (next: ProjectEntry[]) => void;
  defaultRole: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-navy">{label}</p>
      <div className="mt-2 space-y-3">
        {projects.map((p, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-white p-3 space-y-2"
          >
            <input
              type="url"
              className={inputClass}
              placeholder={urlLabel}
              value={p.url}
              onChange={(e) =>
                onChange(
                  projects.map((row, idx) =>
                    idx === i ? { ...row, url: e.target.value } : row,
                  ),
                )
              }
            />
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor={`role-${label}-${i}`}>
                {roleLabel}
              </label>
              <select
                id={`role-${label}-${i}`}
                className={inputClass}
                value={p.role}
                onChange={(e) =>
                  onChange(
                    projects.map((row, idx) =>
                      idx === i ? { ...row, role: e.target.value } : row,
                    ),
                  )
                }
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="shrink-0 text-xs text-muted hover:text-danger"
                onClick={() =>
                  onChange(projects.filter((_, idx) => idx !== i))
                }
              >
                {removeLabel}
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-medium text-link hover:underline"
          onClick={() => onChange([...projects, emptyProject(defaultRole)])}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
