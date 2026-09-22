import { DUTCH_RATES } from '../data/dutchRates.ts';
import { getDutchHolidays } from '../data/holidays.ts';

/* =========================================================================
   1. Uurloon berekenen
   Formule: Maandsalaris = (Uurloon * uren_per_week * 52) / 12
   Gemiddeld aantal werkuren per maand = (uren_per_week * 52) / 12
   ========================================================================= */
export interface UurloonCalculationResult {
  monthlySalary: number;
  hourlyWage: number;
  annualSalary: number; // 12 * maandloon
  annualSalaryWithVacation: number; // inclusief 8% vakantiegeld (12.96 * maandloon)
  fourWeeklySalary: number; // (maandloon * 12) / 13
  dailyWage: number; // maandloon / 21.67 of wekelijkse_uren / 5
  monthlyHours: number;
}

export function calculateFromMonthlyWage(
  monthlySalary: number,
  weeklyHours: number
): UurloonCalculationResult {
  const safeMonthly = Math.max(0, monthlySalary);
  const safeHours = Math.max(1, weeklyHours);
  const monthlyHours = (safeHours * 52) / 12;
  const hourlyWage = monthlyHours > 0 ? safeMonthly / monthlyHours : 0;
  const annualSalary = safeMonthly * 12;
  const annualSalaryWithVacation = annualSalary * 1.08;
  const fourWeeklySalary = (safeMonthly * 12) / 13;
  const dailyWage = (hourlyWage * safeHours) / 5;

  return {
    monthlySalary: safeMonthly,
    hourlyWage: Math.round(hourlyWage * 100) / 100,
    annualSalary: Math.round(annualSalary * 100) / 100,
    annualSalaryWithVacation: Math.round(annualSalaryWithVacation * 100) / 100,
    fourWeeklySalary: Math.round(fourWeeklySalary * 100) / 100,
    dailyWage: Math.round(dailyWage * 100) / 100,
    monthlyHours: Math.round(monthlyHours * 100) / 100
  };
}

export function calculateFromHourlyWage(
  hourlyWage: number,
  weeklyHours: number
): UurloonCalculationResult {
  const safeHourly = Math.max(0, hourlyWage);
  const safeHours = Math.max(1, weeklyHours);
  const monthlyHours = (safeHours * 52) / 12;
  const monthlySalary = safeHourly * monthlyHours;
  const annualSalary = monthlySalary * 12;
  const annualSalaryWithVacation = annualSalary * 1.08;
  const fourWeeklySalary = (monthlySalary * 12) / 13;
  const dailyWage = (safeHourly * safeHours) / 5;

  return {
    monthlySalary: Math.round(monthlySalary * 100) / 100,
    hourlyWage: safeHourly,
    annualSalary: Math.round(annualSalary * 100) / 100,
    annualSalaryWithVacation: Math.round(annualSalaryWithVacation * 100) / 100,
    fourWeeklySalary: Math.round(fourWeeklySalary * 100) / 100,
    dailyWage: Math.round(dailyWage * 100) / 100,
    monthlyHours: Math.round(monthlyHours * 100) / 100
  };
}

/* =========================================================================
   2. Reiskostenvergoeding berekenen
   Woon-werkverkeer kilometers en Belastingdienst norm (€ 0,23 / km)
   Jaarregeling Belastingdienst: 214 werkdagen bij 5 reisdagen per week
   of pro-rata per week: reisdagen * 46 weken of (reisdagen * 52) / 12
   ========================================================================= */
export interface ReiskostenResult {
  dailyKm: number;
  ratePerKm: number;
  officialRatePerKm: number;
  dailyAllowance: number;
  weeklyAllowance: number;
  monthlyAllowance: number;
  annualAllowance: number;
  isAboveOfficialRate: boolean;
  taxablePortionMonthly: number;
  untaxedPortionMonthly: number;
}

