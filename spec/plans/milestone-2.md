# תוכנית – Milestone 2: כניסת סוכן וניהול נכסים

> מבוסס על `MILESTONES.md` (Milestone 2), ‏PRD (F7, ‏F8, מקרי קצה), ‏DESIGN (§1.6–1.8, ‏§2) ו-ARCHITECTURE (§2.3–2.11, ‏ADR-1–4).
> לפי ADR-3: בכל מקום שכתוב `.env.local` – הכוונה ל-`.env`.

---

## 1. מטרה ותוצר

הסוכן נכנס במייל וסיסמה (ADR-9) לממשק הניהול (מול Supabase Development), רואה את רשימת הנכסים, מוסיף נכס עם תמונות, עורך, משנה סטטוס ומוחק. משתמש אחר נחסם. גישה בלי התחברות מעבירה למסך ההתחברות.

**מחוץ להיקף:** כל מה שקשור לפניות (M3–M4), ההפעלה של עדכונים על נכס חדש (M6 – ב-M2 `createProperty` לא מפעיל שום דבר ברקע), Production בפועל (רק יוצרים את הפרויקט).

---

## 2. פעולות משתמש (בהדרכה צעד אחר צעד, בזמן הבנייה)

הבנייה נעצרת בכל אחת מהנקודות האלה, מדריכה את המשתמש בשפה פשוטה, ומוודאת הצלחה לפני שממשיכים:

1. **Supabase Development:** יצירת Organization חינמי ← פרויקט Development ב-Region ‏Frankfurt. העתקת `Project URL`, ‏Publishable key, ‏Secret key ו-Connection string של **Session Pooler** (פורט 5432) ל-`.env` (המשתמש ממלא; Claude לא קורא את `.env`).
2. **Supabase Production:** Organization נפרד, תוכנית Pro, פרויקט ב-Frankfurt. **רק יצירה** – לא מחברים אליו כלום ולא מעתיקים פרטים.
3. ~~Google Cloud~~ – בוטל (ADR-8, ‏ADR-9). אין צורך בחשבון Google Cloud.
4. **Supabase Dev → Authentication:**
   - Sign In / Providers: כיבוי "Allow new users to sign up".
   - Users → Add user → Create new user: המייל של הסוכן + סיסמה + Auto Confirm User.
   - Integrations → Data API: ‏Enable Data API דלוק.
   - URL Configuration: ‏Site URL ‏`http://localhost:3000`; ‏Redirect URLs: ‏`http://localhost:3000/**` וכתובת ה-Preview של Vercel עם Wildcard.
   - Hooks → Before User Created → בחירת הפונקציה `public.hook_before_user_created` (אחרי שה-Migration רצה).
