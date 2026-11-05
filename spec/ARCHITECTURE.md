# ARCHITECTURE – מערכת התאמת נכסים ללקוחות עבור סוכן נדל"ן

> המסמך הזה מתרגם את דרישות [PRD.md](PRD.md) לתכנון טכני. הוא לא מוסיף פיצ'רים ולא משנה דרישות. כל ההפניות מהסוג F1–F9 מתייחסות לסעיפים ב-PRD.
> המחקר עודכן לנובמבר 2026. מחירים ומגבלות של שירותים חיצוניים עשויים להשתנות, ולכן כדאי לאמת אותם בדפי התמחור הרשמיים לפני ההתקשרות.

---

## 1. Technology Stack שנבחר

### 1.1 טבלת רכיבים

| תחום | טכנולוגיה | תפקיד |
|---|---|---|
| **Framework (Frontend + Backend)** | **Next.js 16** (App Router), **TypeScript** | אפליקציה אחת שכוללת את ממשק הלקוח, את ממשק הניהול ואת לוגיקת השרת (Server Components, Server Actions, Route Handlers). |
| **UI** | **Tailwind CSS** ו-**shadcn/ui** (מבוסס Radix UI) | אתר רספונסיבי (Desktop, עם התאמה מלאה למובייל) ותמיכה מלאה ב-RTL. רכיבי טפסים, דיאלוגים וטבלאות נגישים. |
| **ולידציה** | **Zod** | סכמה אחת לבדיקת קלט, שמשמשת גם בצד הלקוח וגם בצד השרת. |
| **Database** | **Supabase Postgres** | מסד נתונים רלציוני: נכסים, פניות, התאמות ותור מיילים. |
| **Authentication** | **Supabase Auth** עם **מייל וסיסמה** | חשבון סוכן יחיד שנוצר ידנית, וההרשמה העצמית סגורה. הסיסמה נשמרת מוצפנת ב-Supabase Auth, לא באפליקציה. |
| **אחסון קבצים** | **Supabase Storage** | תמונות הנכסים. |
| **גישה לנתונים** | `@supabase/supabase-js` ו-`@supabase/ssr` | Clients לשרת ולדפדפן, וניהול ה-Session של הסוכן ב-Cookies. |
| **Database Migrations** | **Supabase CLI** (npm package `supabase`, devDependency) | קבצי SQL בתיקייה `supabase/migrations/`. המיגרציות מורצות מול הענן בלבד, בלי Docker. |
| **AI (הבנת שפה טבעית)** | **Claude API** של Anthropic, מודל `claude-opus-5-5`, דרך `@anthropic-ai/sdk` | דירוג הנכסים לפי הטקסט החופשי של הלקוח, וניסוח נימוק בעברית לכל נכס. |
| **שליחת מיילים** | **Resend** ו-**React Email** | מיילים טרנזקציוניים בעברית ובכיוון RTL: תוצאות פנייה ועדכון על נכס חדש. |
| **Hosting ו-Deployment** | **Vercel** (תוכנית Pro) | אחסון האפליקציה, פריסה אוטומטית מ-GitHub, Cron לניסיונות חוזרים של מיילים. |
| **ניהול קוד** | **GitHub** | Repository יחיד. ענף `main` הוא ה-Production. |

### 1.2 נימוקים להחלטות המרכזיות

- **Next.js כאפליקציה אחת.** למוצר יש שני ממשקים קטנים (לקוח וסוכן) ולוגיקת שרת מצומצמת. Next.js נותן Frontend ו-Backend בקוד אחד, בשפה אחת ובפריסה אחת, בלי צורך בשרת API נפרד. זה ה-Framework הנפוץ ביותר ל-React, יש לו תיעוד מקיף, ו-Vercel תומכת בו באופן מובנה, מה שהופך אותו לבחירה הטבעית לפיתוח בעזרת AI. החלופות שנבחנו היו Remix/React Router ו-SvelteKit, שהן טובות אבל עם אקוסיסטם ותמיכה מצומצמים יותר.
- **Supabase.** המוצר דורש מסד נתונים רלציוני (נכסים, פניות וקשרים ביניהם), הזדהות ואחסון תמונות. Supabase נותן את שלושתם בשירות אחד שמבוסס על PostgreSQL, כולל Row Level Security (RLS). החלופות שנבחנו היו Neon יחד עם Auth.js ו-Vercel Blob, אבל זה פיצול לשלושה שירותים ויותר קוד הזדהות לתחזק. Firebase נפסל, כי הוא NoSQL ואין הצדקה ל-NoSQL במוצר הזה.
- **Claude API להבנת שפה טבעית.** נדרשת קריאה אחת לכל פנייה: המערכת שולחת את הטקסט של הלקוח ואת רשימת הנכסים המועמדים, ומקבלת בחזרה דירוג ונימוקים. היא משתמשת ב-Structured Outputs כדי שהתשובה תחזור כ-JSON מובנה. אין צורך ב-Embeddings או ב-Vector Database, כי הסינון הקשיח ב-SQL מצמצם את המועמדים למספר קטן, והמאגר של סוכן יחיד קטן ממילא. המודל `claude-opus-5-5` מטפל היטב בעברית ובנימוק קפדני שמבוסס על הנתונים בלבד. בקריאה הזו הוא מורץ ב-`effort: "low"`, ולכן העלות של כל פנייה נמוכה (סדר גודל של סנטים בודדים).
- **Resend.** זה שירות Email API פשוט עם SDK רשמי ל-TypeScript, אינטגרציה טבעית עם React Email ו-Batch API ששולח עד 100 מיילים בקריאה אחת. החלופות שנבחנו היו Postmark ו-Amazon SES. ‏Postmark טוב אבל יקר יותר. SES זול, אבל ההגדרה והתפעול שלו מורכבים יותר.
- **Vercel Pro.** תוכנית Hobby מיועדת **לשימוש לא מסחרי בלבד**, ומערכת של סוכן נדל"ן היא שימוש מסחרי. בנוסף, ב-Hobby אפשר להריץ Cron רק פעם ביום, בעוד שב-Pro אפשר כל דקה. מנגנון הניסיונות החוזרים לשליחת מיילים צריך תדירות גבוהה יותר.

### 1.3 עלויות משוערות (חודשי)

| שירות | תוכנית | עלות משוערת |
|---|---|---|
| Vercel | Pro (משתמש אחד) | כ-$20 |
| Supabase – Production | Pro (ב-Organization נפרד) | כ-$25. כולל קרדיט Compute לפרויקט אחד. |
| Supabase – Development | Free (ב-Organization נפרד) | $0 |
| Resend | Free: 3,000 מיילים בחודש ועד 100 ביום. ‏Pro: כ-$20 ל-50,000 מיילים | $0, ואחר כך כ-$20 כשהנפח גדל |
| Claude API | לפי שימוש | סנטים בודדים לכל פנייה |
| דומיין לשליחת מיילים | – | כ-$10–15 לשנה |

