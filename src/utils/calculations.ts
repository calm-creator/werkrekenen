import {
  DUTCH_RATES,
  PAYROLL_TAX_RATES_2026,
  MINIMUM_WAGE_RATES_2026,
  ARBEIDSKORTING_RATES_2026,
  ARBEIDSKORTING_BY_YEAR,
  type PayrollTaxRates,
  type MinimumWagePeriod,
  type MinimumWageAge,
  type AowStatus
} from '../data/dutchRates.ts';
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
   Uurloon + aantal overuren + toeslagpercentage (bijv. 100%, 125%, 150%, 200%)
   Optioneel inclusief 8% wettelijk vakantiegeld (art. 16 WML) en indicatie netto
   ========================================================================= */
export interface OverurenResult {
  hourlyWage: number;
  overtimeHours: number;
  surchargePercentage: number; // bijv. 125 voor 125% uitbetaling
  effectiveHourlyRate: number; // hourlyWage * (surchargePercentage / 100)
  basePay: number; // 100% basisvergoeding
  surchargePay: number; // extra toeslag
  totalGrossPay: number; // basisloon + overwerktoeslag
  includeVacationPay: boolean;
  vacationPayAmount: number; // 8% over totalGrossPay if includeVacationPay
  totalGrossWithVacationPay: number; // totalGrossPay + vacationPayAmount
  estimatedNetIndicative: number; // indicatieve netto schatting (ca. 50,5% na bijzonder tarief)
  timeForTimeHours: number; // safeHours * (safePercentage / 100)
}

export function calculateOveruren(
  hourlyWage: number,
  overtimeHours: number,
  surchargePercentage: number = 125,
  includeVacationPay: boolean = false
): OverurenResult {
  const safeWage = Math.max(0, hourlyWage);
  const safeHours = Math.max(0, overtimeHours);
  const safeSurcharge = Math.max(0, surchargePercentage);

  const effectiveHourlyRate = safeWage * (safeSurcharge / 100);
  const basePay = safeWage * safeHours;
  const totalGrossPay = safeHours * effectiveHourlyRate;
  const surchargePay = Math.max(0, totalGrossPay - basePay);

  const vacationPayAmount = includeVacationPay ? totalGrossPay * 0.08 : 0;
  const totalGrossWithVacationPay = totalGrossPay + vacationPayAmount;

  const basisForNet = includeVacationPay ? totalGrossWithVacationPay : totalGrossPay;
  const estimatedNetIndicative = basisForNet * 0.505;
  const timeForTimeHours = safeHours * (safeSurcharge / 100);

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    hourlyWage: round2(safeWage),
    overtimeHours: round2(safeHours),
    surchargePercentage: round2(safeSurcharge),
    effectiveHourlyRate: round2(effectiveHourlyRate),
    basePay: round2(basePay),
    surchargePay: round2(surchargePay),
    totalGrossPay: round2(totalGrossPay),
    includeVacationPay,
    vacationPayAmount: round2(vacationPayAmount),
    totalGrossWithVacationPay: round2(totalGrossWithVacationPay),
    estimatedNetIndicative: round2(estimatedNetIndicative),
    timeForTimeHours: round2(timeForTimeHours)
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

/* =========================================================================
   9. Vakantiedagen berekenen
   Wettelijk: 4 x aantal werkdagen per week (art. 7:634 BW)
   Bovenwettelijk: CAO/werkgever extra dagen (vaak 5 dagen extra bij fulltime)
   Naar rato berekend bij parttime en bij parttime/gedeeltelijk jaar (aantal maanden)
   ========================================================================= */
export interface VakantiedagenResult {
  daysPerWeek: number;
  fulltimeDays: number;
  monthsWorked: number;
  hoursPerDay: number;
  parttimePercentage: number;
  statutoryDays: number;
  nonStatutoryDays: number;
  totalDays: number;
  statutoryHours: number;
  nonStatutoryHours: number;
  totalHours: number;
  totalWeeks: number;
  monthlyAccrualDays: number;
}

export function calculateVakantiedagen(
  daysPerWeek: number = 5,
  fulltimeDaysPerYear: number = 25,
  monthsWorked: number = 12,
  hoursPerDay: number = 8
): VakantiedagenResult {
  const safeDaysPerWeek = Math.max(0, Math.min(7, daysPerWeek));
  const safeFulltimeDays = Math.max(20, fulltimeDaysPerYear);
  const safeMonths = Math.max(1, Math.min(12, monthsWorked));
  const safeHoursPerDay = Math.max(0, Math.min(24, hoursPerDay));

  // Deeltijdfactor t.o.v. standaard voltijdse 5 werkdagen per week
  const parttimeFactor = safeDaysPerWeek / 5;
  const yearFraction = safeMonths / 12;

  // Jaarlijkse wettelijke vakantiedagen = 4 x wekelijkse werkdagen (art. 7:634 BW)
  const statutoryDaysAnnual = safeDaysPerWeek * 4;
  const statutoryDays = statutoryDaysAnnual * yearFraction;

  // Jaarlijkse bovenwettelijke dagen bij fulltime (5 dagen/week)
  const nonStatutoryDaysFT = Math.max(0, safeFulltimeDays - 20);
  const nonStatutoryDaysAnnual = nonStatutoryDaysFT * parttimeFactor;
  const nonStatutoryDays = nonStatutoryDaysAnnual * yearFraction;

  const totalDays = statutoryDays + nonStatutoryDays;
  const totalWeeks = safeDaysPerWeek > 0 ? totalDays / safeDaysPerWeek : 0;

  const statutoryHours = statutoryDays * safeHoursPerDay;
  const nonStatutoryHours = nonStatutoryDays * safeHoursPerDay;
  const totalHours = totalDays * safeHoursPerDay;
  const monthlyAccrualDays = safeMonths > 0 ? totalDays / safeMonths : 0;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    daysPerWeek: safeDaysPerWeek,
    fulltimeDays: safeFulltimeDays,
    monthsWorked: safeMonths,
    hoursPerDay: safeHoursPerDay,
    parttimePercentage: Math.round(parttimeFactor * 1000) / 10,
    statutoryDays: round2(statutoryDays),
    nonStatutoryDays: round2(nonStatutoryDays),
    totalDays: round2(totalDays),
    statutoryHours: round2(statutoryHours),
    nonStatutoryHours: round2(nonStatutoryHours),
    totalHours: round2(totalHours),
    totalWeeks: round2(totalWeeks),
    monthlyAccrualDays: round2(monthlyAccrualDays)
  };
}

/* =========================================================================
   11. Salarisverhoging berekenen
   Berekening van loonsverhoging (percentage)
   per maand, per jaar en inclusief 8% wettelijke vakantiebijslag
   ========================================================================= */
export interface SalarisverhogingResult {
  currentSalary: number;
  period: 'monthly' | 'annual';
  increasePercentage: number;
  increaseAmountMonthly: number;
  increaseAmountAnnual: number;
  increaseAmountAnnualWithVacation: number;
  newSalaryMonthly: number;
  newSalaryAnnual: number;
  newSalaryAnnualWithVacation: number;
  hourlyIncreaseEstimate: number;
}

export function calculateSalarisverhoging(
  currentSalary: number,
  period: 'monthly' | 'annual' = 'monthly',
  increasePercentage: number = 4.0
): SalarisverhogingResult {
  const safeSalary = Math.max(0, currentSalary);
  const safePct = Math.max(0, increasePercentage);

  let currentMonthly = 0;
  let currentAnnual = 0;

  if (period === 'monthly') {
    currentMonthly = safeSalary;
    currentAnnual = safeSalary * 12;
  } else {
    currentAnnual = safeSalary;
    currentMonthly = safeSalary / 12;
  }

  const factor = safePct / 100;

  const increaseAmountMonthly = currentMonthly * factor;
  const increaseAmountAnnual = currentAnnual * factor;
  const increaseAmountAnnualWithVacation = increaseAmountAnnual * 1.08;

  const newSalaryMonthly = currentMonthly + increaseAmountMonthly;
  const newSalaryAnnual = currentAnnual + increaseAmountAnnual;
  const newSalaryAnnualWithVacation = newSalaryAnnual * 1.08;

  const monthlyHoursStandard = (40 * 52) / 12;
  const hourlyIncreaseEstimate = monthlyHoursStandard > 0 ? increaseAmountMonthly / monthlyHoursStandard : 0;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    currentSalary: safeSalary,
    period,
    increasePercentage: safePct,
    increaseAmountMonthly: round2(increaseAmountMonthly),
    increaseAmountAnnual: round2(increaseAmountAnnual),
    increaseAmountAnnualWithVacation: round2(increaseAmountAnnualWithVacation),
    newSalaryMonthly: round2(newSalaryMonthly),
    newSalaryAnnual: round2(newSalaryAnnual),
    newSalaryAnnualWithVacation: round2(newSalaryAnnualWithVacation),
    hourlyIncreaseEstimate: round2(hourlyIncreaseEstimate)
  };
}

/* =========================================================================
   12. Uurloon naar Maandloon berekenen
   Formule: Maandsalaris = (Uurloon * wekelijkse_uren * 52) / 12
   Weeksalaris = Uurloon * wekelijkse_uren
   4-weken salaris = Weeksalaris * 4
   Jaarsalaris = Maandsalaris * 12 (of Weeksalaris * 52)
   Vakantiegeld = 8% over jaarsalaris (en maandelijks 8% over maandsalaris)
   ========================================================================= */
export interface UurloonNaarMaandloonResult {
  hourlyWage: number;
  weeklyHours: number;
  weeklySalary: number;
  fourWeeklySalary: number;
  monthlyHours: number;
  monthlySalary: number;
  monthlyVacationPay: number;
  monthlyTotalWithVacation: number;
  annualSalary: number;
  annualVacationPay: number;
  annualSalaryWithVacation: number;
  dailyWage: number;
}

export function calculateUurloonNaarMaandloon(
  hourlyWage: number,
  weeklyHours: number
): UurloonNaarMaandloonResult {
  const safeHourly = Math.max(0, hourlyWage);
  const safeHours = Math.max(0, weeklyHours);
  const weeklySalary = safeHourly * safeHours;
  const fourWeeklySalary = weeklySalary * 4;
  const monthlyHours = (safeHours * 52) / 12;
  const monthlySalary = safeHourly * monthlyHours;
  const monthlyVacationPay = monthlySalary * 0.08;
  const monthlyTotalWithVacation = monthlySalary + monthlyVacationPay;
  const annualSalary = monthlySalary * 12;
  const annualVacationPay = annualSalary * 0.08;
  const annualSalaryWithVacation = annualSalary + annualVacationPay;
  const dailyWage = safeHours > 0 ? (weeklySalary / 5) : 0;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    hourlyWage: safeHourly,
    weeklyHours: safeHours,
    weeklySalary: round2(weeklySalary),
    fourWeeklySalary: round2(fourWeeklySalary),
    monthlyHours: round2(monthlyHours),
    monthlySalary: round2(monthlySalary),
    monthlyVacationPay: round2(monthlyVacationPay),
    monthlyTotalWithVacation: round2(monthlyTotalWithVacation),
    annualSalary: round2(annualSalary),
    annualVacationPay: round2(annualVacationPay),
    annualSalaryWithVacation: round2(annualSalaryWithVacation),
    dailyWage: round2(dailyWage)
  };
}

/* =========================================================================
   13. Maandloon naar Uurloon berekenen
   Formule: Uurloon = (Maandsalaris * 12) / (wekelijkse_uren * 52)
   Gemiddelde maanduren = (wekelijkse_uren * 52) / 12
   Weeksalaris = (Maandsalaris * 12) / 52
   4-weken salaris = (Maandsalaris * 12) / 13
   Jaarsalaris = Maandsalaris * 12
   ========================================================================= */
export interface MaandloonNaarUurloonResult {
  monthlySalary: number;
  weeklyHours: number;
  hourlyWage: number;
  weeklySalary: number;
  fourWeeklySalary: number;
  monthlyHours: number;
  annualSalary: number;
  annualSalaryWithVacation: number;
  dailyWage: number;
}

export function calculateMaandloonNaarUurloon(
  monthlySalary: number,
  weeklyHours: number
): MaandloonNaarUurloonResult {
  const safeMonthly = Math.max(0, monthlySalary);
  const safeHours = Math.max(0, weeklyHours);
  const monthlyHours = (safeHours * 52) / 12;
  const hourlyWage = monthlyHours > 0 ? safeMonthly / monthlyHours : 0;
  const annualSalary = safeMonthly * 12;
  const annualSalaryWithVacation = annualSalary * 1.08;
  const weeklySalary = (safeMonthly * 12) / 52;
  const fourWeeklySalary = (safeMonthly * 12) / 13;
  const dailyWage = safeHours > 0 ? weeklySalary / 5 : 0;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    monthlySalary: safeMonthly,
    weeklyHours: safeHours,
    hourlyWage: round2(hourlyWage),
    weeklySalary: round2(weeklySalary),
    fourWeeklySalary: round2(fourWeeklySalary),
    monthlyHours: round2(monthlyHours),
    annualSalary: round2(annualSalary),
    annualSalaryWithVacation: round2(annualSalaryWithVacation),
    dailyWage: round2(dailyWage)
  };
}

/* =========================================================================
   14. Werkuren per Jaar berekenen
   Contractuele jaaruren = wekelijkse_uren * 52
   Contractuele maanduren = (wekelijkse_uren * 52) / 12
   Contractuele werkdagen (5-daagse basis) = 52 * 5 = 260 dagen
   Uren per dag = wekelijkse_uren / 5
   Vakantie-uren = vakantiedagen * uren_per_dag
   Feestdag-uren = feestdagen * uren_per_dag
   ADV-uren = adv_dagen * uren_per_dag
   Netto gewerkte jaaruren = Contractuele jaaruren - Vakantie-uren - Feestdag-uren - ADV-uren
   Netto gewerkte maanduren = Netto gewerkte jaaruren / 12
   Netto gewerkte werkweken = wekelijkse_uren > 0 ? Netto gewerkte jaaruren / wekelijkse_uren : 0
   Netto gewerkte werkdagen = uren_per_dag > 0 ? Netto gewerkte jaaruren / uren_per_dag : 0
   ========================================================================= */
export interface WerkurenPerJaarResult {
  weeklyHours: number;
  vacationDays: number;
  publicHolidays: number;
  advDays: number;
  dailyHours: number;
  contractualAnnualHours: number;
  contractualMonthlyHours: number;
  contractualAnnualDays: number;
  vacationHours: number;
  holidayHours: number;
  advHours: number;
  totalLeaveHours: number;
  actualAnnualHours: number;
  actualMonthlyHours: number;
  actualAnnualWeeks: number;
  actualAnnualDays: number;
}

export function calculateWerkurenPerJaar(
  weeklyHours: number,
  vacationDays: number = 25,
  publicHolidays: number = 7,
  advDays: number = 0
): WerkurenPerJaarResult {
  const safeHours = Math.max(0, weeklyHours);
  const safeVacationDays = Math.max(0, vacationDays);
  const safeHolidays = Math.max(0, publicHolidays);
  const safeAdvDays = Math.max(0, advDays);

  const dailyHours = safeHours > 0 ? safeHours / 5 : 0;
  const contractualAnnualHours = safeHours * 52;
  const contractualMonthlyHours = (safeHours * 52) / 12;
  const contractualAnnualDays = 52 * 5; // 260 nominale werkdagen

  const vacationHours = safeVacationDays * dailyHours;
  const holidayHours = safeHolidays * dailyHours;
  const advHours = safeAdvDays * dailyHours;
  const totalLeaveHours = vacationHours + holidayHours + advHours;

  const actualAnnualHours = Math.max(0, contractualAnnualHours - totalLeaveHours);
  const actualMonthlyHours = actualAnnualHours / 12;
  const actualAnnualWeeks = safeHours > 0 ? actualAnnualHours / safeHours : 0;
  const actualAnnualDays = dailyHours > 0 ? actualAnnualHours / dailyHours : 0;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    weeklyHours: safeHours,
    vacationDays: safeVacationDays,
    publicHolidays: safeHolidays,
    advDays: safeAdvDays,
    dailyHours: round2(dailyHours),
    contractualAnnualHours: round2(contractualAnnualHours),
    contractualMonthlyHours: round2(contractualMonthlyHours),
    contractualAnnualDays,
    vacationHours: round2(vacationHours),
    holidayHours: round2(holidayHours),
    advHours: round2(advHours),
    totalLeaveHours: round2(totalLeaveHours),
    actualAnnualHours: round2(actualAnnualHours),
    actualMonthlyHours: round2(actualMonthlyHours),
    actualAnnualWeeks: round2(actualAnnualWeeks),
    actualAnnualDays: round2(actualAnnualDays)
  };
}

/* =========================================================================
   15. Woon-werk kosten berekenen
   Afstand enkele reis, reisdagen per week, verbruik per 100km, brandstofprijs, parkeer/tol
   ========================================================================= */
export interface WoonWerkKostenResult {
  oneWayKm: number;
  returnKmDaily: number;
  travelDaysPerWeek: number;
  annualTravelDays: number;
  fuelConsumptionPer100Km: number;
  fuelPricePerLiter: number;
  dailyExtraCosts: number;
  fuelCostPerKm: number;
  costPerOneWay: number;
  fuelCostDaily: number;
  totalCostDaily: number;
  weeklyFuelCost: number;
  weeklyTotalCost: number;
  monthlyFuelCost: number;
  monthlyTotalCost: number;
  annualFuelCost: number;
  annualTotalCost: number;
  annualCommuteKm: number;
  taxFreeAllowanceAnnual: number;
  taxFreeAllowanceMonthly: number;
  totalCarCostEstimateAnnual: number;
}

