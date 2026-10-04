# TestHub — frontend

Telegram Mini App test platformasining frontend qismi. Backend hali yo'q: barcha
ma'lumotlar `services/mock/` qatlamida, `localStorage` (rasmlar — IndexedDB) da
saqlanadi va sahifa yangilanganda yo'qolmaydi.

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
```

Boshqa buyruqlar:

| Buyruq            | Vazifasi                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| `npm run build`   | Ishlab chiqarish uchun yig'ish (`dist/`)                                |
| `npm run preview` | Yig'ilgan versiyani ko'rish                                             |
| `npm test`        | Vitest (grading, import, jonli simulyator, mock API, ilova smoke-testi) |
| `npm run lint`    | ESLint (0 warning)                                                      |
| `npm run format`  | Prettier                                                                |

## Brauzer rejimi va Dev panel

Telegram muhiti topilmasa ilova avtomatik **mock rejimga** o'tadi: soxta
foydalanuvchi, MainButton o'rniga ekran pastidagi tugma, BackButton o'rniga
sarlavhadagi strelka.

Header'ning chap yuqori burchagidagi kichik 🐞 tugmasi Dev panelni ochadi
(brauzerda `npm run dev` da; Telegram ichida faqat URL'ga `?dev=1` qo'shilganda):

- foydalanuvchini almashtirish — 2 o'qituvchi, 1 o'quvchi, 1 admin;
- mavzu (yorug' / qorong'i / tizim) va til (uz / ru);
- tarmoq kechikishi (0 / 300 / 1500 ms) va xato simulyatsiyasi (0 / 30 / 100%);
- kanal obunasi tekshiruvi natijasini majburlash;
- `/dev/ui` — barcha umumiy komponentlar vitrinasi;
- **Reset** — mock ma'lumotlarni boshlang'ich holatga qaytaradi.

## Telegram Mini App sifatida sinash

```bash
npm run dev
npx cloudflared tunnel --url http://localhost:5173   # yoki ngrok http 5173
```

Olingan `https://...` havolasini BotFather'da Mini App URL sifatida qo'ying.
Vite konfiguratsiyasida `allowedHosts: true` va `host: true` yoqilgan.

## Arxitektura

```
src/
├── app/          router (data router), RootLayout, ThemeProvider, DevPanel
├── pages/        sahifalar (TZ 5-bo'lim)
├── components/   umumiy UI kit (TZ 6-bo'lim)
├── features/     test-editor, live, stats
├── services/
│   ├── types.ts  domen tiplari
│   ├── api.ts    yagona interfeys (TestsApi, AttemptsApi, UsersApi, LiveApi...)
│   ├── mock/     hozirgi realizatsiya
│   └── http/     backend ulanganda to'ldiriladi
├── mocks/        seed ma'lumotlar, SVG rasmlar, liveSimulator
├── lib/          grading, importers, telegram, storage, format
├── hooks/        TanStack Query hooklari, usePrimaryAction
├── store/        Zustand (ui, session, dev, toast)
├── i18n/         uz.json (asosiy), ru.json
└── styles/       tokens.css, global.css
```

Qoidalar:

- komponentlar mock'ga to'g'ridan-to'g'ri murojaat qilmaydi — faqat
  `services/api.ts` interfeysi orqali (TanStack Query hooklari ichida);
- ranglar faqat `styles/tokens.css` dagi CSS o'zgaruvchilari orqali (Tailwind
  temasiga ulangan) — komponentlarda hex kod yo'q;
- foydalanuvchiga ko'rinadigan matnlar faqat `i18n/*.json` da;
- javob tekshirish (`lib/grading.ts`) — sof funksiyalar, unit testlar bilan
  qoplangan; keyinchalik backendga o'zgarishsiz ko'chiriladi.

### Backendga o'tish

1. `services/http/` ichida `Api` interfeysini amalga oshiring (resurs boshiga
   bitta fayl, `services/mock/` tuzilishini takrorlab).
2. `.env` da `VITE_API_MODE=http` qiling.

Sahifalar, hooklar va komponentlar o'zgarmaydi.

### Telegram integratsiyasi

`lib/telegram/` — bitta tor interfeys (`TelegramBridge`) va uning ikki
realizatsiyasi: rasmiy `window.Telegram.WebApp` ustidagi adapter va brauzer
uchun `mockTelegram`. Ilovaning qolgan qismi muhitni tekshirmaydi; asosiy
harakat har doim `usePrimaryAction` orqali beriladi.