### 1.4 סיכונים ומגבלות

| סיכון | משמעות | טיפול |
|---|---|---|
| **השהיית פרויקט Free ב-Supabase** | פרויקט בתוכנית Free מושהה אחרי שבוע בלי פעילות. אם זה קורה ל-Production, האתר מפסיק לעבוד. | פרויקט ה-Production נמצא בתוכנית Pro, שבה אין השהיה. אם פרויקט ה-Development מושהה, מפעילים אותו מחדש בלחיצה ב-Dashboard. הנתונים לא נמחקים. |
| **מכסת המיילים של Resend Free** | בתוכנית Free אפשר לשלוח עד 100 מיילים ביום. נכס חדש שתואם להרבה פניות יכול לחרוג מהמכסה. | המיילים נשמרים בתור (`email_outbox`) ונשלחים שוב אוטומטית. כשהנפח גדל, משדרגים ל-Resend Pro. |
| **דומיין מאומת** | Resend שולח רק מדומיין שאומת ברשומות DNS. | העסק צריך דומיין (למשל `example.co.il`) ולהוסיף לו רשומות SPF ו-DKIM. |
| **זמינות ה-AI** | ה-API של Claude עלול להיות איטי, להחזיר שגיאה או לסרב לבקשה. | Timeout, ניסיון חוזר אחד ושימוש בפרמטר `fallbacks: "default"`. אם כל אלה נכשלים, המערכת חוזרת לדירוג ברירת מחדל (מהחדש לישן) עם נימוק בסיסי, כפי שמוגדר במקרי הקצה ב-PRD. |
| **שימוש לרעה בטופס הציבורי** | כל שליחה של הטופס עולה קריאה ל-AI ומייל. | Rate Limiting לפי כתובת IP בצד השרת (ראו סעיף 2.8). |
| **שינויים מתמשכים בשירותים** | התמחור, המגבלות וה-APIs של כל השירותים משתנים מדי פעם. | גרסאות התלויות ננעלות ב-`package-lock.json`. את מגבלות התוכניות כדאי לבדוק בדפים הרשמיים אחת לתקופה. |

---

## 2. ארכיטקטורת המערכת

### 2.1 מבנה כללי

```
                ┌──────────────────────────── Vercel ────────────────────────────┐
 לקוח (דפדפן) ─▶│  Next.js App                                                    │
                │   ├─ Public UI (טופס, דף אישי)        ┐                          │
 סוכן (מחשב) ──▶│   ├─ Admin UI (נכסים, פניות)          ├─ Server Actions / Routes │
                │   ├─ /admin/login (מייל + סיסמה)      │                          │
                │   └─ /api/cron/email-outbox (Cron)    ┘                          │
                │            │ Domain Services: matching, requests, properties,    │
                │            │ notifications, email                                │
                └────────────┼─────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼──────────────────────┬─────────────────────┐
        ▼                    ▼                      ▼                     ▼
  Supabase Postgres    Supabase Auth          Supabase Storage      Claude API / Resend
  (נתונים + RLS)        (מייל + סיסמה)         (תמונות נכסים)        (AI / מיילים)
```

כל הקריאות לשירותים חיצוניים (Claude ו-Resend) והקריאות שמשתמשות במפתח הסודי של Supabase מתבצעות **בשרת בלבד**. הדפדפן לא מקבל אף מפתח סודי.

### 2.2 חלוקה לשכבות ול-Modules

| שכבה | אחריות | תוכן עיקרי |
|---|---|---|
| **UI** (`app/`) | דפים ורכיבים בעברית ובכיוון RTL | Server Components להצגה, ו-Client Components רק למקומות שצריכים אינטראקציה, כמו טפסים והעלאת תמונות. |
| **Actions / Routes** | נקודות כניסה לשרת | Server Actions לטפסים, ו-Route Handlers ל-Cron. הן אחראיות רק על ולידציה בעזרת Zod, הרשאות וקריאה ל-Domain Services. |
| **Domain Services** (`lib/services/`) | הלוגיקה העסקית | ראו טבלת ה-Modules בהמשך. |
| **Integrations** (`lib/integrations/`) | עטיפה של שירותים חיצוניים | `supabase` (Clients), ‏`claude` (קריאה למודל), ‏`resend` (שליחה). |
| **Data** (`supabase/migrations/`) | סכמה, RLS ו-Storage policies | קבצי SQL שמנוהלים ב-Git. |

**Domain Modules:**

| Module | אחריות | דרישות PRD |
|---|---|---|
| `requests` | יצירה ועדכון של פנייה, הנפקת טוקן לקישור האישי, הפעלה והפסקה של עדכונים | F1, ‏F4, ‏F5 |
| `matching` | סינון ב-SQL, דירוג ונימוק בעזרת Claude, ודירוג ברירת מחדל כשה-AI לא זמין | F2, ‏F3 |
| `properties` | פעולות CRUD על נכסים ותמונות, ורשימת אזורים | F8 |
| `notifications` | איתור פניות פעילות שתואמות לנכס חדש ויצירת רשומות בתור המיילים | F6 |
| `email` | בניית תבניות (React Email), שליחה דרך Resend וניסיונות חוזרים | F4, ‏F6 |
| `admin` | בדיקת הרשאת סוכן, שאילתות לרשימת הפניות ולפרטי פנייה, ומחיקת פנייה | F7, ‏F9 |

### 2.3 מבנה ה-Frontend (Routes)

| Route | מי משתמש | תוכן |
|---|---|---|
| `/` | לקוח | טופס הפנייה (F1). |
| `/r/[token]` | לקוח | **הדף האישי.** מיד אחרי השליחה הוא משמש גם כמסך התוצאות (F3), ומציג עד 3 נכסים עם נימוקים. בהמשך הוא מציג גם את הקריטריונים, את הנכסים שנשלחו בעדכונים ואת מצב העדכונים (F5). |
| `/r/[token]/edit` | לקוח | עדכון הקריטריונים. |
| `/r/[token]/properties/[id]` | לקוח | פרטי נכס מלאים: כל התמונות והתיאור. הנכס מוצג רק אם הוא מקושר לפנייה הזו. |
| `/r/[token]/unsubscribe` | לקוח | מסך אישור לפני הפסקת עדכונים. הפעולה עצמה מתבצעת ב-POST ולא ב-GET, כדי שסורקי קישורים בתוכנות מייל לא יפסיקו את העדכונים בטעות. |
| `/admin/login` | סוכן | שדות מייל וסיסמה וכפתור "כניסה". |
| `/admin/properties` | סוכן | רשימת נכסים, הוספה, עריכה ומחיקה (F8). |
| `/admin/properties/new`, `/admin/properties/[id]` | סוכן | טופס נכס והעלאת תמונות. |
| `/admin/requests`, `/admin/requests/[id]` | סוכן | רשימת פניות ופרטי פנייה. מלבד מחיקת פנייה, לקריאה בלבד (F9). |