export function calculateReiskosten(
  oneWayKm: number,
  travelDaysPerWeek: number,
  customRatePerKm: number = DUTCH_RATES.travelAllowancePerKm,
  isRoundTripInput = false
): ReiskostenResult {
  const safeKm = Math.max(0, oneWayKm);
  const dailyKm = isRoundTripInput ? safeKm : safeKm * 2;
  const safeDays = Math.min(7, Math.max(0, travelDaysPerWeek));
  const safeRate = Math.max(0, customRatePerKm);
  const officialRate = DUTCH_RATES.travelAllowancePerKm;

  const dailyAllowance = dailyKm * safeRate;
  const weeklyAllowance = dailyAllowance * safeDays;

  // Nederlandse Belastingdienst vaste reiskostenvergoeding norm:
  // Bij een vast aantal reisdagen per week: 214 dagen * (dagen/5) per jaar
  // Of 46 werkweken per jaar (rekening houdend met vakanties en verlof)
  const annualDays = (safeDays / 5) * 214;
  const annualAllowance = dailyAllowance * annualDays;
  const monthlyAllowance = annualAllowance / 12;

  const isAboveOfficialRate = safeRate > officialRate;
  const untaxedDailyAllowance = dailyKm * Math.min(safeRate, officialRate);
  const untaxedMonthlyAllowance = (untaxedDailyAllowance * annualDays) / 12;
  const taxableMonthlyAllowance = Math.max(0, monthlyAllowance - untaxedMonthlyAllowance);

  return {
    dailyKm: Math.round(dailyKm * 10) / 10,
    ratePerKm: safeRate,
    officialRatePerKm: officialRate,
    dailyAllowance: Math.round(dailyAllowance * 100) / 100,
    weeklyAllowance: Math.round(weeklyAllowance * 100) / 100,
    monthlyAllowance: Math.round(monthlyAllowance * 100) / 100,
    annualAllowance: Math.round(annualAllowance * 100) / 100,
    isAboveOfficialRate,
    taxablePortionMonthly: Math.round(taxableMonthlyAllowance * 100) / 100,
    untaxedPortionMonthly: Math.round(untaxedMonthlyAllowance * 100) / 100
  };
}

/* =========================================================================
   3. Thuiswerkvergoeding berekenen
   Belastingdienst norm: € 2,40 per thuiswerkdag (2025/2026)
   Belastingdienst 214-dagenregeling pro-rata
   ========================================================================= */
export interface ThuiswerkResult {
  daysPerWeek: number;
  ratePerDay: number;
  officialRatePerDay: number;
  weeklyAllowance: number;
  monthlyAllowance: number;
  annualAllowance: number;
  annualDays: number;
}

export function calculateThuiswerkvergoeding(
  daysPerWeek: number,
  ratePerDay: number = DUTCH_RATES.homeWorkAllowancePerDay
): ThuiswerkResult {
  const safeDays = Math.min(7, Math.max(0, daysPerWeek));
  const safeRate = Math.max(0, ratePerDay);
  const officialRate = DUTCH_RATES.homeWorkAllowancePerDay;

  // Bijv. 2 dagen thuiswerken = (2/5) * 214 dagen = 85,6 dagen/jaar
  const annualDays = (safeDays / 5) * 214;
  const weeklyAllowance = safeDays * safeRate;
  const annualAllowance = annualDays * safeRate;
  const monthlyAllowance = annualAllowance / 12;

  return {
    daysPerWeek: safeDays,
    ratePerDay: safeRate,
    officialRatePerDay: officialRate,
    weeklyAllowance: Math.round(weeklyAllowance * 100) / 100,
    monthlyAllowance: Math.round(monthlyAllowance * 100) / 100,
    annualAllowance: Math.round(annualAllowance * 100) / 100,
    annualDays: Math.round(annualDays * 10) / 10
  };
}

/* =========================================================================
   4. Vakantiegeld berekenen
   Wettelijk minimum: 8% van het bruto jaarsalaris
   Opbouwperiode: meestal 12 maanden (1 juni t/m 31 mei)
   ========================================================================= */
export interface VakantiegeldResult {
  monthlySalary: number;
  monthsWorked: number;
  percentage: number;
  extraAllowancesMonthly: number;
  totalAccrualBasis: number;
  grossVacationPay: number;
  monthlyAccrual: number;
  estimatedNetIndicative: number; // Bijzonder tarief indicatie (gemiddeld ~50% inhouding)
}

