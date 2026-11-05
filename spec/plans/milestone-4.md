# Milestone 4 – צפייה בפניות בממשק הניהול — תוכנית בנייה

> מבוסס על: PRD (F9, Flow 5, מקרה הקצה "נכס שהוצג ללקוח נמחק", אילוץ הפרטיות), ARCHITECTURE (§2.2–2.4, §2.7, ADR-4, ADR-6, ADR-11), DESIGN (§1.9, §1.10, §1.11, Style Guide), ‏`mockups.png` (המסכים "פניות" ו"פרטי פנייה"), MILESTONES (Milestone 4), וקוד Milestones 2–3.
> מחוץ להיקף כאן: הפסקה והפעלה של עדכונים בידי הלקוח (M5 — ב-M4 רק **מציגים** את `notifications_active`), נכסים שנשלחו בעדכונים אוטומטיים (M6), כל פעולת עריכה, סטטוס, הערה או שליחת מייל מתוך המסכים (PRD §6 — מחוץ לטווח).

---

## 0. אין החלטות פתוחות

כל מה שה-Milestone צריך מוגדר ב-PRD, ב-DESIGN וב-Mockups. אין Placeholders פתוחים, ואין צורך בפעולת משתמש בשירות חיצוני (אין חשבונות או מפתחות חדשים). התפריט הצדדי עם "נכסים" ו"פניות" כבר קיים מ-Milestone 1, והדף `/admin/requests` קיים כ-Placeholder.

## 1. הנחות קטנות של הבנייה (לא משנות התנהגות שב-PRD)

- **"הנכסים שהוצגו ללקוח"** = ההתאמות הראשוניות הנוכחיות (`source='initial'`, ‏`is_current=true`), לפי `rank`. ב-M5 (עדכון קריטריונים) הסט הנוכחי הוא מה שיוצג; התאמות מעדכונים אוטומטיים (`source='notification'`) נוספות ב-M6 ואינן חלק מהמסך עכשיו.
- **נכס שנמחק:** השורה נשארת בטבלה במקומה בדירוג, באפור. בעמודת "נכס" מופיע "נכס שנמחק", המחיר "–", והנימוק שנשמר מוצג כרגיל (כך ב-Mockups). ‏`property_title_snapshot` **לא** מוצג (DESIGN מגדיר את הטקסט "נכס שנמחק").
- **פנייה בלי נכסים מתאימים:** במקום הטבלה מוצג טקסט אפור "לא נמצאו נכסים מתאימים בזמן הפנייה".
- **רשימה ריקה:** Panel עם הטקסט "עדיין לא התקבלו פניות".
- **אין עימוד (Pagination):** כל הפניות מוצגות בטבלה אחת. במוצר עם סוכן יחיד זה מספיק; אפשר להוסיף בהמשך אם תתבקש.
- **תאריך:** בפורמט `DD/MM/YYYY` (כמו ב-Mockups), לפי שעון ישראל (`Asia/Jerusalem`).
- **אזור:** "עיר • שכונה א', שכונה ב'" (כמו ב-Mockups). **תקציב:** ברשימה `₪ 2,000,000`; בפרטי הפנייה "עד ₪ 2,000,000". **חדרים:** `formatRoomsRange` הקיים, בכיוון LTR.
- **טלפון ריק** → "–".
- **מזהה פנייה לא קיים או לא תקין** בכתובת `/admin/requests/[id]` → דף 404 הרגיל של Next.js (`notFound()`).
- **שורה לחיצה:** שם הלקוח הוא קישור (`<Link>`) שמכסה את כל השורה (Stretched link: `tr` עם `relative`, והקישור עם `after:absolute after:inset-0`), עם רקע Hover עדין וטבעת Focus. כך כל השורה לחיצה, ונגישה במקלדת.

---

## 2. Migration חדשה — הרשאת קריאה לסוכן

קובץ חדש ב-`supabase/migrations/` (נוצר עם `npx supabase migration new admin_read_requests`), מורץ על Development בלבד עם `npm run db:push`.

- Policy **לקריאה בלבד** (`for select`) ל-Role ‏`authenticated`, בתנאי `(select public.is_admin())`, על:
  - `client_requests`
  - `request_matches`
- **אין** Policy להוספה, עדכון או מחיקה לסוכן — זה מבטיח את "לקריאה בלבד" גם ברמת מסד הנתונים.
- **אין** שינוי ל-`anon` ול-`submission_log` (נשארים חסומים לגמרי).
- זה תואם ל-ARCHITECTURE §2.7 (שכבה 2: RLS לפי `admin_users`), ולהערה בתוכנית M3 ש"מדיניות קריאה לסוכן תתווסף ב-M4". המסכים של הסוכן ניגשים לנתונים **עם ה-Session של הסוכן** (`lib/integrations/supabase/server.ts`), ולא עם המפתח הסודי — כמו מסכי הנכסים.
- Migration שרק מוסיפה Policies — תואמת לאחור.
- אחרי ההרצה: `npm run check:rls` — להוסיף לסקריפט בדיקות שהמפתח הציבורי (בלי התחברות) לא יכול לקרוא, להוסיף, לעדכן או למחוק ב-`client_requests` וב-`request_matches` (חלק מהבדיקות אולי כבר קיימות מ-M3; משלימים מה שחסר).

