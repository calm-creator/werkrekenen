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
