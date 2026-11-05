# Milestone 3 – פנייה והתאמה חכמה — תוכנית בנייה

> מבוסס על: PRD (F1, F2, F3, מקרי קצה), ARCHITECTURE (§2.3–2.7, §2.11, ADRs), DESIGN (§1.1–1.3), MILESTONES (Milestone 3), וקוד Milestone 2.
> מחוץ להיקף כאן: **דירוג ונימוק בעזרת AI (נדחה — ראו סעיף 0)**. שייך ל-Milestones הבאים: טבלת `email_outbox` ושליחת מיילים (M5), הדף האישי המלא, עדכון קריטריונים והפסקת עדכונים (M5), מסכי הפניות אצל הסוכן (M4), תגית "לא זמין" בדף האישי (M5).

---

## 0. החלטות שהתקבלו עם המשתמש לפני הבנייה

1. **ה-AI (Claude) יוצא מה-Milestone הזה.** הדירוג הוא תמיד דירוג ברירת המחדל (מהחדש לישן) עם נימוק בסיסי שנבנה מהקריטריונים. לא מותקן `@anthropic-ai/sdk`, לא נדרש `ANTHROPIC_API_KEY`, ואין קריאה לשירות חיצוני. המיקום של ה-AI ב-MILESTONES.md ייקבע עם המשתמש.
   - הקוד נבנה כך שה-AI יתווסף בהמשך בנקודה אחת: הפונקציה `rankCandidates()` ב-`lib/services/matching.ts`, שכרגע מחזירה את דירוג ברירת המחדל.
   - **תנאי DoD שמושפעים:** "לכל נכס יש נימוק בעברית" — מתקיים עם הנימוק הבסיסי בלבד (לא מותאם לטקסט החופשי). "כשה-AI לא זמין..." ו"בדיקות Unit ל... בדיקת הפלט של ה-AI" — נדחים יחד עם ה-AI.
2. **כיתוב על תמונת הכרטיס** ("מרפסת שמש ונוף פתוח" ב-Mockups): הוחלט שה-AI יכתוב אותו. מכיוון שה-AI נדחה, ב-M3 **אין כיתוב**, והתמונה מוצגת נקייה. העמודה `highlight` תתווסף יחד עם ה-AI.
3. **אייקון הלב** על התמונות — **מושמט**, כי אין פיצ'ר מועדפים ב-PRD.
4. **הטקסט החופשי** "מה הכי חשוב לכם בנכס?" — נשאר בטופס כשדה חובה ונשמר בפנייה (PRD F1), גם אם עדיין לא משמש לדירוג.

## 1. הנחות קטנות של הבנייה (לא משנות התנהגות שב-PRD)

- **הודעת "שלחנו את התוצאות גם למייל שלכם"** במסך התוצאות — **לא מוצגת** ב-M3, כי המייל עוד לא נשלח. היא תתווסף ב-M5.
- **פנייה כפולה:** אם אותו `submission_id` מגיע שוב (למשל לחיצה כפולה או שליחה חוזרת של הרשת), השרת לא יוצר פנייה חדשה. הוא מחזיר תשובה "כבר נשלח", והטופס נשאר במצב טעינה עד שהשליחה הראשונה מעבירה את הלקוח לתוצאות. (את הטוקן של הפנייה הראשונה אי אפשר לשחזר, כי נשמר רק ה-Hash שלו.) בנוסף, הכפתור מושבת בזמן השליחה.
- **אבטחת `/r/*`** (`Referrer-Policy: no-referrer` ו-`noindex`) — מוגדרת כבר עכשיו, כי הקישור עם הטוקן נוצר כבר ב-M3. זה לא פיצ'ר חדש אלא הגנה שמוגדרת ב-ARCHITECTURE §2.7. (MILESTONES משייך אותה ל-M5; ב-M5 רק יוודא שהיא קיימת.)
- **מגבלות קלט:** שם עד 100 תווים, טקסט חופשי עד 1,000 תווים, תקציב עד 1,000,000,000. טלפון: ספרות, רווחים, מקפים ו-`+` בתחילתו, 9–15 ספרות.
- **בחירת חדרים:** שני Selects ("מ-" / "עד") עם ערכים 1 עד 10 בקפיצות של 0.5.