export function calculateVakantiegeld(
  grossMonthlySalary: number,
  monthsWorked: number = 12,
  percentage: number = DUTCH_RATES.vacationPayPercentage,
  monthlyExtras: number = 0
): VakantiegeldResult {
  const safeSalary = Math.max(0, grossMonthlySalary);
  const safeMonths = Math.min(12, Math.max(0, monthsWorked));
  const safePercentage = Math.max(0, percentage);
  const safeExtras = Math.max(0, monthlyExtras);

  const monthlyBasis = safeSalary + safeExtras;
  const totalAccrualBasis = monthlyBasis * safeMonths;
  const grossVacationPay = (totalAccrualBasis * safePercentage) / 100;
  const monthlyAccrual = (monthlyBasis * safePercentage) / 100;

  // Indicatie netto: vakantiegeld valt onder bijzonder tarief (vaak 37% tot 49,5% plus afbouw algemene heffingskorting/arbeidskorting, vuistregel ca. 50% netto)
  const estimatedNetIndicative = grossVacationPay * 0.52;

  return {
    monthlySalary: safeSalary,
    monthsWorked: safeMonths,
    percentage: safePercentage,
    extraAllowancesMonthly: safeExtras,
    totalAccrualBasis: Math.round(totalAccrualBasis * 100) / 100,
    grossVacationPay: Math.round(grossVacationPay * 100) / 100,
    monthlyAccrual: Math.round(monthlyAccrual * 100) / 100,
    estimatedNetIndicative: Math.round(estimatedNetIndicative * 100) / 100
  };
}

/* =========================================================================
   5. Vakantie-uren berekenen
   Wettelijk: 4 x wekelijkse arbeidsduur (art. 7:634 BW)
   Bovenwettelijk: CAO/werkgever aanvullend (vaak 1 week extra = 5 weken totaal)
   ========================================================================= */
export interface VakantieUrenResult {
  weeklyHours: number;
  statutoryHours: number;
  statutoryDays: number;
  nonStatutoryHours: number;
  nonStatutoryDays: number;
  totalHours: number;
  totalDays: number;
  parttimePercentage: number;
}

export function calculateVakantieUren(
  weeklyHours: number,
  totalVacationDaysFulltime: number = 25, // Standaard fulltime norm (20 wettelijk + 5 bovenwettelijk)
  fulltimeNormHours: number = 40
): VakantieUrenResult {
  const safeHours = Math.max(0, weeklyHours);
  const safeNorm = Math.max(1, fulltimeNormHours);
  const safeTotalDaysFT = Math.max(20, totalVacationDaysFulltime);

  const parttimeFactor = safeHours / safeNorm;
  const dailyHoursFT = safeNorm / 5; // bij 40u = 8u per dag; bij 36u = 7.2u per dag

  // Wettelijke uren = 4 * wekelijkse uren
  const statutoryHours = safeHours * 4;
  const statutoryDays = statutoryHours / (safeHours / 5 || 1); // aantal dagen bij eigen werkweek

  // Bovenwettelijke dagen fulltime = totaal dagen - 20 (wettelijk)
  const nonStatutoryDaysFT = Math.max(0, safeTotalDaysFT - 20);
  const nonStatutoryHours = nonStatutoryDaysFT * dailyHoursFT * parttimeFactor;
  const nonStatutoryDays = nonStatutoryHours / (safeHours / 5 || 1);

  const totalHours = statutoryHours + nonStatutoryHours;
  const totalDays = statutoryDays + nonStatutoryDays;

  return {
    weeklyHours: safeHours,
    statutoryHours: Math.round(statutoryHours * 10) / 10,
    statutoryDays: Math.round(statutoryDays * 10) / 10,
    nonStatutoryHours: Math.round(nonStatutoryHours * 10) / 10,
    nonStatutoryDays: Math.round(nonStatutoryDays * 10) / 10,
    totalHours: Math.round(totalHours * 10) / 10,
    totalDays: Math.round(totalDays * 10) / 10,
    parttimePercentage: Math.round(parttimeFactor * 1000) / 10
  };
}

/* =========================================================================
   6. Overuren berekenen
   Uurloon + toeslagpercentage (bijv. 125%, 150%, 200%)
   ========================================================================= */
export interface OverurenResult {
  hourlyWage: number;
  overtimeHours: number;
  surchargePercentage: number; // bijv. 125 voor 125% uitbetaling
  basePay: number; // 100%
  surchargePay: number; // toeslagdeel (bijv. 25%)
  totalGrossPay: number;
  timeForTimeHours: number;
}