export function calculateWoonWerkKosten(
  oneWayKm: number,
  travelDaysPerWeek: number = 5,
  fuelConsumptionPer100Km: number = 6.5,
  fuelPricePerLiter: number = 2.05,
  dailyExtraCosts: number = 0
): WoonWerkKostenResult {
  const safeOneWay = Math.max(0, oneWayKm);
  const safeDays = Math.min(7, Math.max(0, travelDaysPerWeek));
  const safeConsumption = Math.max(0, fuelConsumptionPer100Km);
  const safePrice = Math.max(0, fuelPricePerLiter);
  const safeExtra = Math.max(0, dailyExtraCosts);

  const returnKmDaily = safeOneWay * 2;
  // Belastingdienst 214-dagen norm pro rato
  const annualTravelDays = (safeDays / 5) * 214;
  const annualCommuteKm = returnKmDaily * annualTravelDays;

  // Brandstofkosten per km
  const fuelCostPerKm = (safeConsumption / 100) * safePrice;
  const costPerOneWay = safeOneWay * fuelCostPerKm;
  const fuelCostDaily = returnKmDaily * fuelCostPerKm;
  const totalCostDaily = fuelCostDaily + safeExtra;

  // Week
  const weeklyFuelCost = fuelCostDaily * safeDays;
  const weeklyTotalCost = totalCostDaily * safeDays;

  // Jaar (o.b.v. 214 norm)
  const annualFuelCost = fuelCostDaily * annualTravelDays;
  const annualTotalCost = totalCostDaily * annualTravelDays;

  // Maand (12 maanden)
  const monthlyFuelCost = annualFuelCost / 12;
  const monthlyTotalCost = annualTotalCost / 12;

  // Fiscale vergoeding (€ 0,23 / km)
  const taxFreeAllowanceAnnual = annualCommuteKm * DUTCH_RATES.travelAllowancePerKm;
  const taxFreeAllowanceMonthly = taxFreeAllowanceAnnual / 12;

  // ANWB / Nibud indicatie totale autokosten (ca. € 0,45 / km benchmark)
  const totalCarCostEstimateAnnual = annualCommuteKm * 0.45;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    oneWayKm: safeOneWay,
    returnKmDaily: round2(returnKmDaily),
    travelDaysPerWeek: safeDays,
    annualTravelDays: round2(annualTravelDays),
    fuelConsumptionPer100Km: safeConsumption,
    fuelPricePerLiter: safePrice,
    dailyExtraCosts: safeExtra,
    fuelCostPerKm: round2(fuelCostPerKm),
    costPerOneWay: round2(costPerOneWay),
    fuelCostDaily: round2(fuelCostDaily),
    totalCostDaily: round2(totalCostDaily),
    weeklyFuelCost: round2(weeklyFuelCost),
    weeklyTotalCost: round2(weeklyTotalCost),
    monthlyFuelCost: round2(monthlyFuelCost),
    monthlyTotalCost: round2(monthlyTotalCost),
    annualFuelCost: round2(annualFuelCost),
    annualTotalCost: round2(annualTotalCost),
    annualCommuteKm: round2(annualCommuteKm),
    taxFreeAllowanceAnnual: round2(taxFreeAllowanceAnnual),
    taxFreeAllowanceMonthly: round2(taxFreeAllowanceMonthly),
    totalCarCostEstimateAnnual: round2(totalCarCostEstimateAnnual)
  };
}

/* =========================================================================
   16. Kilometervergoeding berekenen
   Woon-werkkilometers, tarief per km, enkele reis vs retour
   en Belastingdienst 214-dagenregeling pro-rata
   ========================================================================= */
export interface KilometervergoedingOptions {
  distanceKm: number;
  isReturnTrip?: boolean;
  travelDaysPerWeek: number;
  ratePerKm?: number;
}

export interface KilometervergoedingResult {
  singleKm: number;
  dailyKm: number;
  weeklyKm: number;
  annualKm: number;
  travelDaysPerWeek: number;
  annualTravelDays: number;
  ratePerKm: number;
  officialRatePerKm: number;
  singleAllowance: number;
  dailyAllowance: number;
  weeklyAllowance: number;
  monthlyAllowance: number;
  annualAllowance: number;
  isAboveOfficialRate: boolean;
  taxableRateDiff: number;
  taxablePortionMonthly: number;
  untaxedPortionMonthly: number;
}

export function calculateKilometervergoeding({
  distanceKm,
  isReturnTrip = false,
  travelDaysPerWeek,
  ratePerKm = DUTCH_RATES.travelAllowancePerKm
}: KilometervergoedingOptions): KilometervergoedingResult {
  const safeDist = Math.max(0, distanceKm);
  const singleKm = isReturnTrip ? safeDist / 2 : safeDist;
  const dailyKm = isReturnTrip ? safeDist : safeDist * 2;
  const safeDays = Math.min(7, Math.max(0, travelDaysPerWeek));
  const safeRate = Math.max(0, ratePerKm);
  const officialRate = DUTCH_RATES.travelAllowancePerKm;

  // Belastingdienst 214-dagen norm: (reisdagen / 5) * 214
  const annualTravelDays = (safeDays / 5) * 214;
  const weeklyKm = dailyKm * safeDays;
  const annualKm = dailyKm * annualTravelDays;

  const singleAllowance = singleKm * safeRate;
  const dailyAllowance = dailyKm * safeRate;
  const weeklyAllowance = dailyAllowance * safeDays;
  const annualAllowance = dailyAllowance * annualTravelDays;
  const monthlyAllowance = annualAllowance / 12;

  const isAboveOfficialRate = safeRate > officialRate;
  const taxableRateDiff = Math.max(0, safeRate - officialRate);
  const untaxedDaily = dailyKm * Math.min(safeRate, officialRate);
  const untaxedMonthly = (untaxedDaily * annualTravelDays) / 12;
  const taxableMonthly = Math.max(0, monthlyAllowance - untaxedMonthly);

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    singleKm: Math.round(singleKm * 100) / 100,
    dailyKm: Math.round(dailyKm * 100) / 100,
    weeklyKm: Math.round(weeklyKm * 100) / 100,
    annualKm: Math.round(annualKm * 100) / 100,
    travelDaysPerWeek: safeDays,
    annualTravelDays: Math.round(annualTravelDays * 10) / 10,
    ratePerKm: round2(safeRate),
    officialRatePerKm: officialRate,
    singleAllowance: round2(singleAllowance),
    dailyAllowance: round2(dailyAllowance),
    weeklyAllowance: round2(weeklyAllowance),
    monthlyAllowance: round2(monthlyAllowance),
    annualAllowance: round2(annualAllowance),
    isAboveOfficialRate,
    taxableRateDiff: round2(taxableRateDiff),
    taxablePortionMonthly: round2(taxableMonthly),
    untaxedPortionMonthly: round2(untaxedMonthly)
  };
}

/* =========================================================================
   17. Weekloon berekenen
   Bruto weekloon vanuit uurloon of vanuit maandloon,
   vierwekenloon (13 periodes) en jaarsalaris (52 weken)
   ========================================================================= */
export interface WeekloonOptions {
  calculationMode: 'from_hourly' | 'from_monthly';
  hourlyWage?: number;
  monthlySalary?: number;
  weeklyHours: number;
}

export interface WeekloonResult {
  calculationMode: 'from_hourly' | 'from_monthly';
  weeklyHours: number;
  hourlyWage: number;
  weeklySalary: number;
  fourWeeklySalary: number;
  monthlySalary: number;
  annualSalary: number;
  annualSalaryWithVacation: number;
  monthlyHours: number;
}

export function calculateWeekloon({
  calculationMode,
  hourlyWage = 0,
  monthlySalary = 0,
  weeklyHours = 40
}: WeekloonOptions): WeekloonResult {
  const safeHours = Math.max(0.5, weeklyHours);
  const monthlyHours = (safeHours * 52) / 12;
  const round2 = (val: number) => Math.round(val * 100) / 100;

  if (calculationMode === 'from_hourly') {
    const safeHourly = Math.max(0, hourlyWage);
    const weeklySalary = safeHourly * safeHours;
    const annualSalary = weeklySalary * 52;
    const monthlySalaryCalc = annualSalary / 12;
    const fourWeeklySalary = weeklySalary * 4;
    const annualSalaryWithVacation = annualSalary * 1.08;

    return {
      calculationMode,
      weeklyHours: safeHours,
      hourlyWage: round2(safeHourly),
      weeklySalary: round2(weeklySalary),
      fourWeeklySalary: round2(fourWeeklySalary),
      monthlySalary: round2(monthlySalaryCalc),
      annualSalary: round2(annualSalary),
      annualSalaryWithVacation: round2(annualSalaryWithVacation),
      monthlyHours: round2(monthlyHours)
    };
  } else {
    const safeMonthly = Math.max(0, monthlySalary);
    const annualSalary = safeMonthly * 12;
    const weeklySalary = annualSalary / 52;
    const fourWeeklySalary = annualSalary / 13;
    const hourlyWageCalc = monthlyHours > 0 ? safeMonthly / monthlyHours : 0;
    const annualSalaryWithVacation = annualSalary * 1.08;

    return {
      calculationMode,
      weeklyHours: safeHours,
      hourlyWage: round2(hourlyWageCalc),
      weeklySalary: round2(weeklySalary),
      fourWeeklySalary: round2(fourWeeklySalary),
      monthlySalary: round2(safeMonthly),
      annualSalary: round2(annualSalary),
      annualSalaryWithVacation: round2(annualSalaryWithVacation),
      monthlyHours: round2(monthlyHours)
    };
  }
}

/* =========================================================================
   18. FTE berekenen
   FTE = uren per week ÷ fulltime uren per week
   Deeltijdpercentage = FTE × 100
   Omgekeerd: Uren per week = FTE × fulltime uren per week
   ========================================================================= */
export interface FteResult {
  weeklyHours: number;
  fulltimeHours: number;
  fte: number; // 2 decimalen (bijv. 0.80 of 0.78)
  fte4Decimals: number; // 4 decimalen voor exacte weergave (bijv. 0.7778)
  ftePercentage: number; // bijv. 80 of 77.78
  rawFte: number; // onafgerond
  isFulltime: boolean;
}

export interface FteToHoursResult {
  targetFte: number;
  fulltimeHours: number;
  calculatedHours: number;
  ftePercentage: number;
}

export function calculateFte(
  weeklyHours: number,
  fulltimeHours: number = 40
): FteResult {
  const safeHours = Math.max(0, weeklyHours);
  const safeFulltime = Math.max(0.1, fulltimeHours);
  const rawFte = safeHours / safeFulltime;
  const fte = Math.round(rawFte * 100) / 100;
  const fte4Decimals = Math.round(rawFte * 10000) / 10000;
  const ftePercentage = Math.round(rawFte * 10000) / 100;

  return {
    weeklyHours: Math.round(safeHours * 100) / 100,
    fulltimeHours: Math.round(safeFulltime * 100) / 100,
    fte,
    fte4Decimals,
    ftePercentage: Math.round(ftePercentage * 100) / 100,
    rawFte,
    isFulltime: Math.abs(rawFte - 1.0) < 0.0001
  };
}

export function calculateFteToHours(
  targetFte: number,
  fulltimeHours: number = 40
): FteToHoursResult {
  const safeFte = Math.max(0, targetFte);
  const safeFulltime = Math.max(0.1, fulltimeHours);
  const calculatedHours = safeFte * safeFulltime;

  return {
    targetFte: Math.round(safeFte * 10000) / 10000,
    fulltimeHours: Math.round(safeFulltime * 100) / 100,
    calculatedHours: Math.round(calculatedHours * 100) / 100,
    ftePercentage: Math.round(safeFte * 10000) / 100
  };
}

/* =========================================================================
   19. Werkgeverslasten berekenen (2026)
   Wettelijke werkgeverspremies en werknemersverzekeringen:
   AWf (laag 2,74%, hoog 7,74%)
   Aof (laag 6,27%, hoog 7,63%)
   Wko (0,50%)
   Whk (gedifferentieerd per werkgever, standaard 1,22%)
   Zvw werkgeversheffing (6,57%)
   Maximum premieloon 2026: € 79.409 per jaar
   ========================================================================= */
export interface WerkgeverslastenOptions {
  period: 'month' | 'year';
  salary: number;
  awfType?: 'low' | 'high';
  aofType?: 'low' | 'high';
  whkPercentage?: number;
  includeVacationPay?: boolean;
}

export interface WerkgeverslastenResult {
  period: 'month' | 'year';
  inputSalary: number;
  annualGrossSalary: number;
  monthlyGrossSalary: number;
  includeVacationPay: boolean;
  vacationPayAmount: number;
  cappedWageBaseAnnual: number;
  cappedWageBaseMonthly: number;
  isCapped: boolean;
  maxPremiumWageAnnual: number;
  awfType: 'low' | 'high';
  awfPercentage: number;
  awfAmountAnnual: number;
  awfAmountMonthly: number;
  aofType: 'low' | 'high';
  aofPercentage: number;
  aofAmountAnnual: number;
  aofAmountMonthly: number;
  wkoPercentage: number;
  wkoAmountAnnual: number;
  wkoAmountMonthly: number;
  whkPercentage: number;
  whkAmountAnnual: number;
  whkAmountMonthly: number;
  zvwPercentage: number;
  zvwAmountAnnual: number;
  zvwAmountMonthly: number;
  totalStatutoryContributionsAnnual: number;
  totalStatutoryContributionsMonthly: number;
  totalEmployerCostAnnual: number;
  totalEmployerCostMonthly: number;
  effectiveMarkupPercentage: number;
}

export interface QuickEmployerCostResult {
  monthlySalary: number;
  annualSalary: number;
  indicativePercentage: number;
  estimatedContributionsMonthly: number;
  estimatedContributionsAnnual: number;
  estimatedTotalCostMonthly: number;
  estimatedTotalCostAnnual: number;
}

export function calculateWerkgeverslasten({
  period,
  salary,
  awfType = 'low',
  aofType = 'low',
  whkPercentage = DUTCH_RATES.employerRates.whkDefault,
  includeVacationPay = false
}: WerkgeverslastenOptions): WerkgeverslastenResult {
  const rates = DUTCH_RATES.employerRates;
  const safeSalary = Math.max(0, salary);

  // Basis jaarsalaris berekenen
  const baseAnnual = period === 'month' ? safeSalary * 12 : safeSalary;
  const vacationPayAmount = includeVacationPay ? baseAnnual * 0.08 : 0;
  const annualGrossSalary = baseAnnual + vacationPayAmount;
  const monthlyGrossSalary = annualGrossSalary / 12;

  // Maximum premieloon aftopping (2026: € 79.409)
  const maxCap = rates.maxPremiumWageAnnual;
  const isCapped = annualGrossSalary > maxCap;
  const cappedWageBaseAnnual = Math.min(annualGrossSalary, maxCap);
  const cappedWageBaseMonthly = cappedWageBaseAnnual / 12;

  // Premiepercentages
  const awfPercentage = awfType === 'high' ? rates.awfHigh : rates.awfLow;
  const aofPercentage = aofType === 'high' ? rates.aofHigh : rates.aofLow;
  const wkoPercentage = rates.wko;
  const safeWhk = Math.max(0, Math.min(20, whkPercentage));
  const zvwPercentage = rates.zvwEmployer;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  // Premiebedragen per jaar op basis van gemaximeerd premieloon
  const awfAmountAnnual = round2(cappedWageBaseAnnual * (awfPercentage / 100));
  const aofAmountAnnual = round2(cappedWageBaseAnnual * (aofPercentage / 100));
  const wkoAmountAnnual = round2(cappedWageBaseAnnual * (wkoPercentage / 100));
  const whkAmountAnnual = round2(cappedWageBaseAnnual * (safeWhk / 100));
  const zvwAmountAnnual = round2(cappedWageBaseAnnual * (zvwPercentage / 100));

  const totalStatutoryContributionsAnnual = round2(
    awfAmountAnnual + aofAmountAnnual + wkoAmountAnnual + whkAmountAnnual + zvwAmountAnnual
  );
  const totalEmployerCostAnnual = round2(annualGrossSalary + totalStatutoryContributionsAnnual);

  // Maandelijkse bedragen
  const awfAmountMonthly = round2(awfAmountAnnual / 12);
  const aofAmountMonthly = round2(aofAmountAnnual / 12);
  const wkoAmountMonthly = round2(wkoAmountAnnual / 12);
  const whkAmountMonthly = round2(whkAmountAnnual / 12);
  const zvwAmountMonthly = round2(zvwAmountAnnual / 12);
  const totalStatutoryContributionsMonthly = round2(totalStatutoryContributionsAnnual / 12);
  const totalEmployerCostMonthly = round2(totalEmployerCostAnnual / 12);

  const effectiveMarkupPercentage = annualGrossSalary > 0
    ? round2((totalStatutoryContributionsAnnual / annualGrossSalary) * 100)
    : 0;

  return {
    period,
    inputSalary: round2(safeSalary),
    annualGrossSalary: round2(annualGrossSalary),
    monthlyGrossSalary: round2(monthlyGrossSalary),
    includeVacationPay,
    vacationPayAmount: round2(vacationPayAmount),
    cappedWageBaseAnnual: round2(cappedWageBaseAnnual),
    cappedWageBaseMonthly: round2(cappedWageBaseMonthly),
    isCapped,
    maxPremiumWageAnnual: maxCap,
    awfType,
    awfPercentage,
    awfAmountAnnual,
    awfAmountMonthly,
    aofType,
    aofPercentage,
    aofAmountAnnual,
    aofAmountMonthly,
    wkoPercentage,
    wkoAmountAnnual,
    wkoAmountMonthly,
    whkPercentage: round2(safeWhk),
    whkAmountAnnual,
    whkAmountMonthly,
    zvwPercentage,
    zvwAmountAnnual,
    zvwAmountMonthly,
    totalStatutoryContributionsAnnual,
    totalStatutoryContributionsMonthly,
    totalEmployerCostAnnual,
    totalEmployerCostMonthly,
    effectiveMarkupPercentage
  };
}

export function calculateQuickEmployerCost(
  monthlySalary: number,
  indicativePercentage: number = 23
): QuickEmployerCostResult {
  const safeSalary = Math.max(0, monthlySalary);
  const safePercentage = Math.max(0, Math.min(100, indicativePercentage));
  const round2 = (val: number) => Math.round(val * 100) / 100;

  const annualSalary = safeSalary * 12;
  const estimatedContributionsMonthly = round2(safeSalary * (safePercentage / 100));
  const estimatedContributionsAnnual = round2(annualSalary * (safePercentage / 100));
  const estimatedTotalCostMonthly = round2(safeSalary + estimatedContributionsMonthly);
  const estimatedTotalCostAnnual = round2(annualSalary + estimatedContributionsAnnual);

  return {
    monthlySalary: round2(safeSalary),
    annualSalary: round2(annualSalary),
    indicativePercentage: safePercentage,
    estimatedContributionsMonthly,
    estimatedContributionsAnnual,
    estimatedTotalCostMonthly,
    estimatedTotalCostAnnual
  };
}

/* =========================================================================
   19. 13e Maand Berekenen
   Formule:
   Volledig jaar: Bruto 13e maand = Bruto maandsalaris * (percentage / 100)
   Deel van het jaar: Pro-rata = (Bruto maandsalaris * (percentage / 100)) * (gewerkte maanden / 12)
   Indicatieve maandelijkse opbouw = Volledig jaar bedrag / 12
   ========================================================================= */
export interface DertiendeMaandOptions {
  monthlySalary: number;
  percentage?: number; // default: 100
  periodMode?: 'full_year' | 'partial_year'; // default: 'full_year'
  workedMonths?: number; // 1 - 12 (default: 12)
}

export interface DertiendeMaandResult {
  monthlySalary: number;
  percentage: number;
  periodMode: 'full_year' | 'partial_year';
  workedMonths: number;
  proRataFactor: number;
  fullYearAmount: number;
  estimatedGross13thMonth: number;
  monthlyAccrual: number;
  annualSalaryWithout13th: number;
  annualSalaryWith13th: number;
  isPartialYear: boolean;
}

