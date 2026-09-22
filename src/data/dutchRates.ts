/**
 * Officiële Nederlandse normen en tarieven (2025 / 2026)
 * Bronnen: Belastingdienst, Rijksoverheid, UWV
 */

export interface DutchRates {
  year: number;
  travelAllowancePerKm: number; // Onbelaste reiskostenvergoeding per km
  homeWorkAllowancePerDay: number; // Onbelaste thuiswerkvergoeding per dag
  vacationPayPercentage: number; // Wettelijk minimum percentage vakantiebijslag (8%)
  statutoryVacationWeeks: number; // Wettelijk minimum aantal weken vakantie (4x wekelijkse arbeidsduur)
  standardFulltimeHours: number; // Standaard fulltime werkweek (vaak 36 of 40 uur)
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
  sources: {
    belastingdienst: 'https://www.belastingdienst.nl',
    rijksoverheid: 'https://www.rijksoverheid.nl/onderwerpen/arbeidsovereenkomst-en-cao',
    uwv: 'https://www.uwv.nl'
  },
  lastUpdated: '1 januari 2026'
};
