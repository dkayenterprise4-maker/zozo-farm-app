# Zozo Farm App 🌱

**Your Farms, In Your Pocket.** A farm management app for managing multiple farms in Zambia.
It works on Android phones and computers, works **offline**, and saves everything on the phone first.

Built with React + Tailwind CSS as a PWA (Progressive Web App). Currency is Kwacha (K), and dates show as DD/MM/YYYY.

---

## Demo logins

| Role | Email | Password | PIN |
|---|---|---|---|
| Owner (Zozo) | zozo@gmail.com | 123456 | 1234 |
| Worker (John Banda, Farm A) | worker@gmail.com | 123456 | 1234 |
| Worker (Mary Phiri, Farm B) | mary@gmail.com | 123456 | 1234 |

The demo data has 2 farms: **Farm A - Lusaka West** (Maize + Goats) and **Farm B - Chongwe** (Tilapia). You can reset it in Settings → Load Demo Data, or remove it with Settings → Delete All.

---

## What's inside

- **My Farms**: all farms with photo, location, type, this month's profit/loss and number of projects. Search, filter, and grid/list view.
- **Farm Dashboard**: quick buttons, sales, expenses, profit, margin and capital, an Income vs Expenses chart, a monthly profit trend, a projection to December, the top 3 expenses, the best project, insight cards, 5-day weather, tasks and notes.
- **Projects**: unlimited per farm, and one project can mix products (e.g. Maize + Goats). Each tracks its own cost, income and profit.
- **Money**: Sales (qty × price, buyer, Cash/Mobile Money/Bank, receipt photo), Expenses (10 categories, receipt photo, can add to stock), and Capital/Investment (kept separate from income).
- **Income Statement**: per project, per farm, or all farms combined. Filter by Today, Week, Month, Year, All or a custom range. **Exports to Excel, PDF, Word and PowerPoint.**
- **Zozo Assistant**: a floating button on every screen. You can type or speak. It reads your real data ("How did Farm A do this month?", "Create a monthly report for Farm B") and answers farming questions offline. Adding a Claude API key in Settings gives smarter AI answers and photo checks.
- **Crop rotation**: warns when you plant the same crop on the same field and suggests the next crop. It also has a fish feeding calculator, water-change reminders, and livestock vaccination schedules that you can add to Tasks with one tap.
- **Photos**: farm, project, receipt, visit and problem photos. Problem photos get a suggested cause and action.
- **Tasks**: assign to workers, overdue tasks show in red, and alerts go to the notification bell (plus optional phone notifications).
- **Inventory**: low-stock alerts, and stock updates automatically from expenses.
- **Workers**: the owner adds workers and assigns farms. Workers only see their farms, cannot see profit, cannot delete and cannot export.
- **Activity Feed and Visit Log**: a timeline of everything that happens.
- **Settings**: profile, password, PIN, full backup/restore, CSV export, delete data, AI key and cloud sync.

---

## File structure

```
zozo-farm-app/
├── index.html              App entry page
├── vite.config.js          Build + PWA (offline) settings
├── tailwind.config.js      Colours: Deep Green, Light Green, Earth Brown
├── public/                 App icons (leaf + Z logo)
└── src/
    ├── main.jsx            Starts the app, turns on offline mode
    ├── App.jsx             Splash screen, login check, all page routes
    ├── index.css           Shared styles (big buttons, cards, inputs)
    ├── lib/                ── The "brain" (no screens) ──
    │   ├── store.jsx       All data actions, login, roles/permissions, activity feed
    │   ├── db.js           Saves data to IndexedDB + LocalStorage, photo storage
    │   ├── seed.js         Demo farms, sales, expenses, tasks, workers
    │   ├── finance.js      ALL money maths: statement, margin, projection, insights
    │   ├── exports.js      Excel / PDF / Word / PowerPoint export
    │   ├── assistant.js    Zozo Assistant (built-in + optional Claude AI)
    │   ├── knowledge.js    Farming knowledge for Zambia + photo problem hints
    │   ├── guidance.js     Crop rotation, fish feeding, livestock schedules
    │   ├── weather.js      5-day forecast (Open-Meteo, free) + planting advice
    │   ├── sync.js         Optional Supabase cloud sync
    │   ├── constants.js    Crops/animals/fish list, expense categories, units
    │   └── utils.js        Kwacha formatting, DD/MM/YYYY dates, periods
    ├── components/         ── Reusable pieces ──
    │   ├── Layout.jsx      Top bar, bottom menu, AI button, offline badge, notifications
    │   ├── ui.jsx          Buttons, modals, confirm dialog, photo picker, search...
    │   ├── Charts.jsx      Bar / line / pie charts
    │   ├── TxList.jsx      Sales/expense/capital lists with search + filters
    │   ├── FarmForm.jsx, ProjectForm.jsx, Weather.jsx
    └── pages/              ── One file per screen ──
        Auth.jsx (Login / PIN / Sign Up), Farms.jsx, FarmDashboard.jsx, Projects.jsx,
        ProjectDetail.jsx, TransactionForm.jsx, Transactions.jsx, Statement.jsx,
        Assistant.jsx, Workers.jsx, Inventory.jsx, Tasks.jsx, Gallery.jsx, Visits.jsx,
        ActivityFeed.jsx, WorkerHome.jsx, Settings.jsx, More.jsx
```