export function calculateDertiendeMaand(options: DertiendeMaandOptions): DertiendeMaandResult {
  const safeSalary = Math.max(0, options.monthlySalary);
  const safePercentage = Math.max(0, options.percentage ?? 100);
  const periodMode = options.periodMode ?? 'full_year';
  const rawMonths = options.workedMonths ?? 12;
  const safeWorkedMonths = periodMode === 'partial_year' ? Math.min(12, Math.max(1, Math.round(rawMonths))) : 12;

  const round2 = (val: number) => Math.round(val * 100) / 100;

  const fullYearAmount = round2(safeSalary * (safePercentage / 100));
  const proRataFactor = round2(safeWorkedMonths / 12);
  const estimatedGross13thMonth = round2(fullYearAmount * (safeWorkedMonths / 12));
  const monthlyAccrual = round2(fullYearAmount / 12);
  const annualSalaryWithout13th = round2(safeSalary * 12);
  const annualSalaryWith13th = round2(annualSalaryWithout13th + estimatedGross13thMonth);
  const isPartialYear = periodMode === 'partial_year' && safeWorkedMonths < 12;

  return {
    monthlySalary: round2(safeSalary),
    percentage: round2(safePercentage),
    periodMode,
    workedMonths: safeWorkedMonths,
    proRataFactor,
    fullYearAmount,
    estimatedGross13thMonth,
    monthlyAccrual,
    annualSalaryWithout13th,
    annualSalaryWith13th,
    isPartialYear
  };
}

/* =========================================================================
   20. Opzegtermijn Berekenen
   Wettelijke opzegtermijn conform art. 7:672 Burgerlijk Wetboek.
   Opzegging geschiedt tegen het einde van de kalendermaand.
   ========================================================================= */
export interface OpzegtermijnOptions {
  initiator: 'werknemer' | 'werkgever';
  contractType: 'vast' | 'tijdelijk';
  noticeDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD (indiensttreding, vereist voor werkgever)
}

export interface OpzegtermijnResult {
  initiator: 'werknemer' | 'werkgever';
  contractType: 'vast' | 'tijdelijk';
  noticeDate: string; // YYYY-MM-DD
  startDate?: string;
  yearsOfService: number;
  monthsOfService: number;
  serviceBracketText: string;
  noticePeriodMonths: number;
  noticePeriodText: string;
  startOfNoticeDate: string; // YYYY-MM-DD
  expectedEndDate: string; // YYYY-MM-DD
  formattedNoticeDate: string; // "20 september 2026"
  formattedStartDate?: string;
  formattedStartOfNoticeDate: string; // "1 oktober 2026"
  formattedExpectedEndDate: string; // "31 oktober 2026"
  isTemporaryContract: boolean;
  explanation: string;
}