**עקרונות UI:**
- `<html lang="he" dir="rtl">` מוגדר בכל האפליקציה, ובעיצוב משתמשים ב-Logical Properties של Tailwind (`ms-`, `me-`, `ps-`, `pe-`).
- הטפסים בנויים כ-Server Actions עם ולידציה בעזרת Zod. הודעות השגיאה בעברית ומוצגות ליד השדה הרלוונטי.
- בזמן חישוב ההתאמות מוצג מצב טעינה (`useFormStatus`), וכפתור השליחה מושבת.
- כל נתיבי `/admin/*` מוגנים. הבדיקה מתבצעת בשרת בכל דף ובכל Action (ראו סעיף 2.7).

### 2.4 Data Model

כל הטבלאות נמצאות בסכמה `public`, ו-RLS מופעל על כולן.

**`properties`** – נכסים (F8)

| שדה | סוג | הערות |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | חובה |
| `city`, `neighborhood` | text | חובה |
| `address` | text | רשות |
| `price` | integer | חובה, ‏> 0 |
| `rooms` | numeric(3,1) | חובה. תומך בחצאי חדרים. |
| `area_sqm`, `floor` | integer | רשות |
| `has_parking`, `has_elevator`, `has_balcony`, `has_safe_room`, `has_storage` | boolean | ברירת מחדל: false |
| `condition` | enum `property_condition` (`new`, `renovated`, `needs_renovation`) | רשות |
| `description` | text | תיאור חופשי |
| `expected_rent`, `estimated_yield` | integer, numeric(4,2) | רשות |
| `status` | enum `property_status` (`available`, `unavailable`) | חובה |
| `created_at`, `updated_at` | timestamptz | |

אינדקסים: `(status, city)` ו-`(price)`.

**`property_images`** – תמונות

| שדה | סוג | הערות |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → `properties` | `ON DELETE CASCADE` |
| `storage_path` | text | הנתיב בתוך ה-Bucket |
| `is_primary` | boolean | לכל נכס יש לכל היותר תמונה ראשית אחת (Partial Unique Index). |
| `sort_order` | smallint | |

מגבלה של עד 10 תמונות לנכס, שנאכפת בשרת.

**`client_requests`** – פניות (F1, ‏F4, ‏F5)

| שדה | סוג | הערות |
|---|---|---|
| `id` | uuid PK | |
| `submission_id` | uuid UNIQUE | מזהה שנוצר בכל טעינה של הטופס. מונע יצירה של פנייה כפולה בלחיצה חוזרת. |
| `name`, `email` | text | חובה |
| `phone` | text | רשות |
| `city` | text | חובה |
| `neighborhoods` | text[] | שכונה אחת או יותר |
| `max_budget` | integer | ‏> 0 |
| `rooms_min`, `rooms_max` | numeric(3,1) | CHECK: ‏`rooms_min <= rooms_max` |
| `preferences_text` | text | הטקסט החופשי |
| `access_token_hash` | text UNIQUE | Hash מסוג SHA-256 של הטוקן שבקישור האישי. הטוקן עצמו לא נשמר. |
| `notifications_active` | boolean | ברירת מחדל: true |
| `created_at`, `updated_at` | timestamptz | |

**`request_matches`** – הנכסים שהוצגו או נשלחו ללקוח (F3, ‏F5, ‏F6, ‏F9)

| שדה | סוג | הערות |
|---|---|---|
| `id` | uuid PK | |
| `request_id` | uuid FK → `client_requests` | `ON DELETE CASCADE` |
| `property_id` | uuid FK → `properties`, nullable | `ON DELETE SET NULL`, כך שנכס שנמחק מוצג אצל הסוכן כ"נכס שנמחק". |
| `property_title_snapshot` | text | כותרת הנכס בזמן ההתאמה. משמשת לתצוגה אחרי שהנכס נמחק. |
| `source` | enum (`initial`, `notification`) | התאמה ראשונית מהפנייה, או התאמה שנשלחה בעדכון. |
| `rank` | smallint, nullable | מיקום הנכס (1–3) בהתאמה הראשונית. |
| `reason` | text, nullable | הנימוק של ה-AI. ריק בהתאמות מעדכונים, לפי הדרישה ב-F6. |
| `is_current` | boolean | כשהלקוח מעדכן קריטריונים, ההתאמות הראשוניות הקודמות מסומנות `false` ונוצר סט חדש. |
| `created_at` | timestamptz | |

אינדקס ייחודי חלקי על `(request_id, property_id) WHERE source = 'notification'` מבטיח שאותו נכס לא יישלח פעמיים לאותה פנייה.

**`email_outbox`** – תור המיילים (F4, ‏F6)

| שדה | סוג | הערות |
|---|---|---|
| `id` | uuid PK | |
| `request_id` | uuid FK → `client_requests` | `ON DELETE CASCADE` |
| `kind` | enum (`results`, `new_property`) | |
| `property_id` | uuid, nullable | רלוונטי למיילים מסוג `new_property`. |
| `status` | enum (`pending`, `sent`, `failed`) | |
| `attempts` | smallint | מספר ניסיונות השליחה, עד 5. |
| `last_error` | text | |
| `created_at`, `sent_at` | timestamptz | |

**`submission_log`** – Rate Limiting לטופס הציבורי

| שדה | סוג | הערות |
|---|---|---|
| `ip_hash` | text | Hash של כתובת ה-IP. כתובת ה-IP עצמה לא נשמרת. |
| `created_at` | timestamptz | רשומות ישנות מ-24 שעות נמחקות על ידי ה-Cron. |

**`admin_users`** – רשימת הסוכנים המורשים

| שדה | סוג | הערות |
|---|---|---|
| `email` | text PK | כתובת המייל של הסוכן. מוזנת ידנית בכל סביבה (ראו סעיף 2.10). |

**View ‏`available_areas`** – ערים ושכונות ייחודיות של נכסים בסטטוס `available`. מהן נבנית הרשימה הסגורה בטופס.

**Storage:** Bucket ציבורי לקריאה בשם `property-images`. הקריאה ציבורית כדי שהתמונות יוצגו גם במיילים, ותמונות נכסים אינן מידע רגיש. העלאה ומחיקה מותרות רק לסוכן, דרך Storage Policies. סוגי הקבצים המותרים הם JPEG, ‏PNG ו-WebP, עד 5MB לקובץ. **[הנחה]**

