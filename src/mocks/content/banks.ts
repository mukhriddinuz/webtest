import { options, text, type QuestionSpec } from '../builders';

/**
 * Small hand-written question banks for the demo catalogue. A row is the
 * question, the right answer, then three wrong ones; a bank is cut into
 * differently sized papers by `bankQuestions`, so many tests share one source.
 */
type Row = [question: string, correct: string, wrong1: string, wrong2: string, wrong3: string];

const BANKS: Record<string, Row[]> = {
  Biologiya: [
    [
      'Hujayraning “energiya stansiyasi” qaysi organoid?',
      'Mitoxondriya',
      'Ribosoma',
      'Lizosoma',
      'Golji apparati',
    ],
    ['Fotosintez qaysi organoidda kechadi?', 'Xloroplast', 'Mitoxondriya', 'Yadro', 'Vakuola'],
    [
      'Qonda kislorodni tashuvchi hujayralar qaysilar?',
      'Eritrotsitlar',
      'Leykotsitlar',
      'Trombotsitlar',
      'Limfotsitlar',
    ],
    ['DNK nechta zanjirdan iborat?', 'Ikkita', 'Bitta', 'Uchta', 'To‘rtta'],
    ['Odam hujayrasida nechta xromosoma bor?', '46', '44', '48', '23'],
    ['Oqsillar qaysi organoidda sintezlanadi?', 'Ribosoma', 'Lizosoma', 'Xloroplast', 'Vakuola'],
    [
      'Insulin gormoni qayerda ishlab chiqariladi?',
      'Oshqozon osti bezida',
      'Jigarda',
      'Buyrak usti bezida',
      'Qalqonsimon bezda',
    ],
    ['Odam yuragi nechta kameradan iborat?', 'To‘rtta', 'Ikkita', 'Uchta', 'Beshta'],
    [
      'Fotosintez natijasida qaysi gaz ajraladi?',
      'Kislorod',
      'Karbonat angidrid',
      'Azot',
      'Vodorod',
    ],
    [
      'Irsiyat qonunlarining asoschisi kim?',
      'Gregor Mendel',
      'Charlz Darvin',
      'Lui Paster',
      'Karl Linney',
    ],
    [
      'O‘simliklarda suvning bug‘lanishi qanday ataladi?',
      'Transpiratsiya',
      'Fotosintez',
      'Nafas olish',
      'Osmos',
    ],
    ['Quyidagilardan qaysi biri sut emizuvchi?', 'Delfin', 'Akula', 'Timsoh', 'Baqa'],
    ['ABO tizimida nechta asosiy qon guruhi bor?', 'To‘rtta', 'Ikkita', 'Uchta', 'Beshta'],
    [
      'Nafas olishda gazlar almashinuvi qayerda sodir bo‘ladi?',
      'O‘pka alveolalarida',
      'Traxeyada',
      'Bronxlarda',
      'Hiqildoqda',
    ],
  ],
  Kimyo: [
    ['Suvning kimyoviy formulasi qaysi?', 'H₂O', 'CO₂', 'NaCl', 'O₂'],
    ['Osh tuzining formulasi qaysi?', 'NaCl', 'KCl', 'CaCO₃', 'NaOH'],
    ['Davriy jadvalni kim yaratgan?', 'D. I. Mendeleyev', 'A. Lavuazye', 'J. Dalton', 'N. Bor'],
    ['Kislorodning tartib raqami nechaga teng?', '8', '6', '16', '1'],
    ['Uglerodning kimyoviy belgisi qaysi?', 'C', 'Ca', 'Cu', 'Cr'],
    ['Eng yengil element qaysi?', 'Vodorod', 'Geliy', 'Litiy', 'Kislorod'],
    ['pH = 7 bo‘lgan muhit qanday?', 'Neytral', 'Kislotali', 'Ishqoriy', 'Kuchli kislotali'],
    ['Temirning kimyoviy belgisi qaysi?', 'Fe', 'Ir', 'Fr', 'F'],
    ['Ohaktoshning asosiy tarkibi qaysi?', 'CaCO₃', 'CaO', 'Ca(OH)₂', 'CaCl₂'],
    ['Quyidagilardan qaysi biri inert gaz?', 'Argon', 'Kislorod', 'Azot', 'Xlor'],
    ['Oltinning kimyoviy belgisi qaysi?', 'Au', 'Ag', 'Al', 'Ar'],
    ['Sirka kislotasining formulasi qaysi?', 'CH₃COOH', 'HCl', 'H₂SO₄', 'HNO₃'],
    ['Metanning formulasi qaysi?', 'CH₄', 'C₂H₆', 'C₂H₄', 'CO'],
    ['NaOH qaysi birikmalar sinfiga kiradi?', 'Asoslar', 'Kislotalar', 'Tuzlar', 'Oksidlar'],
  ],
  Geografiya: [
    ['O‘zbekiston poytaxti qaysi shahar?', 'Toshkent', 'Samarqand', 'Buxoro', 'Namangan'],
    [
      'Eng katta okean qaysi?',
      'Tinch okeani',
      'Atlantika okeani',
      'Hind okeani',
      'Shimoliy Muz okeani',
    ],
    ['Dunyodagi eng baland cho‘qqi qaysi?', 'Jomolungma', 'K2', 'Elbrus', 'Kilimanjaro'],
    [
      'Maydoni bo‘yicha O‘zbekistonning eng katta viloyati qaysi?',
      'Navoiy',
      'Qashqadaryo',
      'Buxoro',
      'Xorazm',
    ],
    ['Afrikadagi eng katta cho‘l qaysi?', 'Sahroi Kabir', 'Kalahari', 'Gobi', 'Qoraqum'],
    [
      'Amudaryo qayerga quyiladi (tarixan)?',
      'Orol dengiziga',
      'Kaspiy dengiziga',
      'Balxash ko‘liga',
      'Qora dengizga',
    ],
    [
      'Yer yuzidagi eng katta materik qaysi?',
      'Yevrosiyo',
      'Afrika',
      'Shimoliy Amerika',
      'Antarktida',
    ],
    ['Yaponiyaning poytaxti qaysi?', 'Tokio', 'Osaka', 'Kioto', 'Seul'],
    ['Eng katta orol qaysi?', 'Grenlandiya', 'Madagaskar', 'Borneo', 'Yangi Gvineya'],
    ['Turkiyaning poytaxti qaysi?', 'Anqara', 'Istanbul', 'Izmir', 'Bursa'],
    ['Qoraqalpog‘iston Respublikasining poytaxti qaysi?', 'Nukus', 'Urganch', 'Qarshi', 'Termiz'],
    ['Fransiyaning poytaxti qaysi?', 'Parij', 'Lion', 'Marsel', 'Nitstsa'],
    [
      'Misr ehromlari qaysi shahar yaqinida joylashgan?',
      'Giza (Qohira)',
      'Iskandariya',
      'Luksor',
      'Asvon',
    ],
    ['Eng chuqur ko‘l qaysi?', 'Baykal', 'Viktoriya', 'Superior', 'Orol'],
  ],
  Informatika: [
    ['1 bayt necha bitga teng?', '8', '4', '16', '10'],
    ['CPU nima?', 'Markaziy protsessor', 'Operativ xotira', 'Videokarta', 'Qattiq disk'],
    [
      'HTML nima uchun ishlatiladi?',
      'Veb-sahifa tuzilishini yozish uchun',
      'Ma’lumotlar bazasi uchun',
      'Operatsion tizim sifatida',
      'Virusdan himoya uchun',
    ],
    ['Ikkilik sanoq tizimidagi 101 soni o‘nlik tizimda nechaga teng?', '5', '3', '6', '7'],
    [
      'RAM qanday xotira?',
      'Tezkor (operativ) xotira',
      'Doimiy xotira',
      'Protsessor keshi',
      'Tashqi disk',
    ],
    ['Python nima?', 'Dasturlash tili', 'Brauzer', 'Operatsion tizim', 'Grafik muharrir'],
    ['.jpg kengaytmali fayl nimani saqlaydi?', 'Rasm', 'Musiqa', 'Video', 'Matn'],
    ['Ikkilik hisobda 1 kilobayt necha baytga teng?', '1024', '1000', '512', '2048'],
    [
      'Algoritm nima?',
      'Masalani yechishning aniq ko‘rsatmalar ketma-ketligi',
      'Dastur nomi',
      'Kompyuter qismi',
      'Fayl turi',
    ],
    [
      'Ko‘p dasturlash tillarida “==” belgisi nimani bildiradi?',
      'Tenglikni tekshirishni',
      'Qiymat berishni',
      'Ko‘paytirishni',
      'Izohni',
    ],
    ['URL nima?', 'Resursning internetdagi manzili', 'Fayl turi', 'Dasturlash tili', 'Xotira turi'],
    ['Quyidagilardan qaysi biri operatsion tizim?', 'Linux', 'Chrome', 'Excel', 'Python'],
    ['Dasturdagi xato odatda qanday ataladi?', 'Bag (bug)', 'Patch', 'Cookie', 'Cache'],
    ['Simsiz lokal tarmoq texnologiyasi qaysi?', 'Wi-Fi', 'HDMI', 'USB', 'SATA'],
  ],
  Adabiyot: [
    ['“Xamsa” asari muallifi kim?', 'Alisher Navoiy', 'Zahiriddin Bobur', 'Nodira', 'Furqat'],
    [
      '“O‘tkan kunlar” romani muallifi kim?',
      'Abdulla Qodiriy',
      'Cho‘lpon',
      'Oybek',
      'G‘afur G‘ulom',
    ],
    [
      '“Boburnoma” muallifi kim?',
      'Zahiriddin Muhammad Bobur',
      'Alisher Navoiy',
      'Mashrab',
      'Uvaysiy',
    ],
    [
      '“Mehrobdan chayon” romani muallifi kim?',
      'Abdulla Qodiriy',
      'Abdulla Qahhor',
      'Said Ahmad',
      'Oybek',
    ],
    ['“Kecha va kunduz” romani muallifi kim?', 'Cho‘lpon', 'Abdulla Qodiriy', 'Hamza', 'Fitrat'],
    [
      '“Navoiy” romani muallifi kim?',
      'Oybek',
      'Mirzakalon Ismoiliy',
      'Pirimqul Qodirov',
      'Odil Yoqubov',
    ],
    [
      '“Sariq devni minib” asari muallifi kim?',
      'Xudoyberdi To‘xtaboyev',
      'Anvar Obidjon',
      'Shukur Xolmirzayev',
      'Tog‘ay Murod',
    ],
    [
      '“Shum bola” qissasi muallifi kim?',
      'G‘afur G‘ulom',
      'Abdulla Qahhor',
      'Oybek',
      'Hamid Olimjon',
    ],
    [
      '“Qutadg‘u bilig” asari muallifi kim?',
      'Yusuf Xos Hojib',
      'Mahmud Koshg‘ariy',
      'Ahmad Yassaviy',
      'Rabg‘uziy',
    ],
    [
      '“Devonu lug‘otit turk” muallifi kim?',
      'Mahmud Koshg‘ariy',
      'Yusuf Xos Hojib',
      'Ahmad Yugnakiy',
      'Sakkokiy',
    ],
    ['“Farhod va Shirin” dostoni muallifi kim?', 'Alisher Navoiy', 'Nizomiy', 'Bobur', 'Lutfiy'],
    [
      '“Ikki eshik orasi” romani muallifi kim?',
      'O‘tkir Hoshimov',
      'Erkin A’zam',
      'Nazar Eshonqul',
      'Murod Muhammad Do‘st',
    ],
    [
      '“Boy ila xizmatchi” dramasi muallifi kim?',
      'Hamza Hakimzoda Niyoziy',
      'Behbudiy',
      'Cho‘lpon',
      'Fitrat',
    ],
    ['Muqimiy qaysi shaharda yashab ijod qilgan?', 'Qo‘qon', 'Xiva', 'Buxoro', 'Termiz'],
  ],
  Tarix: [
    ['Amir Temur qaysi yilda tug‘ilgan?', '1336', '1370', '1405', '1300'],
    [
      'Amir Temur davlatining poytaxti qaysi shahar edi?',
      'Samarqand',
      'Buxoro',
      'Xiva',
      'Toshkent',
    ],
    [
      'Mirzo Ulug‘bek rasadxonasi qaysi shaharda qurilgan?',
      'Samarqand',
      'Buxoro',
      'Xiva',
      'Shahrisabz',
    ],
    ['O‘zbekiston qaysi yilda mustaqillikka erishgan?', '1991', '1990', '1992', '1989'],
    [
      'O‘zbekiston Konstitutsiyasi qachon qabul qilingan?',
      '1992-yil 8-dekabr',
      '1991-yil 1-sentyabr',
      '1993-yil 1-yanvar',
      '1995-yil 5-may',
    ],
    [
      '“Algebra” atamasi qaysi olim asaridan kelib chiqqan?',
      'Al-Xorazmiy',
      'Ibn Sino',
      'Beruniy',
      'Farg‘oniy',
    ],
    ['“Tib qonunlari” asari muallifi kim?', 'Ibn Sino', 'Beruniy', 'Al-Xorazmiy', 'Forobiy'],
    [
      'Boburiylar davlatiga kim asos solgan?',
      'Zahiriddin Muhammad Bobur',
      'Amir Temur',
      'Shayboniyxon',
      'Humoyun',
    ],
    ['Ikkinchi jahon urushi qaysi yilda boshlangan?', '1939', '1941', '1914', '1945'],
    ['Ikkinchi jahon urushi qaysi yilda tugagan?', '1945', '1944', '1946', '1939'],
    [
      'Mo‘g‘ullarning O‘rta Osiyoga bosqini qachon boshlangan?',
      '1219-yil',
      '1120-yil',
      '1300-yil',
      '1370-yil',
    ],
    [
      '“Hindiston” asari muallifi kim?',
      'Abu Rayhon Beruniy',
      'Ibn Sino',
      'Al-Farg‘oniy',
      'Al-Buxoriy',
    ],
    ['Registon maydoni qaysi shaharda joylashgan?', 'Samarqand', 'Buxoro', 'Xiva', 'Toshkent'],
    [
      'Buyuk ipak yo‘li nimani bog‘lagan?',
      'Sharq va G‘arbni',
      'Shimol va Janubni',
      'Faqat Xitoy shaharlarini',
      'Faqat Rimni',
    ],
  ],
  'Ingliz tili': [
    ['She ___ to school every day.', 'goes', 'go', 'going', 'gone'],
    ['What is the past simple of “buy”?', 'bought', 'buyed', 'boughten', 'buys'],
    ['What is the opposite of “generous”?', 'selfish', 'kind', 'rich', 'happy'],
    ['I ___ a book right now.', 'am reading', 'read', 'reads', 'have read'],
    ['What is the plural of “child”?', 'children', 'childs', 'childes', 'childrens'],
    ['There ___ two books on the table.', 'are', 'is', 'be', 'am'],
    ['What is the comparative form of “good”?', 'better', 'gooder', 'more good', 'best'],
    ['If it rains, we ___ at home.', 'will stay', 'stayed', 'would have stayed', 'staying'],
    ['He has lived here ___ 2010.', 'since', 'for', 'from', 'during'],
    ['Which word means the same as “big”?', 'large', 'tiny', 'thin', 'short'],
    ['___ you like some tea?', 'Would', 'Are', 'Have', 'Is'],
    ['I waited for ___ hour.', 'an', 'a', 'some', 'many'],
    ['What is the past participle of “see”?', 'seen', 'saw', 'seed', 'seeing'],
    ['Which word is a noun?', 'happiness', 'quickly', 'beautiful', 'run'],
  ],
  Astronomiya: [
    ['Quyosh tizimidagi eng katta sayyora qaysi?', 'Yupiter', 'Saturn', 'Yer', 'Neptun'],
    ['Quyoshga eng yaqin sayyora qaysi?', 'Merkuriy', 'Venera', 'Mars', 'Yer'],
    ['Yerning tabiiy yo‘ldoshi qaysi?', 'Oy', 'Fobos', 'Yevropa', 'Titan'],
    ['“Qizil sayyora” deb qaysi sayyora ataladi?', 'Mars', 'Venera', 'Yupiter', 'Uran'],
    ['Quyosh tizimida nechta sayyora bor?', '8', '9', '7', '10'],
    [
      'Yorug‘lik tezligi taxminan qancha?',
      '300 000 km/s',
      '30 000 km/s',
      '3 000 km/s',
      '150 000 km/s',
    ],
    ['Halqalari eng mashhur sayyora qaysi?', 'Saturn', 'Mars', 'Merkuriy', 'Venera'],
    [
      'Bizning galaktikamiz qanday ataladi?',
      'Somon yo‘li',
      'Andromeda',
      'Magellan bulutlari',
      'Uchburchak',
    ],
    ['Quyosh nima?', 'Yulduz', 'Sayyora', 'Yo‘ldosh', 'Kometa'],
    [
      'Yer o‘z o‘qi atrofida taxminan qancha vaqtda to‘liq aylanadi?',
      '24 soat',
      '365 kun',
      '30 kun',
      '12 soat',
    ],
    [
      'Kosmosga uchgan birinchi inson kim?',
      'Yuriy Gagarin',
      'Nil Armstrong',
      'German Titov',
      'Alan Shepard',
    ],
    [
      'Oy yuziga birinchi bo‘lib qadam qo‘ygan inson kim?',
      'Nil Armstrong',
      'Buzz Oldrin',
      'Yuriy Gagarin',
      'Alan Shepard',
    ],
    ['Galley kometasi taxminan necha yilda qaytadi?', '76 yil', '10 yil', '200 yil', '1000 yil'],
    ['Eng issiq sayyora qaysi?', 'Venera', 'Merkuriy', 'Mars', 'Yupiter'],
  ],
  'Ona tili': [
    ['“Kitob” so‘zi qaysi so‘z turkumiga kiradi?', 'Ot', 'Sifat', 'Fe’l', 'Ravish'],
    ['“Chiroyli” so‘zi qaysi so‘z turkumiga kiradi?', 'Sifat', 'Ot', 'Son', 'Olmosh'],
    ['O‘zbek tilida nechta unli tovush bor?', '6', '5', '8', '10'],
    ['“Yozmoq” so‘zi qaysi so‘z turkumiga kiradi?', 'Fe’l', 'Ot', 'Sifat', 'Ravish'],
    ['Qaysi harf undosh tovushni bildiradi?', 'b', 'a', 'o', 'e'],
    ['“Go‘zal” so‘ziga ma’nodosh so‘zni toping.', 'chiroyli', 'xunuk', 'katta', 'past'],
    ['“Baland” so‘ziga zid ma’noli so‘zni toping.', 'past', 'uzun', 'keng', 'katta'],
    ['Ko‘plik qo‘shimchasini toping.', '-lar', '-ni', '-ning', '-dan'],
    ['Qaratqich kelishigi qo‘shimchasini toping.', '-ning', '-ni', '-ga', '-da'],
    ['Ega qaysi so‘roqqa javob beradi?', 'Kim? Nima?', 'Nimani?', 'Qayerda?', 'Qachon?'],
    ['“Besh” so‘zi qaysi so‘z turkumiga kiradi?', 'Son', 'Ot', 'Sifat', 'Olmosh'],
    ['“Men” so‘zi qaysi so‘z turkumiga kiradi?', 'Olmosh', 'Ot', 'Son', 'Ravish'],
    ['Qaysi so‘z bosh harf bilan yoziladi?', 'Toshkent', 'kuz', 'dushanba', 'may'],
    [
      '“Kitobim” so‘zidagi -im qo‘shimchasi qanday qo‘shimcha?',
      'Egalik',
      'Kelishik',
      'Ko‘plik',
      'Sifat yasovchi',
    ],
  ],
  'Rus tili': [
    ['“Спасибо” so‘zining tarjimasi qaysi?', 'Rahmat', 'Kechirasiz', 'Salom', 'Xayr'],
    ['“Привет” so‘zining tarjimasi qaysi?', 'Salom', 'Xayr', 'Rahmat', 'Iltimos'],
    ['“Книга” so‘zining tarjimasi qaysi?', 'Kitob', 'Daftar', 'Qalam', 'Stol'],
    ['“Дом” so‘zining tarjimasi qaysi?', 'Uy', 'Maktab', 'Ko‘cha', 'Shahar'],
    ['“Вода” so‘zining tarjimasi qaysi?', 'Suv', 'Non', 'Sut', 'Choy'],
    ['“Школа” so‘zining tarjimasi qaysi?', 'Maktab', 'Uy', 'Kitob', 'Do‘kon'],
    ['“Пять” soni nechaga teng?', '5', '4', '6', '10'],
    ['“Красный” so‘zining tarjimasi qaysi?', 'Qizil', 'Ko‘k', 'Yashil', 'Sariq'],
    ['“Мама” so‘zining tarjimasi qaysi?', 'Ona', 'Ota', 'Opa', 'Aka'],
    ['“Хлеб” so‘zining tarjimasi qaysi?', 'Non', 'Sut', 'Go‘sht', 'Meva'],
    ['“Друг” so‘zining tarjimasi qaysi?', 'Do‘st', 'Dushman', 'O‘qituvchi', 'Qo‘shni'],
    [
      '“Я читаю” jumlasining tarjimasi qaysi?',
      'Men o‘qiyman',
      'Men yozaman',
      'Men yuraman',
      'Men uxlayman',
    ],
    ['“Город” so‘zining tarjimasi qaysi?', 'Shahar', 'Qishloq', 'Uy', 'Ko‘cha'],
    ['“Учитель” so‘zining tarjimasi qaysi?', 'O‘qituvchi', 'O‘quvchi', 'Shifokor', 'Haydovchi'],
  ],
};