## 3. Domain Services

### `lib/services/admin-requests.ts` (חדש, `server-only`) — מודול `admin` לפי ARCHITECTURE §2.2
- **`listRequests()`** → `RequestListItem[]`: ‏`id, name, created_at, city, neighborhoods, max_budget, rooms_min, rooms_max, notifications_active`, ממוין `created_at desc` (משתמש באינדקס הקיים). ‏`rooms_*` מומרים ל-`Number`.
- **`getRequestDetails(id)`** → `RequestDetails | null`:
  - בדיקת פורמט UUID לפני השאילתה (מזהה לא תקין → `null`, בלי שגיאת מסד נתונים).
  - פרטי הפנייה: שם, מייל, טלפון, תאריך, קריטריונים, `preferences_text`, ‏`notifications_active`.
  - ההתאמות: `request_matches` עם `source='initial'`, ‏`is_current=true`, ממוינות לפי `rank`, עם Join ל-`properties(id, title, price)`.
  - **לא** שולף את `access_token_hash` או את `submission_id` (לא נחוצים לתצוגה).
- שתי הפונקציות רצות עם ה-Client של ה-Session, ולכן ה-RLS חל עליהן.

### `lib/admin-requests-view.ts` (חדש, טהור — בלי `server-only`, כדי שיהיה בדיק)
- **`toShownMatches(rows)`** → `{ rank, reason, deleted: boolean, title: string | null, price: number | null }[]` — כש-`property` הוא `null` (נכס נמחק, `ON DELETE SET NULL`): ‏`deleted=true`, ‏`title=null`, ‏`price=null`. שומר על סדר ה-`rank`.

### `lib/format.ts` (הרחבה)
- **`formatDate(iso)`** → `"04/11/2026"`, לפי `Asia/Jerusalem`.
- **`formatArea(city, neighborhoods)`** → `"תל אביב • הצפון הישן, נווה צדק"`.

## 4. מסכים (DESIGN §1.9–1.10, `mockups.png`)

כל דף קורא ל-`requireAdmin()` לפני טעינת נתונים, בתוך רכיב שעטוף ב-`Suspense` עם Skeleton — באותו מבנה של `app/admin/(panel)/properties/page.tsx` (ADR-4). אין בשום מסך כפתור, טופס או Server Action.

### 4.1 פניות — `app/admin/(panel)/requests/page.tsx` (מחליף את ה-Placeholder)
- כותרת H1 "פניות".
- טבלה בתוך `Panel` (‏`padding="none"`, ‏`overflow-x-auto`, ‏`min-w-[720px]`), באותו עיצוב של טבלת הנכסים: ראש טבלה ברקע `table-head`, קווי הפרדה `row-divider`.
- עמודות: **שם הלקוח** (Medium, ‏`text-ink`, קישור לשורה) · **תאריך** · **אזור** · **תקציב** (‏`dir="ltr"`) · **חדרים** (‏`dir="ltr"`, למשל `3.5–4`) · **עדכונים** — `Badge` ‏"פעיל" (`success`) או "לא פעיל" (`neutral`).
- מצב ריק — לפי סעיף 1.
- Metadata: "פניות | ממשק ניהול".

### 4.2 פרטי פנייה — `app/admin/(panel)/requests/[id]/page.tsx` (חדש)
- קישור חזרה "חזרה לפניות" עם אייקון `back`, בצבע הכתום (כמו ב-Mockups), ל-`/admin/requests`.
- כותרת H1 "פנייה של [שם הלקוח]".
- **שני Panels זה לצד זה** (Grid של 2 טורים במחשב, טור אחד במובייל):
  - **"פרטי הלקוח"** עם אייקון `user` כתום: שם, אימייל, טלפון, תאריך פנייה — שורות "תווית אפורה / ערך". המייל והטלפון מוצגים כטקסט רגיל (אין שליחת הודעות מהמערכת). מייל וטלפון ב-`dir="ltr"`.
  - **"קריטריונים"** עם אייקון `search` כתום: אזור, תקציב ("עד ₪ ..."), חדרים, עדכונים (Badge "פעיל" / "לא פעיל").