5. **SQL Editor (Dev):** ‏`insert into admin_users (email) values ('<gmail של הסוכן>');` – המשתמש מזין את הכתובת.
6. **Vercel:** הוספת משתני Dev (‏`NEXT_PUBLIC_SUPABASE_URL`, ‏`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, ‏`SUPABASE_SECRET_KEY`) לסביבת **Preview** בלבד.

לא נוספים משתנים חדשים – כולם כבר מתועדים ב-`.env.example`.

---

## 3. תלויות חדשות

| חבילה | סוג | למה |
|---|---|---|
| `@supabase/supabase-js`, ‏`@supabase/ssr` | dependency | Clients לשרת ולדפדפן, Session ב-Cookies |
| `server-only` | dependency | סימון קבצים שאסור שיגיעו לדפדפן |
| `supabase` (CLI) | devDependency | `migration new`, ‏`db push` מול הענן, בלי Docker |

`npx supabase init` יוצר `supabase/config.toml` (נשמר ב-Git). `supabase/.temp/` כבר ב-`.gitignore`.

סקריפטים חדשים ב-`package.json`:
- `db:push` – סקריפט קטן ב-`scripts/db-push.mjs` שרץ עם `node --env-file=.env` ומפעיל `supabase db push --db-url "$SUPABASE_DB_URL"` (Dev בלבד; עובד גם ב-Windows).
- `db:seed` – אותה פקודה עם `--include-seed`.
- `check:rls` – ‏`node --env-file=.env scripts/check-rls.mjs`.

---

## 4. מסד נתונים – Migrations (`supabase/migrations/`)

נוצרות עם `npx supabase migration new <name>`. מורצות **רק** על Development.

### 4.1 `<ts>_properties.sql`
- Enums: ‏`property_condition` (`new`, `renovated`, `needs_renovation`), ‏`property_status` (`available`, `unavailable`).
- טבלה `properties` לפי ARCHITECTURE §2.4, כולל `CHECK (price > 0)`, ‏`CHECK (rooms > 0)`, ברירות מחדל `false` למאפיינים, `created_at`/`updated_at default now()`.
- Trigger שמעדכן `updated_at` בכל `UPDATE`.
- אינדקסים: `(status, city)`, ‏`(price)`.
- טבלה `property_images`: ‏FK עם `ON DELETE CASCADE`, ‏`sort_order smallint`, ‏Partial Unique Index על `(property_id) WHERE is_primary`.
- View ‏`available_areas` (`select distinct city, neighborhood from properties where status='available'`), עם `security_invoker = true`.

### 4.2 `<ts>_admin_auth.sql`
- טבלה `admin_users (email text primary key)`, RLS מופעל **בלי** Policies (אף אחד מהדפדפן לא קורא אותה).
- פונקציה `public.is_admin()` – ‏`security definer`, ‏`stable`, מחזירה האם `lower(auth.jwt()->>'email')` קיים ב-`admin_users`. ‏`search_path` קבוע.
- פונקציית Auth Hook ‏`public.hook_before_user_created(event jsonb) returns jsonb`: אם המייל של המשתמש החדש לא ב-`admin_users` – מחזירה `{"error": {"http_code": 403, "message": "..."}}`; אחרת `{}`. ‏`grant execute` ל-`supabase_auth_admin`, ‏`grant select on admin_users` ל-`supabase_auth_admin`, ו-`revoke` מ-`anon`, ‏`authenticated`, ‏`public`.

### 4.3 `<ts>_rls_policies.sql`
- `properties`, ‏`property_images`: RLS מופעל. Policy אחת `for all to authenticated using (is_admin()) with check (is_admin())`. **אין** Policy ל-`anon`.
- (טבלאות הלקוח מגיעות ב-M3 עם RLS משלהן.)

### 4.4 `<ts>_storage.sql`
- `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('property-images', 'property-images', true, 5242880, '{image/jpeg,image/png,image/webp}')` – כך ה-Bucket עצמו אוכף סוג וגודל (שכבת השרת).
- Policies על `storage.objects` ל-`authenticated` עם `bucket_id = 'property-images' and is_admin()`: ‏insert, ‏update, ‏delete. קריאה ציבורית דרך ה-Bucket הציבורי.

### 4.5 `supabase/seed.sql`
- כ-8 נכסים לדוגמה בעברית (2–3 ערים, כמה שכונות, שני הסטטוסים, חלק עם נתוני השקעה ותיאור עשיר) – בהתאם לדוגמאות ב-mockups. בלי תמונות (הממשק מציג Placeholder).
- **לא** מכניס רשומה ל-`admin_users`. מורץ **רק** על Dev (`npm run db:seed`).

---

## 5. קוד – קבצים ליצור/לשנות

> לפני הכתיבה: לקרוא ב-`node_modules/next/dist/docs/` את `authentication-with-cache-components.md`, ‏`proxy.md`, ‏`forms.md`, ‏`server-actions.md`, ‏`cookies.md`, ‏`redirect.md`, ‏`images.md` (ADR-4). עם `cacheComponents`, כל קריאה ל-`cookies()` חייבת להיות בתוך `<Suspense>`.

### 5.1 Integrations
| קובץ | תוכן |
|---|---|
| `lib/integrations/supabase/server.ts` | `server-only`. ‏`createClient()` עם `createServerClient` של `@supabase/ssr` + `cookies()` (Publishable key; עובד עם ה-Session של הסוכן ו-RLS). |
| `lib/integrations/supabase/browser.ts` | `createBrowserClient` – משמש רק להעלאת תמונות מהדפדפן. |
| `lib/integrations/supabase/proxy.ts` | `updateSession(request)` – רענון ה-Session בלבד. |
| `proxy.ts` (שורש) | קורא ל-`updateSession`. ‏`matcher`: ‏`/admin/:path*`. לא שכבת הגנה. |
| `lib/database.types.ts` | טיפוסים ידניים מינימליים לטבלאות (או `supabase gen types --db-url` אם עובד בלי Docker). |

### 5.2 Domain services
| קובץ | תוכן |
|---|---|
| `lib/services/admin.ts` | `server-only`. ‏`requireAdmin()`: ‏`getUser()`; אין משתמש → `redirect('/admin/login')`; משתמש לא ב-`admin_users` (‏`rpc('is_admin')`) → `signOut()` ו-`redirect('/admin/login?error=unauthorized')`. מחזיר `{ email }`. |
| `lib/services/properties.ts` | `server-only`. ‏`listProperties()`, ‏`getProperty(id)` (עם תמונות לפי `sort_order`), ‏`createProperty`, ‏`updateProperty`, ‏`deleteProperty` (מוחק קבצים מה-Bucket לפי הנתיבים ב-`property_images`, ואז את הרשומה), ‏`syncImages(propertyId, images, primaryPath)`. |
| `lib/validation/property.ts` | סכמת Zod משותפת לשרת ולדפדפן: שדות F8, חובה (כותרת, עיר, שכונה, מחיר > 0, חדרים > 0 בקפיצות 0.5, סטטוס), רשות (כתובת, שטח, קומה, מאפיינים, מצב, שכר דירה, תשואה 0–99.99, תיאור). המרה מ-`FormData` (מחרוזת ריקה → `null`). הודעות שגיאה בעברית. |
| `lib/validation/images.ts` | קבועים ובדיקות: `MAX_IMAGES = 10`, ‏`MAX_IMAGE_BYTES = 5MB`, סוגים מותרים; `validateImageFile(file)`, ‏`validateImageList(paths, primary)`; ‏`buildImagePath(propertyId, ext)` → ‏`properties/<propertyId>/<uuid>.<ext>`; בדיקה שנתיב שייך לנכס. |
| `lib/images.ts` | `publicImageUrl(path)` מתוך `NEXT_PUBLIC_SUPABASE_URL`. |

### 5.3 Server Actions (`app/admin/(panel)/properties/actions.ts`)
- `createProperty(prev, formData)`, ‏`updateProperty(prev, formData)`, ‏`deleteProperty(id)`.
- כל אחת: `requireAdmin()` ← Zod ← קריאה ל-Service ← `revalidatePath` / `redirect('/admin/properties?done=created|updated|deleted')`.
- מחזירות `{ fieldErrors, formError }` לתצוגה ליד השדות; הנתונים לא נשמרים כשיש שגיאה.
- `logout()` (ב-`app/admin/actions.ts`): ‏`signOut()` ← `redirect('/admin/login')`.

### 5.4 זרימת העלאת תמונות (ARCHITECTURE §2.11)
1. בטופס "הוספה": הדפדפן יוצר מראש `propertyId` (‏`crypto.randomUUID()`), שנשלח כשדה מוסתר ומשמש גם כ-id של הנכס.
2. בחירת קבצים (גרירה או לחיצה): בדיקה בדפדפן (סוג, גודל, סה"כ ≤ 10) → הודעת שגיאה, והקובץ לא מתווסף. Preview מקומי.
3. ב"שמירה": העלאת הקבצים החדשים ישירות ל-Storage (Browser client + Session הסוכן + Storage Policies; ה-Bucket דוחה סוג/גודל לא תקינים) → שליחת ה-Action עם השדות + רשימת הנתיבים + הנתיב הראשי.
4. השרת מוודא: ≤ 10, כל נתיב בתיקיית הנכס, תמונה ראשית אחת (ברירת מחדל: הראשונה). שומר `property_images`; תמונות שהוסרו בעריכה – נמחקות מהטבלה ומה-Bucket.
5. אם ה-Action נכשל אחרי העלאה – הדפדפן מוחק את הקבצים שהעלה עכשיו.

החלטה זו (id מהדפדפן + העלאה לפני שמירה) תתועד כ-ADR.

### 5.5 מסכים ורכיבים
| קובץ | תוכן לפי DESIGN |
|---|---|
| `app/admin/login/page.tsx` | §1.6: רקע Mist + שני עיגולים כתומים, כרטיס Floating, אייקון בית, "כניסה לממשק הניהול", "הכניסה מותרת לסוכן בלבד", שדות "כתובת מייל" ו"סיסמה" (LTR) וכפתור ראשי ברוחב מלא "כניסה". בלי Header/תפריט. שגיאה לפי `?error=` (מ-`requireAdmin`): ‏`unauthorized` → "אין לך הרשאת גישה לממשק הניהול"; ‏`failed` → "ההתחברות נכשלה. נסו שוב." |
| `app/admin/login/actions.ts` | `signIn(prev, formData)`: ולידציה (Zod) ← `signInWithPassword` ← בדיקת `is_admin()` (לא מורשה ← signOut + "אין לך הרשאת גישה לממשק הניהול") ← `redirect("/admin/properties")`. שגיאת פרטים ← "המייל או הסיסמה שגויים". הטופס ב-`login-form.tsx` (`useActionState`). |
| `app/admin/(panel)/layout.tsx` | עוטף בבדיקת `requireAdmin()` בתוך `<Suspense>`; ה-Header מקבל את המייל. |
| `components/layout/admin-header.tsx` | §1.7: Avatar עגול (גבול כתום, רקע Orange 50, האות הראשונה), המייל (LTR), קישור "התנתקות" עם אייקון logout (טופס ← `logout`). |
| `app/admin/(panel)/properties/page.tsx` | §1.7: כותרת "נכסים" + כפתור Primary קטן "+ הוספת נכס". טבלה ב-Panel: כותרת, אזור ("עיר • שכונה"), מחיר (`formatPrice`), חדרים, סטטוס (Badge "זמין"/"לא זמין"), פעולות (Icon buttons עריכה, ומחיקה באדום). Notice אחרי פעולה מוצלחת. מצב ריק: "אין עדיין נכסים במאגר". במובייל: גלילה אופקית של הטבלה. |
| `app/admin/(panel)/properties/delete-property-button.tsx` | Client. כפתור מחיקה ← חלון אישור ("למחוק את הנכס …? הפעולה אינה הפיכה" / "מחיקה" / "ביטול") ← `deleteProperty`. |
| `components/ui/alert-dialog.tsx` | רכיב אישור מבוסס `radix-ui` AlertDialog, בעיצוב Panel. |
| `app/admin/(panel)/properties/new/page.tsx` | "הוספת נכס". |
| `app/admin/(panel)/properties/[id]/page.tsx` | "עריכת נכס", טופס מלא מראש; id לא קיים → `notFound()`. |
| `app/admin/(panel)/properties/property-form.tsx` | Client, ‏`useActionState`. §1.8: שורת כותרת עם "ביטול" (Neutral, חזרה לרשימה) ו"שמירה" (Primary, מושבת בזמן שמירה/העלאה). Panel ימני: כותרת\*, כתובת / עיר\*, שכונה\* / מחיר (₪)\*, חדרים\*, שטח (מ"ר), קומה / "מאפיינים" Checkboxes / מצב הנכס (Select: חדש, משופץ, דרוש שיפוץ), שכר דירה צפוי (₪), תשואה משוערת (%) / "תיאור הנכס והסביבה". Panel שמאלי צר: "סטטוס\*" Radio "זמין"/"לא זמין"; "תמונות (עד 10)". במובייל: Panels זה מתחת לזה. |
| `app/admin/(panel)/properties/image-uploader.tsx` | Client. אזור העלאה מקווקו כתום, "גררו תמונות או לחצו להעלאה"; Grid של 3 בשורה; תמונה ראשית במסגרת כתומה + Badge "ראשית"; לחיצה על תמונה → הופכת לראשית; כפתור הסרה לכל תמונה. |
| `components/icons.tsx` | ללא שינוי (סמל Google לא נדרש – ADR-8). |
| `next.config.ts` | `images.remotePatterns` לדומיין Supabase Storage (`/storage/v1/object/public/property-images/**`). |
| `app/dev/components` | ללא שינוי (אם נוסף AlertDialog – להציג גם שם). |

---

## 6. בדיקות

**Unit (Vitest):**
- `lib/validation/property.test.ts` – שדות חובה חסרים, מחיר 0/שלילי, חדרים 3.5 תקין / 3.3 לא תקין, תשואה מחוץ לטווח, המרת שדות ריקים ל-`null`, מאפיינים מ-Checkbox.
- `lib/validation/images.test.ts` – סוג לא נתמך, קובץ גדול מ-5MB, 11 תמונות, נתיב של נכס אחר, ברירת מחדל לתמונה ראשית.

**בדיקת RLS (`scripts/check-rls.mjs`):** עם ה-Publishable key בלבד ובלי Session: ‏select מ-`properties`, ‏`property_images`, ‏`admin_users` מחזיר 0 שורות; insert/update/delete ל-`properties` נכשל; העלאה ל-Bucket נכשלת. הסקריפט מדפיס "עבר/נכשל" לכל בדיקה.

**ידני בדפדפן (built-in browser מול localhost):** התחברות, חסימת חשבון אחר (בהדרכת המשתמש – Claude לא מזין סיסמאות), Redirect מ-`/admin/properties` בלי Session, הוספה/עריכה/מחיקה, שגיאות טופס ותמונות, 375px.

`npm run build`, ‏`npm run lint`, ‏`npm test` – עוברים.

---

## 7. סדר הבנייה

1. התקנת תלויות, `supabase init`, סקריפטים ב-`package.json`.
2. **עצירה:** פעולות משתמש 1–2 (פרויקטי Supabase, מילוי `.env`).
3. Migrations + Seed ← `db:push` / `db:seed` על Dev ← אימות שהטבלאות וה-Seed קיימים.
4. **עצירה:** פעולות משתמש 4–5 (סגירת הרשמה, חשבון סוכן, Data API, Hook, ‏`admin_users`).
5. Supabase clients, ‏`proxy.ts`, ‏`requireAdmin`, מסך התחברות, Callback, Header עם התנתקות.
6. רשימת נכסים + מחיקה עם אישור.
7. טופס נכס (הוספה/עריכה) + Zod + העלאת תמונות.
8. Unit tests + `check:rls`.
9. **עצירה:** פעולת משתמש 6 (משתני Preview ב-Vercel).
10. בדיקה מלאה מול ה-DoD, תיקונים, ADRs ב-ARCHITECTURE.md, סימון 🟡 ב-MILESTONES.md.

---

## 8. Definition of Done – איך כל תנאי ייבדק

| תנאי | בדיקה |
|---|---|
| שני פרויקטי Supabase; מקומי ו-Preview מחוברים ל-Dev בלבד | אישור המשתמש + Project URL ב-Vercel Preview הוא של Dev |
| Migrations הורצו על Dev ונשמרו ב-Git | `db:push` מצליח; ‏`supabase migration list --db-url` מציג את כולן |
| התחברות הסוכן ← "ניהול נכסים" | בדיקה ידנית |
| חשבון אחר נחסם עם "אין לך הרשאת גישה לממשק הניהול" | בדיקה: כניסה עם משתמש שאינו ב-`admin_users` (סקריפט מול Dev) ← נחסם |
| `/admin/...` בלי התחברות ← מסך התחברות | פתיחה בחלון בלי Session |
| הוספה, עריכה ומחיקה; כל שדות F8 + תמונות + ראשית נשמרים | בדיקה ידנית + בדיקה בטבלאות וב-Bucket שהקבצים נמחקו |
| שגיאות: שדה חובה, פורמט, גודל, יותר מ-10 – הודעה ולא נשמר | Unit tests + בדיקה ידנית |
| אין קריאה/שינוי בלי התחברות | `npm run check:rls` |
| Seed נטען ומוצג ברשימה | `db:seed` + רשימת הנכסים |
| תנאים כלליים (build/lint/test, עיצוב, 375px, מקרי קצה) | הרצה + צילומי מסך מול mockups |

**הערה:** תנאי "הקוד ב-GitHub וה-Preview ב-Vercel עובד" מתקיים רק בשלב הדחיפה (באישור המשתמש), לא במהלך הבנייה.

---

## 9. ADRs שיתועדו בזמן הבנייה

- זרימת העלאת התמונות: id של נכס חדש נוצר בדפדפן, והקבצים עולים ל-Storage לפני שמירת הנכס.
- בדיקת RLS כסקריפט נפרד (`check:rls`) ולא כחלק מ-`npm test`, כי היא דורשת חיבור לענן.
- כל החלטה נוספת שתתקבל בזמן הבנייה (למשל טיפוסי DB ידניים מול `gen types`).
