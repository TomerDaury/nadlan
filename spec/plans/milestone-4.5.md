# Milestone 4.5 – מחיקת פנייה וכפתור "כניסת סוכן" בולט — תוכנית בנייה

> מבוסס על: PRD (F7, ‏F9, Flow 5, מקרה הקצה "הסוכן מחק פנייה"), DESIGN (§1.9, ‏§1.10, ‏§1.11, טבלת הכפתורים ב-Style Guide), ARCHITECTURE (§2.4, ‏§2.7, ‏ADR-12), MILESTONES (Milestone 4.5), וקוד Milestones 2–4.
> מחוץ להיקף כאן: עריכה של פנייה, סטטוסים או הערות (PRD §6), מחיקה של כמה פניות בבת אחת, ושחזור פנייה שנמחקה.

---

## 0. החלטות שהתקבלו עם המשתמש לפני הבנייה

1. **מאיפה מוחקים:** משני המקומות. אייקון מחיקה בכל שורה ברשימת הפניות, וכפתור "מחיקת פנייה" במסך פרטי הפנייה.
2. **סוג המחיקה:** מחיקה מלאה ובלתי הפיכה. הפנייה, פרטי הלקוח וההתאמות נמחקים. הקישור האישי מפסיק לעבוד, והלקוח לא מקבל יותר עדכונים.
3. **"כניסת סוכן":** כפתור Secondary קטן עם מסגרת כתומה ואייקון משתמש, באותו מקום ב-Footer.
4. **תזמון:** אבן דרך קטנה ונפרדת (4.5), לפני Milestone 5.

## 1. הנחות קטנות של הבנייה (לא משנות התנהגות שב-PRD)

- **טקסט בקשת האישור:** כותרת "מחיקת פנייה". גוף: "למחוק את הפנייה של [שם הלקוח]? הפנייה ופרטי הלקוח יימחקו, הקישור האישי שלו יפסיק לעבוד, ולא ניתן לשחזר אותם." כפתורים: "ביטול" (Neutral) ו"מחיקה" (אדום). זה אותו רכיב ואותו סגנון כמו במחיקת נכס.
- **אחרי מחיקה:** מעבר ל-`/admin/requests?done=deleted`, עם Notice ירוק "הפנייה נמחקה". זה קורה גם כשמוחקים מהרשימה וגם כשמוחקים ממסך הפרטים, כמו ב-`/admin/properties?done=deleted`.
- **פנייה שכבר נמחקה,** למשל בלשונית אחרת: אם המחיקה לא מצאה שורה למחוק, מתייחסים לזה כאל הצלחה ומעבירים לרשימה עם אותה הודעה. אין טעם להציג שגיאה על פנייה שכבר לא קיימת.
- **שגיאה אמיתית** (למשל תקלה במסד הנתונים): בתוך חלון האישור מוצגת ההודעה "המחיקה נכשלה. נסו שוב.", והחלון נשאר פתוח.
- **"כניסת סוכן":** גובה ה-Footer עולה מ-48px ל-56px, כדי שהכפתור (‏`size="sm"`, ‏36px) ייכנס בנוחות.

---

## 2. Migration חדשה

קובץ חדש ב-`supabase/migrations/` (נוצר עם `npx supabase migration new admin_delete_requests`), מורץ על Development בלבד עם `npm run db:push`.

- Policy מסוג `for delete` על `client_requests`, ל-Role ‏`authenticated`, בתנאי `(select public.is_admin())` (ADR-12).
- **אין** Policy מסוג `delete` על `request_matches`. השורות שלה נמחקות דרך `ON DELETE CASCADE`, ש-Postgres מבצע בלי לבדוק RLS.
- **אין** Policy מסוג `insert` או `update` לסוכן. ‏`anon` ו-`submission_log` נשארים בלי שינוי.
- Migration שרק מוסיפה Policy, ולכן תואמת לאחור.
- **`scripts/check-rls.mjs`:** כבר בודק ש-`anon` לא יכול למחוק `client_requests` ו-`request_matches`. אחרי ההרצה מריצים `npm run check:rls` ומוודאים שהכול עדיין עובר.

## 3. Domain Service

### `lib/services/admin-requests.ts` (הרחבה)
- **`deleteRequest(id)`:** מוחק את השורה מ-`client_requests` עם ה-Client של ה-Session, כך שה-RLS חל, ומחזיר כמה שורות נמחקו (`.delete().eq("id", id).select("id")`). שגיאה ממסד הנתונים נזרקת הלאה.

## 4. Server Action

### `app/admin/(panel)/requests/actions.ts` (חדש)
- **`deleteRequestAction(id)`**, באותו מבנה של `deletePropertyAction`:
  1. `requireAdmin()`.
  2. בדיקה ש-`id` הוא UUID. אם לא, מוחזרת השגיאה "המחיקה נכשלה. נסו שוב."
  3. `deleteRequest(id)`. אם נזרקה שגיאה, היא נרשמת בלוג ומוחזרת ל-Client אותה הודעה.
  4. `redirect("/admin/requests?done=deleted")`. זה קורה גם כשנמחקו 0 שורות (סעיף 1).
- אחרי מחיקה מוצלחת לא נדרשת טעינת עמוד מלאה (ADR-13 נוגע רק לשינוי ב-Session). ה-`redirect` מציג את הרשימה המעודכנת, כי הנתונים בדפים לא נשמרים במטמון (ADR-4).

## 5. מסכים

