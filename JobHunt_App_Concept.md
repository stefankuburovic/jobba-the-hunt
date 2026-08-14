# JobHunt App — Concept v0.1

## Циљ
Мобилна апликација (React Native) која:
1. Повлачи огласе за посао са више извора на једно место
2. Приказује их у листи/картицама са описом
3. Чуваш их + мануелно означаваш статус (New, Applied, In Progress, Interview, Rejected, Offer)
4. Интегрисан календар за интервјуе (подсетници на телефону)

## ⚠️ Правна реалност (прочитај прво)
- **LinkedIn, Indeed** и слични: ToS забрањује scraping и auto-apply. Ризик: trajni бан налога. **НЕ дирати.**
- **Auto-apply ботови** генерално производе лошије, генеричке пријаве — fill-in-the-blanks апликације ATS системи и рекрутери лако препознају.
- **Решење:** апликација агрегира огласе са *легалних, јавних* извора (job board API-jи који то дозвољавају), а "Apply" дугме отвара оригинални сајт у browser-у где ти ручно пошаљеш пријаву (обично прилагођену, попуњену CV-јем/cover letter-ом које смо већ направили). App-ов посао је organizacija, не аутоматизација пријављивања.

## Легални извори огласа (public/free API или RSS)
- **Remotive API** — remote tech послови, бесплатан public API
- **Arbeitnow API** — EU-фокусиран, бесплатан, без key-а
- **RemoteOK API** — public JSON endpoint
- **We Work Remotely** — RSS feed по категорији (frontend-programming)
- **Greenhouse / Lever / Ashby public job board API-jevi** — велики број компанија хостује огласе преко ovih ATS-ova, imaju javne read-only API-je (нпр. `boards-api.greenhouse.io/v1/boards/{company}/jobs`) — може се agregirati po listi kompanija koje te zanimaju
- **Adzuna API** — free tier, шире pokriva EU/US тржиште, filtrira po keyword-u i lokaciji

Ово покрива веома пристојан проценат remote frontend огласа без икаквог ToS ризика.

## Архитектура (искориштава тачно твој постојећи стек)
```
React Native (Expo)  →  NestJS backend (agregacija + cache)  →  Postgres/SQLite
       │                         │
       └── expo-calendar         └── cron job: povlači nove oglase svakih N sati
           (интервјуи → device
            calendar reminders)
```

Опционо: за чисто личну употребу, backend може отпасти — RN app директно позива public API-je + чува у локалном SQLite (WatermelonDB/expo-sqlite). Нула инфраструктуре, нула хостинг трошкова. Backend вреди додати само ако желиш sync између телефона и веба, или ако касније ово постане нешто што и други користе.

## Data model (минимум)
```ts
Job {
  id, title, company, source ('remotive'|'arbeitnow'|'greenhouse:{company}'|...),
  url, description, tags[], remote: boolean, postedDate, salaryRange?
}

Application {
  jobId, status: 'new'|'applied'|'in_progress'|'interview'|'rejected'|'offer',
  appliedDate?, notes, contactPerson?,
  interviewEvents: [{ date, calendarEventId }]
}
```
(Скоро идентично колонама у типичном Excel tracker-у — овај app је practically upgrade tog tracker-a sa auto-feed огласа и native календаром уместо ручног уноса компаније/улоге.)

## MVP фазе (реалан redosled, ne sve odjednom)
1. **Faza 1 — Feed:** Fetch + prikaz oglasa iz 2 izvora (npr. Remotive + Arbeitnow), keyword filter (React/Angular/TypeScript/Frontend), swipe/save UI.
2. **Faza 2 — Tracker:** Local storage, status per oglas, "Apply" dugme otvara link, edit statusa (isto što i Excel tab sad radi, samo native).
3. **Faza 3 — Calendar:** Kad staviš status "Interview", app traži datum/vreme i kreira device calendar event + push reminder.
4. **Faza 4 (opciono, kasnije):** Greenhouse/Lever agregacija po listi kompanija koje ciljaš, cover-letter template generator unutar app-a.

## Scope напомена
Ово је full-stack React Native + Node + integracija sa spoljnim API-jem + kalendar — добар portfolio пројекат по обиму.

Прва верзија (Faza 1+2) намерно је ограничена на пар вечери рада. Обичан spreadsheet tracker покрива исту функцију дана данас, па нема разлога преширити scope пре него што Faza 1+2 стварно раде.