export function calculateOveruren(
  hourlyWage: number,
  overtimeHours: number,
  surchargePercentage: number = 125 // 125% betekent 100% basis + 25% toeslag
): OverurenResult {
  const safeWage = Math.max(0, hourlyWage);
  const safeHours = Math.max(0, overtimeHours);
  const safeSurcharge = Math.max(100, surchargePercentage);

  const basePay = safeWage * safeHours;
  const totalGrossPay = basePay * (safeSurcharge / 100);
  const surchargePay = totalGrossPay - basePay;
  const timeForTimeHours = safeHours * (safeSurcharge / 100);

  return {
    hourlyWage: safeWage,
    overtimeHours: safeHours,
    surchargePercentage: safeSurcharge,
    basePay: Math.round(basePay * 100) / 100,
    surchargePay: Math.round(surchargePay * 100) / 100,
    totalGrossPay: Math.round(totalGrossPay * 100) / 100,
    timeForTimeHours: Math.round(timeForTimeHours * 100) / 100
  };
}

/* =========================================================================
   7. Werkdagen berekenen
   Tussen twee datums, exclusief zaterdag/zondag en feestdagen
   ========================================================================= */
export interface WerkdagenResult {
  startDate: string;
  endDate: string;
  totalCalendarDays: number;
  weekendDays: number;
  publicHolidaysCount: number;
  publicHolidaysList: { date: string; name: string }[];
  workingDays: number;
  workingHours: number;
}

export function calculateWerkdagen(
  startDateStr: string,
  endDateStr: string,
  excludePublicHolidays = true,
  dailyHours = 8
): WerkdagenResult {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return {
      startDate: startDateStr,
      endDate: endDateStr,
      totalCalendarDays: 0,
      weekendDays: 0,
      publicHolidaysCount: 0,
      publicHolidaysList: [],
      workingDays: 0,
      workingHours: 0
    };
  }

  // Pre-load relevant holidays for covered years
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  const holidaysMap = new Map<string, string>();

  if (excludePublicHolidays) {
    for (let y = startYear; y <= endYear; y++) {
      const yearHolidays = getDutchHolidays(y);
      for (const h of yearHolidays) {
        if (h.isOfficialWorkFree) {
          holidaysMap.set(h.date, h.name);
        }
      }
    }
  }

  let totalCalendarDays = 0;
  let weekendDays = 0;
  let publicHolidaysCount = 0;
  const publicHolidaysList: { date: string; name: string }[] = [];
  let workingDays = 0;

  const current = new Date(start);
  while (current <= end) {
    totalCalendarDays++;
    const dayOfWeek = current.getUTCDay(); // 0 = Zondag, 6 = Zaterdag
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      weekendDays++;
    } else {
      if (excludePublicHolidays && holidaysMap.has(dateStr)) {
        publicHolidaysCount++;
        publicHolidaysList.push({
          date: dateStr,
          name: holidaysMap.get(dateStr)!
        });
      } else {
        workingDays++;
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalCalendarDays,
    weekendDays,
    publicHolidaysCount,
    publicHolidaysList,
    workingDays,
    workingHours: workingDays * Math.max(0, dailyHours)
  };
}

/* =========================================================================
   8. Parttime salaris berekenen
   Fulltime <-> Parttime conversie
   ========================================================================= */
export interface ParttimeResult {
  fulltimeSalary: number;
  fulltimeHours: number;
  parttimeHours: number;
  parttimePercentage: number;
  parttimeSalary: number;
  differenceMonthly: number;
  hourlyWage: number;
  annualParttimeWithVacation: number;
}

export function calculateParttimeSalaris(
  fulltimeMonthlySalary: number,
  fulltimeHours: number,
  parttimeHours: number
): ParttimeResult {
  const safeFTSalary = Math.max(0, fulltimeMonthlySalary);
  const safeFTHours = Math.max(1, fulltimeHours);
  const safePTHours = Math.max(0, parttimeHours);

  const factor = safePTHours / safeFTHours;
  const parttimeSalary = safeFTSalary * factor;
  const differenceMonthly = safeFTSalary - parttimeSalary;

  const monthlyHoursFT = (safeFTHours * 52) / 12;
  const hourlyWage = monthlyHoursFT > 0 ? safeFTSalary / monthlyHoursFT : 0;
  const annualParttimeWithVacation = parttimeSalary * 12 * 1.08;

  return {
    fulltimeSalary: safeFTSalary,
    fulltimeHours: safeFTHours,
    parttimeHours: safePTHours,
    parttimePercentage: Math.round(factor * 1000) / 10,
    parttimeSalary: Math.round(parttimeSalary * 100) / 100,
    differenceMonthly: Math.round(differenceMonthly * 100) / 100,
    hourlyWage: Math.round(hourlyWage * 100) / 100,
    annualParttimeWithVacation: Math.round(annualParttimeWithVacation * 100) / 100
  };
}
