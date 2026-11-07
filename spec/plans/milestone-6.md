# Milestone 6 – עדכון אוטומטי על נכס חדש

> תוכנית בנייה. מבוססת על MILESTONES.md (Milestone 6), ‏PRD F6 ו-Flow 2, ‏DESIGN.md §1.4, ‏ARCHITECTURE.md §2.4–§2.6 ו-ADR-11, ‏ADR-12, ‏ADR-15.

## מטרה
כשהסוכן מוסיף נכס חדש בסטטוס "זמין", כל פנייה פעילה שהנכס תואם לה (אזור, תקציב, טווח חדרים) מקבלת מייל אחד עליו, והנכס מופיע בדף האישי שלה תחת "נכסים חדשים שנשלחו אליי".

## מה כבר קיים (לא בונים מחדש)
- `request_matches.source` כולל כבר `notification`, והאינדקס הייחודי החלקי `request_matches_one_notification_idx` על `(request_id, property_id) WHERE source='notification'` כבר קיים (Migration של Milestone 3).
- `email_outbox.kind` כולל כבר `new_property`, ויש עמודה `property_id`.
- תור המיילים, ה-"Claim" של שורה (`sendClaimed`), ה-Cron וניסיונות חוזרים עד 5 (`lib/services/email.ts`).
- גזירת הטוקן לקישור האישי (`tokenForRequest`, ‏ADR-15) ודף "הפסקת עדכונים".
- `getMatchedProperty` כבר מאשר פתיחת פרטי נכס לכל נכס שמקושר לפנייה, כולל התאמות מסוג `notification`.

## זרימה (ARCHITECTURE §2.6 ב')
1. `createPropertyAction` שומר את הנכס כרגיל. אם `status === "available"`, הוא רושם `after(() => notifyNewProperty(id))` ואז מבצע `redirect` כרגיל. הסוכן לא מחכה למיילים.
2. `notifyNewProperty(propertyId)` (שרת בלבד, Client עם המפתח הסודי, כי לסוכן אין הרשאת `insert` לטבלאות הפניות – ADR-12):
   1. קורא את הנכס. אם הוא לא קיים או לא `available` – יוצא.
   2. `findMatchingRequests(supabase, property)` – שאילתה: `notifications_active = true`, ‏`city = property.city`, ‏`neighborhoods @> {property.neighborhood}`, ‏`max_budget >= price`, ‏`rooms_min <= rooms`, ‏`rooms_max >= rooms`.
   3. קורא ל-RPC ‏`record_property_notifications(property_id, request_ids)` – בטרנזקציה אחת: יוצר `request_matches` (‏`source='notification'`, ‏`rank` ו-`reason` ריקים, ‏`property_title_snapshot`) עם `ON CONFLICT DO NOTHING` על האינדקס הייחודי, ורק לשורות שנוצרו בפועל יוצר רשומה ב-`email_outbox` (‏`new_property`). מחזיר את מזהי רשומות התור.
   4. שולח את המיילים ב-Batches של עד 100 (`sendNewPropertyBatch`).
3. כל כישלון נרשם ללוג ולא מפיל את שמירת הנכס. רשומה שלא נשלחה נשארת בתור, וה-Cron הקיים ינסה שוב.

## Migration חדשה
`supabase/migrations/<timestamp>_property_notifications.sql`:
- פונקציה `public.record_property_notifications(p_property_id uuid, p_request_ids uuid[]) returns setof uuid`:
  - `insert into request_matches ... select ... from client_requests where id = any(p_request_ids) and notifications_active` (בדיקה חוזרת של "פעיל" בתוך הטרנזקציה), ‏`on conflict (request_id, property_id) where source = 'notification' do nothing returning request_id`.
  - `insert into email_outbox (request_id, kind, property_id) ... returning id`.
  - `security invoker`, ‏`set search_path = ''`.
  - `revoke execute ... from public, anon, authenticated`; ‏`grant execute ... to service_role`. כך רק השרת (המפתח הסודי) יכול להפעיל אותה.
- לא משנים טבלאות קיימות. תואם לאחור.
- הרצה על Development בלבד: `npm run db:push`, ואחריה `npm run check:rls` כדי לוודא שהפונקציה חסומה לדפדפן (מוסיפים לסקריפט בדיקת `rpc` עם המפתח הציבורי שצריכה להיכשל).

## קבצים