---

## 2. Migration חדשה

קובץ חדש ב-`supabase/migrations/` (נוצר עם `npx supabase migration new client_requests`), מורץ על Development בלבד עם `npm run db:push`.

- **enum** `match_source` (`initial`, `notification`).
- **`client_requests`** — לפי ARCHITECTURE §2.4:
  - `submission_id uuid unique not null`, `name`, `email`, `phone`, `city`, `neighborhoods text[]` (לפחות אחת), `max_budget integer check (> 0)`, `rooms_min`, `rooms_max numeric(3,1)` עם `check (rooms_min <= rooms_max)`, `preferences_text`, `access_token_hash text unique not null`, `notifications_active boolean default true`, `created_at`, `updated_at` (+ trigger `set_updated_at` הקיים).
  - אינדקס `(created_at desc)` (לרשימת הפניות ב-M4).
- **`request_matches`** — לפי §2.4:
  - `request_id` → `client_requests` `on delete cascade`; `property_id` → `properties` `on delete set null`; `property_title_snapshot`, `source`, `rank smallint`, `reason text`, `is_current boolean default true`, `created_at`.
  - אינדקס `(request_id, source, is_current)`.
  - אינדקס ייחודי חלקי `(request_id, property_id) where source = 'notification'` (נדרש ל-M6, נוצר עכשיו כי הוא חלק מהגדרת הטבלה).
- **`submission_log`** — `id`, `ip_hash text not null`, `created_at`; אינדקס `(ip_hash, created_at)`.
- **RLS מופעל על שלוש הטבלאות, בלי אף Policy.** גישה רק מהשרת עם המפתח הסודי. (מדיניות קריאה לסוכן תתווסף ב-M4.)
- אחרי ההרצה: `npm run check:rls` — להרחיב את הסקריפט כך שיוודא שגם שלוש הטבלאות החדשות חסומות לקריאה ולכתיבה עם המפתח הציבורי.

## 3. שכבת Integrations

- **`lib/integrations/supabase/service.ts`** (חדש, `server-only`): Client עם `SUPABASE_SECRET_KEY`, בלי Session. משמש רק את הצד הציבורי (טופס, תוצאות, פרטי נכס) — כי ללקוח אין התחברות וה-RLS חוסם את `anon`. זורק שגיאה ברורה אם המשתנה חסר.
- **אין Integration ל-Claude ב-M3** (סעיף 0).
- **`.env.example`:** אין משתנים חדשים. (`ANTHROPIC_API_KEY` כבר מתועד שם, ויישאר ריק עד שה-AI ייבנה.)

## 4. Domain Services

### `lib/validation/request.ts` (חדש) — סכמת Zod משותפת לדפדפן ולשרת (F1)
- שדות: `submission_id` (uuid), `name`, `email`, `phone` (רשות), `city`, `neighborhoods` (מערך, לפחות 1), `max_budget` (מספר שלם חיובי), `rooms_min`, `rooms_max` (שלם או חצי, ‏`rooms_min <= rooms_max`), `preferences_text` (חובה).
- הודעות שגיאה בעברית, לכל שדה בנפרד. טווח הפוך → הודעה ליד "מספר חדרים".
- פונקציית `requestFormValues(formData)` ו-`parseRequest()` באותו סגנון של `lib/validation/property.ts`.
- **בשרת בלבד:** בדיקה שהעיר והשכונות קיימות ב-`available_areas` (רשימה סגורה). אם לא — הודעה "יש לבחור עיר ושכונות מהרשימה".

### `lib/services/areas.ts` (חדש)
- `listAvailableAreas()` → `{ city, neighborhoods[] }[]`, ממוין לפי א"ב, מ-View ‏`available_areas` דרך ה-Service Client.