/** A few free-text and multiple-choice questions, so a paper is not all radio buttons. */
const TEXT_ROWS: Record<string, [question: string, ...accepted: string[]][]> = {
  Informatika: [
    ['Python fayllarining kengaytmasini nuqta bilan yozing.', '.py', 'py'],
    ['Veb-sahifalarni bezash uchun ishlatiladigan til qisqartmasi nima? (3 harf)', 'css', 'CSS'],
  ],
  'Ingliz tili': [
    ['Write the past simple of “go”.', 'went'],
    ['Write the plural of “man”.', 'men'],
  ],
  Kimyo: [['Suvning formulasini yozing.', 'H2O', 'H₂O', 'h2o']],
  Geografiya: [
    ['O‘zbekistonning eng uzun daryosi qaysi? (Amudaryo yoki Sirdaryo)', 'Amudaryo', 'Amu'],
  ],
};

const MULTI_ROWS: Record<string, [question: string, right: string[], wrong: string[]][]> = {
  Biologiya: [['Sut emizuvchilarni tanlang.', ['Delfin', 'Ot', 'Kenguru'], ['Akula', 'Timsoh']]],
  Kimyo: [['Inert gazlarni tanlang.', ['Argon', 'Neon', 'Geliy'], ['Kislorod', 'Azot']]],
  Informatika: [['Dasturlash tillarini tanlang.', ['Python', 'Java', 'C#'], ['HTML', 'Excel']]],
  Geografiya: [
    [
      'Materiklarni tanlang.',
      ['Afrika', 'Avstraliya', 'Antarktida'],
      ['Grenlandiya', 'Madagaskar'],
    ],
  ],
  Astronomiya: [
    ['Gaz gigant sayyoralarni tanlang.', ['Yupiter', 'Saturn'], ['Mars', 'Yer', 'Venera']],
  ],
};