> Eslatma: TZ da `@telegram-apps/sdk-react` ko'rsatilgan. Uning 3.x versiyasi
> signal-asosidagi API'ga o'tgan va Telegram muhitidan tashqarida mount
> qilinmaydi, shuning uchun rasmiy WebApp API ustidagi adapter tanlandi —
> funksional talablar (MainButton, BackButton, haptic, mavzu, viewport, safe
> area) to'liq qoplangan va SDK'ga o'tish uchun bitta fayl almashtiriladi.

## Navigatsiya

Ilovada pastki navbar bor: Asosiy (`/`), Testlarim (`/my-tests`), markazdagi
"Yaratish" tugmasi (`/tests/new`), Natijalar (`/results`) va Profil
(`/profile`). Navbar to'liq ekranli sahifalarda ko'rsatilmaydi — bu route
konfiguratsiyasidagi `handle: { hideNav: true }` orqali (test ishlash, jonli
test, muharrir) va sahifada `MainButton` ko'rinib turganda avtomatik hal
qilinadi (`app/RootLayout.tsx`).

## Jonli test (5.10 / 5.11)

`mocks/liveSimulator.ts` haqiqiy WebSocket o'rnini bosadi va kelajakdagi
protokol bilan bir xil hodisalarni chiqaradi: `lobby_update`,
`session_started`, `question_show`, `answer_count_update`, `question_end`,
`leaderboard`, `session_paused`, `session_resumed`, `session_finished`.

Sessiyani yaratgan tab (host) simulyatorni yuritadi; ishtirokchi tabi
`BroadcastChannel` orqali ulanadi — shuning uchun bitta brauzerda ikki tabda
host va ishtirokchi sifatida sinash mumkin:

1. Jonli testni oching → **Boshqaruv** → «Jonli sessiyani boshlash».
2. Lobbyda «Ishtirokchi sifatida ochish» tugmasi yangi tab ochadi (yoki bosh
   sahifadagi 6 xonali kod maydoniga kodni kiriting).
3. Soxta ishtirokchilar 0.5–2 soniyada birin-ketin qo'shiladi va savol
   vaqtida tasodifiy javob beradi.

## Mock ma'lumotlar

