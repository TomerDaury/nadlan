# תוכנית – Milestone 1: הקמת הפרויקט ושפת העיצוב

> מבוסס על: `MILESTONES.md` (Milestone 1), ‏`ARCHITECTURE.md` (סעיפים 1, 2.2, 2.3, 2.8, 2.9), ‏`DESIGN.md` (סעיף 2 – Style Guide, וה-Layouts מסעיף 1), ‏`style-guide.png`, ‏`mockups.png`, ‏`wireframes.png`.
> מצב נוכחי: בתיקייה יש רק `CLAUDE.md`, ‏`.gitignore` ו-`spec/`. אין קוד ואין repo של git.

---

## 1. היקף

**בתוך ה-Milestone:**
- שלד Next.js 16 (App Router, TypeScript) עם Tailwind CSS, ‏shadcn/ui, ‏Zod ו-Vitest.
- Design Tokens (צבעים, גופן, Radius, צללים) לפי DESIGN.md §2.
- רכיבי בסיס משותפים + סט אייקונים.
- Layout של אתר הלקוח ו-Layout של ממשק הניהול (Header + תפריט צד), עם דף בסיס לכל אחד.
- דף דוגמה פנימי שמציג את כל הרכיבים.
- `.env.example` עם כל המשתנים.
- הכנה לחיבור GitHub ו-Vercel (הפעולות עצמן – בשלב נפרד, באישור המשתמש; ראו §9).