export function calculateOpzegtermijn(options: OpzegtermijnOptions): OpzegtermijnResult {
  const { initiator, contractType, noticeDate, startDate } = options;

  const parseDateSafe = (dStr: string): Date => {
    const parts = dStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const toIsoDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateDutch = (d: Date): string => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  const noticeD = parseDateSafe(noticeDate);
  const formattedNoticeDate = formatDateDutch(noticeD);

  let yearsOfService = 0;
  let monthsOfService = 0;
  let formattedStartDate = '';

  if (startDate) {
    const startD = parseDateSafe(startDate);
    formattedStartDate = formatDateDutch(startD);

    let y = noticeD.getFullYear() - startD.getFullYear();
    let m = noticeD.getMonth() - startD.getMonth();
    let dayDiff = noticeD.getDate() - startD.getDate();

    if (dayDiff < 0) {
      m--;
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    yearsOfService = Math.max(0, y);
    monthsOfService = Math.max(0, m);
  }

  // Bepaal wettelijke opzegtermijn in maanden
  let noticePeriodMonths = 1;
  let serviceBracketText = '';

  if (initiator === 'werknemer') {
    noticePeriodMonths = 1;
    serviceBracketText = 'Standaard wettelijke termijn voor werknemer (1 maand)';
  } else {
    // Werkgever termijnen op basis van dienstjaren (art. 7:672 lid 2 BW)
    if (yearsOfService < 5) {
      noticePeriodMonths = 1;
      serviceBracketText = 'Minder dan 5 jaar in dienst (1 maand)';
    } else if (yearsOfService < 10) {
      noticePeriodMonths = 2;
      serviceBracketText = '5 tot 10 jaar in dienst (2 maanden)';
    } else if (yearsOfService < 15) {
      noticePeriodMonths = 3;
      serviceBracketText = '10 tot 15 jaar in dienst (3 maanden)';
    } else {
      noticePeriodMonths = 4;
      serviceBracketText = '15 jaar of langer in dienst (4 maanden)';
    }
  }

  const noticePeriodText = noticePeriodMonths === 1 ? '1 maand' : `${noticePeriodMonths} maanden`;

  // Start van de opzegtermijn: 1e dag van de volgende kalendermaand (art. 7:672 lid 1 BW)
  const nYear = noticeD.getFullYear();
  const nMonth = noticeD.getMonth(); // 0-indexed

  const startOfNotice = new Date(nYear, nMonth + 1, 1);
  const startOfNoticeDate = toIsoDate(startOfNotice);
  const formattedStartOfNoticeDate = formatDateDutch(startOfNotice);

  // Einddatum: laatste dag van de maand waarin de termijn afloopt
  const expectedEndD = new Date(nYear, nMonth + noticePeriodMonths + 1, 0);
  const expectedEndDate = toIsoDate(expectedEndD);
  const formattedExpectedEndDate = formatDateDutch(expectedEndD);

  const isTemporaryContract = contractType === 'tijdelijk';

  // Toelichting opstellen
  let explanation = '';
  if (isTemporaryContract) {
    explanation =
      'Bij een tijdelijk contract eindigt de arbeidsovereenkomst meestal van rechtswege op de afgesproken einddatum. Tussentijds opzeggen kan alleen als dit volgens de arbeidsovereenkomst (schriftelijk tussentijds opzegbeding) en de wettelijke regels mogelijk is. Indien tussentijds opzeggen contractueel is toegestaan, geldt indicatief een wettelijke termijn van ' +
      noticePeriodText +
      ' tegen het einde van de maand (einddatum bij opzegging op ' +
      formattedNoticeDate +
      ': ' +
      formattedExpectedEndDate +
      ').';
  } else if (initiator === 'werknemer') {
    explanation =
      'Je zegt als werknemer op met een vast contract. De wettelijke opzegtermijn is normaal gesproken 1 maand. Omdat je op ' +
      formattedNoticeDate +
      ' opzegt, begint de opzegtermijn op ' +
      formattedStartOfNoticeDate +
      ' en eindigt het dienstverband normaal gesproken op ' +
      formattedExpectedEndDate +
      '.';
  } else {
    const serviceYearsStr =
      yearsOfService +
      ' jaar' +
      (monthsOfService > 0 ? ' en ' + monthsOfService + ' maanden' : '');
    explanation =
      'De werkgever zegt op bij een vast contract. Op basis van een diensttijd van ' +
      serviceYearsStr +
      ' (' +
      serviceBracketText +
      ') is de wettelijke opzegtermijn ' +
      noticePeriodText +
      '. Bij opzegging op ' +
      formattedNoticeDate +
      ' vangt de opzegtermijn aan op ' +
      formattedStartOfNoticeDate +
      ' en eindigt het dienstverband normaal gesproken op ' +
      formattedExpectedEndDate +
      '.';
  }

  return {
    initiator,
    contractType,
    noticeDate,
    startDate,
    yearsOfService,
    monthsOfService,
    serviceBracketText,
    noticePeriodMonths,
    noticePeriodText,
    startOfNoticeDate,
    expectedEndDate,
    formattedNoticeDate,
    formattedStartDate: formattedStartDate || undefined,
    formattedStartOfNoticeDate,
    formattedExpectedEndDate,
    isTemporaryContract,
    explanation
  };
}

/* =========================================================================
   21. Arbeidsverleden Berekenen
   Exacte kalenderberekening van gewerkte periode in jaren, maanden en dagen
   ========================================================================= */
export interface ArbeidsverledenOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ArbeidsverledenResult {
  startDate: string;
  endDate: string;
  formattedStartDate: string;
  formattedEndDate: string;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonthsApprox: number;
  humanReadableDuration: string;
  periodText: string;
  isValid: boolean;
  errorMessage?: string;
}

export function calculateArbeidsverleden(options: ArbeidsverledenOptions): ArbeidsverledenResult {
  const { startDate, endDate } = options;

  const parseDateSafe = (dStr: string): Date => {
    const parts = (dStr || '').split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const startD = parseDateSafe(startDate);
  const endD = parseDateSafe(endDate);

  const formatDateDutch = (d: Date): string => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  const formattedStartDate = formatDateDutch(startD);
  const formattedEndDate = formatDateDutch(endD);

  const utc1 = Date.UTC(startD.getFullYear(), startD.getMonth(), startD.getDate());
  const utc2 = Date.UTC(endD.getFullYear(), endD.getMonth(), endD.getDate());

  if (utc2 < utc1) {
    return {
      startDate,
      endDate,
      formattedStartDate,
      formattedEndDate,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalMonthsApprox: 0,
      humanReadableDuration: 'Ongeldige periode',
      periodText: `${formattedStartDate} t/m ${formattedEndDate}`,
      isValid: false,
      errorMessage: 'De einddatum kan niet vóór de startdatum liggen.'
    };
  }

  const totalDays = Math.round((utc2 - utc1) / 86400000);

  let years = endD.getFullYear() - startD.getFullYear();
  let months = endD.getMonth() - startD.getMonth();
  let days = endD.getDate() - startD.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(endD.getFullYear(), endD.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const formatHumanReadable = (y: number, m: number, d: number): string => {
    if (y === 0 && m === 0 && d === 0) {
      return '0 dagen';
    }
    const parts: string[] = [];
    if (y > 0) parts.push(`${y} ${y === 1 ? 'jaar' : 'jaar'}`);
    if (m > 0) parts.push(`${m} ${m === 1 ? 'maand' : 'maanden'}`);
    if (d > 0) parts.push(`${d} ${d === 1 ? 'dag' : 'dagen'}`);

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} en ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} en ${parts[2]}`;
  };

  const humanReadableDuration = formatHumanReadable(years, months, days);
  const totalMonthsApprox = Math.round((years * 12 + months + days / 30.4375) * 10) / 10;

  return {
    startDate,
    endDate,
    formattedStartDate,
    formattedEndDate,
    years,
    months,
    days,
    totalDays,
    totalMonthsApprox,
    humanReadableDuration,
    periodText: `${formattedStartDate} t/m ${formattedEndDate}`,
    isValid: true
  };
}

/* =========================================================================
   22. Wajong Uitkering Berekenen
   Wajong (Wet werk en arbeidsondersteuning jonggehandicapten)
   Referentiemaandloon 2026:
   - Vanaf 1 juli 2026:
     21 jaar en ouder (100%): € 2.337,00
     20 jaar (80%): € 1.869,60
     19 jaar (60%): € 1.402,20
     18 jaar (50%): € 1.168,50
   - Vanaf 1 januari 2026:
     21 jaar en ouder (100%): € 2.294,40
     20 jaar (80%): € 1.835,52
     19 jaar (60%): € 1.376,64
     18 jaar (50%): € 1.147,20

   Percentages Wajong:
   - Duurzaam geen arbeidsvermogen: 75% van het toepasselijke minimum(jeugd)loon
   - Wel arbeidsvermogen: 70% van het toepasselijke minimum(jeugd)loon

   Verrekening inkomen uit werk (Wet vereenvoudiging Wajong):
   - 70% van de bruto inkomsten uit werk wordt verrekend met de Wajong-uitkering.
   - De werknemer houdt bruto 30% van elke verdiende euro extra over (tot Wajong € 0 bereikt).
   ========================================================================= */

export type WajongArbeidsvermogen = 'wel' | 'geen';
export type WajongPeriod = '2026-07' | '2026-01';

export interface WajongOptions {
  age: number;
  arbeidsvermogen: WajongArbeidsvermogen;
  hasWorkIncome: boolean;
  workIncomeMonthly?: number;
  period?: WajongPeriod;
  guaranteeAmount?: number;
}

export interface WajongResult {
  age: number;
  ageGroupLabel: string;
  arbeidsvermogen: WajongArbeidsvermogen;
  arbeidsvermogenLabel: string;
  wajongPercentage: number; // 70 of 75
  referenceMonthlyWageAdult: number; // bijv. 2337.00
  youthPercentage: number; // 50, 60, 80 of 100
  applicableMinimumWage: number; // referentiemaandloon voor de leeftijd
  maxWajongMonthly: number; // basis Wajong zonder inkomsten
  hasWorkIncome: boolean;
  workIncomeMonthly: number;
  incomeDeduction: number; // 70% van inkomen uit werk (tot max basis)
  retentionBenefit: number; // 30% extra overgehouden van werk
  estimatedWajongMonthly: number; // na aftrek inkomsten
  guaranteeAmount: number;
  isGuaranteeApplied: boolean;
  finalWajongMonthly: number; // inclusief eventueel garantiebedrag
  totalGrossMonthlyIncome: number; // finalWajongMonthly + workIncomeMonthly
  vacationAllowanceMonthlyEstimate: number; // 8% vakantiebijslag reservering UWV
  period: WajongPeriod;
  periodLabel: string;
  isValid: boolean;
  errorMessage?: string;
  noticeMessage?: string;
}

export const WAJONG_RATES_2026 = {
  '2026-07': {
    label: 'Vanaf 1 juli 2026 (huidige norm)',
    adultReferenceMonthlyWage: 2337.00
  },
  '2026-01': {
    label: '1 januari t/m 30 juni 2026',
    adultReferenceMonthlyWage: 2294.40
  }
};

export const WAJONG_YOUTH_PERCENTAGES: Record<number, number> = {
  18: 50,
  19: 60,
  20: 80
};

export function calculateWajong(options: WajongOptions): WajongResult {
  const {
    age,
    arbeidsvermogen,
    hasWorkIncome,
    workIncomeMonthly = 0,
    period = '2026-07',
    guaranteeAmount = 0
  } = options;

  const periodData = WAJONG_RATES_2026[period] || WAJONG_RATES_2026['2026-07'];
  const adultRefWage = periodData.adultReferenceMonthlyWage;

  // Validation
  if (isNaN(age) || age < 18) {
    return {
      age: isNaN(age) ? 0 : age,
      ageGroupLabel: 'Jonger dan 18 jaar',
      arbeidsvermogen,
      arbeidsvermogenLabel: arbeidsvermogen === 'geen' ? 'Duurzaam geen arbeidsvermogen' : 'Wel arbeidsvermogen',
      wajongPercentage: arbeidsvermogen === 'geen' ? 75 : 70,
      referenceMonthlyWageAdult: adultRefWage,
      youthPercentage: 0,
      applicableMinimumWage: 0,
      maxWajongMonthly: 0,
      hasWorkIncome: false,
      workIncomeMonthly: 0,
      incomeDeduction: 0,
      retentionBenefit: 0,
      estimatedWajongMonthly: 0,
      guaranteeAmount: 0,
      isGuaranteeApplied: false,
      finalWajongMonthly: 0,
      totalGrossMonthlyIncome: 0,
      vacationAllowanceMonthlyEstimate: 0,
      period,
      periodLabel: periodData.label,
      isValid: false,
      errorMessage: 'Wajong kan worden aangevraagd vanaf 18 jaar. Voer een leeftijd van 18 jaar of ouder in.'
    };
  }

  const safeWorkIncome = hasWorkIncome ? Math.max(0, Number(workIncomeMonthly) || 0) : 0;
  const safeGuarantee = Math.max(0, Number(guaranteeAmount) || 0);

  // Age group & percentage of minimum wage
  let youthPercentage = 100;
  let ageGroupLabel = `${age} jaar (volwassen minimumloon)`;

  if (age === 18) {
    youthPercentage = WAJONG_YOUTH_PERCENTAGES[18];
    ageGroupLabel = '18 jaar (50% minimumjeugdloon)';
  } else if (age === 19) {
    youthPercentage = WAJONG_YOUTH_PERCENTAGES[19];
    ageGroupLabel = '19 jaar (60% minimumjeugdloon)';
  } else if (age === 20) {
    youthPercentage = WAJONG_YOUTH_PERCENTAGES[20];
    ageGroupLabel = '20 jaar (80% minimumjeugdloon)';
  } else if (age >= 21) {
    youthPercentage = 100;
    ageGroupLabel = age >= 67 ? `${age} jaar (AOW-leeftijd bereikt)` : `${age} jaar (100% wettelijk minimumloon)`;
  }

  let noticeMessage: string | undefined = undefined;
  if (age >= 67) {
    noticeMessage = 'Let op: Bij het bereiken van de AOW-gerechtigde leeftijd stopt de Wajong-uitkering en gaat u over naar de AOW.';
  }

  // Applicable reference minimum wage for this age
  const applicableMinimumWage = Math.round(adultRefWage * (youthPercentage / 100) * 100) / 100;

  // Wajong percentage: 75% for 'geen arbeidsvermogen', 70% for 'wel arbeidsvermogen'
  const wajongPercentage = arbeidsvermogen === 'geen' ? 75 : 70;
  const arbeidsvermogenLabel = arbeidsvermogen === 'geen'
    ? 'Duurzaam geen arbeidsvermogen (75%)'
    : 'Wel arbeidsvermogen (70%)';

  // Base maximum Wajong without work income
  const maxWajongMonthly = Math.round(applicableMinimumWage * (wajongPercentage / 100) * 100) / 100;

  // Work income deduction: UWV harmonized rule offsets 70% of gross work income
  let incomeDeduction = 0;
  let retentionBenefit = 0;
  let estimatedWajongMonthly = maxWajongMonthly;

  if (safeWorkIncome > 0) {
    const rawDeduction = 0.70 * safeWorkIncome;
    incomeDeduction = Math.round(Math.min(maxWajongMonthly, rawDeduction) * 100) / 100;
    estimatedWajongMonthly = Math.max(0, Math.round((maxWajongMonthly - incomeDeduction) * 100) / 100);
    // Benefit retained: 30% of work income as long as Wajong is not zeroed out
    retentionBenefit = Math.round(Math.min(safeWorkIncome * 0.30, (maxWajongMonthly / 0.70) * 0.30) * 100) / 100;
  }

  // Guarantee amount handling
  let isGuaranteeApplied = false;
  let finalWajongMonthly = estimatedWajongMonthly;

  if (safeGuarantee > 0 && safeGuarantee > estimatedWajongMonthly) {
    isGuaranteeApplied = true;
    finalWajongMonthly = safeGuarantee;
  }

  // Total gross income = final Wajong + work income
  const totalGrossMonthlyIncome = Math.round((finalWajongMonthly + safeWorkIncome) * 100) / 100;

  // 8% holiday allowance estimate
  const vacationAllowanceMonthlyEstimate = Math.round(finalWajongMonthly * 0.08 * 100) / 100;

  return {
    age,
    ageGroupLabel,
    arbeidsvermogen,
    arbeidsvermogenLabel,
    wajongPercentage,
    referenceMonthlyWageAdult: adultRefWage,
    youthPercentage,
    applicableMinimumWage,
    maxWajongMonthly,
    hasWorkIncome: Boolean(hasWorkIncome && safeWorkIncome > 0),
    workIncomeMonthly: safeWorkIncome,
    incomeDeduction,
    retentionBenefit,
    estimatedWajongMonthly,
    guaranteeAmount: safeGuarantee,
    isGuaranteeApplied,
    finalWajongMonthly,
    totalGrossMonthlyIncome,
    vacationAllowanceMonthlyEstimate,
    period,
    periodLabel: periodData.label,
    isValid: true,
    noticeMessage
  };
}

/* =========================================================================
   23. Netto Besteedbaar Inkomen Berekenen
   Formule:
   Totale inkomsten = netto inkomen (+ optioneel partner) + andere inkomsten + toeslagen
   Totale vaste lasten = huur/hypotheek + energie/water + zorgverzekering + vervoer + overig
   Netto besteedbaar inkomen = Totale inkomsten - Totale vaste lasten
   ========================================================================= */

export interface NettoBesteedbaarInkomenOptions {
  nettoIncome: number;
  partnerIncome?: number;
  otherIncome?: number;
  allowances?: number;
  isHousehold?: boolean;

  housingCosts: number;
  energyWaterCosts: number;
  healthInsuranceCosts: number;
  transportCosts: number;
  otherFixedCosts: number;
}

export interface NettoBesteedbaarInkomenResult {
  nettoIncome: number;
  partnerIncome: number;
  otherIncome: number;
  allowances: number;
  isHousehold: boolean;
  totalIncomeMonthly: number;
  totalIncomeAnnual: number;

  housingCosts: number;
  energyWaterCosts: number;
  healthInsuranceCosts: number;
  transportCosts: number;
  otherFixedCosts: number;
  totalExpensesMonthly: number;
  totalExpensesAnnual: number;

  disposableIncomeMonthly: number;
  disposableIncomeAnnual: number;
  disposableIncomeWeekly: number;
  disposableIncomeDaily: number;

  fixedCostsPercentage: number;
  disposablePercentage: number;
  housingPercentage: number;

  isPositive: boolean;
  shortfallMonthly: number;

  isValid: boolean;
  errorMessage?: string;
}

export function calculateNettoBesteedbaarInkomen(
  options: NettoBesteedbaarInkomenOptions
): NettoBesteedbaarInkomenResult {
  const {
    nettoIncome,
    partnerIncome = 0,
    otherIncome = 0,
    allowances = 0,
    isHousehold = false,
    housingCosts,
    energyWaterCosts,
    healthInsuranceCosts,
    transportCosts,
    otherFixedCosts
  } = options;

  const rawInputs = [
    nettoIncome,
    partnerIncome,
    otherIncome,
    allowances,
    housingCosts,
    energyWaterCosts,
    healthInsuranceCosts,
    transportCosts,
    otherFixedCosts
  ];

  if (rawInputs.some(val => typeof val === 'number' && val < 0)) {
    return {
      nettoIncome: 0,
      partnerIncome: 0,
      otherIncome: 0,
      allowances: 0,
      isHousehold: false,
      totalIncomeMonthly: 0,
      totalIncomeAnnual: 0,
      housingCosts: 0,
      energyWaterCosts: 0,
      healthInsuranceCosts: 0,
      transportCosts: 0,
      otherFixedCosts: 0,
      totalExpensesMonthly: 0,
      totalExpensesAnnual: 0,
      disposableIncomeMonthly: 0,
      disposableIncomeAnnual: 0,
      disposableIncomeWeekly: 0,
      disposableIncomeDaily: 0,
      fixedCostsPercentage: 0,
      disposablePercentage: 0,
      housingPercentage: 0,
      isPositive: true,
      shortfallMonthly: 0,
      isValid: false,
      errorMessage: 'Bedragen kunnen niet negatief zijn. Vul een positief getal of 0 in.'
    };
  }

  const safeNetto = Math.max(0, Number(nettoIncome) || 0);
  const safePartner = isHousehold ? Math.max(0, Number(partnerIncome) || 0) : 0;
  const safeOther = Math.max(0, Number(otherIncome) || 0);
  const safeAllowances = Math.max(0, Number(allowances) || 0);

  const safeHousing = Math.max(0, Number(housingCosts) || 0);
  const safeEnergy = Math.max(0, Number(energyWaterCosts) || 0);
  const safeHealth = Math.max(0, Number(healthInsuranceCosts) || 0);
  const safeTransport = Math.max(0, Number(transportCosts) || 0);
  const safeOtherCosts = Math.max(0, Number(otherFixedCosts) || 0);

  const totalIncomeMonthly = Math.round((safeNetto + safePartner + safeOther + safeAllowances) * 100) / 100;
  const totalIncomeAnnual = Math.round((totalIncomeMonthly * 12) * 100) / 100;

  const totalExpensesMonthly = Math.round((safeHousing + safeEnergy + safeHealth + safeTransport + safeOtherCosts) * 100) / 100;
  const totalExpensesAnnual = Math.round((totalExpensesMonthly * 12) * 100) / 100;

  const disposableIncomeMonthly = Math.round((totalIncomeMonthly - totalExpensesMonthly) * 100) / 100;
  const disposableIncomeAnnual = Math.round((disposableIncomeMonthly * 12) * 100) / 100;
  const disposableIncomeWeekly = Math.round((disposableIncomeAnnual / 52.14) * 100) / 100;
  const disposableIncomeDaily = Math.round((disposableIncomeAnnual / 365) * 100) / 100;

  const fixedCostsPercentage = totalIncomeMonthly > 0
    ? Math.round((totalExpensesMonthly / totalIncomeMonthly) * 1000) / 10
    : 0;
  const disposablePercentage = totalIncomeMonthly > 0
    ? Math.round((disposableIncomeMonthly / totalIncomeMonthly) * 1000) / 10
    : 0;
  const housingPercentage = totalIncomeMonthly > 0
    ? Math.round((safeHousing / totalIncomeMonthly) * 1000) / 10
    : 0;

  const isPositive = disposableIncomeMonthly >= 0;
  const shortfallMonthly = isPositive ? 0 : Math.round(Math.abs(disposableIncomeMonthly) * 100) / 100;

  return {
    nettoIncome: safeNetto,
    partnerIncome: safePartner,
    otherIncome: safeOther,
    allowances: safeAllowances,
    isHousehold,
    totalIncomeMonthly,
    totalIncomeAnnual,
    housingCosts: safeHousing,
    energyWaterCosts: safeEnergy,
    healthInsuranceCosts: safeHealth,
    transportCosts: safeTransport,
    otherFixedCosts: safeOtherCosts,
    totalExpensesMonthly,
    totalExpensesAnnual,
    disposableIncomeMonthly,
    disposableIncomeAnnual,
    disposableIncomeWeekly,
    disposableIncomeDaily,
    fixedCostsPercentage,
    disposablePercentage,
    housingPercentage,
    isPositive,
    shortfallMonthly,
    isValid: true
  };
}

/* =========================================================================
   24. Transitievergoeding Berekenen
   Wettelijke transitievergoeding conform art. 7:673 Burgerlijk Wetboek (BW),
   WAB-regels (vanaf dag 1) en wettelijk maximum 2026 (€ 102.000 of jaarsalaris).
   Opbouw: 1/3 maandsalaris per vol dienstjaar, naar rato per maand en dag.
   ========================================================================= */

export type ContractTypeTransitievergoeding = 'vast' | 'tijdelijk' | 'oproep';

export type TerminationReasonTransitievergoeding =
  | 'ontslag_werkgever'
  | 'tijdelijk_niet_verlengd'
  | 'wederzijds_goedvinden'
  | 'zelf_ontslag'
  | 'ernstig_verwijtbaar_werkgever'
  | 'ernstig_verwijtbaar_werknemer'
  | 'pensioen'
  | 'anders';

export interface TransitievergoedingOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  contractType?: ContractTypeTransitievergoeding;
  baseMonthlySalary?: number;
  hourlyWage?: number;
  averageHoursPerMonth?: number;
  includeHolidayAllowance?: boolean;
  holidayAllowancePercentage?: number;
  annualBonusOr13thMonth?: number;
  structuralAllowancesMonthly?: number;
  variableBonusAverageMonthly?: number;
  terminationReason?: TerminationReasonTransitievergoeding;
  endDateInclusive?: boolean;
}

export interface TransitievergoedingResult {
  startDate: string;
  endDate: string;
  formattedStartDate: string;
  formattedEndDate: string;
  yearsOfService: number;
  monthsOfService: number;
  daysOfService: number;
  totalDays: number;
  serviceDurationText: string;

  contractType: ContractTypeTransitievergoeding;
  contractTypeLabel: string;

  baseSalaryMonthly: number;
  holidayAllowanceMonthly: number;
  thirteenthMonthMonthly: number;
  structuralAllowancesMonthly: number;
  variableBonusMonthly: number;
  totalMonthlySalary: number;
  totalAnnualSalary: number;

  severanceFullYears: number;
  severanceRemainingMonths: number;
  severanceRemainingDays: number;
  rawTransitievergoeding: number;

  statutoryCap2026: number;
  effectiveCap: number;
  isCapped: boolean;
  finalTransitievergoeding: number;

  terminationReason: TerminationReasonTransitievergoeding;
  terminationReasonLabel: string;
  isEligible: boolean;
  eligibilityStatusLabel: string;
  eligibilityExplanation: string;

  isValid: boolean;
  errorMessage?: string;
}

export const STATUTORY_TRANSITIEVERGOEDING_MAX_2026 = 102000;

export function calculateTransitievergoeding(
  options: TransitievergoedingOptions
): TransitievergoedingResult {
  const {
    startDate,
    endDate,
    contractType = 'vast',
    baseMonthlySalary = 0,
    hourlyWage = 0,
    averageHoursPerMonth = 0,
    includeHolidayAllowance = true,
    holidayAllowancePercentage = 8,
    annualBonusOr13thMonth = 0,
    structuralAllowancesMonthly = 0,
    variableBonusAverageMonthly = 0,
    terminationReason = 'ontslag_werkgever',
    endDateInclusive = true
  } = options;

  const parseDateSafe = (dStr: string): Date => {
    const parts = (dStr || '').split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const startD = parseDateSafe(startDate);
  const endD = parseDateSafe(endDate);

  const formatDateDutch = (d: Date): string => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  const formattedStartDate = formatDateDutch(startD);
  const formattedEndDate = formatDateDutch(endD);

  const utc1 = Date.UTC(startD.getFullYear(), startD.getMonth(), startD.getDate());
  const utc2 = Date.UTC(endD.getFullYear(), endD.getMonth(), endD.getDate());

  if (utc2 < utc1) {
    return {
      startDate,
      endDate,
      formattedStartDate,
      formattedEndDate,
      yearsOfService: 0,
      monthsOfService: 0,
      daysOfService: 0,
      totalDays: 0,
      serviceDurationText: 'Ongeldige periode',
      contractType,
      contractTypeLabel: 'Onbekend',
      baseSalaryMonthly: 0,
      holidayAllowanceMonthly: 0,
      thirteenthMonthMonthly: 0,
      structuralAllowancesMonthly: 0,
      variableBonusMonthly: 0,
      totalMonthlySalary: 0,
      totalAnnualSalary: 0,
      severanceFullYears: 0,
      severanceRemainingMonths: 0,
      severanceRemainingDays: 0,
      rawTransitievergoeding: 0,
      statutoryCap2026: STATUTORY_TRANSITIEVERGOEDING_MAX_2026,
      effectiveCap: STATUTORY_TRANSITIEVERGOEDING_MAX_2026,
      isCapped: false,
      finalTransitievergoeding: 0,
      terminationReason,
      terminationReasonLabel: 'Onbekend',
      isEligible: false,
      eligibilityStatusLabel: 'Ongeldig',
      eligibilityExplanation: 'De einddatum kan niet vóór de startdatum liggen.',
      isValid: false,
      errorMessage: 'De einddatum kan niet vóór de startdatum liggen.'
    };
  }

  // Calculate calendar duration (inclusive of end date per Dutch labor law practice: "tot en met de laatste werkdag")
  const calcEndD = endDateInclusive
    ? new Date(endD.getFullYear(), endD.getMonth(), endD.getDate() + 1)
    : endD;

  let years = calcEndD.getFullYear() - startD.getFullYear();
  let months = calcEndD.getMonth() - startD.getMonth();
  let days = calcEndD.getDate() - startD.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(calcEndD.getFullYear(), calcEndD.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const rawTotalDays = Math.round((utc2 - utc1) / 86400000) + (endDateInclusive ? 1 : 0);
  const totalDays = Math.max(0, rawTotalDays);

  const formatServiceDuration = (y: number, m: number, d: number): string => {
    if (y === 0 && m === 0 && d === 0) return '0 dagen';
    const parts: string[] = [];
    if (y > 0) parts.push(`${y} ${y === 1 ? 'jaar' : 'jaar'}`);
    if (m > 0) parts.push(`${m} ${m === 1 ? 'maand' : 'maanden'}`);
    if (d > 0) parts.push(`${d} ${d === 1 ? 'dag' : 'dagen'}`);

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} en ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} en ${parts[2]}`;
  };

  const serviceDurationText = formatServiceDuration(years, months, days);

  // Contract type label
  let contractTypeLabel = 'Vast contract';
  if (contractType === 'tijdelijk') contractTypeLabel = 'Tijdelijk contract';
  if (contractType === 'oproep') contractTypeLabel = 'Oproep- / min-maxcontract';

  // Base monthly salary calculation
  let baseSalary = 0;
  if (contractType === 'oproep') {
    const sHourly = Math.max(0, Number(hourlyWage) || 0);
    const sHours = Math.max(0, Number(averageHoursPerMonth) || 0);
    baseSalary = Math.round(sHourly * sHours * 100) / 100;
  } else {
    baseSalary = Math.max(0, Number(baseMonthlySalary) || 0);
  }

  // Allowances calculation under Besluit loonbegrip
  const holidayAllowanceRate = includeHolidayAllowance
    ? Math.max(0, Number(holidayAllowancePercentage) || 0) / 100
    : 0;
  const holidayAllowanceMonthly = Math.round(baseSalary * holidayAllowanceRate * 100) / 100;

  const raw13th = Math.max(0, Number(annualBonusOr13thMonth) || 0);
  const thirteenthMonthMonthly = Math.round((raw13th / 12) * 100) / 100;

  const structuralAllowances = Math.max(0, Number(structuralAllowancesMonthly) || 0);
  const variableBonus = Math.max(0, Number(variableBonusAverageMonthly) || 0);

  const totalMonthlySalary = Math.round(
    (baseSalary + holidayAllowanceMonthly + thirteenthMonthMonthly + structuralAllowances + variableBonus) * 100
  ) / 100;
  const totalAnnualSalary = Math.round(totalMonthlySalary * 12 * 100) / 100;

  // Accrual formula: 1/3 per full year + proportional for remaining months and days
  // a = years * (1/3 * totalMonthlySalary)
  // b = (months / 12) * (1/3 * totalMonthlySalary)
  // c = (days / 365) * (1/3 * totalMonthlySalary)
  const monthlyAccrualRate = totalMonthlySalary / 3;

  const severanceFullYears = Math.round(years * monthlyAccrualRate * 100) / 100;
  const severanceRemainingMonths = Math.round((months / 12) * monthlyAccrualRate * 100) / 100;
  const severanceRemainingDays = Math.round((days / 365) * monthlyAccrualRate * 100) / 100;

  const rawTransitievergoeding = Math.round(
    (years + months / 12 + days / 365) * monthlyAccrualRate * 100
  ) / 100;

  // Statutory cap 2026: € 102.000 of 1 bruto jaarsalaris indien dat hoger is
  const statutoryCap2026 = STATUTORY_TRANSITIEVERGOEDING_MAX_2026;
  const effectiveCap = Math.max(statutoryCap2026, totalAnnualSalary);
  const isCapped = rawTransitievergoeding > effectiveCap;
  const finalTransitievergoeding = isCapped ? effectiveCap : rawTransitievergoeding;

  // Termination reason interpretation
  let terminationReasonLabel = 'Ontslag door werkgever';
  let isEligible = true;
  let eligibilityStatusLabel = 'Wettelijk recht op transitievergoeding';
  let eligibilityExplanation =
    'Bij ontslag op initiatief van de werkgever (via UWV of de kantonrechter) heb je volgens art. 7:673 BW wettelijk recht op de volledige transitievergoeding.';

  switch (terminationReason) {
    case 'tijdelijk_niet_verlengd':
      terminationReasonLabel = 'Tijdelijk contract niet verlengd door werkgever';
      isEligible = true;
      eligibilityStatusLabel = 'Wettelijk recht op transitievergoeding';
      eligibilityExplanation =
        'Wanneer een tijdelijk contract op initiatief van de werkgever van rechtswege afloopt en niet wordt verlengd, heb je vanaf dag 1 recht op de transitievergoeding.';
      break;
    case 'wederzijds_goedvinden':
      terminationReasonLabel = 'Wederzijds goedvinden (Vaststellingsovereenkomst / VSO)';
      isEligible = true;
      eligibilityStatusLabel = 'Onderhandelbaar (wettelijke richtlijn)';
      eligibilityExplanation =
        'Bij een vaststellingsovereenkomst (VSO) geldt de transitievergoeding niet dwingend, maar fungeert deze in de onderhandelingen vrijwel altijd als het absolute minimale startpunt.';
      break;
    case 'zelf_ontslag':
      terminationReasonLabel = 'Zelf ontslag genomen';
      isEligible = false;
      eligibilityStatusLabel = 'In de regel geen recht op transitievergoeding';
      eligibilityExplanation =
        'Als je zelf het initiatief neemt om ontslag te nemen, vervalt in de regel het recht op een transitievergoeding, tenzij er sprake is van ernstig verwijtbaar handelen van de werkgever.';
      break;
    case 'ernstig_verwijtbaar_werkgever':
      terminationReasonLabel = 'Ontslag wegens ernstig verwijtbaar handelen werkgever';
      isEligible = true;
      eligibilityStatusLabel = 'Recht op transitievergoeding (+ evt. billijke vergoeding)';
      eligibilityExplanation =
        'Wanneer het ontslag te wijten is aan ernstig verwijtbaar handelen of nalaten van de werkgever, behoud je het recht op de transitievergoeding en kan de kantonrechter een aanvullende billijke vergoeding toekennen.';
      break;
    case 'ernstig_verwijtbaar_werknemer':
      terminationReasonLabel = 'Ontslag wegens ernstig verwijtbaar handelen werknemer';
      isEligible = false;
      eligibilityStatusLabel = 'Geen recht op transitievergoeding';
      eligibilityExplanation =
        'Bij ontslag wegens ernstig verwijtbaar handelen of nalaten van de werknemer (zoals diefstal, fraude of werkweigering) vervalt volgens de wet het recht op een transitievergoeding.';
      break;
    case 'pensioen':
      terminationReasonLabel = 'Beëindiging wegens bereiken AOW- of pensioenleeftijd';
      isEligible = false;
      eligibilityStatusLabel = 'Geen wettelijk recht bij AOW/pensioen';
      eligibilityExplanation =
        'Bij beëindiging van het dienstverband wegens het bereiken van de AOW-gerechtigde leeftijd of een overeengekomen pensioenleeftijd bestaat wettelijk geen recht op een transitievergoeding.';
      break;
    case 'anders':
      terminationReasonLabel = 'Andere beëindigingssituatie';
      isEligible = true;
      eligibilityStatusLabel = 'Afhankelijk van omstandigheden';
      eligibilityExplanation =
        'Of je recht hebt op een transitievergoeding hangt af van wie het initiatief nam en of er sprake is van ernstige verwijtbaarheid.';
      break;
    default:
      break;
  }

  return {
    startDate,
    endDate,
    formattedStartDate,
    formattedEndDate,
    yearsOfService: years,
    monthsOfService: months,
    daysOfService: days,
    totalDays,
    serviceDurationText,
    contractType,
    contractTypeLabel,
    baseSalaryMonthly: baseSalary,
    holidayAllowanceMonthly,
    thirteenthMonthMonthly,
    structuralAllowancesMonthly: structuralAllowances,
    variableBonusMonthly: variableBonus,
    totalMonthlySalary,
    totalAnnualSalary,
    severanceFullYears,
    severanceRemainingMonths,
    severanceRemainingDays,
    rawTransitievergoeding,
    statutoryCap2026,
    effectiveCap,
    isCapped,
    finalTransitievergoeding,
    terminationReason,
    terminationReasonLabel,
    isEligible,
    eligibilityStatusLabel,
    eligibilityExplanation,
    isValid: true
  };
}

/* =========================================================================
   25. Netto Salaris Berekenen
   Witte maandtabel & jaarregeling conform Belastingdienst 2026.
   Inclusief schijventarief, algemene heffingskorting, arbeidskorting,
   loonheffingskorting, AOW-differentiatie, pensioenpremie (pre-tax),
   en tabel bijzondere beloningen voor vakantiegeld en 13e maand / bonus.
   ========================================================================= */

export type SalaryPeriod = 'month' | '4week' | 'week' | 'hour' | 'year';

export interface NettoSalarisOptions {
  grossSalary: number;
  salaryPeriod?: SalaryPeriod;
  weeklyHours?: number;
  age?: number;
  birthDate?: string; // YYYY-MM-DD
  isAowEligible?: boolean;
  applyLoonheffingskorting?: boolean;
  employeePensionMonthly?: number;
  otherDeductionsMonthly?: number;
  includeHolidayAllowance?: boolean;
  hasBonusOr13thMonth?: boolean;
  grossBonusOr13thMonth?: number;
  taxYear?: number;
}

export interface NettoSalarisResult {
  grossInput: number;
  salaryPeriod: SalaryPeriod;
  salaryPeriodLabel: string;
  weeklyHours?: number;

  grossMonthlySalary: number;
  grossAnnualSalary: number;
  grossFourWeeklySalary: number;
  grossWeeklySalary: number;
  grossHourlyWage?: number;

  isAowEligible: boolean;
  age: number;
  applyLoonheffingskorting: boolean;

  employeePensionMonthly: number;
  taxableMonthlyWage: number;
  taxableAnnualWage: number;

  grossTaxMonthly: number;
  generalTaxCreditMonthly: number;
  labourTaxCreditMonthly: number;
  totalTaxCreditsMonthly: number;
  appliedTaxCreditMonthly: number;
  payrollTaxMonthly: number;
  payrollTaxAnnual: number;

  effectiveTaxRatePercentage: number;

  otherDeductionsMonthly: number;

  netMonthlySalary: number;
  netAnnualSalary: number;
  netFourWeeklySalary: number;
  netWeeklySalary: number;
  netHourlyWage?: number;

  includeHolidayAllowance: boolean;
  grossHolidayAllowanceAnnual: number;
  marginalTaxRateHolidayPercentage: number;
  taxHolidayAllowanceAnnual: number;
  netHolidayAllowanceAnnual: number;
  netAnnualSalaryWithHoliday: number;

  hasBonusOr13thMonth: boolean;
  grossBonusOr13thMonth: number;
  marginalTaxRateBonusPercentage: number;
  taxBonusOr13thMonth: number;
  netBonusOr13thMonth: number;

  isBelowMinimumWage?: boolean;
  minimumWageNotice?: string;

  taxYear: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Berekent het marginale belastingtarief volgens de Tabel Bijzondere Beloningen 2026.
 * Houdt rekening met het schijventarief én de marginale afbouw/opbouw van AHK en arbeidskorting.
 */
export function calculateMarginalTaxRate2026(
  taxableAnnualWage: number,
  isAow: boolean = false
): number {
  const Y = Math.max(0, taxableAnnualWage);

  // 1. Basis schijventarief
  let bracketRate = 35.82;
  if (isAow) {
    bracketRate = Y <= 38441 ? 17.92 : Y <= 76817 ? 37.48 : 49.50;
  } else {
    bracketRate = Y <= 38441 ? 35.82 : Y <= 76817 ? 37.48 : 49.50;
  }

  // 2. Afbouw algemene heffingskorting (+6,43% tussen € 28.406 en € 76.817)
  let ahkEffect = 0;
  if (Y > 28406 && Y <= 76817) {
    ahkEffect = isAow ? 0.064344 * 0.5003 * 100 : 6.4344;
  }

  // 3. Opbouw / afbouw arbeidskorting
  let akEffect = 0;
  if (Y <= 11965) {
    akEffect = isAow ? -8.328 * 0.5003 : -8.328;
  } else if (Y > 11965 && Y <= 24811) {
    akEffect = isAow ? -31.107 * 0.5003 : -31.107;
  } else if (Y > 24811 && Y <= 44097) {
    akEffect = isAow ? -3.50 * 0.5003 : -3.50;
  } else if (Y > 44097 && Y <= 131425) {
    akEffect = isAow ? 6.510 * 0.5003 : 6.510;
  }

  const rawRate = bracketRate + ahkEffect + akEffect;
  return Math.round(Math.max(0, Math.min(60, rawRate)) * 100) / 100;
}

/**
 * Berekent de jaarlijkse bruto belasting vóór heffingskortingen
 */
function computeAnnualGrossTax(taxableAnnual: number, isAow: boolean): number {
  const brackets = PAYROLL_TAX_RATES_2026.brackets;
  let remaining = Math.max(0, taxableAnnual);
  let tax = 0;
  let prevLimit = 0;

  for (const b of brackets) {
    if (remaining <= 0) break;
    const bandWidth = b.limit - prevLimit;
    const taxableInBand = Math.min(remaining, bandWidth);
    const rate = (isAow ? b.rateAow : b.rateStandard) / 100;
    tax += taxableInBand * rate;
    remaining -= taxableInBand;
    prevLimit = b.limit;
  }
  return tax;
}

/**
 * Berekent de Algemene Heffingskorting (AHK) per jaar
 */
function computeAnnualGeneralTaxCredit(taxableAnnual: number, isAow: boolean): number {
  const cfg = PAYROLL_TAX_RATES_2026.generalTaxCredit;
  const Y = Math.max(0, taxableAnnual);

  let credit = 0;
  if (Y <= cfg.phaseOutStart) {
    credit = cfg.maxAmountStandard;
  } else if (Y <= cfg.phaseOutEnd) {
    credit = Math.max(0, cfg.maxAmountStandard - cfg.phaseOutRate * (Y - cfg.phaseOutStart));
  } else {
    credit = 0;
  }

  if (isAow) {
    credit *= cfg.aowRatio;
  }
  return Math.round(credit * 100) / 100;
}

/**
 * Berekent de Arbeidskorting (AK) per jaar
 */
function computeAnnualLabourTaxCredit(taxableAnnual: number, isAow: boolean): number {
  const cfg = PAYROLL_TAX_RATES_2026.labourTaxCredit;
  const Y = Math.max(0, taxableAnnual);

  let credit = 0;
  if (Y <= 11965) {
    credit = Y * 0.08328;
  } else if (Y <= 24811) {
    credit = 996.44 + (Y - 11965) * 0.31107;
  } else if (Y <= 44097) {
    credit = 4986.37 + (Y - 24811) * 0.03500;
  } else if (Y <= 131425) {
    credit = Math.max(0, 5685 - (Y - 44097) * 0.06510);
  } else {
    credit = 0;
  }

  if (isAow) {
    credit *= cfg.aowRatio;
  }
  return Math.round(credit * 100) / 100;
}

export function calculateNettoSalaris(options: NettoSalarisOptions): NettoSalarisResult {
  const {
    grossSalary,
    salaryPeriod = 'month',
    weeklyHours,
    age = 30,
    birthDate,
    isAowEligible,
    applyLoonheffingskorting = true,
    employeePensionMonthly = 0,
    otherDeductionsMonthly = 0,
    includeHolidayAllowance = false,
    hasBonusOr13thMonth = false,
    grossBonusOr13thMonth = 0,
    taxYear = 2026
  } = options;

  if (isNaN(grossSalary) || grossSalary < 0) {
    return {
      grossInput: 0,
      salaryPeriod,
      salaryPeriodLabel: 'Per maand',
      grossMonthlySalary: 0,
      grossAnnualSalary: 0,
      grossFourWeeklySalary: 0,
      grossWeeklySalary: 0,
      isAowEligible: false,
      age,
      applyLoonheffingskorting,
      employeePensionMonthly: 0,
      taxableMonthlyWage: 0,
      taxableAnnualWage: 0,
      grossTaxMonthly: 0,
      generalTaxCreditMonthly: 0,
      labourTaxCreditMonthly: 0,
      totalTaxCreditsMonthly: 0,
      appliedTaxCreditMonthly: 0,
      payrollTaxMonthly: 0,
      payrollTaxAnnual: 0,
      effectiveTaxRatePercentage: 0,
      otherDeductionsMonthly: 0,
      netMonthlySalary: 0,
      netAnnualSalary: 0,
      netFourWeeklySalary: 0,
      netWeeklySalary: 0,
      includeHolidayAllowance: false,
      grossHolidayAllowanceAnnual: 0,
      marginalTaxRateHolidayPercentage: 0,
      taxHolidayAllowanceAnnual: 0,
      netHolidayAllowanceAnnual: 0,
      netAnnualSalaryWithHoliday: 0,
      hasBonusOr13thMonth: false,
      grossBonusOr13thMonth: 0,
      marginalTaxRateBonusPercentage: 0,
      taxBonusOr13thMonth: 0,
      netBonusOr13thMonth: 0,
      taxYear,
      isValid: false,
      errorMessage: 'Voer een geldig, positief bruto salarisbedrag in.'
    };
  }

  // 1. Leeftijd & AOW bepalen
  let effectiveAge = Math.max(15, Math.min(100, Number(age) || 30));
  if (birthDate) {
    const parts = birthDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      const bYear = parts[0];
      effectiveAge = Math.max(15, 2026 - bYear);
    }
  }

  const aowAge = PAYROLL_TAX_RATES_2026.aowAge; // 67
  const isAow = typeof isAowEligible === 'boolean' ? isAowEligible : effectiveAge >= aowAge;

  // 2. Salarisperiode conversie naar standaard maand-, jaar-, week- en 4-wekensalaris
  const safeGross = Math.max(0, Number(grossSalary) || 0);
  let safeWeeklyHours = weeklyHours !== undefined ? Math.max(1, Math.min(80, Number(weeklyHours) || 36)) : undefined;

  let grossMonthlySalary = 0;
  let grossAnnualSalary = 0;
  let grossFourWeeklySalary = 0;
  let grossWeeklySalary = 0;
  let grossHourlyWage: number | undefined = undefined;

  let salaryPeriodLabel = 'Per maand';

  switch (salaryPeriod) {
    case 'month':
      salaryPeriodLabel = 'Per maand';
      grossMonthlySalary = safeGross;
      grossAnnualSalary = grossMonthlySalary * 12;
      grossFourWeeklySalary = grossAnnualSalary / 13;
      grossWeeklySalary = grossAnnualSalary / 52;
      if (safeWeeklyHours) {
        grossHourlyWage = grossWeeklySalary / safeWeeklyHours;
      }
      break;
    case '4week':
      salaryPeriodLabel = 'Per 4 weken (13x per jaar)';
      grossFourWeeklySalary = safeGross;
      grossAnnualSalary = grossFourWeeklySalary * 13;
      grossMonthlySalary = grossAnnualSalary / 12;
      grossWeeklySalary = grossAnnualSalary / 52;
      if (safeWeeklyHours) {
        grossHourlyWage = grossWeeklySalary / safeWeeklyHours;
      }
      break;
    case 'week':
      salaryPeriodLabel = 'Per week';
      grossWeeklySalary = safeGross;
      grossAnnualSalary = grossWeeklySalary * 52;
      grossMonthlySalary = grossAnnualSalary / 12;
      grossFourWeeklySalary = grossAnnualSalary / 13;
      if (safeWeeklyHours) {
        grossHourlyWage = grossWeeklySalary / safeWeeklyHours;
      }
      break;
    case 'hour':
      salaryPeriodLabel = 'Per uur';
      safeWeeklyHours = safeWeeklyHours || 36;
      grossHourlyWage = safeGross;
      grossWeeklySalary = grossHourlyWage * safeWeeklyHours;
      grossAnnualSalary = grossWeeklySalary * 52;
      grossMonthlySalary = grossAnnualSalary / 12;
      grossFourWeeklySalary = grossAnnualSalary / 13;
      break;
    case 'year':
      salaryPeriodLabel = 'Per jaar';
      grossAnnualSalary = safeGross;
      grossMonthlySalary = grossAnnualSalary / 12;
      grossFourWeeklySalary = grossAnnualSalary / 13;
      grossWeeklySalary = grossAnnualSalary / 52;
      if (safeWeeklyHours) {
        grossHourlyWage = grossWeeklySalary / safeWeeklyHours;
      }
      break;
    default:
      grossMonthlySalary = safeGross;
      grossAnnualSalary = grossMonthlySalary * 12;
      grossFourWeeklySalary = grossAnnualSalary / 13;
      grossWeeklySalary = grossAnnualSalary / 52;
      break;
  }

  // 3. Pensioenpremie en fiscaal belastbaar loon
  const safePension = Math.max(0, Number(employeePensionMonthly) || 0);
  const taxableMonthlyWage = Math.max(0, grossMonthlySalary - safePension);
  const taxableAnnualWage = taxableMonthlyWage * 12;

  // 4. Bruto belasting berekenen
  const annualGrossTax = computeAnnualGrossTax(taxableAnnualWage, isAow);
  const monthlyGrossTax = annualGrossTax / 12;

  // 5. Heffingskortingen berekenen
  const annualAHK = computeAnnualGeneralTaxCredit(taxableAnnualWage, isAow);
  const annualAK = computeAnnualLabourTaxCredit(taxableAnnualWage, isAow);

  const generalTaxCreditMonthly = Math.round((annualAHK / 12) * 100) / 100;
  const labourTaxCreditMonthly = Math.round((annualAK / 12) * 100) / 100;
  const totalTaxCreditsMonthly = Math.round((generalTaxCreditMonthly + labourTaxCreditMonthly) * 100) / 100;

  let appliedTaxCreditMonthly = 0;
  if (applyLoonheffingskorting) {
    appliedTaxCreditMonthly = Math.min(monthlyGrossTax, totalTaxCreditsMonthly);
  }

  // 6. Loonheffing per maand
  const payrollTaxMonthly = Math.max(0, Math.round((monthlyGrossTax - appliedTaxCreditMonthly) * 100) / 100);
  const payrollTaxAnnual = Math.round(payrollTaxMonthly * 12 * 100) / 100;

  const effectiveTaxRatePercentage = grossMonthlySalary > 0
    ? Math.round((payrollTaxMonthly / grossMonthlySalary) * 1000) / 10
    : 0;

  // 7. Andere netto inhoudingen
  const safeOtherDeductions = Math.max(0, Number(otherDeductionsMonthly) || 0);

  // 8. Netto salaris
  const netMonthlySalary = Math.max(
    0,
    Math.round((grossMonthlySalary - payrollTaxMonthly - safePension - safeOtherDeductions) * 100) / 100
  );
  const netAnnualSalary = Math.round(netMonthlySalary * 12 * 100) / 100;
  const netFourWeeklySalary = Math.round(((netMonthlySalary * 12) / 13) * 100) / 100;
  const netWeeklySalary = Math.round(((netMonthlySalary * 12) / 52) * 100) / 100;
  const netHourlyWage = safeWeeklyHours && safeWeeklyHours > 0
    ? Math.round((netWeeklySalary / safeWeeklyHours) * 100) / 100
    : undefined;

  // 9. Vakantiegeld (8% over regulier jaarsalaris)
  const grossHolidayAllowanceAnnual = Math.round(grossAnnualSalary * 0.08 * 100) / 100;
  const marginalTaxRateHolidayPercentage = calculateMarginalTaxRate2026(taxableAnnualWage, isAow);
  const taxHolidayAllowanceAnnual = Math.round(
    grossHolidayAllowanceAnnual * (marginalTaxRateHolidayPercentage / 100) * 100
  ) / 100;
  const netHolidayAllowanceAnnual = Math.max(
    0,
    Math.round((grossHolidayAllowanceAnnual - taxHolidayAllowanceAnnual) * 100) / 100
  );
  const netAnnualSalaryWithHoliday = Math.round((netAnnualSalary + netHolidayAllowanceAnnual) * 100) / 100;

  // 10. 13e maand / bonus (tabel bijzondere beloningen)
  const safeBonus = hasBonusOr13thMonth ? Math.max(0, Number(grossBonusOr13thMonth) || 0) : 0;
  const marginalTaxRateBonusPercentage = calculateMarginalTaxRate2026(taxableAnnualWage, isAow);
  const taxBonusOr13thMonth = Math.round(
    safeBonus * (marginalTaxRateBonusPercentage / 100) * 100
  ) / 100;
  const netBonusOr13thMonth = Math.max(
    0,
    Math.round((safeBonus - taxBonusOr13thMonth) * 100) / 100
  );

  // 11. Minimumloon controle
  let isBelowMinimumWage: boolean | undefined = undefined;
  let minimumWageNotice: string | undefined = undefined;

  if (grossHourlyWage !== undefined) {
    const minWageAdultJan2026 = PAYROLL_TAX_RATES_2026.minimumWageHourly.asOfJan; // 14.71
    const minWageAdultJul2026 = PAYROLL_TAX_RATES_2026.minimumWageHourly.asOfJul; // 14.99

    if (effectiveAge >= 21) {
      if (grossHourlyWage < minWageAdultJan2026) {
        isBelowMinimumWage = true;
        minimumWageNotice = `Let op: Je berekende bruto uurloon van € ${grossHourlyWage.toFixed(2)} ligt onder het wettelijk minimumuurloon van € ${minWageAdultJan2026.toFixed(2)} (vanaf 1 juli 2026: € ${minWageAdultJul2026.toFixed(2)}) voor 21 jaar en ouder.`;
      }
    }
  }

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    grossInput: safeGross,
    salaryPeriod,
    salaryPeriodLabel,
    weeklyHours: safeWeeklyHours,

    grossMonthlySalary: round2(grossMonthlySalary),
    grossAnnualSalary: round2(grossAnnualSalary),
    grossFourWeeklySalary: round2(grossFourWeeklySalary),
    grossWeeklySalary: round2(grossWeeklySalary),
    grossHourlyWage: grossHourlyWage !== undefined ? round2(grossHourlyWage) : undefined,

    isAowEligible: isAow,
    age: effectiveAge,
    applyLoonheffingskorting,

    employeePensionMonthly: round2(safePension),
    taxableMonthlyWage: round2(taxableMonthlyWage),
    taxableAnnualWage: round2(taxableAnnualWage),

    grossTaxMonthly: round2(monthlyGrossTax),
    generalTaxCreditMonthly,
    labourTaxCreditMonthly,
    totalTaxCreditsMonthly,
    appliedTaxCreditMonthly: round2(appliedTaxCreditMonthly),
    payrollTaxMonthly,
    payrollTaxAnnual,

    effectiveTaxRatePercentage,

    otherDeductionsMonthly: round2(safeOtherDeductions),

    netMonthlySalary,
    netAnnualSalary,
    netFourWeeklySalary,
    netWeeklySalary,
    netHourlyWage,

    includeHolidayAllowance,
    grossHolidayAllowanceAnnual,
    marginalTaxRateHolidayPercentage,
    taxHolidayAllowanceAnnual,
    netHolidayAllowanceAnnual,
    netAnnualSalaryWithHoliday,

    hasBonusOr13thMonth,
    grossBonusOr13thMonth: safeBonus,
    marginalTaxRateBonusPercentage,
    taxBonusOr13thMonth,
    netBonusOr13thMonth,

    isBelowMinimumWage,
    minimumWageNotice,

    taxYear,
    isValid: true
  };
}

/* =========================================================================
   26. Jaarinkomen berekenen
   Formules:
   - Maandsalaris: maandloon * 12 (of pro rata gewerkte maanden)
   - 4-wekenloon: 4-wekenloon * 13 (of pro rata gewerkte maanden)
   - Weekloon: weekloon * 52 (of pro rata gewerkte maanden)
   - Uurloon: uurloon * wekelijkse uren * 52 (of pro rata)
   - Dagloon: dagloon * werkdagen per week * 52 (of pro rata)
   - Vakantiegeld: basis jaarsalaris * (vakantiegeld% / 100)
   - 13e maand: vast bedrag of percentage over jaarsalaris
   - Bonus / extra inkomsten: vast jaarbedrag
   - Totaal bruto jaarinkomen: basis + vakantiegeld + 13e maand + bonus
   - Optionele netto schatting conform witte maandtabel 2026
   ========================================================================= */

export type SalaryPeriodYearly = 'maand' | 'vierwekelijks' | 'week' | 'dag' | 'uur';

export interface JaarinkomenOptions {
  grossSalary: number;
  salaryPeriod: SalaryPeriodYearly;
  weeklyHours?: number; // voor 'uur'
  daysPerWeek?: number; // voor 'dag'

  // Vakantiegeld
  includeHolidayAllowance?: boolean; // default true
  holidayAllowancePercentage?: number; // default 8

  // 13e maand
  thirteenthMonthType?: 'none' | 'fixed' | 'percentage'; // default 'none'
  thirteenthMonthValue?: number; // bedrag in € of percentage

  // Bonus of andere jaarlijkse inkomsten
  annualBonus?: number; // bruto jaarbedrag

  // Aantal gewerkte maanden in het jaar
  workedFullYear?: boolean; // default true
  monthsWorked?: number; // 1 tot 12

  // Optionele netto schatting
  estimateNet?: boolean;
  age?: number;
  isAowEligible?: boolean;
  applyLoonheffingskorting?: boolean;
  employeePensionMonthly?: number;
  taxYear?: number;
}

export interface JaarinkomenResult {
  grossInput: number;
  salaryPeriod: SalaryPeriodYearly;
  salaryPeriodLabel: string;
  weeklyHours?: number;
  daysPerWeek?: number;

  // Basis salaris
  baseAnnualSalary: number; // Excl. vakantiegeld, pro rata indien gebroken jaar
  fullYearEquivalentSalary: number; // Volledige jaarnorm (12 maanden)
  workedFullYear: boolean;
  monthsWorked: number;

  // Onderdelen
  includeHolidayAllowance: boolean;
  holidayAllowancePercentage: number;
  holidayAllowanceAmount: number;

  thirteenthMonthType: 'none' | 'fixed' | 'percentage';
  thirteenthMonthAmount: number;

  annualBonus: number;

  // Totaal bruto jaarinkomen
  totalGrossAnnualIncome: number;
  grossAnnualIncomeExclHoliday: number;

  // Gemiddelde omrekeningen
  averageGrossMonthly: number;
  averageGrossFourWeekly: number;
  averageGrossWeekly: number;
  averageGrossHourly?: number;

  // Optionele netto schatting
  estimateNet: boolean;
  isAowEligible?: boolean;
  applyLoonheffingskorting?: boolean;
  employeePensionAnnual?: number;
  taxableAnnualIncome?: number;
  estimatedGrossTaxAnnual?: number;
  estimatedTaxCreditsAnnual?: number;
  estimatedPayrollTaxAnnual?: number;
  estimatedNetAnnualIncome?: number;
  estimatedNetMonthlyIncome?: number;

  taxYear: number;
  isValid: boolean;
  errorMessage?: string;
}

export function calculateJaarinkomen(options: JaarinkomenOptions): JaarinkomenResult {
  const {
    grossSalary,
    salaryPeriod = 'maand',
    weeklyHours = 36,
    daysPerWeek = 5,
    includeHolidayAllowance = true,
    holidayAllowancePercentage = 8,
    thirteenthMonthType = 'none',
    thirteenthMonthValue = 0,
    annualBonus = 0,
    workedFullYear = true,
    monthsWorked = 12,
    estimateNet = false,
    age = 30,
    isAowEligible,
    applyLoonheffingskorting = true,
    employeePensionMonthly = 0,
    taxYear = 2026
  } = options;

  if (isNaN(grossSalary) || grossSalary < 0) {
    return {
      grossInput: 0,
      salaryPeriod,
      salaryPeriodLabel: 'Per maand',
      baseAnnualSalary: 0,
      fullYearEquivalentSalary: 0,
      workedFullYear: true,
      monthsWorked: 12,
      includeHolidayAllowance,
      holidayAllowancePercentage: 8,
      holidayAllowanceAmount: 0,
      thirteenthMonthType: 'none',
      thirteenthMonthAmount: 0,
      annualBonus: 0,
      totalGrossAnnualIncome: 0,
      grossAnnualIncomeExclHoliday: 0,
      averageGrossMonthly: 0,
      averageGrossFourWeekly: 0,
      averageGrossWeekly: 0,
      estimateNet: false,
      taxYear,
      isValid: false,
      errorMessage: 'Voer een geldig, positief bruto salarisbedrag in.'
    };
  }

  const safeGross = Math.max(0, Number(grossSalary) || 0);
  let safeWeeklyHours = weeklyHours !== undefined ? Math.max(1, Math.min(80, Number(weeklyHours) || 36)) : 36;
  let safeDaysPerWeek = daysPerWeek !== undefined ? Math.max(1, Math.min(7, Number(daysPerWeek) || 5)) : 5;

  let fullYearEquivalentSalary = 0;
  let salaryPeriodLabel = 'Per maand';

  switch (salaryPeriod) {
    case 'maand':
      salaryPeriodLabel = 'Per maand';
      fullYearEquivalentSalary = safeGross * 12;
      break;
    case 'vierwekelijks':
      salaryPeriodLabel = 'Per 4 weken (13x per jaar)';
      fullYearEquivalentSalary = safeGross * 13;
      break;
    case 'week':
      salaryPeriodLabel = 'Per week';
      fullYearEquivalentSalary = safeGross * 52;
      break;
    case 'dag':
      salaryPeriodLabel = `Per dag (${safeDaysPerWeek} dagen/week)`;
      fullYearEquivalentSalary = safeGross * safeDaysPerWeek * 52;
      break;
    case 'uur':
      salaryPeriodLabel = `Per uur (${safeWeeklyHours} uur/week)`;
      fullYearEquivalentSalary = safeGross * safeWeeklyHours * 52;
      break;
    default:
      fullYearEquivalentSalary = safeGross * 12;
      break;
  }

  // Aantal gewerkte maanden verwerken
  const safeMonths = workedFullYear ? 12 : Math.max(1, Math.min(12, Number(monthsWorked) || 12));
  const baseAnnualSalary = workedFullYear
    ? fullYearEquivalentSalary
    : (fullYearEquivalentSalary / 12) * safeMonths;

  // Vakantiegeld berekenen
  const safeHolidayPct = Math.max(0, Math.min(100, Number(holidayAllowancePercentage) || 0));
  const holidayAllowanceAmount = includeHolidayAllowance
    ? baseAnnualSalary * (safeHolidayPct / 100)
    : 0;

  // 13e maand berekenen
  let thirteenthMonthAmount = 0;
  const safe13thVal = Math.max(0, Number(thirteenthMonthValue) || 0);
  if (thirteenthMonthType === 'fixed') {
    thirteenthMonthAmount = safe13thVal;
  } else if (thirteenthMonthType === 'percentage') {
    const safe13thPct = Math.min(100, safe13thVal);
    thirteenthMonthAmount = baseAnnualSalary * (safe13thPct / 100);
  }

  // Bonus / extra inkomsten
  const safeBonus = Math.max(0, Number(annualBonus) || 0);

  // Totale bruto jaarinkomen
  const totalGrossAnnualIncome = baseAnnualSalary + holidayAllowanceAmount + thirteenthMonthAmount + safeBonus;
  const grossAnnualIncomeExclHoliday = baseAnnualSalary + thirteenthMonthAmount + safeBonus;

  // Gemiddelde omrekeningen
  const averageGrossMonthly = totalGrossAnnualIncome / 12;
  const averageGrossFourWeekly = totalGrossAnnualIncome / 13;
  const averageGrossWeekly = totalGrossAnnualIncome / 52;
  let averageGrossHourly: number | undefined = undefined;

  if (salaryPeriod === 'uur') {
    averageGrossHourly = safeWeeklyHours > 0 ? totalGrossAnnualIncome / (safeWeeklyHours * 52) : undefined;
  } else if (weeklyHours !== undefined && weeklyHours > 0) {
    averageGrossHourly = totalGrossAnnualIncome / (safeWeeklyHours * 52);
  }

  // Optionele netto schatting
  let isAow = false;
  let employeePensionAnnual = 0;
  let taxableAnnualIncome = 0;
  let estimatedGrossTaxAnnual = 0;
  let estimatedTaxCreditsAnnual = 0;
  let estimatedPayrollTaxAnnual = 0;
  let estimatedNetAnnualIncome = 0;
  let estimatedNetMonthlyIncome = 0;

  if (estimateNet) {
    const effectiveAge = Math.max(15, Math.min(100, Number(age) || 30));
    const aowAge = PAYROLL_TAX_RATES_2026.aowAge; // 67
    isAow = typeof isAowEligible === 'boolean' ? isAowEligible : effectiveAge >= aowAge;

    const safePensionMonthly = Math.max(0, Number(employeePensionMonthly) || 0);
    employeePensionAnnual = safePensionMonthly * 12;
    taxableAnnualIncome = Math.max(0, totalGrossAnnualIncome - employeePensionAnnual);

    // Bruto belasting volgens box 1 schijven
    estimatedGrossTaxAnnual = computeAnnualGrossTax(taxableAnnualIncome, isAow);

    // Heffingskortingen
    if (applyLoonheffingskorting) {
      const ahk = computeAnnualGeneralTaxCredit(taxableAnnualIncome, isAow);
      const ak = computeAnnualLabourTaxCredit(taxableAnnualIncome, isAow);
      estimatedTaxCreditsAnnual = Math.min(estimatedGrossTaxAnnual, ahk + ak);
    } else {
      estimatedTaxCreditsAnnual = 0;
    }

    estimatedPayrollTaxAnnual = Math.max(0, estimatedGrossTaxAnnual - estimatedTaxCreditsAnnual);
    estimatedNetAnnualIncome = Math.max(0, taxableAnnualIncome - estimatedPayrollTaxAnnual);
    estimatedNetMonthlyIncome = estimatedNetAnnualIncome / 12;
  }

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return {
    grossInput: safeGross,
    salaryPeriod,
    salaryPeriodLabel,
    weeklyHours: salaryPeriod === 'uur' ? safeWeeklyHours : (weeklyHours || undefined),
    daysPerWeek: salaryPeriod === 'dag' ? safeDaysPerWeek : undefined,

    baseAnnualSalary: round2(baseAnnualSalary),
    fullYearEquivalentSalary: round2(fullYearEquivalentSalary),
    workedFullYear,
    monthsWorked: safeMonths,

    includeHolidayAllowance,
    holidayAllowancePercentage: safeHolidayPct,
    holidayAllowanceAmount: round2(holidayAllowanceAmount),

    thirteenthMonthType,
    thirteenthMonthAmount: round2(thirteenthMonthAmount),

    annualBonus: round2(safeBonus),

    totalGrossAnnualIncome: round2(totalGrossAnnualIncome),
    grossAnnualIncomeExclHoliday: round2(grossAnnualIncomeExclHoliday),

    averageGrossMonthly: round2(averageGrossMonthly),
    averageGrossFourWeekly: round2(averageGrossFourWeekly),
    averageGrossWeekly: round2(averageGrossWeekly),
    averageGrossHourly: averageGrossHourly !== undefined ? round2(averageGrossHourly) : undefined,

    estimateNet,
    isAowEligible: estimateNet ? isAow : undefined,
    applyLoonheffingskorting: estimateNet ? applyLoonheffingskorting : undefined,
    employeePensionAnnual: estimateNet ? round2(employeePensionAnnual) : undefined,
    taxableAnnualIncome: estimateNet ? round2(taxableAnnualIncome) : undefined,
    estimatedGrossTaxAnnual: estimateNet ? round2(estimatedGrossTaxAnnual) : undefined,
    estimatedTaxCreditsAnnual: estimateNet ? round2(estimatedTaxCreditsAnnual) : undefined,
    estimatedPayrollTaxAnnual: estimateNet ? round2(estimatedPayrollTaxAnnual) : undefined,
    estimatedNetAnnualIncome: estimateNet ? round2(estimatedNetAnnualIncome) : undefined,
    estimatedNetMonthlyIncome: estimateNet ? round2(estimatedNetMonthlyIncome) : undefined,

    taxYear,
    isValid: true
  };
}

/* =========================================================================
   27. Dagloon Berekenen (Algemeen Dagloon & UWV Dagloon)
   Bronnen:
   - UWV Besluit dagloonregels werknemersverzekeringen
   - Wet werk en inkomen naar arbeidsvermogen (WIA)
   - Werkloosheidswet (WW) & Ziektewet (ZW)
   - Standaard Nederlandse werkdagen/dagloondagen: 261 dagen per jaar, 21,75 per maand
   - UWV maximumdagloon 2026: € 309,91 bruto per dag incl. vakantiebijslag
   ========================================================================= */

export type DagloonCalculationType = 'algemeen' | 'uwv';
export type UwvBenefitType = 'ww' | 'zw' | 'wia' | 'wao';

export interface DagloonParams {
  type: DagloonCalculationType;

  // Algemeen dagloon
  grossAnnualSalary?: number; // Bruto jaarloon (€)
  includeHolidayPay?: boolean; // Vakantiegeld meenemen? Standaard true (8%)
  holidayPayPercentage?: number; // Standaard 8.0%
  workingDaysPerYear?: number; // Standaard 261

  // UWV dagloon
  benefitType?: UwvBenefitType; // 'ww' | 'zw' | 'wia' | 'wao'
  svLoonReferencePeriod?: number; // SV-loon in de referteperiode (€)
  referencePeriodMonths?: number; // Aantal maanden gewerkt (1 t/m 12, standaard 12)
  referenceDate?: string; // YYYY-MM-DD datum eerste werkloosheidsdag of eerste ziektedag
  holidayPayAlreadyIncluded?: boolean; // Zit vakantiegeld al in SV-loon? (standaard true)
  separateHolidayPay?: number; // Los vakantiegeld indien nog niet in SV-loon (€)
  separateAvwb?: number; // 13e maand / eindejaarsuitkering / IKB indien nog niet in SV-loon (€)

  lowerPayDueToLeaveOrIllness?: boolean; // Loon tijdelijk lager door ziekte/verlof?
  unpaidLeaveDays?: number; // Aantal verlof-/ziektedagen zonder loon (verlaagt noemer)
  customMaxDagloon?: number; // Optioneel overschrijven, standaard DUTCH_RATES.uwvRates.maxDagloon (309.91)
}

export interface DagloonCalculationResult {
  calculationType: DagloonCalculationType;
  benefitType?: UwvBenefitType;
  benefitTypeLabel?: string;

  // Algemeen dagloon details
  grossAnnualSalary?: number;
  includeHolidayPay?: boolean;
  holidayPayPercentage?: number;
  holidayPayAmount?: number;
  totalAnnualBasis?: number;

  // UWV details
  svLoon?: number;
  referencePeriodMonths?: number;
  referenceDate?: string;
  referencePeriodDescription?: string;
  separateHolidayPay?: number;
  separateAvwb?: number;
  totalSvLoonCorrected?: number;

  lowerPayDueToLeaveOrIllness?: boolean;
  unpaidLeaveDays?: number;

  // Dagloondagen noemer
  dagloondagen: number; // Standaard 261 (of aangepast bij gebroken jaar / verlof)
  baseDagloondagen: number;

  // Dagloon uitkomsten
  calculatedDagloon: number; // Ongetopt berekend dagloon
  maxDagloon: number; // 309.91 in 2026
  isMaxDagloonApplied: boolean;
  applicableDagloon: number; // Het toe te passen dagloon (gemaximeerd indien UWV)

  // Omgerekende periodieke bedragen
  estimatedWeeklyGross: number; // dagloon * 5
  estimatedMonthlyGross: number; // dagloon * 21.75
  regularAnnualMonthlyGross?: number; // jaarloon / 12 (ter vergelijking bij algemeen)

  // Toelichtingen & metadata
  year: number;
  isValid: boolean;
  errorMessage?: string;
}

export function getUwvBenefitLabel(type?: UwvBenefitType): string {
  switch (type) {
    case 'ww':
      return 'WW-uitkering (Werkloosheidswet)';
    case 'zw':
      return 'Ziektewet (ZW)';
    case 'wia':
      return 'WIA-uitkering (WGA / IVA)';
    case 'wao':
      return 'WAO-uitkering';
    default:
      return 'UWV-uitkering';
  }
}

export function formatUwvReferencePeriod(benefitType: UwvBenefitType, referenceDateStr?: string): string {
  if (!referenceDateStr) {
    switch (benefitType) {
      case 'ww':
        return '1 jaar (12 volledige kalendermaanden) vóór de voorlaatste kalendermaand voorafgaand aan je werkloosheid.';
      case 'zw':
        return '1 jaar (12 kalendermaanden) vóór de kalendermaand waarin je ziek werd.';
      case 'wia':
        return '1 jaar (12 kalendermaanden) vóór je allereerste ziektedag (waarmee de wachttijd van 104 weken ziekte begon).';
      case 'wao':
        return '1 jaar (12 kalendermaanden) vóór het intreden van de arbeidsongeschiktheid.';
    }
  }

  const refDate = new Date(referenceDateStr);
  if (isNaN(refDate.getTime())) {
    return formatUwvReferencePeriod(benefitType);
  }

  const monthNames = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december'
  ];

  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-11

  if (benefitType === 'ww') {
    // Voorlaatste maand voor werkloosheid
    // Voorbeeld: werkloos in april (month 3) -> voorlaatste maand is februari (month 1).
    // Eindmaand = month - 2
    const endMonthDate = new Date(year, month - 1, 0); // Laatste dag van voorlaatste maand
    const startMonthDate = new Date(endMonthDate.getFullYear() - 1, endMonthDate.getMonth() + 1, 1);

    const startStr = `1 ${monthNames[startMonthDate.getMonth()]} ${startMonthDate.getFullYear()}`;
    const endStr = `${endMonthDate.getDate()} ${monthNames[endMonthDate.getMonth()]} ${endMonthDate.getFullYear()}`;
    return `Van ${startStr} tot en met ${endStr} (12 kalendermaanden vóór de voorlaatste maand).`;
  } else if (benefitType === 'zw') {
    // 12 maanden vóór de maand waarin je ziek werd
    const endMonthDate = new Date(year, month, 0); // Laatste dag van vorige maand
    const startMonthDate = new Date(endMonthDate.getFullYear() - 1, endMonthDate.getMonth() + 1, 1);

    const startStr = `1 ${monthNames[startMonthDate.getMonth()]} ${startMonthDate.getFullYear()}`;
    const endStr = `${endMonthDate.getDate()} ${monthNames[endMonthDate.getMonth()]} ${endMonthDate.getFullYear()}`;
    return `Van ${startStr} tot en met ${endStr} (12 kalendermaanden vóór de ziektemaand).`;
  } else if (benefitType === 'wia') {
    // 12 maanden vóór de eerste ziektedag
    const endMonthDate = new Date(year, month, 0);
    const startMonthDate = new Date(endMonthDate.getFullYear() - 1, endMonthDate.getMonth() + 1, 1);

    const startStr = `1 ${monthNames[startMonthDate.getMonth()]} ${startMonthDate.getFullYear()}`;
    const endStr = `${endMonthDate.getDate()} ${monthNames[endMonthDate.getMonth()]} ${endMonthDate.getFullYear()}`;
    return `Van ${startStr} tot en met ${endStr} (het jaar vóór de start van de 104 weken ziekte).`;
  } else {
    return '12 kalendermaanden voorafgaand aan de datum van arbeidsongeschiktheid.';
  }
}