### `lib/services/matching.ts` (חדש) — F2
- **`findCandidates(criteria)`** — סינון ב-SQL דרך supabase-js: `status='available'`, `city = ?`, `neighborhood in (?)`, `price <= max_budget`, `rooms between rooms_min and rooms_max`, ממוין `created_at desc`, `limit 40`.
- **`defaultRanking(candidates, criteria)`** (טהורה): 3 הראשונים מהחדש לישן, עם **נימוק בסיסי** שנבנה מהקריטריונים, למשל: "הנכס נמצא בשכונת הצפון הישן, במחיר ₪ 1,950,000 שנמצא בתקציב שלכם, ועם 4 חדרים בטווח שביקשתם."
- **`rankCandidates(preferences, candidates, criteria)`** — נקודת החיבור העתידית ל-AI. ב-M3 היא רק קוראת ל-`defaultRanking` (0 מועמדים → רשימה ריקה).

### `lib/services/requests.ts` (חדש) — F1, F4 (שמירה בלבד)
- **`submitRequest(input, ip)`** — לפי ARCHITECTURE §2.6 א':
  1. אם `submission_id` כבר קיים → `{ status: "duplicate" }`.
  2. **Rate Limit:** ‏`ip_hash` = SHA-256 של ה-IP. אם יש 5 רשומות או יותר ב-`submission_log` בשעה האחרונה → `{ status: "rate_limited" }`, בלי ליצור פנייה. אחרת — רשומה חדשה ב-`submission_log`.
  3. טוקן: 32 בתים אקראיים (`crypto.randomBytes`) ב-base64url. נשמר רק ה-SHA-256 שלו.
  4. שמירת הפנייה. התנגשות על `submission_id` (שתי שליחות באותו רגע) → `duplicate`.
  5. `findCandidates` → `rankCandidates` → שמירת עד 3 רשומות `request_matches` (`source='initial'`, ‏`rank`, ‏`reason`, ‏`property_title_snapshot`).
  6. אם שלב 5 נכשל באופן לא צפוי — הפנייה כבר שמורה; רושמים שגיאה ב-log ועדיין מחזירים את הטוקן (המסך יציג 0 תוצאות).
  7. מחזיר `{ status: "created", token }`.
- **`getRequestByToken(token)`** — בדיקת פורמט (43 תווים base64url) לפני גישה למסד, ואז חיפוש לפי ה-Hash. מחזיר רק מה שהמסך צריך (בלי מייל וטלפון).
- **`getCurrentMatches(requestId)`** — התאמות `initial` עם `is_current = true`, ממוינות לפי `rank`, יחד עם נתוני הנכס והתמונה הראשית. התאמה שהנכס שלה נמחק (`property_id = null`) לא מוצגת.
- **`getMatchedProperty(requestId, propertyId)`** — מחזיר נכס **רק** אם הוא מקושר לפנייה הזו ב-`request_matches`, כולל כל התמונות.

## 5. Server Action

**`app/(public)/actions.ts`** — `submitRequestAction(prev, formData)`:
- ולידציה עם Zod (+ בדיקת הרשימה הסגורה). שגיאות → `fieldErrors` ליד כל שדה.
- IP מ-`headers()` (`x-forwarded-for`, הערך הראשון).
- `duplicate` → מחזיר מצב "ממתין" בלי הודעה. `rate_limited` → הודעה מעל הכפתור: "שלחתם כמה פניות בזמן קצר. נסו שוב בעוד שעה."
- הצלחה → `redirect('/r/<token>')`.
- שגיאה לא צפויה → "השליחה נכשלה. נסו שוב."

## 6. מסכים (DESIGN §1.1–1.3, `mockups.png`)

**לפני הכתיבה:** לקרוא את המדריכים הרלוונטיים ב-`node_modules/next/dist/docs/` על Cache Components, ‏`headers()`, ‏Suspense ו-`params` דינמיים (ADR-4).