`mocks/seed.ts` — 9 ta test (4 turning hammasi, 1 qoralama, 1 arxiv), har birida
8–10 savol, 4 xil javob turi, formulalar va SVG rasmlar. Yakunlangan testlarda
30–60 ta soxta urinish (o'zbekcha ismlar, normal taqsimot) — statistika va
reyting to'liq ko'rinadi. Vaqtlar joriy vaqtga nisbatan hisoblanadi: bitta
musobaqa 2 soatdan keyin boshlanadi, boshqasi hozir davom etmoqda.

## Platformaga moslashish

Telegram hamma telefonda bir xil ko'rinmaydi: iPhone'da guruhlangan ro'yxatlar
chetdan ichkarida va burchaklari yumaloq, dialog markazda; Android va desktopda
ro'yxatlar chetdan-chetga, dialog tugmalari o'ng pastda.

Shuning uchun `lib/platform.ts` `WebApp.platform` ni o'qiydi va `<html>` ga
`data-platform="ios" | "base"` qo'yadi. `ListSection`, `ListFeed` va
`ConfirmDialog` shu qiymatga qarab shakl tanlaydi, `.section-header` esa CSS
orqali. Brauzerda har doim `base` ishlaydi.

Yangi ekran yozganda ro'yxatni qo'lda yasamang — `ListSection` / `ListFeed`
ishlating, shunda ikkala platformada ham to'g'ri chiqadi.

## Imtihon rejimi (DTM va Milliy sertifikat)

`exam` turidagi testlar bo'limlarga bo'linadi va natijani boshqacha hisoblaydi.
Barcha koeffitsient va daraja chegaralari `services/types.ts` dagi `ExamConfig`
ichida **ma'lumot** sifatida saqlanadi — qoidalar o'zgarganda `mocks/content/exams.ts`
dagi bitta joy tahrirlanadi, baholash kodiga tegilmaydi.

- **DTM blok test** — 30 + 30 + 30 savol, koeffitsientlari 1.1 / 3.1 / 2.1, jami 189 ball.
- **Milliy sertifikat** — 75 ball, A+ (70) dan C (46) gacha daraja.

Milliy sertifikatning rasmiy natijasi savol qiyinligini hisobga oluvchi Rasch
modeli bo'yicha chiqadi. Uni takrorlab bo'lmaydi, shuning uchun `ExamConfig.approximate`
yoqilgan va natija ekranida baho taxminiy ekani yozib qo'yiladi.

### QR kodni skanerlash

Bosh sahifadagi kod maydonining yonida kamera tugmasi bor: Telegramning o'z skaneri
(`WebApp.showScanQrPopup`, Bot API 6.4) ochiladi, o'qilgan kod jonli xonaga yoki
testga olib boradi. Tugma faqat skaner bor joyda chiziladi — oddiy brauzerda va
eski klientda u umuman ko'rinmaydi.

QR ichidagi matn **ishonchsiz ma'lumot** hisoblanadi: koridordagi plakatga har kim
istalgan havolani bosib qo'yishi mumkin. Shuning uchun `lib/scan.ts` uni faqat uch
shaklda taniydi — 6 xonali kod, ilovaning o'z manzilidagi `/live/<id>` va `/t/<id>` —
va undan faqat identifikator oladi. Yo'nalishni ilovaning o'zi shu identifikatordan
quradi; skanerlangan matnning o'zi hech qachon ochilmaydi. `/live/<id>/host`
ataylab qabul qilinmaydi: o'yinchi boshlovchi boshqaruviga tushib qolmasligi kerak.

Backend ulanmaguncha skaner faqat **shu qurilmadagi** ma'lumotni topa oladi (kodni
qo'lda yozgandagi kabi): boshqa telefonda ochilgan xona bu yerda yo'q.

### Imtihon paytidagi himoya

Uch soatlik varaqni telefon emas, faqat nomzod yakunlashi kerak:

- **Yopishni tasdiqlash** — ishlash paytida ✕ yoki pastga tortish "yopasizmi?" deb so'raydi
  (`WebApp.enableClosingConfirmation`).
- **Ekran o'chmaydi** — Screen Wake Lock; qo'llab-quvvatlanmasa jim o'tkazib yuboriladi.
- **Vaqt ogohlantirishi** — 10 va 5 daqiqa qolganda taymer sariq bo'ladi va haptik beradi
  (`lib/timeWarnings.ts`). Qisqa testda ogohlantirish berilmaydi.
- **Yakunlashdan oldingi xulosa** — javob berilgan / belgilangan / javobsiz, imtihonda blok
  bo'yicha; blokka bosilsa birinchi bo'sh savolga o'tadi.
- **Aloqa uzilishi** — javob endi "yubor va unut" emas: yuborilmagani navbatda turadi
  (`features/attempt/useAnswerSync.ts`), aloqa qaytganda qayta yuboriladi va yakunlash
  navbat bo'shaguncha to'xtatiladi. Faqat vaqt tugaganda varaq baribir yopiladi.

Dev panelida "Xato simulyatsiyasi" ni 100% qilib, bularni sinash mumkin.

### Imtihon yaratish

Imtihon endi sehrgar orqali yaratiladi: `Yangi test` → `Imtihon` → qolip (DTM yoki
Milliy sertifikat) → bloklarning fani. Koeffitsientlar, savollar soni va daraja
chegaralari **qoliptan keladi va tahrirlanmaydi** (`features/exams/presets.ts`) —
aks holda chiqqan ball haqiqiy imtihonga o'xshab ko'rinib, aslida boshqa narsani
bildirar edi.

Savollar qadami bloklarga bo'lingan: har birida `0 / 30` hisobi, o'sha blokka
savol qo'shish va import qilish tugmalari bor. Blok to'lmagan bo'lsa,
`validateExam` nashr qilishga yo'l bermaydi.

Savollar (`mocks/content/examQuestions.ts`) shu loyiha uchun yozilgan: javoblar
formuladan hisoblanadi, parametrlar savol raqamidan kelib chiqadi. Haqiqiy imtihon
varaqalari ko'chirilmagan — ular mualliflik huquqi bilan himoyalangan.

## Testlar

```bash
npm test
```

- `lib/grading.test.ts` — normalizatsiya (lotin/kirill, apostroflar), sonli
  xatolik oralig'i, qisman ball, jarima, jonli ball formulasi;
- `lib/importers.test.ts` — matnli import formati;
- `mocks/liveSimulator.test.ts` — jonli sessiya hodisalari, ball, pauza,
  o'rin o'zgarishi;
- `services/mock/mock.test.ts` — seed ma'lumotlar, test yaratish/nashr qilish,
  ishlash va baholash, urinishlar limiti, joylar limiti, musobaqa oynasi;
- `app/App.test.tsx` — ilovaning haqiqiy render bo'lishi (smoke test).

## Android APK

The app is wrapped for Android with Capacitor (`android/`, `capacitor.config.ts`). It runs on the
mock data layer, the same as in a browser.

- Build in CI: GitHub → Actions → **Android APK** → *Run workflow*. The installable `TestHub.apk`
  appears under the run's artifacts and on the `apk-latest` release.
- Build locally (needs JDK 21 and the Android SDK): `npm run build && npx cap sync android &&
  cd android && ./gradlew assembleDebug`. The file is `android/app/build/outputs/apk/debug/app-debug.apk`.

The APK is debug-signed, so Android asks to allow installs from unknown sources. A Play Store
release needs a release keystore.