export function calculateDagloon(params: DagloonParams): DagloonCalculationResult {
  const round2 = (val: number) => Math.round(val * 100) / 100;
  const year = DUTCH_RATES.year;
  const maxDagloon = params.customMaxDagloon ?? (DUTCH_RATES.uwvRates?.maxDagloon ?? 309.91);

  if (params.type === 'algemeen') {
    const rawGross = params.grossAnnualSalary ?? 0;
    if (rawGross < 0) {
      return {
        calculationType: 'algemeen',
        dagloondagen: 261,
        baseDagloondagen: 261,
        calculatedDagloon: 0,
        maxDagloon,
        isMaxDagloonApplied: false,
        applicableDagloon: 0,
        estimatedWeeklyGross: 0,
        estimatedMonthlyGross: 0,
        year,
        isValid: false,
        errorMessage: 'Het bruto jaarloon kan niet negatief zijn.'
      };
    }

    const includeHoliday = params.includeHolidayPay !== false;
    const holidayPct = includeHoliday ? (params.holidayPayPercentage ?? 8.0) : 0;
    const holidayAmount = rawGross * (holidayPct / 100);
    const totalAnnualBasis = rawGross + holidayAmount;

    const dagloondagen = params.workingDaysPerYear && params.workingDaysPerYear > 0
      ? params.workingDaysPerYear
      : 261;

    const calculatedDagloon = dagloondagen > 0 ? totalAnnualBasis / dagloondagen : 0;
    const applicableDagloon = calculatedDagloon; // Bij algemeen dagloon geen verplichte UWV-aftopping
    const isMaxDagloonApplied = false;

    const roundedApplicableDagloon = round2(applicableDagloon);
    const estimatedWeeklyGross = round2(roundedApplicableDagloon * 5);
    const estimatedMonthlyGross = round2(roundedApplicableDagloon * 21.75);
    const regularAnnualMonthlyGross = round2(totalAnnualBasis / 12);

    return {
      calculationType: 'algemeen',
      grossAnnualSalary: round2(rawGross),
      includeHolidayPay: includeHoliday,
      holidayPayPercentage: round2(holidayPct),
      holidayPayAmount: round2(holidayAmount),
      totalAnnualBasis: round2(totalAnnualBasis),

      dagloondagen,
      baseDagloondagen: dagloondagen,

      calculatedDagloon: round2(calculatedDagloon),
      maxDagloon: round2(maxDagloon),
      isMaxDagloonApplied,
      applicableDagloon: roundedApplicableDagloon,

      estimatedWeeklyGross,
      estimatedMonthlyGross,
      regularAnnualMonthlyGross,

      year,
      isValid: true
    };
  }

  // UWV Dagloon Berekening
  const benefitType: UwvBenefitType = params.benefitType || 'ww';
  const benefitTypeLabel = getUwvBenefitLabel(benefitType);

  const rawSvLoon = params.svLoonReferencePeriod ?? 0;
  if (rawSvLoon < 0) {
    return {
      calculationType: 'uwv',
      benefitType,
      benefitTypeLabel,
      dagloondagen: 261,
      baseDagloondagen: 261,
      calculatedDagloon: 0,
      maxDagloon,
      isMaxDagloonApplied: false,
      applicableDagloon: 0,
      estimatedWeeklyGross: 0,
      estimatedMonthlyGross: 0,
      year,
      isValid: false,
      errorMessage: 'Het SV-loon kan niet negatief zijn.'
    };
  }

  const rawHoliday = Math.max(0, params.separateHolidayPay || 0);
  const rawAvwb = Math.max(0, params.separateAvwb || 0);
  const totalSvLoonCorrected = rawSvLoon + rawHoliday + rawAvwb;

  const rawMonths = params.referencePeriodMonths !== undefined
    ? Math.min(12, Math.max(1, params.referencePeriodMonths))
    : 12;

  // Standaard noemer: 12 maanden = 261 dagen; bij minder maanden = maanden * 21,75
  const baseDagloondagen = rawMonths === 12 ? 261 : Math.round(rawMonths * 21.75);

  // Correctie voor tijdelijk lager loon door ziekte/onbetaald verlof
  let dagloondagen = baseDagloondagen;
  if (params.lowerPayDueToLeaveOrIllness && (params.unpaidLeaveDays ?? 0) > 0) {
    const leaveDays = Math.max(0, params.unpaidLeaveDays || 0);
    dagloondagen = Math.max(1, baseDagloondagen - leaveDays);
  }

  const calculatedDagloon = dagloondagen > 0 ? totalSvLoonCorrected / dagloondagen : 0;
  const isMaxDagloonApplied = calculatedDagloon > maxDagloon;
  const applicableDagloon = isMaxDagloonApplied ? maxDagloon : calculatedDagloon;

  const roundedApplicableDagloon = round2(applicableDagloon);
  const estimatedWeeklyGross = round2(roundedApplicableDagloon * 5);
  const estimatedMonthlyGross = round2(roundedApplicableDagloon * 21.75);

  const referencePeriodDescription = formatUwvReferencePeriod(benefitType, params.referenceDate);

  return {
    calculationType: 'uwv',
    benefitType,
    benefitTypeLabel,

    svLoon: round2(rawSvLoon),
    referencePeriodMonths: rawMonths,
    referenceDate: params.referenceDate,
    referencePeriodDescription,
    separateHolidayPay: round2(rawHoliday),
    separateAvwb: round2(rawAvwb),
    totalSvLoonCorrected: round2(totalSvLoonCorrected),

    lowerPayDueToLeaveOrIllness: Boolean(params.lowerPayDueToLeaveOrIllness),
    unpaidLeaveDays: params.lowerPayDueToLeaveOrIllness ? (params.unpaidLeaveDays || 0) : undefined,

    dagloondagen,
    baseDagloondagen,

    calculatedDagloon: round2(calculatedDagloon),
    maxDagloon: round2(maxDagloon),
    isMaxDagloonApplied,
    applicableDagloon: roundedApplicableDagloon,

    estimatedWeeklyGross,
    estimatedMonthlyGross,

    year,
    isValid: true
  };
}