### 6.1 טופס פנייה — `app/(public)/page.tsx` + `request-form.tsx` (Client)
- Server Component טוען את `listAvailableAreas()` ומייצר `submission_id` חדש (uuid) בכל טעינה.
- **מאגר ריק** → במקום הטופס: Panel עם "אין כרגע נכסים במערכת. נשמח לעזור בקרוב."
- מבנה לפי DESIGN §1.1: Panel ממורכז, כותרת ותת-כותרת, שני טורים עם קו מפריד ("הפרטים שלכם" עם אייקון משתמש, "מה אתם מחפשים" עם אייקון חיפוש), Textarea ברוחב מלא, כפתור Primary "מצא לי נכסים" עם אייקון חיפוש.
- בחירת עיר מציגה את השכונות שלה כ-`ChipGroup`. החלפת עיר מאפסת את השכונות שנבחרו. השכונות נשלחות כשדות `hidden`.
- ולידציה בדפדפן עם אותה סכמה לפני השליחה, והודעות ליד כל שדה. הערכים נשמרים אחרי שגיאה מהשרת.
- **מצב טעינה:** `useFormStatus` — הכפתור מושבת, עם טקסט "מחפשים עבורכם נכסים..." וספינר.
- מובייל: הטורים אחד מתחת לשני.