### 5.1 רכיב משותף — `app/admin/(panel)/requests/delete-request-button.tsx` (חדש, Client)
- מבוסס על `DeletePropertyButton`: ‏`AlertDialog`, ‏`useTransition`, ושגיאה שמוצגת בתוך החלון.
- Props: ‏`id`, ‏`name`, ו-`variant`:
  - `"icon"`: כפתור אייקון אדום (`variant="icon" size="icon" tone="danger"`), עם `aria-label="מחיקת הפנייה של [שם]"`. משמש ברשימה.
  - `"button"`: כפתור Neutral קטן עם אייקון מחיקה אדום והטקסט "מחיקת פנייה". משמש במסך הפרטים.
- **אם בכמה מקומות יחזור אותו קוד של חלון אישור,** אפשר להוציא את החלק המשותף לרכיב `ConfirmDeleteDialog` ב-`components/`. עושים את זה רק אם זה מקצר את הקוד, ובלי לשנות את ההתנהגות של מחיקת נכס.

### 5.2 רשימת הפניות — `app/admin/(panel)/requests/page.tsx`
- עמודה שביעית "פעולות", עם `DeleteRequestButton variant="icon"`.
- **חשוב:** הקישור של שם הלקוח פרוש על כל השורה (`after:absolute after:inset-0`). לכן התא של הפעולות מקבל `relative z-10`, כדי שהלחיצה על האייקון תפתח את חלון האישור ולא את הפנייה.
- `min-w` של הטבלה גדל בהתאם (‏`min-w-[800px]`).
- Notice ‏"הפנייה נמחקה" כש-`done=deleted`, בתוך `Suspense`, באותו מבנה של `DoneNotice` בדף הנכסים.

### 5.3 פרטי פנייה — `app/admin/(panel)/requests/[id]/page.tsx`
- שורת הכותרת הופכת לשורה גמישה: ‏H1 ‏"פנייה של [שם]" בצד ימין, ו-`DeleteRequestButton variant="button"` בצד שמאל. במובייל הכפתור יורד מתחת לכותרת (`flex-wrap`).
- שאר המסך נשאר בלי שינוי.

### 5.4 Footer של אתר הלקוח — `components/layout/site-footer.tsx`
- במקום קישור הטקסט: `<Button asChild variant="secondary" size="sm">` עם `<Link href="/admin/properties">`, אייקון `user` והטקסט "כניסת סוכן".
- ‏`h-12` הופך ל-`h-14`. הכפתור נשאר בצד שמאל.
- מעדכנים את ההערה בקוד, כי הכפתור כבר לא "low-key".

## 6. בדיקות Unit (Vitest)

- אין כאן לוגיקה טהורה חדשה. ההתנהגות החדשה היא פעולה מול מסד הנתונים ומסכים, ולכן נבדקת בהרצה ובבדיקת ה-RLS (סעיף 8). הבדיקות הקיימות צריכות להמשיך לעבור.

## 7. פעולות משתמש

אין. לא נוסף שירות חיצוני, ולא נוספו משתנים ל-`.env`. כדי שאוכל לבדוק בדפדפן את המחיקה כסוכן, תצטרך להתחבר בחלון הדפדפן שבתוך אפליקציית Claude, כי אני לא מזין את הסיסמה שלך.

## 8. בדיקה עצמית בסוף הבנייה (מול ה-DoD)

| תנאי DoD | איך נבדק |
|---|---|
| ה-Migration הורצה על Development ונשמרה | `npm run db:push`, ואחר כך `npm run db:list`. |
| מחיקה מבקשת אישור, וביטול לא מוחק | בשני המקומות: לחיצה על מחיקה ← "ביטול" ← הפנייה עדיין קיימת. |
| אחרי מחיקה הפנייה נעלמה, וגם ההתאמות שלה | אני שולח פניית בדיקה בטופס (שם "בדיקת מחיקה") ומוחק אותה. היא לא מופיעה ברשימה, ומוצגת ההודעה "הפנייה נמחקה". בבדיקה עם המפתח הסודי מוודאים שאין יותר `request_matches` עם ה-`request_id` שלה. |
| הקישור האישי של פנייה שנמחקה מציג "הקישור אינו תקין" | פותחים את קישור `/r/[token]` של פניית הבדיקה אחרי המחיקה. |
| בלי התחברות אי אפשר למחוק | `npm run check:rls` עובר. |
| הסוכן עדיין לא יכול לערוך פנייה | ב-Migration יש רק Policy מסוג `delete`, ואין Policies מסוג `insert` או `update`. |
| כפתור "כניסת סוכן" בולט | בדיקה ויזואלית ב-Footer במחשב וברוחב 375px, ולחיצה עליו מעבירה לממשק הניהול. |
| תנאים כלליים | `npm run build`, ‏`npm run lint` ו-`npm test` עוברים. |

אני מוחק רק פניות בדיקה שיצרתי בעצמי בזמן הבדיקה. פניות אחרות לא נמחקות.

בסיום: סגירת השרת וסימון 🟡 ליד Milestone 4.5 ב-MILESTONES.md, בלי commit.

## 9. רשימת קבצים

**חדשים:**
- `supabase/migrations/<timestamp>_admin_delete_requests.sql`
- `app/admin/(panel)/requests/actions.ts`
- `app/admin/(panel)/requests/delete-request-button.tsx`

**משתנים:**
- `lib/services/admin-requests.ts`
- `app/admin/(panel)/requests/page.tsx`
- `app/admin/(panel)/requests/[id]/page.tsx`
- `components/layout/site-footer.tsx`
- `spec/MILESTONES.md` (סימון 🟡 בסוף הבנייה)
