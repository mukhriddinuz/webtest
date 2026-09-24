/** Uzbek names used to populate fake participants and live bots. */
export const FIRST_NAMES = [
  'Aziz',
  'Jasur',
  'Dilnoza',
  'Shahzod',
  'Malika',
  'Bekzod',
  'Gulnora',
  'Sardor',
  'Zilola',
  'Otabek',
  'Nilufar',
  'Javohir',
  'Madina',
  'Rustam',
  'Sevara',
  'Aziza',
  'Ulug‘bek',
  'Kamola',
  'Doniyor',
  'Nodira',
  'Farrux',
  'Shahnoza',
  'Islom',
  'Lola',
  'Temur',
  'Zuhra',
  'Anvar',
  'Mohira',
  'Sanjar',
  'Dilfuza',
  'Akmal',
  'Ruxshona',
  'Jahongir',
  'Xurshida',
  'Behruz',
  'Sitora',
  'Umid',
  'Feruza',
  'Alisher',
  'Iroda',
];

export const LAST_NAMES = [
  'Rahimov',
  'Karimova',
  'Tursunov',
  'Yusupova',
  'Abdullayev',
  'Qodirova',
  'Ergashev',
  'Xolmatova',
  'Sobirov',
  'Nazarova',
  'Umarov',
  'Ismoilova',
  'Jo‘rayev',
  'Maxmudova',
  'Saidov',
  'Alimova',
  'Rasulov',
  'Bekmurodova',
  'Hasanov',
  'Sultonova',
];

/** Deterministic name for participant #index. */
export function participantName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length] as string;
  const last = LAST_NAMES[
    Math.floor(index / FIRST_NAMES.length + index * 7) % LAST_NAMES.length
  ] as string;
  return `${first} ${last}`;
}
