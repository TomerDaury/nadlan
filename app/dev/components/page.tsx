import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon, icons, type IconName } from "@/components/icons";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureTag } from "@/components/ui/feature-tag";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TintBox } from "@/components/ui/tint-box";
import { formatPrice, formatRoomsRange } from "@/lib/format";
import { AlertDialogDemo, CheckboxDemo, ChipsDemo, RadioDemo } from "./interactive-demos";

export const metadata: Metadata = {
  title: "דף רכיבים (פנימי)",
  robots: { index: false, follow: false },
};

const COLORS = [
  { name: "Orange 500 · Primary", hex: "#FF7A1A", className: "bg-brand-500" },
  { name: "Orange 600", hex: "#E5650A", className: "bg-brand-600" },
  { name: "Orange 700", hex: "#B5530F", className: "bg-brand-700" },
  { name: "Orange 50 · Tint", hex: "#FFF1E6", className: "bg-brand-50" },
  { name: "Purple · Accent", hex: "#7B3FE4", className: "bg-accent-purple" },
  { name: "Ink", hex: "#2B2B2B", className: "bg-ink" },
  { name: "Slate", hex: "#6B6B6B", className: "bg-slate-text" },
  { name: "Muted", hex: "#8A8A8A", className: "bg-muted-text" },
  { name: "Line", hex: "#E3E3E3", className: "bg-line" },
  { name: "Mist", hex: "#F4F4F4", className: "bg-mist" },
  { name: "White", hex: "#FFFFFF", className: "bg-white" },
  { name: "Success", hex: "#1E9E5A", className: "bg-success" },
  { name: "Error", hex: "#D93025", className: "bg-error" },
];

const TYPE_SCALE = [
  { name: "Display", spec: "48 / 56 · Medium", className: "text-display font-medium", sample: "מצאו בית שמתאים לכם" },
  { name: "H1", spec: "36 / 44 · Medium", className: "text-h1 font-medium", sample: "מצאנו עבורכם 3 נכסים" },
  { name: "H2", spec: "28 / 36 · Medium", className: "text-h2 font-medium", sample: "הנכסים שהוצגו לי" },
  { name: "H3", spec: "22 / 30 · Medium", className: "text-h3 font-medium", sample: "דירת 4 חדרים עם מרפסת" },
  { name: "Body L", spec: "18 / 28 · Regular", className: "text-body-l", sample: "דירה שקטה וקרובה לפארק ולגני ילדים" },
  { name: "Body", spec: "16 / 24 · Regular", className: "text-body", sample: "הנכס נמצא בשכונה שביקשתם ובתוך התקציב" },
  { name: "Small", spec: "14 / 20 · Regular", className: "text-small", sample: "שכונה א', עיר • 95 מ\"ר • קומה 3" },
  { name: "Caption", spec: "12 / 16 · Regular", className: "text-caption", sample: "* שדה חובה" },
];

