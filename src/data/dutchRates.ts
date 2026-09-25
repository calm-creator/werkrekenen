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
