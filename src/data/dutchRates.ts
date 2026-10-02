/**
 * Officiële Nederlandse normen en tarieven (2025 / 2026)
 * Bronnen: Belastingdienst, Rijksoverheid, UWV
 */

export interface EmployerRates {
  year: number;
  maxPremiumWageAnnual: number;
  maxPremiumWageMonthly: number;
  awfLow: number;
  awfHigh: number;
  aofLow: number;
  aofHigh: number;
  wko: number;
  whkDefault: number;
  zvwEmployer: number;
}

export const EMPLOYER_RATES_2026: EmployerRates = {
  year: 2026,
  maxPremiumWageAnnual: 79409,
  maxPremiumWageMonthly: Math.round((79409 / 12) * 100) / 100,
  awfLow: 2.74,
  awfHigh: 7.74,
  aofLow: 6.27,
  aofHigh: 7.63,
  wko: 0.50,
  whkDefault: 1.22,
  zvwEmployer: 6.57
};

export interface UwvRates {
  year: number;
  maxDagloon: number; // € 309,91 bruto per dag incl. vakantiegeld (Besluit dagloonregels 2026)
  annualDagloondagen: number; // Standaard 261 dagloondagen per refertejaar
  monthlyDagloondagen: number; // 21,75 dagloondagen per kalendermaand (261 / 12)
  weeklyDagloondagen: number; // 5 dagloondagen per week
  effectiveDate: string;
}

export const UWV_RATES_2026: UwvRates = {
  year: 2026,
  maxDagloon: 309.91,
  annualDagloondagen: 261,
  monthlyDagloondagen: 21.75,
  weeklyDagloondagen: 5,
  effectiveDate: '1 januari 2026'
};

export interface DutchRates {
  year: number;
  travelAllowancePerKm: number; // Onbelaste reiskostenvergoeding per km
  homeWorkAllowancePerDay: number; // Onbelaste thuiswerkvergoeding per dag
  vacationPayPercentage: number; // Wettelijk minimum percentage vakantiebijslag (8%)
  statutoryVacationWeeks: number; // Wettelijk minimum aantal weken vakantie (4x wekelijkse arbeidsduur)
  standardFulltimeHours: number; // Standaard fulltime werkweek (vaak 36 of 40 uur)
  employerRates: EmployerRates;
  uwvRates: UwvRates;
  sources: {
    belastingdienst: string;
    rijksoverheid: string;
    uwv: string;
  };
  lastUpdated: string;
}

export const DUTCH_RATES: DutchRates = {
  year: 2026,
  travelAllowancePerKm: 0.23, // € 0,23 per kilometer (onbelaste norm Belastingdienst 2024-2026)
  homeWorkAllowancePerDay: 2.40, // € 2,40 per thuiswerkdag (norm Belastingdienst 2025/2026)
  vacationPayPercentage: 8.0, // 8% over het bruto jaarsalaris (Wet minimumloon en minimumvakantiebijslag)
  statutoryVacationWeeks: 4, // 4 keer het aantal gewerkte uren per week (art. 7:634 BW)
  standardFulltimeHours: 40,
  employerRates: EMPLOYER_RATES_2026,
  uwvRates: UWV_RATES_2026,
  sources: {
    belastingdienst: 'https://www.belastingdienst.nl',
    rijksoverheid: 'https://www.rijksoverheid.nl/onderwerpen/arbeidsovereenkomst-en-cao',
    uwv: 'https://www.uwv.nl'
  },
  lastUpdated: '1 januari 2026'
};

/* =========================================================================
   Loonbelasting & Heffingskortingen 2026 (Witte Maandtabel & Jaarregeling)
   Bron: Belastingdienst Handboek Loonheffingen 2026 / Belastingplan 2026
   ========================================================================= */

export interface TaxBracket {
  limit: number;
  rateStandard: number; // percentage onder AOW
  rateAow: number; // percentage vanaf AOW
}

export interface AlgemeneHeffingskortingConfig {
  maxAmountStandard: number;
  phaseOutStart: number;
  phaseOutEnd: number;
  phaseOutRate: number;
  aowRatio: number;
}

export interface ArbeidskortingBracket {
  min: number;
  max: number;
  baseAmount: number;
  rate: number;
  isPhaseOut?: boolean;
}

