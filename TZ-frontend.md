# TEXNIK TOPSHIRIQ — 1-QISM: FRONTEND

## Loyiha: "TestHub" — Telegram Mini App test platformasi

> **Claude Code uchun eslatma:**
> Bu bosqichda **faqat frontend** yoziladi. Backend YO'Q — barcha ma'lumotlar **mock (namunaviy) ma'lumotlar** orqali ishlaydi, lekin ilova **to'liq ishlaydigan** bo'lishi kerak: test yaratish, ishlash, natija, jonli test simulyatsiyasi — hammasi haqiqiydek ishlasin.
> Keyinchalik backend ulanganda faqat `services/` qatlamini almashtirish kifoya bo'lishi uchun arxitekturani shunga moslab qur (8-bo'lim).
> Ishni **11-bo'limdagi bosqichlar** tartibida bajar. Har bosqichdan keyin qisqa hisobot ber va tasdiq kut. Aniq yozilmagan muhim qaror kerak bo'lsa — so'ra.
> Umumiy loyiha talablari `TZ.md` faylida. Ushbu fayl frontend uchun undan ustun turadi.

---

## 1. Maqsad

Telegram Mini App'ning to'liq frontend qismini yaratish:

- Barcha sahifalar va holatlar (bo'sh holat, yuklanish, xato) tayyor.
- Mock ma'lumotlar bilan to'liq ishlaydi, yaratilgan ma'lumotlar sahifa yangilanganda ham saqlanib qoladi.
- Oddiy brauzerda ham (Telegram'siz) ochib ko'rish va sinash mumkin.
- Dizayn toza, zamonaviy va ta'limga mos.

---

## 2. Texnologiyalar

| Vazifa        | Texnologiya                                                               |
| ------------- | ------------------------------------------------------------------------- |
| Asos          | **React 18 + TypeScript (strict) + Vite**                                 |
| Telegram      | `@telegram-apps/sdk-react`                                                |
| Stil          | **Tailwind CSS** + CSS o'zgaruvchilari (dizayn tokenlari)                 |
| Routing       | React Router v6                                                           |
| Holat         | Zustand (UI holati) + TanStack Query (ma'lumotlar)                        |
| Formulalar    | **KaTeX** (`react-katex` yoki o'z `MathText` komponenti)                  |
| Diagrammalar  | Recharts                                                                  |
| Animatsiyalar | Framer Motion (me'yorida)                                                 |
| Ikonkalar     | lucide-react                                                              |
| Shriftlar     | Inter (matn), Source Serif 4 (sarlavhalar), JetBrains Mono (kod/raqamlar) |
| Excel         | SheetJS (`xlsx`) — import/eksport                                         |
| i18n          | i18next (uz — asosiy, ru)                                                 |
| Formalar      | React Hook Form + Zod                                                     |

---

## 3. Dizayn konsepsiyasi

### 3.1. Uslub — "Claude uslubi"

Interfeys Claude ilovasining uslubida bo'lsin:

- **Tinch va toza:** ortiqcha bezaksiz, keng bo'sh joylar (whitespace), kontent markazda.
- **Iliq neytral fon:** sof oq emas, biroz iliq, qog'ozga o'xshash och fon.
- **Sarlavhalarda serif shrift** (Source Serif 4) — kitobiy, ilmiy kayfiyat; oddiy matnda Inter.
- **Yumshoq kartalar:** katta radius, ingichka chegara (border), soya juda yengil yoki umuman yo'q.
- **Bitta asosiy aksent rang** — faqat muhim tugma va faol elementlarda. Rang ko'p ishlatilmaydi.
- **Nozik animatsiyalar:** fade/slide 150–250ms, sakrab turuvchi yoki "o'yinchoq" effektlar yo'q (jonli test bundan mustasno — u yerda biroz jonliroq bo'lishi mumkin).
- Ikonkalar ingichka chiziqli (lucide, `strokeWidth={1.75}`).

### 3.2. Ranglar — ta'lim palitrasi

Asosiy g'oya: **chuqur ko'k** (bilim, ishonch, diqqat) + **iliq sariq/amber** (energiya, rag'bat) + **yashil** (muvaffaqiyat). Fon — iliq, ko'zni charchatmaydigan.

Barcha ranglar `src/styles/tokens.css` da CSS o'zgaruvchilari sifatida yoziladi va Tailwind konfiguratsiyasiga ulanadi. Komponentlarda to'g'ridan-to'g'ri hex kod yozish **taqiqlanadi**.

**Yorug' mavzu:**

| Token             | Qiymat    | Ishlatilishi                                |
| ----------------- | --------- | ------------------------------------------- |
| `--bg`            | `#FAF8F4` | Asosiy fon (iliq qog'oz)                    |
| `--surface`       | `#FFFFFF` | Kartalar                                    |
| `--surface-muted` | `#F2EFE8` | Ikkinchi darajali bloklar, input foni       |
| `--border`        | `#E6E1D6` | Chegaralar                                  |
| `--text`          | `#1F2433` | Asosiy matn                                 |
| `--text-muted`    | `#6B7080` | Ikkinchi darajali matn                      |
| `--primary`       | `#2B4C8C` | Asosiy aksent (akademik ko'k)               |
| `--primary-hover` | `#223D72` |                                             |
| `--primary-soft`  | `#E8EEF8` | Tanlangan element foni                      |
| `--accent`        | `#E0A526` | Rag'bat: yulduz, medal, bonus, e'tibor      |
| `--accent-soft`   | `#FBF1DA` |                                             |
| `--on-primary`    | `#FFFFFF` | `--primary` foni ustidagi matn va ikonkalar |
| `--on-accent`     | `#1F1A0E` | `--accent` foni ustidagi matn va ikonkalar  |
| `--success`       | `#2F8F5B` | To'g'ri javob                               |
| `--success-soft`  | `#E3F3EA` |                                             |
| `--danger`        | `#C4473A` | Noto'g'ri javob, o'chirish                  |
| `--danger-soft`   | `#F9E5E2` |                                             |
| `--info`          | `#3E7CB1` | Ma'lumot, jonli holat                       |

**Qorong'i mavzu:**

| Token             | Qiymat    |
| ----------------- | --------- |
| `--bg`            | `#1A1C22` |
| `--surface`       | `#23262E` |
| `--surface-muted` | `#2C2F38` |
| `--border`        | `#353945` |
| `--text`          | `#ECEAE5` |
| `--text-muted`    | `#9A9EAB` |
| `--primary`       | `#7A9CE0` |
| `--primary-hover` | `#92AFE8` |
| `--primary-soft`  | `#2A3350` |
| `--accent`        | `#F0BB4A` |
| `--accent-soft`   | `#3D3320` |
| `--on-primary`    | `#0F1420` |
| `--on-accent`     | `#1F1A0E` |
| `--success`       | `#5BBE86` |
| `--success-soft`  | `#1F3A2B` |
| `--danger`        | `#E07268` |
| `--danger-soft`   | `#40241F` |
| `--info`          | `#6FA6D6` |

**Test turlari uchun belgi ranglari (badge):**

- Oddiy — `--primary`
- Musobaqa — `--accent`
- Cheklangan — `--info`
- Jonli — `--danger` + pulsatsiyalanuvchi nuqta

**Mavzu tanlash:** Telegram ichida — `colorScheme` bo'yicha avtomatik. Brauzerda — tizim sozlamasi bo'yicha, sozlamalarda qo'lda o'zgartirish ham mumkin. Kontrast WCAG AA darajasidan past bo'lmasin.

### 3.3. Tipografiya

| Element                      | Shrift         | O'lcham / qalinlik                           |
| ---------------------------- | -------------- | -------------------------------------------- |
| Sahifa sarlavhasi            | Source Serif 4 | 26px / 600                                   |
| Bo'lim sarlavhasi            | Source Serif 4 | 20px / 600                                   |
| Karta sarlavhasi             | Inter          | 16px / 600                                   |
| Asosiy matn                  | Inter          | 15px / 400, qator oralig'i 1.55              |
| Kichik matn                  | Inter          | 13px / 400                                   |
| Taymer va test kodi          | JetBrains Mono | `tabular-nums`                               |
| Ballar, statistika raqamlari | Inter          | `tabular-nums`                               |
| Savol matni                  | Inter          | 17px / 400 (o'qish qulayligi uchun kattaroq) |

### 3.4. O'lchamlar

- Oraliqlar 4px tizimida (4, 8, 12, 16, 24, 32).
- Radius: tugma va input — 12px, karta — 16px, katta modal/bottom sheet — 24px.
- Sahifa yon chekkasi — 16px. Kontent maksimal kengligi — 640px (planshet/desktopda markazda).
- Bosiladigan elementlar kamida 44×44px.
- Nofaol tugmalar: fon `--surface-muted`, matn `--text-muted`; `opacity` ishlatilmaydi.
- Gorizontal scroll bo'lgan barcha joylarda scrollbar yashiriladi (`.no-scrollbar`).

---

## 4. Telegram integratsiyasi va brauzer rejimi

- `MainButton` — har sahifadagi asosiy harakat uchun ("Testni boshlash", "Keyingi", "Saqlash"). Brauzer rejimida uning o'rniga ekran pastida yopishgan oddiy tugma chiqadi (yagona `usePrimaryAction` hook orqali).
- `BackButton` — ichki sahifalarda.
- Haptic feedback: javob tanlash (`selection`), to'g'ri/noto'g'ri (`notification success/error`), test tugashi.
- Safe area va `viewport` balandligi o'zgarishlarini hisobga olish.
- Ilova ochilganda va mavzu o'zgarganda `setHeaderColor`, `setBackgroundColor` va `setBottomBarColor` joriy `--bg` qiymatiga o'rnatiladi — Telegram header'i bilan ilova orasida chok ko'rinmaydi.
- **Brauzer rejimi (dev):** agar Telegram muhiti topilmasa, `mockTelegram.ts` soxta foydalanuvchi va muhit yaratadi. Ekran burchagida kichik **"Dev panel"** bo'ladi:
  - foydalanuvchini almashtirish (3–4 ta namunaviy foydalanuvchi, jumladan admin),
  - mavzuni almashtirish (yorug'/qorong'i),
  - tilni almashtirish,
  - mock ma'lumotlarni boshlang'ich holatga qaytarish (reset),
  - tarmoq kechikishini sozlash (0 / 300 / 1500ms) va xato simulyatsiyasi.
    Dev panel header'ning chap yuqori burchagidagi kichik (28px) tugma orqali ochiladi va kontent ham, navbar ham ustiga chiqmaydi. Brauzerda `import.meta.env.DEV` da, Telegram ichida esa faqat URL'da `?dev=1` bo'lganda ko'rinadi.

---

## 5. Sahifalar

### 5.0. Navigatsiya

Ilova bo'ylab yagona **pastki navbar** (`components/BottomNav.tsx`) — 5 ta element:

| Element             | Ikonka (lucide) | Route        |
| ------------------- | --------------- | ------------ |
| Asosiy              | `House`         | `/`          |
| Testlarim           | `LibraryBig`    | `/my-tests`  |
| Yaratish (markazda) | `Plus`          | `/tests/new` |
| Natijalar           | `Trophy`        | `/results`   |
| Profil              | `User`          | `/profile`   |

**Ko'rinishi:**

- `position: fixed; bottom: 0`, balandligi 64px + `env(safe-area-inset-bottom)`.
- Fon — `--surface` 85% shaffoflik + `backdrop-filter: blur(12px)`, yuqorisida 1px `--border`.
- Faol element: ikonka va yozuv `--primary` rangda, yozuv ostida 4px indikator nuqta. Nofaol — `--text-muted`. Yozuv 11px, ikonka 22px.
- "Yaratish": 48px `--primary` doira, ichida `--on-primary` rangli `+`, navbar chizig'idan 12px yuqoriga ko'tarilgan, yengil soya, yozuvsiz.
- Har bosishda `hapticFeedback.selectionChanged()`.

**Yashirilishi.** Navbar quyidagi holatlarda ko'rsatilmaydi:

- route konfiguratsiyasida `handle: { hideNav: true }` bo'lsa — test ishlash (5.6), jonli test host va ishtirokchi (5.10, 5.11), test muharriri (5.2; import oynasi ham shu sahifa ichida);
- sahifada `MainButton` (brauzerda uning o'rnini bosuvchi pastki tugma) ko'rinib turgan bo'lsa — ikki panel hech qachon ustma-ust tushmaydi.

Qaror layout darajasida (`app/RootLayout.tsx`) qabul qilinadi, sahifalar buni o'zi hal qilmaydi.

**Kontent oralig'i.** Navbar ko'rinadigan sahifalarda kontentga pastdan
`calc(64px + env(safe-area-inset-bottom) + 16px)` bo'shliq beriladi (`--nav-height` o'zgaruvchisi orqali). Hech bir element navbar ostida qolmasligi kerak. Suzuvchi "Yangi test" (FAB) tugmasi ishlatilmaydi.

#### 5.0.1. Testlarim (`/my-tests`)

- Sarlavha "Testlarim", o'ng tomonda qidiruv ikonkasi — bosilganda qidiruv maydoni ochiladi.
- Filtr chiplari sonlar bilan: Hammasi, Qoralama, Rejalashtirilgan, Faol, Yakunlangan, Arxiv (`Faol · 3`).
  - Balandligi 32px, shrift 13px; faol chip — fon `--primary-soft`, matn `--primary`, qalin chegarasiz.
  - Gorizontal scroll, scrollbar ko'rinmaydi, o'ng chetda `--bg` ga o'tuvchi gradient.
  - Soni nolga teng chiplar umuman ko'rsatilmaydi ("Hammasi" doim ko'rinadi); tanlangan chip bo'shab qolsa avtomatik "Hammasi"ga qaytiladi.
  - Foydalanuvchida test bo'lmasa chiplar ko'rsatilmaydi — faqat bitta tugmali bo'sh holat.
- Test kartalari ro'yxati (`TestCard`, 5.0.3). Qoralama — muharrirga, qolganlari boshqaruv paneliga olib boradi.

#### 5.0.2. Natijalar (`/results`)

- Yuqorida umumiy statistika: ishlangan testlar, o'rtacha natija, eng yaxshi natija.
- Ishlangan testlar ro'yxati: nom, sana, ball, foiz. Foiz rangi — ≥80% `--success`, 50–79% `--accent`, <50% `--danger`.
- Qator bosilganda natija sahifasiga (5.7) o'tadi.
- Bo'sh holat: "Kod bilan qo'shilish" tugmasi bilan.

#### 5.0.3. Test kartasi (`TestCard`)

Barcha ro'yxatlarda bir xil karta ishlatiladi. Tuzilmasi yuqoridan pastga:

1. **Test nomi** — 16px, 600, ko'pi bilan 2 qator, so'ng ellipsis. Nom bo'sh bo'lsa `--text-muted` kursivda "Nomsiz test".
2. **Belgilar** — turi va holati.
3. **Meta** — savollar soni, ishtirokchilar soni, sana.

Chapda 64px kvadrat: muqova rasmi, bo'lmasa `--primary-soft` fonda turga mos ikonka.

- **Tur belgisi** hamma turlar uchun neytral: fon `--surface-muted`, matn `--text-muted`; faqat ikonka turning rangida (Oddiy `FileText` / `--primary`, Musobaqa `Trophy` / `--accent`, Cheklangan `Users` / `--info`, Jonli `Radio` / `--danger`).
- **Holat belgisi** yumshoq fon bilan: Qoralama — neytral, Rejalashtirilgan — `--info`, Faol — `--success`, Yakunlangan — `--text-muted`, Arxiv — `--text-muted` + kursiv.
- **"Efirda"** (qizil pulsatsiyalanuvchi nuqta) — faqat shu testning jonli sessiyasi haqiqatan ochiq bo'lganda. Test turi "Jonli" bo'lishi o'z-o'zidan yetarli emas.
- **Qoralama** kartasida meta qatori o'rniga keyingi qadam ko'rsatiladi ("Savollar qo'shilmagan" yoki "12 savol · tahrirlanmoqda") va pastda `--primary` rangli "Davom ettirish →". Bosilganda muharrir oxirgi ochilgan qadamda ochiladi.
- **Ixcham ko'rinish** (`compact`) — sanoqlar va holat belgisisiz: nom, turi va sana. Bosh sahifadagi tasmalar uchun.

---

### 5.1. Bosh sahifa (`/`)

Tartib yuqoridan pastga:

1. **Ixcham header** — "Salom, Aziz 👋" (Source Serif 4, 22px, bir qatorda, uzun ism ellipsis bilan qisqaradi). Ostida 14px `--text-muted` qisqa jumla. Ajratuvchi chiziq yo'q.

2. **Kod bilan qo'shilish** — bitta qatorli ixcham karta:
   - placeholder "Test kodi" (oddiy matn, `letter-spacing` siz); `letter-spacing: 0.3em` va JetBrains Mono faqat kiritilgan qiymatga qo'llanadi;
   - `inputMode="numeric"`, `maxLength={6}`; 6 ta raqam kiritilishi bilan avtomatik yuboriladi;
   - tugma nofaol holatda fon `--surface-muted`, matn `--text-muted`.

3. **Statistika** — faqat foydalanuvchida kamida 1 ta urinish yoki 1 ta yaratilgan test bo'lsa ko'rinadi. Bitta karta ichida 3 ustun, vertikal ajratuvchilar bilan: "Ishlangan", "O'rtacha", "Yaratilgan". Qiymat 20px Inter `tabular-nums`. Hali test ishlanmagan bo'lsa "O'rtacha" qiymati `0%` emas, `—`.

4. **Dinamik bo'limlar** — har biri bo'sh bo'lsa umuman ko'rinmaydi:
   - **Davom ettirish** — tugallanmagan urinishlar (progress chizig'i va "X / Y savol" bilan) hamda nashr qilinmagan qoralamalar; oxirgi o'zgartirilgani birinchi;
   - **Yaqinda boshlanadi** — ro'yxatdan o'tilgan musobaqalar, gorizontal scroll kartalar, teskari sanoq bilan;
   - **Jonli testlar** — hozir lobby holatida turgan, qo'shilish mumkin bo'lgan sessiyalar (kod ko'rsatiladi);
   - **So'nggi faoliyat** — oxirgi 3 ta nashr qilingan yoki ishlangan test (qoralamalarsiz), har biri `TestCard` ixcham ko'rinishida, "Hammasini ko'rish" havolasi bilan (`/my-tests` yoki `/results`).

5. **Yangi foydalanuvchi uchun bo'sh holat** — hech qanday faoliyat bo'lmasa 4-band o'rniga bitta karta: illustratsiya, "Xush kelibsiz!", qisqa matn va ikkita tugma — "Test yaratish" (primary) va "Kod bilan qo'shilish" (secondary, bosilganda kod maydoniga focus beradi). Boshqa dublikat tugma bo'lmaydi.

6. **Tezkor harakatlar** — foydalanuvchining o'z kontenti kam bo'lganda (atigi 1 ta bo'lim ko'rinsa) eng pastda 2×2 grid: "Test yaratish", "Excel'dan import", "Kod bilan qo'shilish", "Natijalarim". Kontent yetarli bo'lsa blok ko'rinmaydi. Ochiq jonli sessiyalar hammaga ko'rinadi, shuning uchun bu hisobga kirmaydi.

Bosh sahifada "Mening testlarim / Ishlaganlarim" tablari va holat filtri **bo'lmaydi** — ular 5.0.1 va 5.0.2 sahifalariga ko'chirilgan. Profil ikonkasi ham yo'q — profil navbarda.

### 5.2. Test yaratish ustasi (`/tests/new`, `/tests/:id/edit`)

Qadam-baqadam (stepper), har qadam yuqorida progress bilan:

1. **Tur tanlash** — 4 ta katta karta (Oddiy, Musobaqa, Cheklangan, Jonli), har birida ikonka va 1 qatorli tavsif.
2. **Asosiy ma'lumotlar** — nom, tavsif, muqova rasmi, fan/kategoriya. Nom majburiy: Zod sxemasi kamida 3 belgi talab qiladi, aks holda maydon ostida xato chiqadi va "Keyingi" tugmasi nofaol bo'ladi.
3. **Savollar** — savollar ro'yxati (drag & drop bilan tartiblash), qo'shish, nusxalash, o'chirish, import (5.3).
4. **Sozlamalar** — turga qarab o'zgaradi: vaqt oralig'i, davomiylik, ishtirokchilar limiti, urinishlar soni, kirish turi (ochiq/parol/taklif), kanal obunasi, aralashtirish, jarima ball, orqaga qaytish, natija ko'rsatish, anti-cheat.
5. **Ko'rib chiqish va nashr** — umumiy xulosa, validatsiya xatolari ro'yxati (masalan, "5-savolda to'g'ri javob belgilanmagan"), "Qoralama sifatida saqlash" va "Nashr qilish".

Qoralama har o'zgarishda avtomatik saqlanadi ("Saqlandi ✓" belgisi). Nomi kiritilmagan qoralama "Nomsiz test" nomi bilan saqlanadi. Oxirgi ochilgan qadam eslab qolinadi — qoralama kartasidan qaytib kirilganda o'sha qadamdan davom etadi.

### 5.3. Savol muharriri (bottom sheet yoki alohida sahifa)

- Savol turi: bitta variant / bir nechta variant / matnli javob / sonli javob.
- **Kontent bloklari:** "Matn", "Formula", "Rasm" bloklarini qo'shish, tartiblash, o'chirish.
- **Formula bloki:** LaTeX kiritish maydoni + ostida **jonli preview**. Tez belgilar paneli: `x²`, `xₙ`, kasr, `√`, `∑`, `∫`, `π`, `α β γ θ`, `≤ ≥ ≠`, `∞`, `→`, matritsa. Matn bloki ichida ham `$...$` ishlaydi.
- **Rasm bloki:** fayl tanlash, preview, brauzerda siqish (maks. 1600px, webp), mock rejimda base64 yoki `URL.createObjectURL` + IndexedDB'da saqlash.
- **Variantlar:** 2–8 ta, har biri ham matn/formula/rasm bo'lishi mumkin; to'g'risini belgilash (bitta turda radio, ko'p turda checkbox).
- **Matnli javob:** qabul qilinadigan javoblar ro'yxati (teg ko'rinishida).
- **Sonli javob:** to'g'ri qiymat + ruxsat etilgan xatolik (±).
- Ball, vaqt (jonli uchun), izoh/yechim.
- Pastda **"Ishtirokchi ko'rinishi"** tugmasi — savol ishtirokchiga qanday ko'rinishini ko'rsatadi.

### 5.4. Import oynasi

- Excel shablonini yuklab olish va yuklash.
- Matnli format (`*` — to'g'ri javob) maydoni.
- Tahlil natijasi: nechta savol topildi, xatolar qatori bilan, tasdiqlashdan oldin ko'rib chiqish.

### 5.5. Test sahifasi — boshlashdan oldin (`/t/:id`)

- Nom, muallif, tavsif, turi, savollar soni, davomiylik, urinishlar.
- Turga qarab holat:
  - Musobaqa: boshlanishgacha **katta teskari sanoq** yoki "Tugashiga 45:12 qoldi"; "Ro'yxatdan o'tish" tugmasi.
  - Cheklangan: "37 / 50 joy band" progress chizig'i; joy tugasa — "Joylar tugagan".
  - Parolli: parol kiritish maydoni.
  - Kanal sharti: kanallar ro'yxati + "Obuna bo'ldim, tekshirish" (mock'da tasodifiy/sozlanadigan natija).
- "Testni boshlash" (MainButton).

### 5.6. Test ishlash (`/t/:id/attempt/:attemptId`)

- Yuqorida: savol raqami (`7 / 30`), progress chizig'i, taymer (oxirgi 1 daqiqada `--danger` rangga o'tadi va yumshoq pulsatsiya).
- Savol kartasi: matn + formulalar + rasmlar (rasm bosilganda to'liq ekranda zoom).
- Javob variantlari — katta bosiladigan kartalar, tanlanganda `--primary-soft` fon va chegara.
- Matnli/sonli javob uchun input (sonli uchun raqamli klaviatura: `inputMode="decimal"`).
- Pastda: "Oldingi" / "Keyingi"; savollar paneli (grid) — javob berilgan, berilmagan, "belgilangan" (bayroqcha) savollar.
- Javoblar avtomatik saqlanadi, sahifa yangilansa davom etadi.
- "Yakunlash" — tasdiqlash oynasi: "3 ta savolga javob berilmagan. Yakunlaysizmi?"
- Vaqt tugasa — avtomatik yakunlanadi.
- Anti-cheat: `visibilitychange` hisoblanadi, qaytganda ogohlantirish chiqadi.
- Orqaga qaytish taqiqlangan sozlamada "Oldingi" yashiriladi.

### 5.7. Natija sahifasi (`/t/:id/result/:attemptId`)

- Katta aylanma ko'rsatkich (foiz), ball, vaqt, reytingdagi o'rin.
- Natijaga qarab qisqa rag'batlantiruvchi matn (masalan, 90%+ → "A'lo natija! 🏆").
- Ruxsat bo'lsa: har bir savol — ishtirokchi javobi, to'g'ri javob, izoh (`--success` / `--danger` belgilar).
- "Natijani ulashish" (Telegram `switchInlineQuery` yoki havola nusxalash).

### 5.8. Reyting (`/t/:id/leaderboard`)

- Top-3 podium ko'rinishida (oltin/kumush/bronza — `--accent` asosida), keyin ro'yxat.
- Joriy foydalanuvchi qatori ajratib ko'rsatiladi va ro'yxat pastida yopishib turadi.

### 5.9. Test yaratuvchi paneli (`/tests/:id/manage`)

- Holat va boshqaruv tugmalari: nashr qilish, to'xtatish, yakunlash, arxivlash, nusxalash, o'chirish (holatga qarab faqat ruxsat etilganlari faol).
- Havola va QR kod, taklif kodi, nusxalash tugmalari.
- Tablar:
  - **Ishtirokchilar** — jadval (ism, ball, %, vaqt, chiqishlar soni), saralash, qidiruv; qator bosilganda batafsil javoblar.
  - **Tahlil** — ball taqsimoti diagrammasi, o'rtacha ko'rsatkichlar, savollar bo'yicha to'g'ri javob foizi, eng qiyin 5 savol, har savol uchun variantlar taqsimoti.
  - **Eksport** — Excel yuklab olish (SheetJS bilan haqiqatda ishlasin).

### 5.10. Jonli test — host ko'rinishi (`/live/:sessionId/host`)

- **Lobby:** katta 6 xonali kod, QR, qo'shilganlar soni va ismlari (animatsiya bilan paydo bo'ladi), "Boshlash".
- **Savol vaqtida:** savol, qolgan vaqt (aylanma taymer), "Javob berdi: 23 / 31", variantlar bo'yicha jonli ustunli diagramma (javoblar kelgan sari o'sadi), "Keyingiga o'tish", "Pauza".
- **Savoldan keyin:** to'g'ri javob, taqsimot, top-10 reyting (o'rinlar o'zgarishi animatsiyasi).
- **Yakun:** podium + to'liq natijalar.

### 5.11. Jonli test — ishtirokchi ko'rinishi (`/live/:sessionId`)

- Kod bilan qo'shilish → "Kutilmoqda... 31 ishtirokchi" ekrani.
- Savol chiqqanda — savol + variantlar + taymer; javob berilgach "Javobingiz qabul qilindi" va kutish.
- Savol tugagach — to'g'ri/noto'g'ri, olingan ball (+tezlik bonusi, `--accent`), joriy o'rni.
- Yakunda — shaxsiy natija va podium.

### 5.12. Profil va sozlamalar (`/profile`)

- Profil ma'lumotlari (Telegram'dan), umumiy statistika, til, mavzu.

### 5.13. Admin panel (`/admin`, faqat admin uchun)

- Foydalanuvchilar va testlar ro'yxati, bloklash, umumiy statistika (oddiy jadvallar yetarli).

**Har bir sahifada:** yuklanish holati (skeleton), bo'sh holat, xato holati ("Qayta urinish" tugmasi bilan).

---

## 6. Asosiy komponentlar (`src/components/`)

`Button`, `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Switch`, `Tabs`, `BottomSheet`, `Modal`, `ConfirmDialog`, `Toast`, `Skeleton`, `EmptyState`, `ProgressBar`, `CircularProgress`, `Countdown`, `Timer`, `Avatar`, `Stepper`,
`MathText` (matn ichidagi `$...$` va `$$...$$` ni KaTeX bilan render qiladi, xato LaTeX'da qizil ramkada xom matnni ko'rsatadi),
`ContentBlocks` (bloklar massivini render qiladi), `QuestionView`, `OptionCard`, `QuestionEditor`, `FormulaInput`, `ImageUploader`, `ImageZoom`, `QuestionNavigator`, `TestCard`, `TestTypeBadge`, `Leaderboard`, `Podium`, `LiveAnswerChart`.

Barcha komponentlar faqat dizayn tokenlaridan foydalanadi va ikkala mavzuda tekshiriladi.

---

## 7. Mock ma'lumotlar

`src/mocks/seed.ts` — boshlang'ich ma'lumotlar. Hammasi **o'zbek tilida, real ko'rinishdagi** bo'lsin:

- **4 ta foydalanuvchi:** 2 ta o'qituvchi (test yaratuvchi), 1 ta o'quvchi, 1 ta admin.
- **Kamida 8 ta test**, jumladan:
  - "Algebra: kvadrat tenglamalar" — oddiy, formulalarga boy (`$ax^2+bx+c=0$`, diskriminant, `$\sqrt{}$`, kasrlar).
  - "Fizika: mexanika asoslari" — musobaqa, rasmli savollar (grafiklar, chizmalar — `src/mocks/images/` ichida oddiy SVG sifatida chizilsin, tashqi havolalarsiz).
  - "Ingliz tili: Present Perfect" — oddiy, matnli javoblar bilan.
  - "Geometriya olimpiadasi" — cheklangan (50 joy, 47 band), rasm + formula.
  - "Tarix: Amir Temur davri" — jonli test.
  - "Kimyo: moddalar formulasi" — sonli javoblar va `$H_2SO_4$` kabi formulalar.
  - 1 ta qoralama, 1 ta arxivlangan va 1 ta yakunlangan (vaqti o'tgan) musobaqa — kartaning barcha holatlari ko'rinishi uchun.
- **1 ta ochiq jonli sessiya** (lobby holatida, ishtirokchilari bilan) — "Efirda" belgisi va bosh sahifadagi "Jonli testlar" bo'limi birinchi ochilishdayoq ko'rinadi.
- Har testda 8–20 ta savol, barcha 4 javob turi ishtirok etsin.
- Yakunlangan testlar uchun **30–80 ta soxta ishtirokchi urinishi** (o'zbekcha ismlar, realistik ball taqsimoti) — statistika va reyting to'liq ko'rinsin.
- Vaqtlar **joriy vaqtga nisbatan** hisoblansin (masalan, musobaqa "2 soatdan keyin boshlanadi", boshqasi "hozir faol"), shunda har doim barcha holatlarni ko'rish mumkin bo'ladi.

**Saqlash:** mock "baza" `localStorage` (rasmlar uchun IndexedDB) da saqlanadi — yangi yaratilgan testlar, urinishlar va javoblar sahifa yangilanganda yo'qolmaydi. Dev paneldagi "Reset" boshlang'ich holatga qaytaradi.

### 7.1. Jonli test simulyatsiyasi

`src/mocks/liveSimulator.ts` haqiqiy WebSocket o'rniga ishlaydi:

- Lobby'da soxta ishtirokchilar 0.5–2 soniya oraliqda birin-ketin qo'shiladi.
- Savol vaqtida ular tasodifiy vaqtlarda javob beradi (to'g'ri javob ehtimoli sozlanadigan, masalan 60%).
- Tezlik bonusi, reyting va o'rin o'zgarishlari haqiqiy formula bo'yicha hisoblanadi.
- Simulyator **kelajakdagi WebSocket hodisalari bilan bir xil nomli hodisalar** chiqaradi: `lobby_update`, `session_started`, `question_show`, `answer_count_update`, `question_end`, `leaderboard`, `session_paused`, `session_resumed`, `session_finished`.
- Foydalanuvchi ham host, ham ishtirokchi sifatida sinab ko'ra olishi kerak.

---

## 8. Arxitektura — backendga tayyorgarlik

```
src/
├── app/                 # router, providerlar, layout
├── pages/               # 5-bo'limdagi sahifalar
├── components/          # umumiy UI komponentlar
├── features/            # test-editor, attempt, live, stats, import...
├── services/
│   ├── types.ts         # barcha domen tiplari (Test, Question, Attempt...)
│   ├── api.ts           # yagona interfeys: TestsApi, AttemptsApi, LiveApi...
│   ├── mock/            # mock realizatsiya (hozir ishlatiladi)
│   └── http/            # bo'sh — backend ulanganda to'ldiriladi
├── mocks/               # seed ma'lumotlar, rasmlar, liveSimulator
├── lib/                 # grading, formatlash, telegram, storage yordamchilari
├── hooks/
├── store/
├── i18n/                # uz.json, ru.json
└── styles/              # tokens.css, global.css
```

Qoidalar:

- Komponentlar **hech qachon** mock'ga to'g'ridan-to'g'ri murojaat qilmaydi — faqat `services/api.ts` interfeysi orqali (TanStack Query hooklari ichida).
- Qaysi realizatsiya ishlatilishi `.env` dagi `VITE_API_MODE=mock | http` bilan belgilanadi.
- Mock servislar sozlanadigan sun'iy kechikish bilan **Promise** qaytaradi (haqiqiy tarmoqqa o'xshab).
- Domen tiplari `TZ.md` ning 11-bo'limidagi ma'lumotlar bazasi tuzilmasiga mos bo'lsin.
- Javob tekshirish logikasi (`lib/grading.ts`) — alohida sof funksiyalar: normalizatsiya (katta-kichik harf, bo'shliqlar, lotin/kirill), sonli xatolik oralig'i, qisman ball, jarima. Bu mantiq keyin backendga ko'chiriladi, shuning uchun **Vitest bilan unit testlar yozilsin**.

---

## 9. Sifat talablari

- TypeScript strict, `any` yo'q, ESLint + Prettier xatosiz.
- Kod izohlari va nomlar — ingliz tilida; foydalanuvchiga ko'rinadigan barcha matnlar — faqat `i18n` fayllarida.
- 360px kenglikdagi ekranda ham hech narsa sig'may qolmasin; uzun formulalar gorizontal scroll qilinsin.
- Ikkala mavzu (yorug'/qorong'i) va ikkala tilda barcha sahifalar tekshirilgan bo'lsin.
- Bundle hajmi oqilona: KaTeX, Recharts, SheetJS kerakli sahifalarda lazy-load qilinsin.
- `prefers-reduced-motion` hurmat qilinsin.

---

## 10. Tayyorlik mezoni (Definition of Done)

`npm run dev` bilan brauzerda ochganda quyidagilarning **hammasi** ishlaydi:

1. Formulali va rasmli savollar bilan har 4 turdagi test yaratish va nashr qilish.
2. Boshqa foydalanuvchiga (dev panel orqali) o'tib, shu testni ishlash va natijani ko'rish.
3. Musobaqa testining teskari sanog'i va avtomatik ochilishi/yopilishi.
4. Cheklangan testda joylar tugaganda kirishning yopilishi.
5. Jonli testni host sifatida o'tkazish — soxta ishtirokchilar bilan boshidan oxirigacha.
6. Test yaratuvchi statistikasi, diagrammalar va Excel eksport.
7. Excel/matn orqali savollar importi.
8. Sahifa yangilanganda barcha ma'lumotlarning saqlanib qolishi.
9. Telegram Mini App sifatida ochilganda (ngrok/cloudflared orqali) MainButton, BackButton, mavzu va haptic'ning to'g'ri ishlashi.

---

## 11. Ishlash bosqichlari

| #   | Bosqich                        | Natija                                                                                                        |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | Loyiha asosi                   | Vite + TS + Tailwind, dizayn tokenlari, shriftlar, i18n, router, Telegram SDK + mockTelegram, Dev panel       |
| 2   | UI kit                         | 6-bo'limdagi umumiy komponentlar + `/dev/ui` sahifasida ularning barchasi ikkala mavzuda ko'rsatilgan vitrina |
| 3   | Mock qatlam                    | `services/` interfeyslari, mock realizatsiya, seed ma'lumotlar va SVG rasmlar, localStorage/IndexedDB saqlash |
| 4   | Bosh sahifa va test ko'rish    | 5.1, 5.5, 5.12                                                                                                |
| 5   | Test yaratish                  | 5.2, 5.3 (formula muharriri, rasm yuklash), 5.4                                                               |
| 6   | Test ishlash va natija         | 5.6, 5.7, 5.8 + `grading.ts` va uning testlari                                                                |
| 7   | Musobaqa va cheklangan testlar | Taymerlar, holatlar, ro'yxatdan o'tish, joylar limiti, parol, kanal sharti                                    |
| 8   | Jonli test                     | `liveSimulator`, 5.10, 5.11                                                                                   |
| 9   | Boshqaruv va statistika        | 5.9, Excel eksport, 5.13 admin                                                                                |
| 10  | Sayqal                         | Animatsiyalar, bo'sh/xato holatlari, mobil tekshiruv, lazy-load, 10-bo'lim bo'yicha to'liq tekshiruv          |

Har bosqich oxirida: nima qilindi, qanday tekshirish mumkin (qaysi sahifaga kirib, nimani bosish kerak), qolgan muammolar.