**קשרים:** לכל נכס יש כמה תמונות (`properties` 1─N `property_images`). לכל פנייה יש כמה התאמות (`client_requests` 1─N `request_matches`), וכל התאמה מצביעה על נכס אחד, או על אף נכס אם הוא נמחק (`request_matches` N─1 `properties`). לכל פנייה יש גם כמה רשומות בתור המיילים (`client_requests` 1─N `email_outbox`).

### 2.5 APIs ותקשורת

**ממשקים פנימיים (Server Actions ו-Route Handlers):**

| פעולה | סוג | הרשאה |
|---|---|---|
| `submitRequest(form)` | Server Action | ציבורי, עם Rate Limiting |
| `updateCriteria(token, form)` | Server Action | בעל הטוקן |
| `setNotifications(token, active)` | Server Action | בעל הטוקן |
| `createProperty` / `updateProperty` / `deleteProperty` | Server Actions | סוכן |
| `GET /api/cron/email-outbox` | Route Handler | Vercel Cron בלבד. הבקשה מאומתת בעזרת `Authorization: Bearer ${CRON_SECRET}`. |

כל קריאת נתונים לדפים מתבצעת ישירות מ-Server Components. אין REST API ציבורי.

**אינטגרציות חיצוניות:**

| שירות | שימוש | פרטים |
|---|---|---|
| **Claude API** | דירוג ונימוק (F2) | קריאה אחת ל-`messages.create` עם `model: "claude-opus-5-5"`, ‏`output_config: { effort: "low", format: <JSON Schema> }` ו-`fallbacks: "default"` (beta `server-side-fallback-2026-07-01`). הקלט כולל את הטקסט של הלקוח ורשימת מועמדים בפורמט JSON (מזהה, מאפיינים ותיאור לכל נכס). הפלט הוא `[{ property_id, rank, reason }]`, עם עד 3 פריטים. Timeout של כ-25 שניות. |
| **Resend** | שליחת מיילים | `emails.send` לתוצאות פנייה, ו-`batch.send` (עד 100 בקריאה) לעדכונים על נכס חדש. התבניות בנויות ב-React Email, עם `dir="rtl"`. |
| **Supabase Auth – מייל וסיסמה** | התחברות הסוכן | Server Action ‏`signIn` שקורא ל-`signInWithPassword`, ואחריו בודק `is_admin()`. אין שליחת מיילים בתהליך ההתחברות. |

**כללים לקריאה ל-Claude:**
- ה-System Prompt מנחה את המודל לדרג **רק** מתוך המועמדים שנשלחו, ולנמק **רק** על בסיס השדות שהתקבלו, בעברית ובמשפט עד שלושה משפטים.
- הקוד מאמת את הפלט: כל `property_id` חייב להיות מתוך רשימת המועמדים, ולא יכולות להיות כפילויות. אם הפלט לא עובר את הבדיקה, המערכת עוברת לדירוג ברירת המחדל.
- הקוד בודק את `stop_reason`. אם התקבל `refusal` או שגיאה, המערכת עוברת לדירוג ברירת המחדל.
- הטקסט של הלקוח מועבר כ-Data בתוך תגיות ייעודיות, ולא כהוראות למודל. זו הגנה מפני Prompt Injection.

### 2.6 Data Flow

**א. שליחת פנייה (F1–F4):**
1. `submitRequest` מבצע ולידציה בעזרת Zod ובודק את ה-Rate Limit. אם `submission_id` כבר קיים, המערכת מחזירה את הפנייה הקיימת ולא יוצרת חדשה.
2. המערכת מנפיקה טוקן אקראי של 32 בתים (base64url) ושומרת את הפנייה עם ה-Hash של הטוקן.
3. **סינון ב-SQL:** המערכת מחפשת נכסים שמקיימים `status='available'`, נמצאים בעיר ובשכונות שהלקוח בחר, עומדים בתנאי `price <= max_budget` ובתנאי `rooms BETWEEN rooms_min AND rooms_max`. התוצאות ממוינות לפי `created_at DESC`, עם `LIMIT 40`. **[הנחה]** תקרה של 40 מועמדים מספיקה למאגר של סוכן יחיד.
4. **דירוג:**
   - אם אין מועמדים, השלב הזה מדולג.
   - אם יש מועמדים, המערכת קוראת ל-Claude. היא עושה את זה גם כשיש שלושה מועמדים או פחות, כדי לקבל נימוקים.
   - אם ה-AI נכשל, המערכת משתמשת בדירוג ברירת המחדל, עם נימוק בסיסי שנבנה מהקריטריונים.
5. המערכת שומרת עד 3 רשומות ב-`request_matches` (`source='initial'`), ומוסיפה ל-`email_outbox` רשומה מסוג `results`.
6. Redirect ל-`/r/[token]`. המיילים נשלחים ברקע אחרי שהתשובה כבר חזרה ללקוח, בעזרת `after()` של Next.js. אם השליחה נכשלת, הרשומה נשארת `pending`, וה-Cron ינסה לשלוח אותה שוב.

**ב. נכס חדש (F6):**
1. `createProperty` שומר את הנכס. אם הסטטוס הוא `available`, המערכת ממשיכה לשלב הבא, ברקע בעזרת `after()`.
2. שאילתת SQL מחפשת פניות פעילות שתואמות לנכס: `notifications_active = true`, עיר תואמת, שכונה שנכללת ב-`neighborhoods`, מחיר בגבולות התקציב וחדרים בטווח.
3. בטרנזקציה אחת המערכת יוצרת `request_matches` (`source='notification'`) ורשומה ב-`email_outbox` (`new_property`) לכל פנייה תואמת. במקרה של התנגשות על האינדקס הייחודי, הרשומה לא נוצרת (`ON CONFLICT DO NOTHING`), וכך נמנעת שליחה כפולה.
4. המיילים נשלחים ב-Batches של עד 100.

**ג. ניסיונות חוזרים (Cron):**
- Vercel Cron מפעיל את `/api/cron/email-outbox` כל 10 דקות.
- הוא שולח מחדש רשומות במצב `pending` שנוצרו לפני יותר מ-2 דקות, או רשומות במצב `failed` שעברו פחות מ-5 ניסיונות.
- הוא גם מנקה רשומות ישנות מ-`submission_log`.

**ד. עדכון קריטריונים (F5):** המערכת שומרת את הקריטריונים החדשים ומסמנת את ההתאמות הראשוניות הקודמות כ-`is_current=false`. אחר כך היא מריצה את שלבים 3–5 של זרימה א' מחדש, ושולחת מייל עם התוצאות החדשות.

### 2.7 Authentication, Authorization, אבטחה ופרטיות