- **`TintBox`** הקיים עם הכותרת "מה חשוב ללקוח", והטקסט החופשי בתוך מירכאות ("…"), עם שמירה על שורות (`whitespace-pre-line`).
- **"הנכסים שהוצגו ללקוח"** (כותרת H3): טבלה בתוך `Panel`, עמודות **#** · **נכס** · **מחיר** · **נימוק**:
  - מספר הדירוג ב-`Badge variant="rank"`.
  - שם הנכס במשקל Medium. הוא **לא** קישור (DESIGN לא מגדיר ניווט מכאן).
  - נכס שנמחק: כל השורה בצבע Muted, "נכס שנמחק", מחיר "–".
  - מצב בלי התאמות — לפי סעיף 1.
- `metadata` דינמי: `generateMetadata` → "פנייה של [שם] | ממשק ניהול" (בתוך אותו `requireAdmin` — אם אין הרשאה, לא נחשף שם). אם זה מסבך מול Cache Components, משתמשים בכותרת קבועה "פרטי פנייה | ממשק ניהול".
- `notFound()` כש-`getRequestDetails` מחזיר `null`.

### 4.3 ניווט
- התפריט הצדדי כבר מסמן את "פניות" גם בכתובות `/admin/requests/...` (`startsWith`). רק לוודא בבדיקה.

### 4.4 מובייל (375px)
- הטבלאות נגללות אופקית בתוך ה-Panel (כמו טבלת הנכסים), בלי גלילה אופקית של כל הדף.
- שני ה-Panels בפרטי הפנייה נערמים זה מעל זה.

## 5. בדיקות Unit (Vitest)

- `lib/format.test.ts` — ‏`formatDate` (כולל פנייה שנשלחה בשעת לילה בשעון UTC שנופלת על יום אחר בישראל), ‏`formatArea` (שכונה אחת, כמה שכונות).
- `lib/admin-requests-view.test.ts` — ‏`toShownMatches`: נכס קיים, נכס שנמחק (`property: null`) עם נימוק, שמירה על סדר הדירוג, רשימה ריקה.

## 6. פעולות משתמש

אין. (אין שירות חיצוני חדש ואין משתנים חדשים ב-`.env`.)

## 7. בדיקה עצמית בסוף הבנייה (מול ה-DoD)

הרצה מקומית מול Development (`npm run dev`), עם חשבון הסוכן:

| תנאי DoD | איך נבדק |
|---|---|
| פנייה חדשה מופיעה בראש רשימת הפניות | שליחת פנייה חדשה בטופס `/`, ואז מעבר ל-`/admin/requests` — היא בשורה הראשונה, עם שם, תאריך, אזור, תקציב, חדרים ו"פעיל". |
| פרטי פנייה מציגים את כל שדות F9, והנכסים לפי הדירוג | לחיצה על השורה: שם, מייל, טלפון, תאריך, קריטריונים, טקסט חופשי, עדכונים, והנכסים 1–3 לפי הסדר שהלקוח ראה ב-`/r/[token]`. |
| נכס שנמחק מוצג כ"נכס שנמחק", והמסך לא נשבר | יצירת נכס בדיקה, שליחת פנייה שתואמת לו, מחיקת הנכס בממשק, וצפייה בפנייה: שורה אפורה "נכס שנמחק", מחיר "–". בסיום — מחיקת נתוני הבדיקה רק באישור המשתמש. |
| אין אפשרות עריכה | בדיקה במסך שאין כפתורים, שדות או טפסים; וב-Migration יש רק Policies מסוג `select`. |
| בלי התחברות אין גישה למסכים או לנתונים | גלישה ל-`/admin/requests` ול-`/admin/requests/<id>` בחלון בלי התחברות → מסך ההתחברות. ‏`npm run check:rls` → המפתח הציבורי לא קורא ולא משנה את `client_requests` ו-`request_matches`. |
| תנאים כלליים | `npm run build`, ‏`npm run lint`, ‏`npm test` עוברים. בדיקה ויזואלית מול ה-Mockups, ברוחב 375px ובמחשב. מזהה שגוי בכתובת → 404. |

בסיום: סגירת השרת, סימון 🟡 ליד Milestone 4 ב-MILESTONES.md, בלי commit.

## 8. רשימת קבצים

**חדשים:**
- `supabase/migrations/<timestamp>_admin_read_requests.sql`
- `lib/services/admin-requests.ts`
- `lib/admin-requests-view.ts`, ‏`lib/admin-requests-view.test.ts`
- `app/admin/(panel)/requests/[id]/page.tsx`

**משתנים:**
- `app/admin/(panel)/requests/page.tsx` (טבלת הפניות במקום ה-Placeholder)
- `lib/format.ts`, ‏`lib/format.test.ts`
- `scripts/check-rls.mjs` (בדיקות לטבלאות הפניות, אם חסרות)
- `spec/MILESTONES.md` (סימון 🟡 בסוף הבנייה)
