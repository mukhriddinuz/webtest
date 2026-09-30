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

/**
 * Deterministic name for participant #index. First and last names alternate
 * between male and female forms, so a pair is only ever built from matching
 * ones; the result is unique for the first 400 indexes.
 */
export const UNIQUE_NAMES = (FIRST_NAMES.length * LAST_NAMES.length) / 2;

export function participantName(index: number): string {
  const slot = (index * 37 + 11) % UNIQUE_NAMES;
  const first = slot % FIRST_NAMES.length;
  const last = Math.floor(slot / FIRST_NAMES.length) * 2 + (first % 2);
  return `${FIRST_NAMES[first] as string} ${LAST_NAMES[last] as string}`;
}