### חדשים
| קובץ | תוכן |
|---|---|
| `lib/services/notifications.ts` | ללא `server-only` (מקבל Client כפרמטר, כמו `matching.ts`), כדי שיהיה ניתן לבדיקה: `findMatchingRequests(supabase, property)` ו-`recordNotifications(supabase, propertyId, requestIds)` (עטיפה ל-RPC). |
| `lib/services/notifications.test.ts` | בדיקות Unit עם Fake Client (באותה שיטה של `matching.test.ts`): שהשאילתה מסננת לפי פעיל/עיר/שכונה/תקציב/חדרים עם הערכים הנכונים, החזרת רשימה ריקה, זריקת שגיאה, ו-`recordNotifications` שלא קורא ל-RPC כשאין פניות. |
| `lib/services/notify-new-property.ts` | ‏`server-only`: ‏`notifyNewProperty(propertyId)` – מחבר את השלבים: קריאת נכס ← התאמה ← RPC ← שליחה. לעולם לא זורק (נקרא מתוך `after()`). |
| `emails/new-property-email.tsx` | תבנית React Email, עברית ו-RTL, באותו סגנון של `results-email.tsx`: כותרת "שלום <שם>, נכנס נכס חדש שמתאים לכם", תמונה ראשית, כותרת, מחיר, פרטים, תיבת "הנכס עומד בקריטריונים שלכם" עם שלוש שורות ✓ (אזור – שכונה ועיר; מחיר בתקציב עד ‎₪ X; ‏N חדרים בטווח A–B), כפתור "לפרטי הנכס", כפתור "לדף האישי שלי", וקישור "הפסקת עדכונים". אין נימוק מנוסח (PRD §6). נושא: "נכס חדש שמתאים לכם". |
| `emails/new-property-email.test.tsx` | בדיקה שהתבנית מרונדרת עם RTL, כוללת את פרטי הנכס, את שלושת הקריטריונים, קישור לדף האישי וקישור "הפסקת עדכונים". |
| `supabase/migrations/<timestamp>_property_notifications.sql` | ראו למעלה. |

### שינויים
| קובץ | שינוי |
|---|---|
| `app/admin/(panel)/properties/actions.ts` | ב-`createPropertyAction` בלבד: אחרי שמירה מוצלחת, ואם הסטטוס `available`, ‏`after(() => notifyNewProperty(id))`. ‏`updatePropertyAction` לא משתנה (עריכה לא מפעילה עדכון – PRD F6). |
| `lib/integrations/resend.ts` | פונקציה חדשה `sendEmailBatch(emails[])` – מרנדרת כל מייל ושולחת ב-`resend.batch.send` (עד 100), עם אותה החלפת נמען ב-`EMAIL_TEST_RECIPIENT`. |
| `lib/services/email.ts` | (1) ‏`buildNewPropertyEmail(supabase, row)` – בונה מייל `new_property` מהנתונים העדכניים בזמן השליחה. (2) ‏`sendClaimed` תומך גם ב-`new_property` (ה-Cron משתמש בו לניסיונות חוזרים, אחד-אחד). (3) ‏`sendNewPropertyBatch(ids)` – מחלק ל-Batches של 100: עושה Claim לכל שורה, בונה את המיילים, שולח ב-`sendEmailBatch`, ומסמן את כולן `sent` או `failed`. (4) מקרים שבהם לא שולחים: הפנייה הפסיקה עדכונים לפני השליחה, הנכס נמחק או כבר לא זמין, או טוקן ישן (ADR-15) – השורה מסומנת `failed` עם `attempts = 5` וסיבה ב-`last_error`, כדי שה-Cron לא ינסה שוב. |
| `lib/services/email-outbox.ts` | קבוע `BATCH_SIZE = 100`, ופונקציה טהורה `chunk()` (עם בדיקה). |
| `lib/services/requests.ts` | ‏`getNotificationMatches(requestId)` – התאמות `source='notification'`, מהחדשה לישנה, בלי נכסים שנמחקו (כמו `getCurrentMatches`), עם Thumbnail, כותרת, שכונה, מחיר וסטטוס. לא תלוי ב-`is_current`: היסטוריית העדכונים נשמרת גם אחרי עדכון קריטריונים. |
| `app/(public)/r/[token]/page.tsx` | בדף האישי (לא במצב `view=results`): מתחת ל"הנכסים שהוצגו לי", ‏Panel ‏"נכסים חדשים שנשלחו אליי" לפי DESIGN §1.4 – בכל שורה Thumbnail, כותרת, שכונה, מחיר וקישור "לפרטים" אל `/r/<token>/properties/<id>`. נכס לא זמין מקבל תגית "לא זמין" וטקסט אפור, כמו בכרטיס הקטן. |
| `components/property/notification-row.tsx` (חדש) | רכיב השורה של הרשימה. |
| `scripts/check-rls.mjs` | בדיקה שקריאה ל-`record_property_notifications` עם המפתח הציבורי נדחית. |
| `spec/ARCHITECTURE.md` | ADR חדש (ADR-17): הטרנזקציה של §2.6 ב'.3 ממומשת כפונקציית Postgres שרק `service_role` רשאי להפעיל, והשאילתה למציאת הפניות נשארת ב-TypeScript כדי שתהיה ניתנת לבדיקת Unit. |
| `spec/MILESTONES.md` | סימון 🟡 ליד הכותרת בסיום הבנייה. |