/* =========================================================================
   28. WW Berekenen (Werkloosheidswet)
   Formules & regels UWV (2026):
   - Referteperiode: 12 kalendermaanden vóór de voorlaatste maand van werkloosheid
   - Aantal dagloondagen: 261 dagen per jaar (Besluit dagloonregels UWV)
   - Gemaximeerd dagloon 2026: € 309,91 bruto/dag (inclusief vakantiegeld)
   - WW-maandloon: dagloon × 21,75 (261 / 12)
   - Hoogte uitkering:
     * Maand 1 en 2: 75% van het WW-maandloon
     * Vanaf maand 3: 70% van het WW-maandloon
   - Inkomstenverrekening bij neveninkomsten:
     * Resterende WW = percentage × (WW-maandloon - inkomen uit werk)
     * Bij inkomen > 87,5% van WW-maandloon gedurende 2 maanden stopt de WW
   - Duur & Voorwaarden:
     * Wekeneis: in minstens 26 van 36 weken gewerkt -> recht op 3 maanden basis-WW
     * Jareneis: in minstens 4 van laatste 5 kalenderjaren gewerkt -> verlenging op basis van arbeidsverleden
     * Arbeidsverleden duur:
       - Eerste 10 jaar: 1 maand per jaar
       - Jaren boven 10 t/m 2015: 1 maand per jaar
       - Jaren vanaf 2016: 0,5 maand per jaar
       - Wettelijk maximum: 24 maanden
   ========================================================================= */