export interface ArbeidskortingConfig {
  maxAmountStandard: number;
  brackets: ArbeidskortingBracket[];
  aowRatio: number;
}

export interface PayrollTaxRates {
  year: number;
  aowAge: number;
  brackets: TaxBracket[];
  generalTaxCredit: AlgemeneHeffingskortingConfig;
  labourTaxCredit: ArbeidskortingConfig;
  minimumWageHourly: {
    asOfJan: number;
    asOfJul: number;
  };
}

export const PAYROLL_TAX_RATES_2026: PayrollTaxRates = {
  year: 2026,
  aowAge: 67,
  brackets: [
    { limit: 38441, rateStandard: 35.82, rateAow: 17.92 },
    { limit: 76817, rateStandard: 37.48, rateAow: 37.48 },
    { limit: Infinity, rateStandard: 49.50, rateAow: 49.50 }
  ],
  generalTaxCredit: {
    maxAmountStandard: 3115,
    phaseOutStart: 28406,
    phaseOutEnd: 76817,
    phaseOutRate: 0.064344, // 3115 / (76817 - 28406)
    aowRatio: 0.5003 // ca. 50,03% wegens vrijstelling AOW-premie
  },
  labourTaxCredit: {
    maxAmountStandard: 5685,
    brackets: [
      { min: 0, max: 11965, baseAmount: 0, rate: 0.08328 },
      { min: 11965, max: 24811, baseAmount: 996.44, rate: 0.31107 },
      { min: 24811, max: 44097, baseAmount: 4986.37, rate: 0.03500 },
      { min: 44097, max: 131425, baseAmount: 5685, rate: 0.06510, isPhaseOut: true }
    ],
    aowRatio: 0.5003
  },
  minimumWageHourly: {
    asOfJan: 14.71,
    asOfJul: 14.99
  }
};

/* =========================================================================
   Wettelijk Minimumuurloon 2026 (per 1 januari 2026 en per 1 juli 2026)
   Bron: Rijksoverheid / Ministerie van Sociale Zaken en Werkgelegenheid
   Inclusief minimumjeugdloon (15-20 jaar) en BBL-staffel (art. 3 Besluit minimumjeugdloonregeling)
   ========================================================================= */

export type MinimumWagePeriod = '2026-07' | '2026-01';
export type MinimumWageAge = '21+' | '20' | '19' | '18' | '17' | '16' | '15';

export interface MinimumWageAgeRate {
  age: MinimumWageAge;
  label: string;
  regularPercentage: number;
  regularRate: number;
  bblPercentage: number;
  bblRate: number;
}

export interface MinimumWagePeriodConfig {
  period: MinimumWagePeriod;
  label: string;
  effectiveFrom: string;
  rates: Record<MinimumWageAge, MinimumWageAgeRate>;
}

export const MINIMUM_WAGE_RATES_2026: Record<MinimumWagePeriod, MinimumWagePeriodConfig> = {
  '2026-07': {
    period: '2026-07',
    label: '1 juli 2026',
    effectiveFrom: '1 juli 2026',
    rates: {
      '21+': { age: '21+', label: '21 jaar of ouder', regularPercentage: 100, regularRate: 14.99, bblPercentage: 100, bblRate: 14.99 },
      '20': { age: '20', label: '20 jaar', regularPercentage: 80, regularRate: 11.99, bblPercentage: 61.5, bblRate: 9.22 },
      '19': { age: '19', label: '19 jaar', regularPercentage: 60, regularRate: 8.99, bblPercentage: 52.5, bblRate: 7.87 },
      '18': { age: '18', label: '18 jaar', regularPercentage: 50, regularRate: 7.50, bblPercentage: 45.5, bblRate: 6.82 },
      '17': { age: '17', label: '17 jaar', regularPercentage: 39.5, regularRate: 5.92, bblPercentage: 39.5, bblRate: 5.92 },
      '16': { age: '16', label: '16 jaar', regularPercentage: 34.5, regularRate: 5.17, bblPercentage: 34.5, bblRate: 5.17 },
      '15': { age: '15', label: '15 jaar', regularPercentage: 30, regularRate: 4.50, bblPercentage: 30, bblRate: 4.50 }
    }
  },
  '2026-01': {
    period: '2026-01',
    label: '1 januari 2026',
    effectiveFrom: '1 januari 2026',
    rates: {
      '21+': { age: '21+', label: '21 jaar of ouder', regularPercentage: 100, regularRate: 14.71, bblPercentage: 100, bblRate: 14.71 },
      '20': { age: '20', label: '20 jaar', regularPercentage: 80, regularRate: 11.77, bblPercentage: 61.5, bblRate: 9.05 },
      '19': { age: '19', label: '19 jaar', regularPercentage: 60, regularRate: 8.83, bblPercentage: 52.5, bblRate: 7.72 },
      '18': { age: '18', label: '18 jaar', regularPercentage: 50, regularRate: 7.36, bblPercentage: 45.5, bblRate: 6.69 },
      '17': { age: '17', label: '17 jaar', regularPercentage: 39.5, regularRate: 5.81, bblPercentage: 39.5, bblRate: 5.81 },
      '16': { age: '16', label: '16 jaar', regularPercentage: 34.5, regularRate: 5.07, bblPercentage: 34.5, bblRate: 5.07 },
      '15': { age: '15', label: '15 jaar', regularPercentage: 30, regularRate: 4.41, bblPercentage: 30, bblRate: 4.41 }
    }
  }
};