export const bankSubjects = Object.keys(BANKS);

const orderedOptions = (row: Row, shift: number) => {
  const [, correct, ...wrong] = row;
  const entries = [...wrong];
  entries.splice(shift % 4, 0, `*${correct}`);
  return options(...entries);
};

/**
 * `count` questions from a bank, starting `offset` rows in. The correct answer
 * moves between positions from one question to the next.
 */
export function bankQuestions(
  subject: string,
  count: number,
  offset = 0,
  section?: string,
): QuestionSpec[] {
  const rows = BANKS[subject];
  if (!rows) throw new Error(`No question bank for ${subject}`);
  const texts = TEXT_ROWS[subject] ?? [];
  const multis = MULTI_ROWS[subject] ?? [];

  const specs: QuestionSpec[] = [];
  for (let index = 0; index < count; index += 1) {
    const at = offset + index;
    // Every fifth question is one of the other shapes, where the bank has any.
    if (index % 5 === 4 && multis.length > 0 && at % 2 === 0) {
      const [question, right, wrong] = multis[at % multis.length] as (typeof multis)[number];
      specs.push({
        type: 'multiple',
        section,
        content: [text(question)],
        options: options(...right.map((item) => `*${item}`), ...wrong),
        points: 2,
      });
      continue;
    }
    if (index % 5 === 3 && texts.length > 0) {
      const [question, ...accepted] = texts[at % texts.length] as (typeof texts)[number];
      specs.push({ type: 'text', section, content: [text(question)], accepted, points: 1 });
      continue;
    }
    const row = rows[at % rows.length] as Row;
    specs.push({
      type: 'single',
      section,
      content: [text(row[0])],
      options: orderedOptions(row, at),
      points: 1,
    });
  }
  return specs;
}