**הסוכן:**
- ההתחברות מתבצעת במייל וסיסמה, באמצעות Supabase Auth. ההרשמה העצמית סגורה, וחשבון הסוכן נוצר ידנית. ה-Session נשמר ב-Cookies מסוג HttpOnly, בעזרת `@supabase/ssr`.
- **ההרשאה נבדקת בשתי שכבות:**
  1. **באפליקציה:** כל דף וכל Action תחת `/admin` קוראים ל-`requireAdmin()`. הפונקציה מאמתת את המשתמש מול Supabase בעזרת `getUser()` ובודקת שהמייל שלו מופיע ב-`admin_users`. אם הבדיקה נכשלת, המשתמש מקבל את ההודעה "אין לך הרשאת גישה לממשק הניהול" ומבוצע Sign-out.
  2. **ב-Database:** מדיניות RLS מאפשרת ל-Role `authenticated` גישה לטבלאות רק אם `auth.jwt()->>'email'` קיים ב-`admin_users`. משתמשים אחרים לא מקבלים גישה לשום נתון, גם אם הצליחו ליצור Session.
- **חסימת הרשמה:** פונקציית Auth Hook מסוג **Before User Created** דוחה יצירה של משתמש שהמייל שלו לא נמצא ב-`admin_users`. הפונקציה נכתבת ב-Migration, וההפעלה שלה נעשית ב-Dashboard.
- **Middleware/Proxy:** הקוד הזה רק מרענן את ה-Session. הוא לא משמש כשכבת הגנה יחידה.

**הלקוח (בלי התחברות):**
- הקישור האישי כולל טוקן אקראי של 256 ביט, ובמסד הנתונים נשמר רק ה-Hash שלו. השוואת הטוקן מתבצעת בשרת.
- עמודי `/r/*` מוגדרים עם `Referrer-Policy: no-referrer` ו-`noindex`, כדי שהטוקן לא ידלוף ולא יאונדקס במנועי חיפוש.
- הדף האישי לא מציג את הטלפון או את המייל של הלקוח.
- לטבלאות הלקוח **אין** מדיניות RLS עבור `anon`, ולכן גישה ישירה מהדפדפן חסומה. כל הגישה לנתוני לקוחות מתבצעת בשרת בעזרת ה-Secret Key, ורק אחרי אימות הטוקן.

**אבטחה כללית:**
- **Rate Limiting:** לכל IP מותרות עד 5 פניות בשעה, לפי ספירה ב-`submission_log`. **[הנחה]**
- **מפתחות סודיים:** ‏`SUPABASE_SECRET_KEY`, ‏`ANTHROPIC_API_KEY`, ‏`RESEND_API_KEY` ו-`CRON_SECRET` נגישים רק בקוד שרת, בקבצים שמסומנים `import "server-only"`.
- **ולידציה:** כל קלט עובר בדיקה בעזרת Zod בשרת, גם אם כבר נבדק בדפדפן. העלאת תמונות נבדקת לפי סוג וגודל, גם בצד השרת וגם ב-Bucket.
- **פרטיות:** הנתונים האישיים נשמרים ב-Supabase. כל מייל כולל קישור להפסקת עדכונים, בהתאם לדרישות הדיוור בישראל. ה-Region המומלץ הוא Frankfurt (`eu-central-1`), כי הוא הקרוב ביותר לישראל. **[הנחה]**

### 2.8 תשתיות, Hosting ו-Deployment

**GitHub:**
- Repository אחד. הענף `main` הוא Production.
- כל שינוי נעשה בענף נפרד ונפתח כ-Pull Request.
- Vercel יוצר **Preview Deployment** לכל PR, והוא מחובר לפרויקט ה-Development.

**Vercel:**
- הפרויקט מחובר ל-Repository דרך Git Integration.
- Push לענף `main` מפעיל Build ופריסה אוטומטית ל-Production.
- ה-Region של ה-Functions הוא `fra1` (Frankfurt), באותו אזור של Supabase.
- `vercel.json` מגדיר את ה-Cron: ‏`*/10 * * * *` ל-`/api/cron/email-outbox`.
- **Build Command:** `npm run vercel-build`. הסקריפט מבצע את הפעולות הבאות:
  1. אם `VERCEL_ENV=production`, הוא מריץ `supabase db push --db-url "$SUPABASE_DB_URL"`, שמחיל את ה-Migrations החדשות על Production.
  2. הוא מריץ `next build`.
  - **אם ה-Migration נכשלת, ה-Build נכשל והגרסה החדשה לא נפרסת.** כך גרסה חדשה של הקוד לא עולה לפני שמבנה מסד הנתונים שלה עודכן.
  - ב-Preview Deployments הסקריפט לא מריץ Migrations.

### 2.9 תצורה ופרטי גישה (Configuration)

| משתנה | תיאור | `.env.local` (מחשב מקומי) | Vercel – Preview | Vercel – Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | כתובת הפרויקט | Dev | Dev | Prod |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | מפתח ציבורי | Dev | Dev | Prod |
| `SUPABASE_SECRET_KEY` | מפתח סודי לשרת | Dev | Dev | Prod |
| `SUPABASE_DB_URL` | Connection String ל-Migrations, דרך ה-Session Pooler על פורט 5432, שתומך ב-IPv4 | Dev | – | Prod |
| `ANTHROPIC_API_KEY` | מפתח Claude | מפתח Dev | מפתח Dev | מפתח Prod |
| `RESEND_API_KEY` | מפתח Resend | מפתח Dev | מפתח Dev | מפתח Prod |
| `EMAIL_FROM` | כתובת השולח | | | |
| `APP_BASE_URL` | הכתובת שמשמשת לבניית קישורים במיילים | `http://localhost:3000` | כתובת ה-Preview | הדומיין הראשי |
| `CRON_SECRET` | אימות של קריאות Cron | – | – | Prod |

**כללים:**
- `.env.local` נמצא ב-`.gitignore` ומכיל **רק** פרטים של Development. פרטי ה-Production נשמרים **רק** ב-Vercel, תחת Environment Variables → Production. הם לא נשמרים במחשב המקומי ולא ב-GitHub.
- הקובץ `.env.example` נשמר ב-Repository, בלי ערכים, ומתעד את כל המשתנים.
- בסביבת Development מומלץ להגביל את המיילים לכתובות בדיקה בלבד. אפשר לעשות את זה דרך דומיין בדיקה ב-Resend, או באמצעות `EMAIL_TEST_RECIPIENT` שמחליף את הנמען. **[הנחה]**

### 2.10 סביבות Supabase ונוהל Migrations

**שני פרויקטים נפרדים:**