export interface WwCalculationInput {
  calculationGoal?: 'both' | 'amount' | 'duration';
  salaryMode?: 'sv_loon' | 'gross_salary';
  svLoon?: number;
  unemploymentDate?: string;
  grossSalaryMonthly?: number;
  salaryPeriod?: 'month' | '4weeks';
  customMaxDagloon?: number;

  worksWhileOnWw?: boolean;
  expectedIncomeMonthly?: number;

  weeksWorkedLast36Weeks?: 'yes' | 'no' | 'unknown';
  worked4OfLast5Years?: 'yes' | 'no' | 'unknown';
  totalEmploymentYears?: number;
  yearsFrom2016?: number;
  involuntaryUnemployment?: 'yes' | 'no' | 'unknown';
}

export interface WwCalculationResult {
  calculationGoal: 'both' | 'amount' | 'duration';
  salaryMode: 'sv_loon' | 'gross_salary';

  // Dagloon & grondslag
  svLoon: number;
  rawDagloon: number;
  maxDagloon: number;
  isMaxDagloonApplied: boolean;
  applicableDagloon: number;
  wwMaandloon: number;
  rawWwMaandloon: number;

  // Standaard uitkering (zonder nevenwerk)
  benefitMonth1And2: number;
  benefitMonth3Plus: number;
  benefitDailyMonth1And2: number;
  benefitDailyMonth3Plus: number;
  benefitWeeklyMonth1And2: number;
  benefitWeeklyMonth3Plus: number;

  // Werken tijdens WW
  worksWhileOnWw: boolean;
  expectedIncomeMonthly: number;
  benefitMonth1And2WithWork: number;
  benefitMonth3PlusWithWork: number;
  totalIncomeMonth1And2: number;
  totalIncomeMonth3Plus: number;
  isIncomeOver87Point5Percent: boolean;

  // Voorwaarden & Duur
  meetsWekeneis: boolean | null;
  meetsJareneis: boolean | null;
  isInvoluntary: boolean | null;
  totalEmploymentYears: number;
  yearsFrom2016: number;
  estimatedDurationMonths: number;
  durationExplanation: string;
  eligibilityStatus: 'likely' | 'unlikely' | 'partial' | 'unknown';
  eligibilityMessage: string;

  unemploymentDate?: string;
  referencePeriodDescription: string;
  year: number;
  isValid: boolean;
  errorMessage?: string;
}

export function calculateWw(params: WwCalculationInput = {}): WwCalculationResult {
  const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;
  const round1 = (val: number) => Math.round((val + Number.EPSILON) * 10) / 10;
  const year = DUTCH_RATES.year;
  const maxDagloon = params.customMaxDagloon ?? (DUTCH_RATES.uwvRates?.maxDagloon ?? 309.91);

  const calculationGoal = params.calculationGoal ?? 'both';
  const salaryMode = params.salaryMode ?? 'sv_loon';

  // 1. Validatie invoer
  if (salaryMode === 'sv_loon' && (params.svLoon ?? 0) < 0) {
    return {
      calculationGoal,
      salaryMode,
      svLoon: 0,
      rawDagloon: 0,
      maxDagloon,
      isMaxDagloonApplied: false,
      applicableDagloon: 0,
      wwMaandloon: 0,
      rawWwMaandloon: 0,
      benefitMonth1And2: 0,
      benefitMonth3Plus: 0,
      benefitDailyMonth1And2: 0,
      benefitDailyMonth3Plus: 0,
      benefitWeeklyMonth1And2: 0,
      benefitWeeklyMonth3Plus: 0,
      worksWhileOnWw: false,
      expectedIncomeMonthly: 0,
      benefitMonth1And2WithWork: 0,
      benefitMonth3PlusWithWork: 0,
      totalIncomeMonth1And2: 0,
      totalIncomeMonth3Plus: 0,
      isIncomeOver87Point5Percent: false,
      meetsWekeneis: null,
      meetsJareneis: null,
      isInvoluntary: null,
      totalEmploymentYears: 0,
      yearsFrom2016: 0,
      estimatedDurationMonths: 0,
      durationExplanation: '',
      eligibilityStatus: 'unknown',
      eligibilityMessage: '',
      referencePeriodDescription: '',
      year,
      isValid: false,
      errorMessage: 'Het SV-loon kan niet negatief zijn.'
    };
  }

  if (salaryMode === 'gross_salary' && (params.grossSalaryMonthly ?? 0) < 0) {
    return {
      calculationGoal,
      salaryMode,
      svLoon: 0,
      rawDagloon: 0,
      maxDagloon,
      isMaxDagloonApplied: false,
      applicableDagloon: 0,
      wwMaandloon: 0,
      rawWwMaandloon: 0,
      benefitMonth1And2: 0,
      benefitMonth3Plus: 0,
      benefitDailyMonth1And2: 0,
      benefitDailyMonth3Plus: 0,
      benefitWeeklyMonth1And2: 0,
      benefitWeeklyMonth3Plus: 0,
      worksWhileOnWw: false,
      expectedIncomeMonthly: 0,
      benefitMonth1And2WithWork: 0,
      benefitMonth3PlusWithWork: 0,
      totalIncomeMonth1And2: 0,
      totalIncomeMonth3Plus: 0,
      isIncomeOver87Point5Percent: false,
      meetsWekeneis: null,
      meetsJareneis: null,
      isInvoluntary: null,
      totalEmploymentYears: 0,
      yearsFrom2016: 0,
      estimatedDurationMonths: 0,
      durationExplanation: '',
      eligibilityStatus: 'unknown',
      eligibilityMessage: '',
      referencePeriodDescription: '',
      year,
      isValid: false,
      errorMessage: 'Het bruto maandsalaris kan niet negatief zijn.'
    };
  }

  // 2. Grondslag en Dagloon bepalen
  let effectiveSvLoon = 0;
  if (salaryMode === 'sv_loon') {
    effectiveSvLoon = Math.max(0, params.svLoon ?? 0);
  } else {
    const rawSalary = Math.max(0, params.grossSalaryMonthly ?? 0);
    const is4Weeks = params.salaryPeriod === '4weeks';
    // SV-loon bevat standaard 8% vakantiebijslag
    const annualBasis = is4Weeks ? rawSalary * 13 * 1.08 : rawSalary * 12 * 1.08;
    effectiveSvLoon = round2(annualBasis);
  }

  const rawDagloon = effectiveSvLoon > 0 ? round2(effectiveSvLoon / 261) : 0;
  const isMaxDagloonApplied = rawDagloon > maxDagloon;
  const applicableDagloon = isMaxDagloonApplied ? maxDagloon : rawDagloon;

  const wwMaandloon = round2(applicableDagloon * 21.75);
  const rawWwMaandloon = round2(rawDagloon * 21.75);

  // 3. Standaard WW bedragen (zonder inkomen uit werk)
  const benefitMonth1And2 = round2(wwMaandloon * 0.75);
  const benefitMonth3Plus = round2(wwMaandloon * 0.70);

  const benefitDailyMonth1And2 = round2(applicableDagloon * 0.75);
  const benefitDailyMonth3Plus = round2(applicableDagloon * 0.70);

  const benefitWeeklyMonth1And2 = round2(benefitDailyMonth1And2 * 5);
  const benefitWeeklyMonth3Plus = round2(benefitDailyMonth3Plus * 5);

  // 4. Inkomstenverrekening (werken tijdens WW)
  const worksWhileOnWw = Boolean(params.worksWhileOnWw);
  const expectedIncome = worksWhileOnWw ? Math.max(0, params.expectedIncomeMonthly ?? 0) : 0;

  let benefitMonth1And2WithWork = benefitMonth1And2;
  let benefitMonth3PlusWithWork = benefitMonth3Plus;
  let isIncomeOver87Point5Percent = false;

  if (worksWhileOnWw && expectedIncome > 0) {
    const loss = Math.max(0, wwMaandloon - expectedIncome);
    benefitMonth1And2WithWork = round2(loss * 0.75);
    benefitMonth3PlusWithWork = round2(loss * 0.70);
    isIncomeOver87Point5Percent = expectedIncome > (wwMaandloon * 0.875);
  }

  const totalIncomeMonth1And2 = round2(expectedIncome + benefitMonth1And2WithWork);
  const totalIncomeMonth3Plus = round2(expectedIncome + benefitMonth3PlusWithWork);

  // 5. Voorwaarden en Duurberekening
  const wekeneisInput = params.weeksWorkedLast36Weeks ?? 'yes';
  const meetsWekeneis = wekeneisInput === 'yes' ? true : wekeneisInput === 'no' ? false : null;

  const jareneisInput = params.worked4OfLast5Years ?? 'yes';
  const meetsJareneis = jareneisInput === 'yes' ? true : jareneisInput === 'no' ? false : null;

  const involuntaryInput = params.involuntaryUnemployment ?? 'yes';
  const isInvoluntary = involuntaryInput === 'yes' ? true : involuntaryInput === 'no' ? false : null;

  const rawEmploymentYears = Math.max(0, Math.min(50, params.totalEmploymentYears ?? 5));
  let yearsFrom2016 = params.yearsFrom2016;

  // Indien niet opgegeven en arbeidsverleden > 10 jaar: verdeel logisch
  // 2016 t/m 2025 = maximaal 10 kalenderjaren vanaf 2016
  if (yearsFrom2016 === undefined) {
    if (rawEmploymentYears > 10) {
      yearsFrom2016 = Math.min(rawEmploymentYears - 10, 10);
    } else {
      yearsFrom2016 = 0;
    }
  } else {
    yearsFrom2016 = Math.max(0, Math.min(10, yearsFrom2016));
  }

  let estimatedDurationMonths = 0;
  let durationExplanation = '';

  if (meetsWekeneis === false) {
    estimatedDurationMonths = 0;
    durationExplanation = 'Geen WW-recht omdat je niet aan de wekeneis voldoet (minimaal 26 gewerkte weken in de laatste 36 weken).';
  } else if (meetsWekeneis === true && meetsJareneis === false) {
    estimatedDurationMonths = 3;
    durationExplanation = '3 maanden basis-WW (wel voldaan aan de wekeneis van 26 weken, maar niet aan de jareneis van 4 uit 5 kalenderjaren).';
  } else if (meetsWekeneis === null && meetsJareneis === false) {
    estimatedDurationMonths = 3;
    durationExplanation = 'Maximaal 3 maanden basis-WW mits je aan de wekeneis voldoet (jareneis niet behaald).';
  } else {
    // Wel aan de jareneis voldaan (of onbekend maar uitgaande van arbeidsverleden)
    if (rawEmploymentYears <= 0) {
      estimatedDurationMonths = 3;
      durationExplanation = '3 maanden basis-WW (minimumgarantie bij het voldoen aan de wekeneis).';
    } else if (rawEmploymentYears < 3) {
      estimatedDurationMonths = 3;
      durationExplanation = '3 maanden basis-WW (de wekeneis geeft altijd recht op minimaal 3 maanden).';
    } else if (rawEmploymentYears <= 10) {
      estimatedDurationMonths = rawEmploymentYears;
      durationExplanation = `${rawEmploymentYears} maanden (${rawEmploymentYears} gewerkte kalenderjaren leveren elk 1 maand WW op).`;
    } else {
      // Meer dan 10 jaar arbeidsverleden:
      // Eerste 10 jaar = 10 maanden
      // Jaren vanaf 2016 = 0,5 maand per jaar
      // Resterende jaren tot en met 2015 = 1,0 maand per jaar
      const yearsAbove10 = rawEmploymentYears - 10;
      const safePost2016 = Math.min(yearsAbove10, yearsFrom2016);
      const pre2016Years = yearsAbove10 - safePost2016;

      const calculatedDuration = 10 + (pre2016Years * 1.0) + (safePost2016 * 0.5);
      const cappedDuration = Math.min(24, Math.max(3, calculatedDuration));
      estimatedDurationMonths = round1(cappedDuration);

      if (calculatedDuration >= 24) {
        durationExplanation = '24 maanden (het wettelijk maximum voor een WW-uitkering is bereikt).';
      } else {
        const post2016Text = safePost2016 > 0 ? ` + ${safePost2016} jaar vanaf 2016 (${round1(safePost2016 * 0.5)} mnd)` : '';
        const pre2016Text = pre2016Years > 0 ? ` + ${pre2016Years} jaar t/m 2015 (${pre2016Years} mnd)` : '';
        durationExplanation = `${estimatedDurationMonths.toString().replace('.', ',')} maanden (10 maanden voor eerste 10 jaar${pre2016Text}${post2016Text}).`;
      }
    }
  }

  // 6. Toetsing WW-voorwaarden statusbericht
  let eligibilityStatus: 'likely' | 'unlikely' | 'partial' | 'unknown' = 'likely';
  let eligibilityMessage = '';

  if (meetsWekeneis === false) {
    eligibilityStatus = 'unlikely';
    eligibilityMessage = 'Je voldoet waarschijnlijk niet aan de wekeneis (minimaal 26 van de laatste 36 weken gewerkt). Zonder wekeneis ontstaat in beginsel geen WW-recht.';
  } else if (isInvoluntary === false) {
    eligibilityStatus = 'unlikely';
    eligibilityMessage = 'Je geeft aan dat je zelf ontslag hebt genomen of sprake is van eigen schuld. Bij verwijtbare werkloosheid wijst het UWV een WW-aanvraag in de regel af.';
  } else if (meetsWekeneis === null || isInvoluntary === null) {
    eligibilityStatus = 'partial';
    eligibilityMessage = 'Het is nog niet met zekerheid te bepalen of je aan alle voorwaarden voldoet. Controleer je wekeneis (26 uit 36 weken) en of de werkloosheid niet verwijtbaar is.';
  } else {
    eligibilityStatus = 'likely';
    eligibilityMessage = 'Je lijkt op basis van deze gegevens aan de belangrijkste voorwaarden te voldoen (wekeneis en niet-verwijtbare werkloosheid).';
  }

  const referencePeriodDescription = formatUwvReferencePeriod('ww', params.unemploymentDate);

  return {
    calculationGoal,
    salaryMode,

    svLoon: round2(effectiveSvLoon),
    rawDagloon,
    maxDagloon: round2(maxDagloon),
    isMaxDagloonApplied,
    applicableDagloon: round2(applicableDagloon),
    wwMaandloon,
    rawWwMaandloon,

    benefitMonth1And2,
    benefitMonth3Plus,
    benefitDailyMonth1And2,
    benefitDailyMonth3Plus,
    benefitWeeklyMonth1And2,
    benefitWeeklyMonth3Plus,

    worksWhileOnWw,
    expectedIncomeMonthly: round2(expectedIncome),
    benefitMonth1And2WithWork,
    benefitMonth3PlusWithWork,
    totalIncomeMonth1And2,
    totalIncomeMonth3Plus,
    isIncomeOver87Point5Percent,

    meetsWekeneis,
    meetsJareneis,
    isInvoluntary,
    totalEmploymentYears: rawEmploymentYears,
    yearsFrom2016,
    estimatedDurationMonths,
    durationExplanation,
    eligibilityStatus,
    eligibilityMessage,

    unemploymentDate: params.unemploymentDate,
    referencePeriodDescription,
    year,
    isValid: true
  };
}

