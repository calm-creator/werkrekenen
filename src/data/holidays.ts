/**
 * Officiële Nederlandse feestdagen berekening
 * Rijksoverheid erkende nationale feestdagen
 */

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isOfficialWorkFree: boolean; // Over het algemeen vrij volgens de meeste CAO's
}

/**
 * Bereken Paaszondag volgens het algoritme van Meeus/Jones/Butcher
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based month (2 = maart, 3 = april)
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month, day));
}

function formatDateISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function getDutchHolidays(year: number): Holiday[] {
  const easter = getEasterSunday(year);

  // Goede Vrijdag (2 dagen voor Pasen)
  const goodFriday = addDays(easter, -2);
  // 2e Paasdag (1 dag na Pasen)
  const easterMonday = addDays(easter, 1);
  // Hemelvaartsdag (39 dagen na Pasen)
  const ascensionDay = addDays(easter, 39);
  // 1e Pinksterdag (49 dagen na Pasen)
  const pentecost = addDays(easter, 49);
  // 2e Pinksterdag (50 dagen na Pasen)
  const pentecostMonday = addDays(easter, 50);

  // Koningsdag: 27 april, maar als 27 april een zondag is, wordt het zaterdag 26 april
  let kingsDay = new Date(Date.UTC(year, 3, 27)); // maand 3 is april
  if (kingsDay.getUTCDay() === 0) {
    kingsDay = new Date(Date.UTC(year, 3, 26));
  }

  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Nieuwjaarsdag', isOfficialWorkFree: true },
    { date: formatDateISO(goodFriday), name: 'Goede Vrijdag', isOfficialWorkFree: false },
    { date: formatDateISO(easter), name: 'Eerste Paasdag', isOfficialWorkFree: true },
    { date: formatDateISO(easterMonday), name: 'Tweede Paasdag', isOfficialWorkFree: true },
    { date: formatDateISO(kingsDay), name: 'Koningsdag', isOfficialWorkFree: true },
    { date: `${year}-05-05`, name: 'Bevrijdingsdag', isOfficialWorkFree: year % 5 === 0 }, // vaak 1x per 5 jaar lustrumvrij
    { date: formatDateISO(ascensionDay), name: 'Hemelvaartsdag', isOfficialWorkFree: true },
    { date: formatDateISO(pentecost), name: 'Eerste Pinksterdag', isOfficialWorkFree: true },
    { date: formatDateISO(pentecostMonday), name: 'Tweede Pinksterdag', isOfficialWorkFree: true },
    { date: `${year}-12-25`, name: 'Eerste Kerstdag', isOfficialWorkFree: true },
    { date: `${year}-12-26`, name: 'Tweede Kerstdag', isOfficialWorkFree: true },
  ];

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Controleert of een specifieke ISO-datum (YYYY-MM-DD) een erkende Nederlandse feestdag is
 */
export function isDutchHoliday(dateStr: string, onlyWorkFree = true): { isHoliday: boolean; holidayName?: string } {
  const year = parseInt(dateStr.substring(0, 4), 10);
  if (isNaN(year)) return { isHoliday: false };
  const holidays = getDutchHolidays(year);
  const found = holidays.find(h => h.date === dateStr && (!onlyWorkFree || h.isOfficialWorkFree));
  return {
    isHoliday: !!found,
    holidayName: found?.name
  };
}