| | Development | Production |
|---|---|---|
| מטרה | פיתוח, בדיקות ו-Preview Deployments | האתר החי והנתונים האמיתיים |
| תוכנית | Free, ב-Organization נפרד | Pro, ב-Organization נפרד |
| מי מתחבר אליו | המחשב המקומי (`.env.local`) ו-Vercel Preview | Vercel Production בלבד |
| נתונים | נתוני בדיקה (Seed) | נתונים אמיתיים |

**מה המשמעות של מגבלות Supabase, בשפה פשוטה:**
- בחשבון חינמי אפשר להחזיק לכל היותר **שני פרויקטים פעילים**.
- פרויקט חינמי **"נרדם" אחרי שבוע בלי שימוש**. כשהוא רדום, האתר שמחובר אליו לא עובד עד שמעירים אותו בלחיצה ב-Dashboard. הנתונים לא נמחקים.
- לכן פרויקט ה-Production נמצא בתוכנית בתשלום (Pro), שבה אין "הירדמות". פרויקט ה-Development יכול להישאר חינמי. אם הוא נרדם, מעירים אותו לפני שממשיכים לעבוד.
- ב-Organization מסוג Pro, כל פרויקט נוסף עולה כסף (בערך $10 בחודש ומעלה). לכן Development נמצא ב-Organization חינמי נפרד.

**נוהל Migrations:**
1. כל שינוי במבנה מסד הנתונים נכתב כקובץ SQL חדש ב-`supabase/migrations/`. השם של הקובץ מתחיל בחותמת זמן, והוא נוצר בעזרת `npx supabase migration new <name>`. אסור לערוך Migration שכבר הורצה.
2. **Development:** המפתח (או כלי ה-AI) מריץ `npx supabase db push --db-url "$SUPABASE_DB_URL"`, שמשתמש בפרטי ה-Dev מתוך `.env.local`, ובודק את האפליקציה מול Development. זה לא מצריך Docker.
3. הקוד והמיגרציה נכנסים יחד לאותו Pull Request. המשתמש בודק את ה-Preview Deployment, שמחובר ל-Development.
4. **אישור המשתמש** הוא המיזוג (Merge) של ה-PR לענף `main`.
5. **Production:** אחרי המיזוג, ה-Build ב-Vercel מריץ אוטומטית `supabase db push` מול Production, ורק אחר כך בונה ומפרסם את הקוד (סעיף 2.8). אף אחד לא מריץ Migrations ידנית על Production.
6. **כלל בטיחות:** Migrations חייבות להיות תואמות לאחור, כלומר רק להוסיף ולא לשבור. לדוגמה, מוסיפים עמודה חדשה, ואת העמודה הישנה מוחקים רק ב-Migration מאוחרת יותר. הסיבה: אם ה-Migration הצליחה אבל ה-Build נכשל אחריה, הגרסה הקודמת של הקוד ממשיכה לרוץ מול המבנה החדש.

**הגדרות שלא עוברות ב-Migrations, וצריך להגדיר בנפרד בכל אחד משני הפרויקטים:**

| הגדרה | היכן |
|---|---|
| הפעלת ה-Data API | Supabase → Integrations → Data API: ‏Enable Data API דלוק, ו-`public` ב-Exposed schemas. בלי זה כל הקריאות לנתונים נכשלות (שגיאה PGRST002). |
| סגירת ההרשמה העצמית | Supabase → Authentication → Sign In / Providers: ‏"Allow new users to sign up" כבוי. |
| חשבון הסוכן | Supabase → Authentication → Users → Add user → Create new user: המייל של הסוכן, סיסמה, ו-Auto Confirm User. אותו מייל נכנס גם ל-`admin_users`. |
| הפעלת Auth Hook מסוג Before User Created | Supabase → Authentication → Hooks. הפונקציה עצמה נוצרת ב-Migration. |
| רשומת הסוכן ב-`admin_users` | פקודת `insert` חד-פעמית ב-SQL Editor של כל פרויקט. |
| כל המפתחות והסודות | `.env.local` לסביבת Dev, ו-Vercel Environment Variables לכל סביבה. |
| דומיין שליחה ומפתח API ב-Resend | Resend Dashboard. |

ה-Bucket ‏`property-images` וה-Storage Policies שלו **כן** נוצרים ב-Migration, באמצעות `insert` לטבלה `storage.buckets` ופקודות `create policy` על `storage.objects`.

### 2.11 החלטות טכניות נוספות

- **העלאת תמונות:** הדפדפן של הסוכן מעלה את התמונות ישירות ל-Supabase Storage, עם ה-Session של הסוכן ו-RLS. כך נמנעת מגבלת גודל הבקשה של Functions ב-Vercel. רק אחרי שההעלאה מצליחה, הקוד שומר רשומה ב-`property_images`. כשנכס נמחק, גם הקבצים שלו נמחקים מה-Bucket.
- **תמונות בממשק:** התמונות מוצגות בעזרת `next/image`, עם `remotePatterns` לדומיין של Supabase Storage.
- **מחיקת נכס:** הנכס נמחק מהטבלה. כתוצאה מ-`ON DELETE SET NULL`, ההתאמות נשמרות עם `property_title_snapshot`. בדף האישי של הלקוח לא מוצגות התאמות שהנכס שלהן נמחק, ונכס בסטטוס `unavailable` מסומן כ"לא זמין".
- **שינוי סטטוס:** עריכת נכס, כולל שינוי שלו ל-`available`, לא מפעילה עדכונים. רק `createProperty` מפעיל אותם, לפי ההנחה ב-F6.
- **טופס ריק:** אם אין נכסים זמינים, `available_areas` ריק, והטופס מציג הודעה שאין כרגע נכסים במערכת.
- **Seed:** קובץ `supabase/seed.sql` עם נכסים לדוגמה. מריצים אותו **רק** על Development.
- **בדיקות:** Unit Tests ב-Vitest ללוגיקת הסינון, לוולידציה ולבדיקת הפלט של ה-AI. בקריאות ל-Claude ול-Resend משתמשים ב-Mocks. **[הנחה]**

---

## מקורות

