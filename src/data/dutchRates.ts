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

export interface DutchRates {
  year: number;
  travelAllowancePerKm: number; // Onbelaste reiskostenvergoeding per km
  homeWorkAllowancePerDay: number; // Onbelaste thuiswerkvergoeding per dag
  vacationPayPercentage: number; // Wettelijk minimum percentage vakantiebijslag (8%)
  statutoryVacationWeeks: number; // Wettelijk minimum aantal weken vakantie (4x wekelijkse arbeidsduur)
  standardFulltimeHours: number; // Standaard fulltime werkweek (vaak 36 of 40 uur)
  employerRates: EmployerRates;
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