The `dist/` folder is the finished, built app. Those are the files you upload to a website host.

---

## Run it on your computer

1. Install **Node.js** (version 18 or newer) from https://nodejs.org (choose "LTS").
2. Unzip `zozo-farm-app.zip` and open a terminal (Command Prompt) in the folder.
3. Install the parts the app needs (one time, needs internet):
   ```
   npm install
   ```
4. Start it:
   ```
   npm run dev
   ```
5. Open the link it shows (e.g. http://localhost:5173) in Chrome.
   To try it on your phone over the same Wi-Fi, open the "Network" link it prints (e.g. http://192.168.1.5:5173).

To make the final version: `npm run build`. The result goes into `dist/`. You can test that version with `npm run preview`.

---

## Put it on a phone (free)

### Option A: Free website + "Add to Home screen" (easiest, recommended)

**Netlify Drop (no account setup needed beyond sign-up):**
1. Go to https://app.netlify.com/drop
2. Drag the **`dist` folder** onto the page.
3. You get a link like `https://zozo-farm.netlify.app`. You can rename it in Site settings.

**Or Vercel:** sign up at https://vercel.com, then "Add New → Project". Upload the source code (or connect GitHub), and Vercel builds it automatically (Build command `npm run build`, Output folder `dist`).

**Then on Zozo's Android phone:**
1. Open the link in **Chrome**.
2. Tap the **⋮ menu → "Add to Home screen"** (or "Install app").
3. The Zozo Farm icon appears like a normal app. It opens full screen and **works offline** after the first visit.

> Each phone keeps its own data. To share data between the owner's phone and workers' phones, turn on Cloud Sync (below).

### Option B: Real Android app file (APK) with Capacitor (optional)

```
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Zozo Farm" com.zozo.farm --web-dir=dist
npm run build
npx cap add android
npx cap sync
npx cap open android
```
Android Studio opens (install it from https://developer.android.com/studio). Choose **Build → Build APK(s)**, then send the APK file to the phone by WhatsApp or USB and install it. Run `npm run build && npx cap sync` again after any change.

---

## Optional extras

### Smart AI (Claude)
Settings → Smart AI → paste an API key from https://console.anthropic.com. This needs internet and is paid per use (small amounts). Without a key, the built-in assistant still works, and it works offline.
Note: the key is stored on the phone, so only use this on phones you trust.

### Cloud Sync (Supabase, free tier)
1. Create a free project at https://supabase.com.
2. In **SQL Editor**, run:
   ```sql
   create table zozo_sync (id text primary key, data jsonb, updated_at timestamptz default now());
   alter table zozo_sync enable row level security;
   create policy "anon full access" on zozo_sync for all using (true) with check (true);
   ```
3. Copy **Project URL** and **anon public key** (Project Settings → API) into Settings → Cloud Sync on each phone.
4. Press **Sync Now**. After that, the app syncs automatically whenever there is internet.

This simple setup is fine for a family business. Anyone with the key can read the data, so keep the key private. For stronger security, add Supabase Auth later. Photos stay on each phone; use Full Backup to keep them safe.

### Backups
Settings → **Full Backup** downloads one file with everything, including photos. Save it to Google Drive or WhatsApp it to yourself. Use **Restore** to load it on a new phone.

---

## Notes
- Weather uses the free Open-Meteo service (no key). When the phone is offline, it shows the last saved forecast or a seasonal estimate.
- Voice input works in Chrome on Android. "Read aloud" uses the phone's voice.
- Date pickers follow the phone's language setting. All other dates in the app show as DD/MM/YYYY.