/* =========================================================================
   Tabel Arbeidskorting 2026
   Bron: Belastingdienst — Tabel arbeidskorting 2026
   Geldig voor inkomstenbelasting en loonheffing 2026
   ========================================================================= */

export type AowStatus = 'none' | 'during' | 'full';

export interface ArbeidskortingTier {
  min: number;
  max: number;
  baseAmount: number;
  rate: number;
  isPhaseOut?: boolean;
  formulaDescription: string;
}

export interface ArbeidskortingYearConfig {
  year: number;
  maxAmountStandard: number;
  maxAmountAow: number;
  phaseOutStart: number;
  zeroThreshold: number;
  standardBrackets: ArbeidskortingTier[];
  aowBrackets: ArbeidskortingTier[];
}

export const ARBEIDSKORTING_RATES_2026: ArbeidskortingYearConfig = {
  year: 2026,
  maxAmountStandard: 5685,
  maxAmountAow: 2840,
  phaseOutStart: 45592,
  zeroThreshold: 132920,
  standardBrackets: [
    {
      min: 0,
      max: 11965,
      baseAmount: 0,
      rate: 0.08324,
      formulaDescription: '8,324% × arbeidsinkomen'
    },
    {
      min: 11965,
      max: 25845,
      baseAmount: 996,
      rate: 0.31009,
      formulaDescription: '€ 996 + 31,009% × (arbeidsinkomen - € 11.965)'
    },
    {
      min: 25845,
      max: 45592,
      baseAmount: 5300,
      rate: 0.01950,
      formulaDescription: '€ 5.300 + 1,950% × (arbeidsinkomen - € 25.845)'
    },
    {
      min: 45592,
      max: 132920,
      baseAmount: 5685,
      rate: 0.06510,
      isPhaseOut: true,
      formulaDescription: '€ 5.685 - 6,510% × (arbeidsinkomen - € 45.592)'
    }
  ],
  aowBrackets: [
    {
      min: 0,
      max: 11965,
      baseAmount: 0,
      rate: 0.04156,
      formulaDescription: '4,156% × arbeidsinkomen'
    },
    {
      min: 11965,
      max: 25845,
      baseAmount: 498,
      rate: 0.15483,
      formulaDescription: '€ 498 + 15,483% × (arbeidsinkomen - € 11.965)'
    },
    {
      min: 25845,
      max: 45592,
      baseAmount: 2647,
      rate: 0.00974,
      formulaDescription: '€ 2.647 + 0,974% × (arbeidsinkomen - € 25.845)'
    },
    {
      min: 45592,
      max: 132920,
      baseAmount: 2840,
      rate: 0.03250,
      isPhaseOut: true,
      formulaDescription: '€ 2.840 - 3,250% × (arbeidsinkomen - € 45.592)'
    }
  ]
};

export const ARBEIDSKORTING_BY_YEAR: Record<number, ArbeidskortingYearConfig> = {
  2026: ARBEIDSKORTING_RATES_2026
};