לא נדרשים משתני סביבה חדשים.

## החלטות והנחות (לאישורך לפני הבנייה)
1. **רשימה ריקה בדף האישי:** כשעוד לא נשלח אף נכס חדש, ה-Panel ‏"נכסים חדשים שנשלחו אליי" **לא מוצג בכלל**. DESIGN.md לא מגדיר טקסט למצב ריק, ולכן לא ממציאים אחד.
2. **פנייה שהעדכונים בה הופסקו ואז הופעלו מחדש:** מקבלת עדכונים רק על נכסים שנוספו אחרי ההפעלה מחדש. נכסים שנוספו בזמן ההפסקה לא נשלחים לה בדיעבד.
3. **עדכון קריטריונים:** נכסים שכבר נשלחו בעדכונים נשארים ברשימה "נכסים חדשים שנשלחו אליי" גם אחרי שהלקוח שינה קריטריונים.
4. **מסך פרטי פנייה אצל הסוכן:** נשאר כמו היום (הנכסים מהפנייה עצמה בלבד). הוספת נכסי העדכונים למסך הזה לא מופיעה ב-Milestone 6, ולכן לא נבנית עכשיו.
5. **מכסת Resend Free (100 מיילים ביום):** נכס שתואם להרבה פניות יכול לחרוג ממנה. המיילים שלא נשלחו נשארים בתור, וה-Cron ינסה שוב עד 5 פעמים (ARCHITECTURE §1, סיכונים).
6. **ב-Development** כל המיילים מגיעים לכתובת הבדיקה (`EMAIL_TEST_RECIPIENT`), כמו ב-Milestone 5.

## בדיקות שאריץ בעצמי בסיום הבנייה
1. `npm test`, ‏`npm run lint`, ‏`npm run build`, ‏`npm run check:rls`.
2. ב-Development: שתי פניות פעילות עם קריטריונים שתואמים לנכס חדש, ופנייה שלישית שהעדכונים בה הופסקו. מוסיף נכס תואם בסטטוס "זמין" ← בתור נוצרו בדיוק 2 רשומות `new_property` בסטטוס `sent`, ונוצרו 2 שורות `request_matches` מסוג `notification`. הנכס מופיע בדף האישי של שתי הפניות, ולא בשלישית.
3. נכס שלא תואם לעיר/שכונה, נכס מעל התקציב ונכס מחוץ לטווח החדרים ← אין רשומות חדשות בתור.
4. עריכת הנכס התואם (גם שינוי מ"לא זמין" ל"זמין"), ונכס חדש בסטטוס "לא זמין" ← אין רשומות חדשות.
5. הפעלה חוזרת של `notifyNewProperty` לאותו נכס ← לא נוצרות התאמות או מיילים כפולים.
6. כישלון שליחה (מפתח Resend שגוי זמנית) ← הנכס נשמר, הרשומות בתור `failed`, וקריאה ל-Cron אחרי התיקון שולחת אותן.
7. המייל מוצג נכון ב-RTL, והקישורים "לפרטי הנכס", "לדף האישי שלי" ו"הפסקת עדכונים" עובדים.
8. הדף האישי ברוחב 375px ובמחשב.
9. בסיום: מחיקת נתוני הבדיקה שיצרתי ב-Development (נכסים ופניות של בדיקה).

## Definition of Done (מ-MILESTONES.md)
- [ ] ה-Migration החדשה (פונקציית ה-RPC) הורצה בהצלחה על Development ונשמרה בתיקיית הפרויקט.
- [ ] נכס חדש שתואם לשתי פניות פעילות שולח מייל אחד לכל אחת, ומופיע בדף האישי של כל אחת.
- [ ] פנייה שהעדכונים בה הופסקו לא מקבלת מייל.
- [ ] נכס שלא תואם לאזור, לתקציב או לטווח החדרים לא שולח מייל.
- [ ] עריכת נכס קיים, ונכס חדש בסטטוס "לא זמין", לא שולחים מיילים.
- [ ] אותו נכס לא נשלח פעמיים לאותה פנייה.
- [ ] בדיקות Unit מכסות את שאילתת ההתאמה לנכס חדש.
- [ ] תנאים כלליים: build, ‏lint ו-test עוברים; המסך תואם ל-DESIGN.md, בעברית וב-RTL, ושמיש ב-375px ובמחשב.