- [Vercel – Hobby Plan (שימוש לא מסחרי)](https://vercel.com/docs/plans/hobby-plan)
- [Vercel – Cron Jobs Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel – Limits](https://vercel.com/docs/limits)
- [Supabase – Pricing](https://supabase.com/pricing)
- [Supabase – Connecting to Postgres (Direct / Session / Transaction pooler, IPv4)](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase CLI – db push](https://supabase.com/docs/reference/cli/supabase-db-push)
- [Supabase – Password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- [Next.js Blog – releases](https://nextjs.org/blog)
- [Resend – Pricing](https://resend.com/pricing) ו-[סקירת מגבלות Free Tier 2026](https://automationatlas.io/answers/resend-free-tier-explained-2026/)
- [Anthropic – Claude API Documentation](https://platform.claude.com/docs)

---

## החלטות מרכזיות (ADRs)

### ADR-1: Select כ-`<select>` רגיל של הדפדפן, מעוצב
**הקשר:** נדרש רכיב Select (עיר, מספר חדרים, מצב הנכס). ל-shadcn/ui יש Select מבוסס Radix, שמצייר רשימה מותאמת אישית.
**החלטה:** הרכיב `components/ui/select.tsx` הוא `<select>` רגיל של הדפדפן, בעיצוב של שדות הקלט ועם חץ בצד שמאל.
**השלכות:** הערך נשלח אוטומטית בטפסים של Server Actions (‏`FormData`), בלי קוד נוסף. במובייל נפתח בורר המערכת המוכר. הרשימה הפתוחה עצמה מוצגת בעיצוב של הדפדפן ולא בעיצוב המותג.

### ADR-2: ‏lucide-react כסט האייקונים
**הקשר:** ה-Style Guide מגדיר אייקוני Line בגודל 24px, קו בעובי 1.75px ופינות מעוגלות.
**החלטה:** משתמשים ב-`lucide-react` (הסט המובנה של shadcn/ui). המיפוי לשמות של ה-Style Guide נמצא ב-`components/icons.tsx`, עם עובי קו 1.75 כברירת מחדל.
**השלכות:** אין צורך לצייר אייקונים. אייקון חדש מוסיפים רק דרך `components/icons.tsx`, כדי לשמור על סט אחיד.

### ADR-3: קובץ הסודות המקומי הוא `.env` ולא `.env.local`
**הקשר:** סעיף 2.9 ו-MILESTONES.md מתייחסים ל-`.env.local`, בעוד שהנחיות העבודה בפרויקט (`CLAUDE.md`) קובעות `.env`.
**החלטה:** באישור המשתמש, הערכים של Development נשמרים ב-`.env`, שנוצר מ-`.env.example`. בכל מקום במסמכים שכתוב `.env.local`, הכוונה ל-`.env`.
**השלכות:** ‏Next.js טוען את `.env` אוטומטית. ‏`.gitignore` מסתיר את `.env` ואת כל `.env.*` (כולל `.env.local`), חוץ מ-`.env.example`. אסור להוסיף ל-`.env` ערכים של Production.

### ADR-4: ‏Cache Components ו-Partial Prefetching מופעלים
**הקשר:** ‏Next.js 16.4 יוצר פרויקט חדש עם `cacheComponents: true` ו-`partialPrefetching: true` ב-`next.config.ts`. לפי התיעוד, שתי ההגדרות יהיו ברירת המחדל בגרסה הראשית הבאה.
**החלטה:** משאירים אותן מופעלות. ‏Redirects קבועים מוגדרים ב-`redirects()` של `next.config.ts` ולא בתוך דף.
**השלכות:** נתונים נטענים באופן דינמי כברירת מחדל, ושמירה במטמון היא בחירה מפורשת (`use cache`). בבנייה של Milestones הבאים צריך לקרוא את המדריכים שב-`node_modules/next/dist/docs/` לפני שימוש ב-`cookies()`, ‏`headers()` או טעינת נתונים בדפים.

### ADR-5: העלאת תמונות לפני שמירת הנכס, עם מזהה נכס שנקבע מראש
**הקשר:** התמונות עולות ישירות מהדפדפן ל-Storage (סעיף 2.11), ונשמרות בתיקייה של הנכס. בנכס חדש עוד אין מזהה ברגע ההעלאה.
**החלטה:** בטופס "הוספת נכס" השרת קובע מראש מזהה (UUID) לנכס. בלחיצה על "שמירה" הדפדפן מעלה קודם את התמונות החדשות לנתיב `properties/<id>/<uuid>.<ext>`, ורק אחר כך שולח את הטופס עם רשימת הנתיבים. השרת מוודא שכל נתיב שייך לתיקיית הנכס, שיש לכל היותר 10 תמונות ותמונה ראשית אחת. אם הטופס נדחה בגלל שגיאת ולידציה, התמונות שכבר עלו נשמרות בטופס ולא עולות שוב.
**השלכות:** אם הסוכן עוזב את הטופס אחרי שהתמונות עלו אבל הנכס לא נשמר, יכולים להישאר ב-Bucket קבצים בלי נכס. אלה קבצים ציבוריים ולא רגישים, והם לא מוצגים בשום מקום.

### ADR-6: בדיקת RLS כסקריפט נפרד
**הקשר:** ה-DoD של Milestone 2 דורש לוודא שאי אפשר לקרוא או לשנות נתונים בלי התחברות. הבדיקה הזו צריכה חיבור אמיתי לפרויקט Development.
**החלטה:** `npm run check:rls` (‏`scripts/check-rls.mjs`) מתחבר עם המפתח הציבורי בלבד ובודק קריאה, הוספה, עדכון, מחיקה והעלאה ל-Bucket. הוא לא חלק מ-`npm test`.
**השלכות:** `npm test` נשאר מהיר ולא תלוי ברשת. את בדיקת ה-RLS מריצים אחרי כל Migration שנוגעת בהרשאות.

### ADR-7: ‏Supabase CLI 3 – הדגל `--remote` במקום `--db-url`
**הקשר:** בגרסה 3 של Supabase CLI, הפקודה `db push` מקבלת את כתובת מסד הנתונים בדגל `--remote=<url>`, ולא ב-`--db-url` כפי שכתוב בסעיפים 2.8 ו-2.10.
**החלטה:** הסקריפט `scripts/db.mjs` מריץ `supabase db push --remote=<SUPABASE_DB_URL>` (‏`npm run db:push`, ‏`db:seed`, ‏`db:list`), עם המשתנים מ-`.env`. גם סקריפט `vercel-build` של Milestone 7 ישתמש בדגל הזה.
**השלכות:** בכל מקום במסמכים שכתוב `--db-url`, הכוונה ל-`--remote`.

### ADR-8: התחברות הסוכן בקישור כניסה במייל (Magic Link) במקום Google – **הוחלף ב-ADR-9**
**הקשר:** ההתחברות עם Google דרשה מהמשתמש, שאינו מתכנת, להקים פרויקט ב-Google Cloud, מסך הסכמה ו-OAuth Client בכל סביבה. המשתמש ביקש דרך פשוטה יותר, שגם היא לא דורשת סיסמה.
**החלטה:** הסוכן מזין את כתובת המייל שלו ב-`/admin/login`, וה-Server Action ‏`sendLoginLink` קורא ל-`signInWithOtp`. ה-Auth Hook מסוג Before User Created, ‏`requireAdmin()` ומדיניות ה-RLS נשארים בלי שינוי, ולכן רק כתובת שמופיעה ב-`admin_users` יכולה להיכנס. ‏`/auth/callback` מקבל את הקישור בשני הפורמטים: ‏`token_hash`, שעובד בכל דפדפן ומכשיר, ו-`code` (‏PKCE), שעובד רק באותו דפדפן. תבניות המייל ב-Supabase מעודכנות לפורמט `token_hash`.
**השלכות:** אין צורך ב-Google Cloud. ב-Dev, Supabase שולח את המייל בשירות המובנה שלו, שמוגבל לכמה מיילים בשעה ושולח רק לחברי ה-Organization. ב-Prod מגדירים SMTP של Resend ב-Supabase (Milestone 7). הסוכן תלוי בגישה לתיבת המייל שלו כדי להיכנס. ה-Session נשמר ב-Cookies, כך שלא צריך קישור חדש בכל כניסה.

### ADR-9: התחברות הסוכן במייל וסיסמה (מחליף את ADR-8)
**הקשר:** בפיתוח, שירות המיילים המובנה של Supabase מאפשר רק כמה מיילים בשעה. אחרי כמה ניסיונות הסוכן לא הצליח להיכנס בכלל. בנוסף, המשתמש העדיף כניסה מיידית, בלי לחכות למייל בכל פעם.
**החלטה:** הסוכן נכנס במייל וסיסמה (`signInWithPassword`) דרך ה-Server Action ‏`signIn` ב-`/admin/login`. אחרי הכניסה, `is_admin()` נבדק, ומשתמש שאינו ברשימה מנותק מיד. חשבון הסוכן נוצר ידנית ב-Supabase Dashboard עם Auto Confirm, וההרשמה העצמית ("Allow new users to sign up") כבויה. ה-Auth Hook מסוג Before User Created, ‏`admin_users`, ‏`requireAdmin()` ומדיניות ה-RLS נשארים בלי שינוי, כשכבות הגנה נוספות. ‏`/auth/callback` הוסר.
**השלכות:** ההתחברות לא תלויה בשליחת מיילים, ולכן אין צורך ב-SMTP של Resend ב-Supabase. אין מסך "שכחתי סיסמה": איפוס נעשה ב-Dashboard (מחיקה ויצירה מחדש של המשתמש, או שינוי סיסמה). Supabase מגביל מראש ניסיונות כניסה כושלים. בכל סביבה צריך ליצור את חשבון הסוכן בנפרד (סעיף 2.10).

### ADR-10: ה-AI נדחה – דירוג ברירת מחדל בלבד ב-Milestone 3
**הקשר:** סעיפים 1.2, 2.5 ו-2.6 מתארים דירוג ונימוק בעזרת Claude API. המשתמש ביקש להוציא את ה-AI מ-Milestone 3 לגמרי, ואולי להוסיף אותו בהמשך.
**החלטה:** מנוע ההתאמה (`lib/services/matching.ts`) מסנן ב-SQL ומדרג תמיד לפי דירוג ברירת המחדל: מהחדש לישן, עד 3 נכסים, עם נימוק בסיסי שנבנה מהקריטריונים (שכונה, מחיר, חדרים). לא מותקן `@anthropic-ai/sdk`, ואין קריאה לשירות חיצוני. הטקסט החופשי של הלקוח נשמר בפנייה, אבל עדיין לא משפיע על הדירוג. הכיתוב על תמונת הכרטיס, שהוחלט שה-AI יכתוב, לא מוצג.
**השלכות:** אין צורך ב-`ANTHROPIC_API_KEY` ואין עלות AI. הנימוק אינו מותאם למה שהלקוח כתב. כשה-AI ייבנה, הוא יתחבר בנקודה אחת, `rankCandidates()`, ויוסיף עמודה `highlight` ל-`request_matches` עבור הכיתוב על התמונה.

### ADR-11: גישה לנתוני לקוחות דרך Client עם המפתח הסודי
**הקשר:** ללקוח אין התחברות, ולטבלאות הלקוח אין מדיניות RLS עבור `anon` (סעיף 2.7). גם ה-View ‏`available_areas` חסום ל-`anon`.
**החלטה:** הדפים הציבוריים והפעולה `submitRequest` משתמשים ב-`lib/integrations/supabase/service.ts`, ‏Client בצד השרת בלבד עם `SUPABASE_SECRET_KEY`. נתוני פנייה מוחזרים רק אחרי חיפוש לפי ה-Hash של הטוקן, ופרטי נכס מוצגים רק אם הנכס מקושר לאותה פנייה.
**השלכות:** ה-RLS נשאר סגור לגמרי לדפדפן (נבדק ב-`npm run check:rls`). כל בדיקות ההרשאה של הצד הציבורי נמצאות בקוד השרת, ולכן כל שאילתה חדשה בצד הזה חייבת לעבור דרך הטוקן.

### ADR-12: הרשאות הסוכן לטבלאות הפניות – קריאה ומחיקה בלבד
**הקשר:** מסכי הפניות של הסוכן (F9) ניגשים לנתונים עם ה-Session של הסוכן, ולכן ה-RLS חל עליהם. בהמשך התבקשה גם מחיקת פנייה בידי הסוכן.
**החלטה:** ב-Milestone 4 נוספו ל-`client_requests` ול-`request_matches` מדיניות RLS מסוג `select` בלבד, ל-Role `authenticated` בתנאי `is_admin()`. ב-Milestone 4.5 נוספת מדיניות `delete` על `client_requests` בלבד. ההתאמות (`request_matches`) ותור המיילים (`email_outbox`) נמחקים איתה דרך `ON DELETE CASCADE`. לסוכן אין מדיניות `insert` או `update` על טבלאות הפניות.
**השלכות:** גם אם יש באג בקוד, הסוכן לא יכול לשנות פנייה ברמת מסד הנתונים, אלא רק לקרוא או למחוק אותה. פנייה שנמחקה לא ניתנת לשחזור, והקישור האישי שלה מציג "הקישור אינו תקין". מיילים שעוד לא נשלחו לפנייה כזו נמחקים מהתור ולא יישלחו.

### ADR-13: מעבר למסך הנכסים בטעינת עמוד מלאה אחרי התחברות
**הקשר:** אחרי התחברות מוצלחת, `redirect()` מתוך ה-Server Action לא תמיד ראה את ה-Cookies החדשים של ה-Session, ולכן הסוכן הוחזר לטופס ההתחברות ונאלץ להתחבר פעמיים.
**החלטה:** הפעולה `signIn` מחזירה `{ signedIn: true }` במקום `redirect()`. הטופס מבצע אז `window.location.replace("/admin/properties")`, כלומר טעינת עמוד מלאה, שבה ה-Cookies החדשים תמיד נשלחים.
**השלכות:** ההתחברות עובדת בניסיון הראשון. ההתחברות דורשת JavaScript בדפדפן, וזה תקין בממשק ניהול.