**מחוץ ל-Milestone (לא לבנות עכשיו):** Supabase, התחברות, `requireAdmin()`, Proxy/Middleware, מסכים אמיתיים (טופס, תוצאות וכו'), קישור "התנתקות" ו-Avatar ב-Header של הניהול (נוספים ב-Milestone 2), Dialog, ‏`vercel.json`, סקריפט `vercel-build`.

---

## 2. הקמת הפרויקט

1. יצירת הפרויקט בתיקיית השורש בעזרת `create-next-app` (גרסה 16): TypeScript, ‏ESLint, ‏Tailwind CSS, ‏App Router, **בלי** תיקיית `src/`, alias ‏`@/*`.
   - היצירה נעשית בתיקייה זמנית ומועתקת לשורש, כדי לא לדרוס את `.gitignore`, ‏`CLAUDE.md` ו-`spec/`. ה-`.gitignore` של create-next-app **לא** מחליף את הקיים; אם חסרות בקיים שורות נדרשות (למשל `next-env.d.ts`) – מוסיפים אותן.
2. התקנת תלויות:
   - `zod`
   - `lucide-react` (סט האייקונים; ראו §5)
   - shadcn/ui: ‏`npx shadcn@latest init` (Tailwind v4, סגנון ברירת מחדל, CSS variables) – יוצר `components.json`, ‏`lib/utils.ts` (`cn`) ותלויות (`clsx`, ‏`tailwind-merge`, ‏`class-variance-authority`, חבילות Radix).
   - Dev: ‏`vitest`, ‏`@vitejs/plugin-react`, ‏`vite-tsconfig-paths`.
3. סקריפטים ב-`package.json`: `dev`, ‏`build`, ‏`start`, ‏`lint` (‏`eslint .`), ‏`test` (‏`vitest run`).
4. `vitest.config.ts` – סביבת `node`, תמיכה ב-alias ‏`@/`, קבצי בדיקה `**/*.test.ts`.

---

## 3. מבנה תיקיות (רק מה שנוצר ב-Milestone הזה)

```
app/
  layout.tsx                  # <html lang="he" dir="rtl">, גופן Rubik, metadata
  globals.css                 # Tailwind + Design Tokens (@theme)
  (public)/
    layout.tsx                # Layout אתר הלקוח: SiteHeader + רקע Mist
    page.tsx                  # "/" – דף בסיס זמני של אתר הלקוח
  admin/
    page.tsx                  # redirect ל-/admin/properties
    (panel)/
      layout.tsx              # Layout ממשק הניהול: AdminHeader + AdminSidebar
      properties/page.tsx     # דף בסיס: כותרת "נכסים" + Panel ריק
      requests/page.tsx       # דף בסיס: כותרת "פניות" + Panel ריק
  dev/
    components/page.tsx       # דף הדוגמה הפנימי (ראו §7)
components/
  ui/                         # רכיבי הבסיס (§6)
  layout/
    logo.tsx
    site-header.tsx
    admin-header.tsx
    admin-sidebar.tsx         # Client Component (סימון הפריט הפעיל לפי הנתיב)
  icons.tsx                   # ייצוא מרוכז של האייקונים (§5)
lib/
  utils.ts                    # cn() (נוצר ע"י shadcn)
  format.ts                   # formatPrice, formatRoomsRange
  format.test.ts
.env.example
vitest.config.ts
components.json
```

**הערה על `(panel)`:** קבוצת נתיבים, כדי שבמילסטון 2 מסך `/admin/login` יוכל לשבת תחת `app/admin/` **בלי** Header ותפריט צד (לפי DESIGN §1.6), בלי לשנות מבנה.

---

## 4. שפת העיצוב – Design Tokens

ב-`app/globals.css`, בבלוק `@theme` של Tailwind v4:

**צבעים** (DESIGN §2.1):

| Token | ערך |
|---|---|
| `orange-500` | `#FF7A1A` |
| `orange-600` | `#E5650A` |
| `orange-700` | `#B5530F` |
| `orange-50` | `#FFF1E6` |
| `purple` (accent) | `#7B3FE4` |
| `ink` | `#2B2B2B` |
| `slate` | `#6B6B6B` |
| `muted` | `#8A8A8A` |
| `line` | `#E3E3E3` |
| `mist` | `#F4F4F4` |
| `success` / `success-bg` | `#1E9E5A` / `#E6F5EC` |
| `error` | `#D93025` |
| `input-border` | `#D6D6D6` |
| `focus-ring` | `#FFE3CC` |
| `notice-bg` / `notice-border` | `#FFF8F2` / `#FFD2AE` |
| `table-head` | `#FAFAFA` |
| `row-divider` | `#F0F0F0` |

**שמות ה-Tokens בקוד** (כדי לא להתנגש בשמות קיימים של Tailwind ו-shadcn):
- כתומים: `brand-500`, ‏`brand-600`, ‏`brand-700`, ‏`brand-50` (במקום `orange-*`, שהיה דורס את סקאלת Tailwind).
- Slate → `slate-text`, ‏Muted → `muted-text` (‏`slate` ו-`muted` כבר תפוסים ב-Tailwind/shadcn). שאר השמות כמו ב-Style Guide: `ink`, ‏`line`, ‏`mist`, ‏`success`, ‏`error`, ‏`accent-purple`.
- משתני ה-theme של shadcn ממופים לערכי ה-Style Guide: `--primary` = Orange 500, ‏`--ring` = Orange 500, ‏`--border`/`--input` = Line, ‏`--background` = Mist, ‏`--foreground` = Ink, ‏`--destructive` = Error, ‏`--radius` = 10px. בסוף הבנייה – לוודא שלא נשאר צבע ברירת מחדל של shadcn גלוי.

**טיפוגרפיה** (DESIGN §2.2):
- Rubik דרך `next/font/google`, ‏subsets `hebrew` + `latin`, משקלים 400/500/600, כ-CSS variable ‏`--font-rubik`; גיבוי `Arial, sans-serif`.
- סולם גדלים כ-Tokens: `display` 48/56, ‏`h1` 36/44, ‏`h2` 28/36, ‏`h3` 22/30, ‏`body-l` 18/28, ‏`body` 16/24, ‏`small` 14/20, ‏`caption` 12/16.
- טקסט בסיס: 16px, ‏line-height 1.5, צבע Ink.

**Radius** (DESIGN §2.4): `tag` 6, ‏`menu` 8, ‏`input` 10, ‏`card` 14, ‏`panel-lg` 20, ‏`pill` 999.

**צללים:** `card` = `0 2px 12px rgba(0,0,0,0.09)`, ‏`floating` = `0 6px 20px rgba(0,0,0,0.16)`.

**מרווחים:** סולם ה-8px של Tailwind (4 = `1`, 8 = `2` ...) כבר תואם – אין צורך ב-Tokens נוספים.

**RTL:**
- `<html lang="he" dir="rtl">` ב-`app/layout.tsx`.
- בכל הרכיבים: רק Logical Properties (`ms-`, ‏`me-`, ‏`ps-`, ‏`pe-`, ‏`start-`, ‏`end-`, ‏`text-start`). לא `ml-`/`mr-`/`left-`/`right-`.
- רכיבי shadcn שנוצרים – לעבור עליהם ולהחליף מאפייני כיוון פיזיים ללוגיים.
- מספרים/מחירים/טווחים: עטיפה ב-`<bdi>` או `dir="ltr"` כשהם מוצגים בתוך טקסט (נשתמש בזה בדף הדוגמה).

---

## 5. אייקונים

- **ספרייה:** `lucide-react` – אייקוני Line, ברירת מחדל 24px, פינות וחיבורים מעוגלים; זה הסט ש-shadcn משתמש בו. נגדיר `strokeWidth={1.75}` כברירת מחדל.
- `components/icons.tsx` מייצא את הסט מ-DESIGN §2.3 בשמות של ה-Style Guide:

| שם ב-Style Guide | Lucide |
|---|---|
| home | `House` |
| rooms (מיטה) | `BedDouble` |
| area | `SquareDashed` / `Ruler` |
| floor | `Layers` / `Building` |
| parking | `Car` |
| search | `Search` |
| mail | `Mail` |
| bell | `Bell` |
| favorite | `Heart` |
| add | `Plus` |
| edit | `Pencil` |
| delete | `Trash2` |
| image | `Image` |
| upload | `Upload` |
| user | `User` |
| location | `MapPin` |
| logout | `LogOut` |
| chevron | `ChevronDown` |
| back | `ChevronRight` (מצביע ימינה – חזרה ב-RTL) |
| message (מופיע ב-style-guide.png) | `MessageSquare` |
| list (תפריט "פניות" ב-Mockups) | `List` |

- צבע ברירת מחדל Ink; גרסה מודגשת בכתום; מחיקה ב-Error.
- סמל Google לכפתור ההתחברות **לא** נדרש ב-Milestone הזה (המסך נבנה ב-M2).

---

## 6. רכיבי בסיס (`components/ui/`)

כל הרכיבים: עברית, RTL, Logical Properties, מצבי Focus נגישים (טבעת `#FFE3CC` 3px + גבול Orange 500 בשדות).

| רכיב | מקור | מפרט (DESIGN §2.3) |
|---|---|---|
| **Button** | shadcn `button` + התאמה | גלולה (radius 999), גובה 48px (`size="default"`), קטן 36px (`size="sm"`), משקל Medium. Variants: **primary** (Orange 500 / טקסט לבן / Hover Orange 600), **secondary** (לבן, גבול 1.5px Orange 500, טקסט Orange 600), **neutral** (לבן, גבול 1.5px Line, טקסט Ink), **link** (טקסט Orange 600, ללא רקע; אפשר עם חץ), **icon** (ריבוע 28px, radius 8, גבול Line; ו-tone `danger` לאייקון אדום). **Disabled** (כל variant במצב `disabled`): רקע Line, טקסט Muted, ללא גבול. תמיכה ב-`asChild` לקישורים. |
| **Input** | shadcn `input` + התאמה | רקע לבן, גבול 1.5px `#D6D6D6`, radius 10, גובה 46px, טקסט 16px, Placeholder בצבע Muted. Focus: גבול Orange 500 + טבעת 3px `#FFE3CC`. שגיאה (`aria-invalid`): גבול Error. |
| **Field** (עטיפה) | חדש | Label מעל השדה (14px, Medium), כוכבית חובה כתומה כשה-prop `required`, הודעת שגיאה מתחת בצבע Error (12–14px), קישור `aria-describedby`. ישמש את כל הטפסים בהמשך. |
| **Select** | `<select>` native מעוצב (ראו ADR למטה) | אותו סגנון כמו Input; חץ `chevron` בצד **שמאל** (`end` ב-RTL); `appearance-none`. Placeholder כ-option ריק מושבת. |
| **Textarea** | shadcn `textarea` + התאמה | סגנון Input, גובה מינימלי ~84px. |
| **Chip** | חדש | כפתור toggle בצורת גלולה, גובה ~34px, גבול Line. נבחר: גבול Orange 500, רקע Orange 50, טקסט Orange 700 וסימן ✕ (`X` מ-Lucide). `aria-pressed`. **ChipGroup** פשוט לבחירה מרובה (state מבוקר דרך props). |
| **Checkbox** | shadcn `checkbox` + התאמה | 16px; מסומן: רקע Orange 500 + ✓ לבן; radius ~4. |
| **Radio** | shadcn `radio-group` + התאמה | עיגול 16px; נבחר: מסגרת כתומה עבה. |
| **Badge** | shadcn `badge` + התאמה | radius 6, ‏12px Medium. Variants: `success` ("זמין"/"פעיל"), `neutral` ("לא זמין"/"לא פעיל" – אפור על Mist), `rank` (Orange 700 על Orange 50), `primary` ("ראשית" – לבן על כתום), `new` (סגול – "חדש"), `warning-tint` ("עדכונים פעילים" כפי שמופיע ב-style-guide.png – Orange על Orange 50). |
| **FeatureTag** | חדש | רקע לבן, גבול Line, radius 6, ‏`check` אופציונלי (✓ לפני הטקסט). |
| **Panel** | חדש | רקע לבן, radius 14, צל Card, ריפוד 24. Variant `muted` (רקע Mist, ללא צל – ל"נתוני השקעה"), ו-`lg` (radius 20). |
| **Notice** | חדש | רקע `#FFF8F2`, גבול `#FFD2AE`, radius 10, אייקון כתום (ברירת מחדל `Mail`), טקסט Small. |
| **TintBox** | חדש | תיבת "למה זה מתאים לכם" / "מה חשוב ללקוח": רקע Orange 50, radius 10, כותרת Orange 700 Medium. (נכלל כי הוא חלק מ-"Panel/Notice" בשפה העיצובית ומשמש בשלושה מסכים.) |

**ADR שיתועד ב-ARCHITECTURE.md (בסיום הבנייה):** *ADR-1: Select כ-`<select>` native מעוצב במקום Select של Radix* – פשוט יותר, עובד ישירות עם `FormData` של Server Actions, ובמובייל פותח את בורר המערכת. (ומאחר שהסעיף `## החלטות מרכזיות (ADRs)` לא קיים – להוסיף אותו בסוף הקובץ.) ‏*ADR-2: lucide-react כסט האייקונים* – Line icons, 24px, פינות מעוגלות, תואם ל-Style Guide ומובנה ב-shadcn.

---

## 7. Layouts ודפי בסיס

**`app/layout.tsx` (שורש):** `lang="he" dir="rtl"`, ‏Rubik, ‏`metadata.title` כללי (שם זמני: "מערכת התאמת נכסים"), רקע ברירת מחדל Mist, טקסט Ink.

**Logo (`components/layout/logo.tsx`):** ריבוע כתום מעוגל (radius 8, ~32px) עם אייקון home לבן, ולידו טקסט – ברירת מחדל "לוגו" (Placeholder לשם העסק, לפי DESIGN §2.3). מקבל `label` כדי שבניהול יוצג "ממשק ניהול".

**Layout אתר הלקוח – `app/(public)/layout.tsx`:**
- `SiteHeader`: רקע לבן, קו תחתון 1px Line, גובה ~64px, הלוגו בצד ימין (תחילת השורה ב-RTL), שוליים צדדיים 40px בדסקטופ / 16px במובייל.
- אזור תוכן על רקע Mist, מרכוז ברוחב מקסימלי (~1200px).
- **דף בסיס `/`:** Panel לבן ממורכז עם כותרת H1 "מצאו את הנכס שמתאים לכם" ותת-כותרת "מלאו כמה פרטים ונציג לכם עד 3 נכסים מתאימים" (הטקסטים מ-DESIGN §1.1), בלי טופס. הטופס עצמו נבנה ב-Milestone 3.

**Layout ממשק הניהול – `app/admin/(panel)/layout.tsx`:**
- `AdminHeader`: רקע לבן, קו תחתון, Logo עם הכיתוב "ממשק ניהול" בצד ימין. צד שמאל ריק בשלב זה (Avatar, מייל ו"התנתקות" – ב-M2).
- `AdminSidebar` מימין: רוחב ~170px, רקע לבן, קו מפריד בצד השמאלי (`border-e`), פריטים "נכסים" (home → `/admin/properties`) ו"פניות" (list → `/admin/requests`). פריט: אייקון + טקסט, radius 8; פעיל: רקע Orange 50, טקסט Orange 700, Medium. זיהוי הפריט הפעיל עם `usePathname()`.
- אזור תוכן על רקע Mist, ריפוד 32.
- **מובייל (< 768px):** תפריט הצד הופך לשורת לשוניות אופקית מתחת ל-Header (לפי ההנחה ב-DESIGN §2.4).
- **דפי בסיס:** `/admin` → redirect ל-`/admin/properties`. ‏`/admin/properties`: כותרת H1 "נכסים" + Panel לבן ריק. ‏`/admin/requests`: כותרת H1 "פניות" + Panel לבן ריק. (התוכן – ב-M2 וב-M4.)

**דף הדוגמה הפנימי – `/dev/components`:**
- בלי Layout של לקוח/ניהול (Header פשוט בלבד), רקע Mist.
- סקשנים לפי סדר ה-Style Guide: צבעים (ריבועי צבע עם שם ו-HEX), טיפוגרפיה (כל הרמות עם טקסט עברי לדוגמה, כולל מחיר "‏₪ 1,950,000"), כפתורים (כל ה-variants + Disabled + Icon button + גודל קטן), שדות (Input רגיל / Focus / שגיאה עם הודעה, Select, Textarea, Field עם כוכבית), Chips (נבחר / לא נבחר, אינטראקטיבי), Checkbox, Radio, Badges, Feature tags, Panel, Notice, TintBox, אייקונים (Grid עם שם לכל אייקון), Radius וצללים.
- `metadata.robots = noindex`.
- **הגבלה:** הדף מחזיר `notFound()` כש-`VERCEL_ENV === "production"` – זמין מקומית וב-Preview, לא באתר החי.
- הדף הוא Client Component רק בחלקים האינטראקטיביים (Chips, Checkbox, Radio); השאר Server Component.

---

## 8. לוגיקה ובדיקות (Vitest)

`lib/format.ts` – פונקציות עזר שכל המסכים הבאים צריכים, ומאפשרות בדיקת Unit אמיתית כבר עכשיו:
- `formatPrice(n)` → `"₪ 1,950,000"` (סמל לפני המספר עם רווח, מפריד אלפים; DESIGN §2.5).
- `formatRoomsRange(min, max)` → `"3.5–4"` (מינימום משמאל, מקף en-dash); אם שווים → `"4"`.

`lib/format.test.ts` – בדיקות לשתיהן (כולל חצאי חדרים, טווח זהה, מספרים גדולים).

אין בדיקות Unit לרכיבי UI ב-Milestone הזה (הם נבדקים ויזואלית בדף הדוגמה).

---

## 9. סביבה, GitHub ו-Vercel

**`.env.example`** – כל המשתנים מ-ARCHITECTURE §2.9, בלי ערכים, עם הערה קצרה לכל אחד:
`NEXT_PUBLIC_SUPABASE_URL`, ‏`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, ‏`SUPABASE_SECRET_KEY`, ‏`SUPABASE_DB_URL`, ‏`ANTHROPIC_API_KEY`, ‏`RESEND_API_KEY`, ‏`EMAIL_FROM`, ‏`EMAIL_TEST_RECIPIENT`, ‏`APP_BASE_URL`, ‏`CRON_SECRET`.
- ב-Milestone הזה האפליקציה **לא** משתמשת באף אחד מהם – צריך שתרוץ גם כשהם ריקים.
- **קובץ הערכים המקומי:** העתקה חד-פעמית של `.env.example` ל-`.env` (ראו "החלטה שהתקבלה" בסוף).
- `.gitignore` הקיים כבר מכסה `.env` ו-`.env.*` (כולל `.env.local`) ומחריג את `.env.example` – תנאי ה-DoD מתקיים. לא לשנות את השורות האלה.

**GitHub + Vercel (שלב שני של ה-Milestone, דורש אישור):**
לפי CLAUDE.md אין push בלי בקשה מפורשת. לכן הסדר:
1. בנייה ובדיקה מקומית מלאה (§2–§8), סימון 🟡.
2. **עצירה:** לבקש מהמשתמש אישור ל-push ואת כתובת ה-repo ב-GitHub.
3. אחרי האישור: `git init`, commit ראשון ל-`main`, push.
4. הדרכה צעד-אחר-צעד למשתמש: יצירת repo ב-GitHub (אם עוד לא קיים), יצירת פרויקט ב-Vercel ‏(Import Git Repository), אישור ש-Framework = Next.js, פריסה ראשונה.
5. בדיקת Preview: ענף חדש (למשל `chore/preview-check`) עם שינוי זעיר → push → פתיחת Pull Request → וידוא ש-Vercel יצר Preview Deployment תקין ושדף הבסיס ודף הדוגמה נטענים בו.
- אין צורך במשתני סביבה ב-Vercel ב-Milestone הזה.

---

## 10. בדיקות בסיום הבנייה (מול ה-Definition of Done)

| תנאי DoD | איך בודקים |
|---|---|
| `npm run dev` מציג את שני ה-Layouts בעברית, RTL ו-Rubik | פתיחת `/` ו-`/admin/properties` בדפדפן; בדיקה ב-DevTools ש-`dir="rtl"`, ‏`lang="he"` וש-font-family הוא Rubik; צילום מסך והשוואה ל-mockups.png. |
| Push לענף + PR יוצרים Preview תקין ב-Vercel | בשלב §9 – אחרי אישור המשתמש. |
| כל רכיבי הבסיס בדף הדוגמה, תואמים ל-style-guide.png | פתיחת `/dev/components`, צילום מסך והשוואה מול style-guide.png (צבעים, גלולות, Radius, Focus, Chips). |
| `npm run build`, ‏`npm run lint`, ‏`npm test` עוברים | הרצה של שלושתם. |
| `.env.local` ב-`.gitignore` | מכוסה ע"י `.env.*` – לוודא בעזרת `git check-ignore .env.local` אחרי `git init` (או בדיקת התבנית לפני). |
| (כללי) שמיש ב-375px ובמחשב | `resize_window` למובייל ולדסקטופ על שלושת הדפים; לוודא שאין גלילה אופקית ושתפריט הצד הופך לשורה עליונה. |

בנוסף, בסיום הבנייה:
- עדכון סעיף **פקודות הרצה** ב-`CLAUDE.md`: הרצה – `npm run dev`; בדיקות – `npm test`.
- הוספת ADR-1 ו-ADR-2 ל-ARCHITECTURE.md (סעיף ADRs חדש בסוף).
- סימון 🟡 ליד כותרת Milestone 1 ב-MILESTONES.md.
- סגירת שרת ה-dev.

---

## החלטה שהתקבלה

**שם קובץ הסודות המקומי: `.env`** (לפי CLAUDE.md, באישור המשתמש), ולא `.env.local` כפי שכתוב ב-ARCHITECTURE.md וב-MILESTONES.md. ‏Next.js קורא את `.env`, והוא מוסתר מ-Git. בבנייה יתועד כ-ADR-3 ב-ARCHITECTURE.md.