### 6.2 תוצאות — `app/(public)/r/[token]/page.tsx`
- טוקן לא תקין או לא קיים → Panel עם "הקישור אינו תקין" בלבד. לא נחשף שום מידע.
- **כותרת:** "מצאנו עבורכם **N** נכסים" (המספר בכתום). לנכס אחד: "מצאנו עבורכם נכס **1**".
- **0 נכסים:** "לא נמצאו כרגע נכסים מתאימים. נעדכן אתכם במייל כשייכנס נכס שמתאים לכם."
- **1–2 נכסים:** מוצגים רק הם, ומתחתם Notice: "נעדכן אתכם במייל כשייכנס נכס נוסף שמתאים לכם."
- **רכיב `components/property/property-card.tsx`** (חדש): תמונה ראשית ביחס 3:2 (בלי כיתוב ובלי לב — סעיף 0), כותרת, מחיר SemiBold, שורת פרטים באפור (שכונה · חד' · מ"ר · קומה — רק מה שקיים), Feature tags למאפיינים שמסומנים, תיבת נימוק (`TintBox`) "למה זה מתאים לכם", וכפתור Secondary ברוחב מלא "לפרטים".
- **אין תמונה** → Placeholder אפור עם אייקון תמונה (נכסי ה-Seed אין להם תמונות).
- Grid של 3 עמודות במחשב, עמודה אחת במובייל.

### 6.3 פרטי נכס — `app/(public)/r/[token]/properties/[id]/page.tsx`
- נכס שלא מקושר לפנייה, או טוקן לא תקין → "הקישור אינו תקין".
- קישור "חזרה" (חץ ימינה) ל-`/r/<token>`.
- **טור ימני – גלריה** (`property-gallery.tsx`, Client): תמונה גדולה עם מונה "1 / 6", ושורת Thumbnails. לחיצה מחליפה את התמונה, והפעילה במסגרת כתומה. בלי תמונות → Placeholder.
- **טור שמאלי:** כותרת, כתובת עם אייקון מיקום, מחיר גדול, ארבע קוביות נתונים (חדרים, שטח, קומה, מצב הנכס — קובייה בלי ערך מציגה "–"), "מאפיינים" עם ✓, "תיאור", ו-Panel אפור "נתוני השקעה" — רק אם הוזן לפחות אחד מהשניים.
- מובייל: הגלריה מעל הפרטים.

### 6.4 משותף
- `app/(public)/r/layout.tsx` (או `metadata` בדפים): `robots: { index: false, follow: false }`.
- `next.config.ts` → `headers()`: ‏`Referrer-Policy: no-referrer` ל-`/r/:path*`.
- אייקונים חדשים (אם חסרים) נוספים רק דרך `components/icons.tsx` (ADR-2).

## 7. בדיקות Unit (Vitest)

- `lib/validation/request.test.ts` — מייל לא תקין, טלפון לא תקין, תקציב 0/שלילי, טווח חדרים הפוך, חצי חדר, שדות חובה חסרים, אין שכונות.
- `lib/services/matching.test.ts`:
  - **סינון:** `findCandidates` עם Query Builder מדומה — מוודא שכל התנאים (סטטוס, עיר, שכונות, תקציב, טווח חדרים, מיון, ‏limit) מופעלים.
  - **דירוג ברירת מחדל:** לכל היותר 3 נכסים, מהחדש לישן, דירוג 1..N, ונימוק בסיסי עם השכונה, המחיר והחדרים; 0 מועמדים → רשימה ריקה.
  - (בדיקות הפלט של ה-AI וה-Fallback נדחות יחד עם ה-AI.)
- `lib/services/requests.test.ts` — יצירת טוקן ו-Hash (הטוקן לא שווה ל-Hash, ה-Hash דטרמיניסטי), בדיקת פורמט טוקן.

## 8. פעולות משתמש

אין ב-M3 (מפתח Claude נדחה יחד עם ה-AI).

## 9. בדיקה עצמית בסוף הבנייה (מול ה-DoD)

1. `npm run db:push` — ה-Migration רצה על Development; `npm run db:list` מראה אותה. `npm run check:rls` עובר גם על הטבלאות החדשות.
2. פנייה: תל אביב / הצפון הישן, תקציב 2,000,000, חדרים 3.5–4 → 2 נכסים מה-Seed (דירת 4 חדרים עם מרפסת, פנטהאוז קטן), מהחדש לישן, עם נימוק בסיסי בעברית, והודעה על עדכונים עתידיים. (דירת הגן בנווה צדק לא זמינה — לא מופיעה.)
3. פנייה ברמת גן / מרום נווה + הבורסה, תקציב 3,000,000, חדרים 3–5 → 3 נכסים.
4. פנייה בלי התאמות (תקציב נמוך) → הודעת 0 תוצאות, והפנייה נשמרה.
5. ולידציה: מייל לא תקין, תקציב 0, טווח הפוך → הודעה ליד השדה, אין פנייה חדשה.
6. שליחה כפולה עם אותו `submission_id` → פנייה אחת בלבד במסד.
7. 6 שליחות מאותו IP בשעה → השישית נחסמת עם הודעה, ולא נוצרת פנייה.
8. במסד: `access_token_hash` שונה מהטוקן שבכתובת, והטוקן עצמו לא מופיע בשום עמודה.
9. `/r/abc` ו-`/r/<טוקן אחר תקין-בפורמט>` → "הקישור אינו תקין". פרטי נכס שלא שייך לפנייה → "הקישור אינו תקין".
10. "לפרטים" → מסך פרטי נכס, "חזרה" → תוצאות.
11. בדיקה ויזואלית במחשב וב-375px מול `mockups.png`.
12. `npm run build`, ‏`npm run lint`, ‏`npm test` עוברים.
13. סימון 🟡 ליד Milestone 3 ב-MILESTONES.md.

## 10. רשימת קבצים

**חדשים:**
- `supabase/migrations/<timestamp>_client_requests.sql`
- `lib/integrations/supabase/service.ts`
- `lib/validation/request.ts` (+ `.test.ts`)
- `lib/services/areas.ts`, `lib/services/matching.ts` (+ `.test.ts`), `lib/services/requests.ts` (+ `.test.ts`)
- `app/(public)/actions.ts`, `app/(public)/request-form.tsx`
- `app/(public)/r/[token]/page.tsx`, `app/(public)/r/[token]/properties/[id]/page.tsx`, `app/(public)/r/[token]/properties/[id]/property-gallery.tsx`
- `components/property/property-card.tsx`, `components/property/property-image.tsx` (תמונה או Placeholder), `components/property/invalid-link.tsx`

**משתנים:**
- `app/(public)/page.tsx` (הטופס במקום דף הבסיס)
- `next.config.ts` (כותרת `Referrer-Policy` ל-`/r/*`)
- `scripts/check-rls.mjs` (הטבלאות החדשות)
- `components/icons.tsx` (אם צריך אייקונים נוספים)
- `spec/MILESTONES.md` (🟡)