const RADII = [
  { label: "6 · תגיות", className: "rounded-tag" },
  { label: "8 · תפריט", className: "rounded-menu" },
  { label: "10 · שדות", className: "rounded-input" },
  { label: "14 · כרטיסים", className: "rounded-card" },
  { label: "20 · Panels", className: "rounded-panel-lg" },
  { label: "999 · כפתורים", className: "rounded-pill w-28" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel className="flex flex-col gap-5">
      <h2 className="text-h3 font-medium">{title}</h2>
      {children}
    </Panel>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-caption font-medium tracking-wide text-slate-text">{children}</h3>;
}

// Internal component gallery for checking components against style-guide.png.
// Available locally and on Preview deployments, hidden in Production.
export default function ComponentsPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-10">
          <Logo />
          <span className="text-small text-slate-text">דף רכיבים פנימי</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8 sm:px-10">
        <h1 className="text-h2 font-medium sm:text-h1">שפת העיצוב – רכיבי בסיס</h1>

        <Section title="צבעים">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {COLORS.map((c) => (
              <div key={c.hex} className="overflow-hidden rounded-input border border-line bg-white">
                <div className={`h-14 ${c.className}`} />
                <div className="p-2">
                  <p className="text-caption font-medium">{c.name}</p>
                  <p className="text-caption text-slate-text" dir="ltr">
                    {c.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="טיפוגרפיה – Rubik">
          <div className="flex flex-col divide-y divide-line">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                <p className={`${t.className} break-words`}>{t.sample}</p>
                <p className="shrink-0 text-caption text-slate-text" dir="ltr">
                  {t.name} · {t.spec}
                </p>
              </div>
            ))}
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-[28px] font-semibold">{formatPrice(1950000)}</p>
              <p className="text-caption text-slate-text" dir="ltr">
                Price · 20–28 · SemiBold
              </p>
            </div>
            <div className="py-3 text-body">
              טווח חדרים בתוך טקסט: <bdi dir="ltr">{formatRoomsRange(3.5, 4)}</bdi> חדרים
            </div>
          </div>
        </Section>

        <Section title="כפתורים">
          <SubTitle>גודל רגיל</SubTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Icon name="search" />
              מצא לי נכסים
            </Button>
            <Button variant="secondary">לפרטים</Button>
            <Button variant="neutral">ביטול</Button>
            <Button variant="link">
              <Icon name="back" />
              חזרה
            </Button>
            <Button disabled>שמירה</Button>
          </div>
          <SubTitle>גודל קטן ו-Icon buttons</SubTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">
              <Icon name="add" />
              הוספת נכס
            </Button>
            <Button size="sm" variant="secondary">
              <Icon name="edit" />
              עדכון הקריטריונים
            </Button>
            <Button size="sm" variant="neutral">
              הפסקת עדכונים
            </Button>
            <Button size="sm" variant="secondary" disabled>
              לא זמין
            </Button>
            <Button variant="icon" size="icon" aria-label="עריכה">
              <Icon name="edit" />
            </Button>
            <Button variant="icon" size="icon" tone="danger" aria-label="מחיקה">
              <Icon name="delete" />
            </Button>
          </div>
        </Section>

        <Section title="שדות קלט">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="demo-name" label="שם מלא" required>
              {(p) => <Input {...p} placeholder="ישראל ישראלי" />}
            </Field>
            <Field id="demo-email" label="אימייל" required>
              {(p) => <Input {...p} type="email" dir="ltr" className="text-end" placeholder="name@example.com" />}
            </Field>
            <Field id="demo-city" label="עיר" required>
              {(p) => (
                <Select {...p} placeholder="בחרו עיר">
                  <option value="city-a">{"עיר א'"}</option>
                  <option value="city-b">{"עיר ב'"}</option>
                </Select>
              )}
            </Field>
            <Field id="demo-budget" label="תקציב מקסימלי (₪)" required error="יש להזין תקציב חיובי">
              {(p) => <Input {...p} inputMode="numeric" defaultValue="0" />}
            </Field>
            <Field id="demo-rooms" label="מספר חדרים" required>
              {(p) => (
                <div className="flex gap-3">
                  <Select id={p.id} aria-label="מ-" placeholder="מ-">
                    <option value="3">3</option>
                    <option value="3.5">3.5</option>
                  </Select>
                  <Select id="demo-rooms-max" aria-label="עד" placeholder="עד">
                    <option value="4">4</option>
                    <option value="4.5">4.5</option>
                  </Select>
                </div>
              )}
            </Field>
            <Field id="demo-phone" label="טלפון (רשות)">
              {(p) => <Input {...p} type="tel" dir="ltr" className="text-end" placeholder="050-0000000" disabled />}
            </Field>
          </div>
          <Field id="demo-pref" label="מה הכי חשוב לכם בנכס?" required>
            {(p) => <Textarea {...p} placeholder="למשל: שקט, קרוב לגנים, עם מרפסת..." />}
          </Field>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Chips">
            <ChipsDemo />
          </Section>
          <Section title="Checkbox ו-Radio">
            <CheckboxDemo />
            <RadioDemo />
            <SubTitle>חלון אישור (לפני מחיקה)</SubTitle>
            <AlertDialogDemo />
          </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="תגיות">
            <SubTitle>Badges וסטטוס</SubTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">זמין</Badge>
              <Badge variant="success">פעיל</Badge>
              <Badge variant="neutral">לא זמין</Badge>
              <Badge variant="neutral">לא פעיל</Badge>
              <Badge variant="rank">1</Badge>
              <Badge variant="primary">ראשית</Badge>
              <Badge variant="tint">עדכונים פעילים</Badge>
              <Badge variant="new">חדש</Badge>
            </div>
            <SubTitle>Feature tags</SubTitle>
            <div className="flex flex-wrap gap-2">
              <FeatureTag>חניה</FeatureTag>
              <FeatureTag>מעלית</FeatureTag>
              <FeatureTag check>ממ&quot;ד</FeatureTag>
              <FeatureTag check>מרפסת</FeatureTag>
            </div>
          </Section>
          <Section title="Notice ותיבת נימוק">
            <Notice>שלחנו את התוצאות גם למייל שלכם</Notice>
            <TintBox title="למה זה מתאים לכם">שקטה, במרחק הליכה מגן ילדים ועם מרפסת שמש.</TintBox>
          </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Panels">
            <Panel className="border border-line">Panel לבן – Radius 14 וצל Card</Panel>
            <Panel variant="muted">
              <p className="text-small text-slate-text">נתוני השקעה</p>
              <p className="mt-1 text-body font-semibold">
                {formatPrice(6500)} · <bdi dir="ltr">4.0%</bdi>
              </p>
            </Panel>
          </Section>
          <Section title="פינות וצללים">
            <div className="flex flex-wrap items-end gap-3">
              {RADII.map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-1.5">
                  <div className={`size-14 border-[1.5px] border-brand-500 bg-brand-50 ${r.className}`} />
                  <span className="text-caption text-slate-text">{r.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-card border border-line bg-white p-4 text-caption">Flat</div>
              <div className="rounded-card bg-white p-4 text-caption shadow-card">Card</div>
              <div className="rounded-card bg-white p-4 text-caption shadow-floating">Floating</div>
            </div>
          </Section>
        </div>

        <Section title="אייקונים">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-11">
            {(Object.keys(icons) as IconName[]).map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1.5 rounded-input border border-line bg-white py-3"
              >
                <Icon name={name} className={name === "delete" ? "text-error" : name === "search" ? "text-brand-500" : "text-ink"} />
                <span className="text-caption text-slate-text" dir="ltr">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </>
  );
}