/* =========================================================================
   29. Minimumloon Berekenen 2026
   Wet minimumloon en minimumvakantiebijslag (Wml)
   Met ingang van 1 januari 2024 geldt uitsluitend een wettelijk minimumuurloon.
   Bedragen per 1 januari 2026 en 1 juli 2026 (Rijksoverheid)
   ========================================================================= */

export type MinimumWageHoursFrequency = 'week' | 'fourWeeks' | 'month';

export interface MinimumWageCalculationInput {
  period?: MinimumWagePeriod;
  age?: MinimumWageAge;
  isBbl?: boolean;
  hoursFrequency?: MinimumWageHoursFrequency;
  hours?: number;
}

export interface MinimumWageCalculationResult {
  period: MinimumWagePeriod;
  periodLabel: string;
  effectiveFrom: string;
  age: MinimumWageAge;
  ageLabel: string;
  isBbl: boolean;
  percentage: number;
  hourlyWage: number;

  hoursFrequency: MinimumWageHoursFrequency;
  inputHours: number;
  calculatedWeeklyHours: number;
  calculatedFourWeeklyHours: number;
  calculatedMonthlyHours: number;
  calculatedAnnualHours: number;

  wageWeekly: number;
  wageFourWeekly: number;
  wageMonthly: number;
  wageAnnual: number;

  isValid: boolean;
  errorMessage?: string;
}

export function calculateMinimumloon(params: MinimumWageCalculationInput): MinimumWageCalculationResult {
  const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

  const period: MinimumWagePeriod = params.period === '2026-01' ? '2026-01' : '2026-07';
  const validAges: MinimumWageAge[] = ['21+', '20', '19', '18', '17', '16', '15'];
  const age: MinimumWageAge = validAges.includes(params.age as MinimumWageAge) ? (params.age as MinimumWageAge) : '21+';
  const isBbl = Boolean(params.isBbl);
  const hoursFrequency: MinimumWageHoursFrequency =
    params.hoursFrequency === 'fourWeeks' || params.hoursFrequency === 'month'
      ? params.hoursFrequency
      : 'week';
  const rawHours = Number(params.hours);
  const inputHours = isNaN(rawHours) ? (hoursFrequency === 'week' ? 40 : hoursFrequency === 'fourWeeks' ? 160 : 173.33) : Math.max(0, rawHours);

  const periodConfig = MINIMUM_WAGE_RATES_2026[period];
  const rateConfig = periodConfig.rates[age];

  const hourlyWage = isBbl ? rateConfig.bblRate : rateConfig.regularRate;
  const percentage = isBbl ? rateConfig.bblPercentage : rateConfig.regularPercentage;

  let calculatedWeeklyHours = 0;
  let calculatedFourWeeklyHours = 0;
  let calculatedMonthlyHours = 0;
  let calculatedAnnualHours = 0;

  let wageWeekly = 0;
  let wageFourWeekly = 0;
  let wageMonthly = 0;
  let wageAnnual = 0;

  if (hoursFrequency === 'week') {
    calculatedWeeklyHours = round2(inputHours);
    calculatedFourWeeklyHours = round2(inputHours * 4);
    calculatedMonthlyHours = round2((inputHours * 52) / 12);
    calculatedAnnualHours = round2(inputHours * 52);

    wageWeekly = round2(inputHours * hourlyWage);
    wageFourWeekly = round2(wageWeekly * 4);
    wageMonthly = round2((wageWeekly * 52) / 12);
    wageAnnual = round2(wageWeekly * 52);
  } else if (hoursFrequency === 'fourWeeks') {
    calculatedFourWeeklyHours = round2(inputHours);
    calculatedWeeklyHours = round2(inputHours / 4);
    calculatedMonthlyHours = round2((calculatedWeeklyHours * 52) / 12);
    calculatedAnnualHours = round2(calculatedWeeklyHours * 52);

    wageFourWeekly = round2(inputHours * hourlyWage);
    wageWeekly = round2(wageFourWeekly / 4);
    wageMonthly = round2((wageWeekly * 52) / 12);
    wageAnnual = round2(wageWeekly * 52);
  } else {
    calculatedMonthlyHours = round2(inputHours);
    calculatedWeeklyHours = round2((inputHours * 12) / 52);
    calculatedFourWeeklyHours = round2(calculatedWeeklyHours * 4);
    calculatedAnnualHours = round2(inputHours * 12);

    wageMonthly = round2(inputHours * hourlyWage);
    wageAnnual = round2(wageMonthly * 12);
    wageWeekly = round2((wageAnnual) / 52);
    wageFourWeekly = round2(wageWeekly * 4);
  }

  return {
    period,
    periodLabel: periodConfig.label,
    effectiveFrom: periodConfig.effectiveFrom,
    age,
    ageLabel: rateConfig.label,
    isBbl,
    percentage,
    hourlyWage: round2(hourlyWage),

    hoursFrequency,
    inputHours: round2(inputHours),
    calculatedWeeklyHours,
    calculatedFourWeeklyHours,
    calculatedMonthlyHours,
    calculatedAnnualHours,

    wageWeekly: round2(wageWeekly),
    wageFourWeekly: round2(wageFourWeekly),
    wageMonthly: round2(wageMonthly),
    wageAnnual: round2(wageAnnual),

    isValid: true
  };
}

/* =========================================================================
   30. Arbeidskorting Berekenen (2026)
   Bron: Belastingdienst — Tabel arbeidskorting 2026
   ========================================================================= */

export interface ArbeidskortingCalculationInput {
  income: number;
  year?: number;
  aowStatus?: AowStatus;
}

export interface ArbeidskortingCalculationResult {
  year: number;
  income: number;
  aowStatus: AowStatus;
  aowStatusLabel: string;
  arbeidskorting: number;
  arbeidskortingMonthly: number;
  maxArbeidskorting: number;
  bracketIndex: number;
  bracketRange: string;
  formulaDescription: string;
  isMaxReached: boolean;
  isPhaseOut: boolean;
  isZero: boolean;
  zeroReason?: string;
  aowDuringYearNotice?: string;
  indicativeMin?: number;
  indicativeMax?: number;
  explanation: string;
  isValid: boolean;
}

export function calculateArbeidskorting(params: ArbeidskortingCalculationInput): ArbeidskortingCalculationResult {
  const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;
  const formatEuro = (val: number) =>
    new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);

  const year = params.year === 2026 || !params.year ? 2026 : params.year;
  const config = ARBEIDSKORTING_BY_YEAR[year] || ARBEIDSKORTING_RATES_2026;
  const aowStatus: AowStatus = params.aowStatus === 'during' || params.aowStatus === 'full' ? params.aowStatus : 'none';

  const rawIncome = Number(params.income);
  const income = isNaN(rawIncome) || rawIncome < 0 ? 0 : rawIncome;

  const aowStatusLabel =
    aowStatus === 'full'
      ? 'Hele jaar AOW-leeftijd'
      : aowStatus === 'during'
      ? 'Bereikt AOW-leeftijd in ' + year
      : 'Nog niet de AOW-leeftijd';

  const maxArbeidskorting = aowStatus === 'full' ? config.maxAmountAow : config.maxAmountStandard;

  const calcAmountForTiers = (brackets: typeof config.standardBrackets, maxCap: number) => {
    if (income <= 0) {
      return {
        amount: 0,
        bracketIndex: 1,
        bracketRange: 'Tot en met € 11.965',
        formula: brackets[0].formulaDescription,
        isPhaseOut: false,
        isMax: false,
        isZero: true,
        zeroReason: 'Bij een arbeidsinkomen van € 0 heb je geen recht op arbeidskorting omdat je geen inkomsten uit tegenwoordige arbeid hebt.'
      };
    }
    if (income > config.zeroThreshold) {
      return {
        amount: 0,
        bracketIndex: 5,
        bracketRange: 'Boven € 132.920',
        formula: 'Volledig afgebouwd naar € 0',
        isPhaseOut: true,
        isMax: false,
        isZero: true,
        zeroReason: 'Boven een arbeidsinkomen van € 132.920 is de arbeidskorting door de wettelijke afbouw volledig verminderd tot € 0.'
      };
    }

    if (income <= 11965) {
      const amt = brackets[0].rate * income;
      return {
        amount: Math.min(maxCap, Math.max(0, amt)),
        bracketIndex: 1,
        bracketRange: 'Tot en met € 11.965',
        formula: brackets[0].formulaDescription,
        isPhaseOut: false,
        isMax: false,
        isZero: false
      };
    } else if (income <= 25845) {
      const amt = brackets[1].baseAmount + brackets[1].rate * (income - 11965);
      return {
        amount: Math.min(maxCap, Math.max(0, amt)),
        bracketIndex: 2,
        bracketRange: '€ 11.966 t/m € 25.845',
        formula: brackets[1].formulaDescription,
        isPhaseOut: false,
        isMax: false,
        isZero: false
      };
    } else if (income <= 45592) {
      const amt = brackets[2].baseAmount + brackets[2].rate * (income - 25845);
      return {
        amount: Math.min(maxCap, Math.max(0, amt)),
        bracketIndex: 3,
        bracketRange: '€ 25.846 t/m € 45.592',
        formula: brackets[2].formulaDescription,
        isPhaseOut: false,
        isMax: amt >= maxCap - 0.05,
        isZero: false
      };
    } else {
      const amt = brackets[3].baseAmount - brackets[3].rate * (income - 45592);
      return {
        amount: Math.max(0, Math.min(maxCap, amt)),
        bracketIndex: 4,
        bracketRange: '€ 45.593 t/m € 132.920 (afbouwtraject)',
        formula: brackets[3].formulaDescription,
        isPhaseOut: true,
        isMax: false,
        isZero: amt <= 0.005,
        zeroReason: amt <= 0.005 ? 'Door de wettelijke afbouw is het bedrag gedaald naar € 0.' : undefined
      };
    }
  };

  const standardRes = calcAmountForTiers(config.standardBrackets, config.maxAmountStandard);
  const aowRes = calcAmountForTiers(config.aowBrackets, config.maxAmountAow);

  let finalAmount = 0;
  let bracketIndex = 1;
  let bracketRange = '';
  let formulaDescription = '';
  let isPhaseOut = false;
  let isMaxReached = false;
  let isZero = false;
  let zeroReason: string | undefined;
  let aowDuringYearNotice: string | undefined;
  let indicativeMin: number | undefined;
  let indicativeMax: number | undefined;

  if (aowStatus === 'full') {
    finalAmount = round2(aowRes.amount);
    bracketIndex = aowRes.bracketIndex;
    bracketRange = aowRes.bracketRange;
    formulaDescription = aowRes.formula;
    isPhaseOut = aowRes.isPhaseOut;
    isMaxReached = aowRes.isMax;
    isZero = aowRes.isZero;
    zeroReason = aowRes.zeroReason;
  } else if (aowStatus === 'during') {
    finalAmount = round2(standardRes.amount);
    bracketIndex = standardRes.bracketIndex;
    bracketRange = standardRes.bracketRange;
    formulaDescription = standardRes.formula;
    isPhaseOut = standardRes.isPhaseOut;
    isMaxReached = standardRes.isMax;
    isZero = standardRes.isZero;
    zeroReason = standardRes.zeroReason;

    indicativeMin = round2(aowRes.amount);
    indicativeMax = round2(standardRes.amount);
    aowDuringYearNotice =
      'Omdat je in ' +
      year +
      ' de AOW-leeftijd bereikt, geldt een gecombineerd belasting- en premiepercentage op basis van de exacte maand waarin je AOW ingaat. Je daadwerkelijke arbeidskorting ligt indicatief tussen ' +
      formatEuro(indicativeMin) +
      ' en ' +
      formatEuro(indicativeMax) +
      '. Gebruik voor je exacte situatie de officiële rekenhulp van de Belastingdienst.';
  } else {
    finalAmount = round2(standardRes.amount);
    bracketIndex = standardRes.bracketIndex;
    bracketRange = standardRes.bracketRange;
    formulaDescription = standardRes.formula;
    isPhaseOut = standardRes.isPhaseOut;
    isMaxReached = standardRes.isMax;
    isZero = standardRes.isZero;
    zeroReason = standardRes.zeroReason;
  }

  const arbeidskortingMonthly = round2(finalAmount / 12);

  let explanation = '';
  if (isZero) {
    explanation = zeroReason || 'Bij dit inkomen bedraagt de geschatte arbeidskorting € 0,00.';
  } else if (aowStatus === 'during') {
    explanation =
      'Op basis van een arbeidsinkomen van ' +
      formatEuro(income) +
      ' in ' +
      year +
      ' bedraagt de indicatieve bandbreedte van je arbeidskorting naar schatting tussen ' +
      formatEuro(indicativeMin ?? 0) +
      ' en ' +
      formatEuro(indicativeMax ?? 0) +
      '.';
  } else {
    explanation =
      'Op basis van een arbeidsinkomen van ' +
      formatEuro(income) +
      ' in ' +
      year +
      ' bedraagt je geschatte arbeidskorting ongeveer ' +
      formatEuro(finalAmount) +
      ' per jaar' +
      (finalAmount > 0 ? ' (gemiddeld circa ' + formatEuro(arbeidskortingMonthly) + ' per maand)' : '') +
      '.';
  }

  return {
    year,
    income: round2(income),
    aowStatus,
    aowStatusLabel,
    arbeidskorting: finalAmount,
    arbeidskortingMonthly,
    maxArbeidskorting,
    bracketIndex,
    bracketRange,
    formulaDescription,
    isMaxReached,
    isPhaseOut,
    isZero,
    zeroReason,
    aowDuringYearNotice,
    indicativeMin,
    indicativeMax,
    explanation,
    isValid: true
  };
}



