export interface CalculatorMeta {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: 'salaris' | 'werkuren' | 'vergoedingen';
  categoryTitle: string;
  description: string;
  metaDescription: string;
  icon: string;
  relatedSlugs: string[];
  popular?: boolean;
}

export interface CategoryMeta {
  id: 'salaris' | 'werkuren' | 'vergoedingen';
  title: string;
  slug: string;
  description: string;
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  salaris: {
    id: 'salaris',
    title: 'Salaris & loon',
    slug: '/categorie/salaris/',
    description: 'Bereken eenvoudig je bruto uurloon, parttime salaris, vakantiegeld en overurentoeslag volgens de actuele Nederlandse maatstaven.'
  },
  werkuren: {
    id: 'werkuren',
    title: 'Werkuren & vakantie',
    slug: '/categorie/werkuren/',
    description: 'Bereken je wettelijke en bovenwettelijke vakantie-uren, parttime uren en het aantal werkdagen tussen twee data met officiële feestdagen.'
  },
  vergoedingen: {
    id: 'vergoedingen',
    title: 'Reiskosten & vergoedingen',
    slug: '/categorie/vergoedingen/',
    description: 'Bereken je maximale onbelaste reiskostenvergoeding en thuiswerkvergoeding conform de richtlijnen van de Belastingdienst.'
  }
};

export const CALCULATORS: CalculatorMeta[] = [
  {
    id: 'uurloon',
    slug: 'uurloon-berekenen',
    title: 'Uurloon berekenen',
    shortTitle: 'Uurloon',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Reken snel je bruto maandloon om naar uurloon, of bereken je maandinkomen op basis van je gewerkte uren en uurtarief.',
    metaDescription: 'Bereken direct je bruto uurloon vanuit je maand- of jaarsalaris. Inclusief instelbare werkweek (36, 38 of 40 uur) en Nederlandse CAO-normen.',
    icon: 'coins',
    popular: true,
    relatedSlugs: ['uurloon-naar-maandloon-berekenen', 'parttime-salaris-berekenen', 'vakantiegeld-berekenen']
  },
  {
    id: 'reiskostenvergoeding',
    slug: 'reiskostenvergoeding-berekenen',
    title: 'Reiskostenvergoeding berekenen',
    shortTitle: 'Reiskosten',
    category: 'vergoedingen',
    categoryTitle: 'Reiskosten & vergoedingen',
    description: 'Bereken je maandelijkse en jaarlijkse kilometervergoeding voor woon-werkverkeer volgens de maximale onbelaste norm van € 0,23 per km.',
    metaDescription: 'Bereken je reiskostenvergoeding voor woon-werkverkeer. Zie direct hoeveel je netto onbelast vergoed krijgt op basis van de Belastingdienst norm van € 0,23/km.',
    icon: 'car',
    popular: true,
    relatedSlugs: ['kilometervergoeding-berekenen', 'woon-werk-kosten-berekenen', 'thuiswerkvergoeding-berekenen']
  },
  {
    id: 'thuiswerkvergoeding',
    slug: 'thuiswerkvergoeding-berekenen',
    title: 'Thuiswerkvergoeding berekenen',
    shortTitle: 'Thuiswerkvergoeding',
    category: 'vergoedingen',
    categoryTitle: 'Reiskosten & vergoedingen',
    description: 'Bereken de onbelaste vergoeding voor je thuiswerkdagen per maand en per jaar op basis van het officiële Belastingdienst-tarief van € 2,40 per dag.',
    metaDescription: 'Bereken je thuiswerkvergoeding per maand en jaar. Conform het officiële onbelaste Belastingdienst tarief van € 2,40 per dag voor hybride werknemers.',
    icon: 'home',
    popular: true,
    relatedSlugs: ['reiskostenvergoeding-berekenen', 'werkdagen-berekenen', 'parttime-salaris-berekenen']
  },
  {
    id: 'vakantiegeld',
    slug: 'vakantiegeld-berekenen',
    title: 'Vakantiegeld berekenen',
    shortTitle: 'Vakantiegeld',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Bereken hoeveel bruto vakantiebijslag (wettelijk minimaal 8%) je opbouwt over je maandsalaris en wat je in mei uitbetaald krijgt.',
    metaDescription: 'Bereken je vakantiegeld (8% wettelijk minimum). Bereken eenvoudig hoeveel bruto vakantiebijslag je hebt opgebouwd over het afgelopen werkjaar.',
    icon: 'sun',
    popular: true,
    relatedSlugs: ['uurloon-berekenen', 'parttime-salaris-berekenen', 'vakantie-uren-berekenen']
  },
  {
    id: 'vakantie-uren',
    slug: 'vakantie-uren-berekenen',
    title: 'Vakantie-uren berekenen',
    shortTitle: 'Vakantie-uren',
    category: 'werkuren',
    categoryTitle: 'Werkuren & vakantie',
    description: 'Bereken je wettelijke en bovenwettelijke vakantiedagen en uren op basis van je wekelijkse arbeidsduur en parttime percentage.',
    metaDescription: 'Bereken direct je wettelijke (4x werkweek) en bovenwettelijke vakantie-uren en vakantiedagen per jaar, ook bij een parttime dienstverband.',
    icon: 'calendar',
    popular: false,
    relatedSlugs: ['vakantiedagen-berekenen', 'werkdagen-berekenen', 'parttime-salaris-berekenen']
  },
  {
    id: 'vakantiedagen',
    slug: 'vakantiedagen-berekenen',
    title: 'Vakantiedagen berekenen',
    shortTitle: 'Vakantiedagen',
    category: 'werkuren',
    categoryTitle: 'Werkuren & vakantie',
    description: 'Bereken exact hoeveel wettelijke en bovenwettelijke vakantiedagen je opbouwt per jaar of maand, zowel voor fulltime als parttime dienstverbanden.',
    metaDescription: 'Bereken direct je wettelijke en bovenwettelijke vakantiedagen per jaar of bij een parttime contract. Conform art. 7:634 BW en Nederlandse CAO-normen.',
    icon: 'calendar',
    popular: true,
    relatedSlugs: ['vakantie-uren-berekenen', 'parttime-salaris-berekenen', 'werkdagen-berekenen', 'uurloon-berekenen']
  },
  {
    id: 'overuren',
    slug: 'overuren-berekenen',
    title: 'Overuren berekenen',
    shortTitle: 'Overuren',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Bereken direct je overurenvergoeding en uitbetaling inclusief overwerktoeslag (125%, 150% of 200%), vakantiegeld en netto indicatie.',
    metaDescription: 'Bereken direct je overuren inclusief overwerktoeslag (zoals 125%, 150% of 200%), 8% vakantiegeld en netto indicatie. Eenvoudig en nauwkeurig.',
    icon: 'clock',
    popular: true,
    relatedSlugs: ['uurloon-berekenen', 'weekloon-berekenen', 'parttime-salaris-berekenen', 'vakantiegeld-berekenen']
  },
  {
    id: 'werkdagen',
    slug: 'werkdagen-berekenen',
    title: 'Werkdagen berekenen',
    shortTitle: 'Werkdagen',
    category: 'werkuren',
    categoryTitle: 'Werkuren & vakantie',
    description: 'Bereken het exacte aantal werkdagen en werkuren tussen twee datums, met automatische aftrek van weekenden en officiële Nederlandse feestdagen.',
    metaDescription: 'Bereken het aantal werkdagen tussen twee datums in Nederland. Exclusief weekenden en officiële Nederlandse feestdagen zoals Koningsdag en Hemelvaart.',
    icon: 'briefcase',
    popular: true,
    relatedSlugs: ['werkuren-per-jaar-berekenen', 'vakantiedagen-berekenen', 'reiskostenvergoeding-berekenen']
  },
  {
    id: 'parttime-salaris',
    slug: 'parttime-salaris-berekenen',
    title: 'Parttime salaris berekenen',
    shortTitle: 'Parttime salaris',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Reken een fulltime salaris om naar parttime (bijv. 24, 28, 32 of 36 uur) of bereken vanuit een parttime salaris het fulltime equivalent.',
    metaDescription: 'Bereken je parttime salaris op basis van je deeltijdfactor en gewerkte uren. Vergelijk direct met het fulltime salaris (36, 38 of 40 uur).',
    icon: 'pie-chart',
    popular: true,
    relatedSlugs: ['fte-berekenen', 'uurloon-berekenen', 'salarisverhoging-berekenen', 'vakantiegeld-berekenen']
  },
  {
    id: 'salarisverhoging',
    slug: 'salarisverhoging-berekenen',
    title: 'Salarisverhoging berekenen',
    shortTitle: 'Salarisverhoging',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Bereken direct wat een salarisverhoging of loonsverhoging betekent per maand, per jaar en inclusief vakantiegeld.',
    metaDescription: 'Bereken je salarisverhoging in euro’s en procenten per maand en per jaar. Inclusief 8% vakantiebijslag, CAO-stappen en bruto-netto toelichting.',
    icon: 'trending-up',
    popular: true,
    relatedSlugs: ['uurloon-berekenen', 'parttime-salaris-berekenen', 'vakantiegeld-berekenen', 'overuren-berekenen']
  },
  {
    id: 'uurloon-naar-maandloon',
    slug: 'uurloon-naar-maandloon-berekenen',
    title: 'Uurloon naar maandloon berekenen',
    shortTitle: 'Uurloon naar maandloon',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Reken eenvoudig een bruto uurloon om naar een maandsalaris, weeksalaris en jaarsalaris op basis van je werkweek.',
    metaDescription: 'Bereken je maandloon vanuit je uurloon. Nauwkeurige omrekening op basis van je wekelijkse arbeidsduur (bijv. 40, 36 of 32 uur), incl. 8% vakantiegeld.',
    icon: 'coins',
    popular: true,
    relatedSlugs: ['weekloon-berekenen', 'maandloon-naar-uurloon-berekenen', 'uurloon-berekenen', 'parttime-salaris-berekenen']
  },
  {
    id: 'maandloon-naar-uurloon',
    slug: 'maandloon-naar-uurloon-berekenen',
    title: 'Maandloon naar uurloon berekenen',
    shortTitle: 'Maandloon naar uurloon',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Reken snel en nauwkeurig je bruto maandsalaris om naar je bruto uurloon op basis van je wekelijkse arbeidsduur.',
    metaDescription: 'Bereken je bruto uurloon vanuit je maandsalaris. Nauwkeurige omrekening via de officiële jaaruren-methode voor 40, 36, 32 en 24 uur per week.',
    icon: 'coins',
    popular: true,
    relatedSlugs: ['weekloon-berekenen', 'uurloon-naar-maandloon-berekenen', 'uurloon-berekenen', 'parttime-salaris-berekenen']
  },
  {
    id: 'werkuren-per-jaar',
    slug: 'werkuren-per-jaar-berekenen',
    title: 'Werkuren per jaar berekenen',
    shortTitle: 'Werkuren per jaar',
    category: 'werkuren',
    categoryTitle: 'Werkuren & vakantie',
    description: 'Bereken je totale contractuele en daadwerkelijk gewerkte uren per jaar na aftrek van vakantiedagen, feestdagen en ADV.',
    metaDescription: 'Bereken eenvoudig het aantal werkuren per jaar. Zie direct het verschil tussen contracturen en feitelijk gewerkte uren na vakantie en feestdagen.',
    icon: 'clock',
    popular: true,
    relatedSlugs: ['werkdagen-berekenen', 'vakantie-uren-berekenen', 'vakantiedagen-berekenen', 'uurloon-berekenen']
  },
  {
    id: 'woon-werk-kosten',
    slug: 'woon-werk-kosten-berekenen',
    title: 'Woon-werk kosten berekenen',
    shortTitle: 'Woon-werk kosten',
    category: 'vergoedingen',
    categoryTitle: 'Reiskosten & vergoedingen',
    description: 'Bereken eenvoudig de werkelijke kosten van je woon-werkverkeer per maand en jaar. Inclusief brandstofverbruik, parkeerkosten en vergelijking met reiskostenvergoeding.',
    metaDescription: 'Bereken direct je werkelijke kosten voor woon-werkverkeer per maand en jaar. Inclusief brandstofverbruik, parkeerkosten en vergelijking met € 0,23/km vergoeding.',
    icon: 'car',
    popular: true,
    relatedSlugs: ['kilometervergoeding-berekenen', 'reiskostenvergoeding-berekenen', 'thuiswerkvergoeding-berekenen']
  },
  {
    id: 'kilometervergoeding',
    slug: 'kilometervergoeding-berekenen',
    title: 'Kilometervergoeding berekenen',
    shortTitle: 'Kilometervergoeding',
    category: 'vergoedingen',
    categoryTitle: 'Reiskosten & vergoedingen',
    description: 'Bereken direct je kilometervergoeding per enkele reis, retour, week, maand en jaar op basis van je kilometers en vergoedingstarief.',
    metaDescription: 'Bereken eenvoudig je kilometervergoeding per dag, week, maand en jaar. Pas direct je kilometertarief aan en zie welk deel onbelast is (€ 0,23/km).',
    icon: 'car',
    popular: true,
    relatedSlugs: ['reiskostenvergoeding-berekenen', 'woon-werk-kosten-berekenen', 'thuiswerkvergoeding-berekenen', 'werkdagen-berekenen']
  },
  {
    id: 'weekloon',
    slug: 'weekloon-berekenen',
    title: 'Weekloon berekenen',
    shortTitle: 'Weekloon',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Bereken eenvoudig je bruto weekloon vanuit je uurloon of maandsalaris, inclusief 4-wekenloon, maandsalaris en jaarsalaris.',
    metaDescription: 'Bereken direct je bruto weekloon vanuit je uurloon of maandloon. Nauwkeurige omrekening via de 52-weken norm voor fulltime en parttime contracten.',
    icon: 'coins',
    popular: true,
    relatedSlugs: ['uurloon-berekenen', 'uurloon-naar-maandloon-berekenen', 'maandloon-naar-uurloon-berekenen', 'parttime-salaris-berekenen']
  },
  {
    id: 'fte',
    slug: 'fte-berekenen',
    title: 'FTE berekenen',
    shortTitle: 'FTE',
    category: 'werkuren',
    categoryTitle: 'Werkuren & vakantie',
    description: 'Bereken eenvoudig je FTE (Fulltime Equivalent) en deeltijdpercentage op basis van je gewerkte contracturen en de fulltime norm van je werkgever of CAO (bijv. 36, 38 of 40 uur).',
    metaDescription: 'Bereken direct je FTE en deeltijdpercentage op basis van je wekelijkse uren en de fulltime norm (36, 38 of 40 uur). Eenvoudig, nauwkeurig en snel.',
    icon: 'pie-chart',
    popular: true,
    relatedSlugs: ['parttime-salaris-berekenen', 'werkuren-per-jaar-berekenen', 'uurloon-berekenen', 'maandloon-naar-uurloon-berekenen']
  },
  {
    id: 'werkgeverslasten',
    slug: 'werkgeverslasten-berekenen',
    title: 'Werkgeverslasten berekenen',
    shortTitle: 'Werkgeverslasten',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Bereken direct de totale werkgeverslasten en werkgeverskosten per maand en per jaar op basis van de officiële premies en regels voor 2026.',
    metaDescription: 'Bereken direct de totale werkgeverslasten en loonkosten in 2026. Inclusief AWf, Aof, Whk, Zvw en het wettelijk maximum premieloon van € 79.409.',
    icon: 'coins',
    popular: true,
    relatedSlugs: ['parttime-salaris-berekenen', 'fte-berekenen', 'salarisverhoging-berekenen', 'uurloon-naar-maandloon-berekenen']
  },
  {
    id: 'dertiende-maand',
    slug: '13e-maand-berekenen',
    title: '13e maand berekenen',
    shortTitle: '13e Maand',
    category: 'salaris',
    categoryTitle: 'Salaris & loon',
    description: 'Bereken direct je bruto 13e maand of eindejaarsuitkering, inclusief pro-rata opbouw bij een deel van het jaar gewerkt of parttime dienstverband.',
    metaDescription: 'Bereken direct je bruto 13e maand of eindejaarsuitkering. Inclusief pro-rata berekening bij tussentijdse in- of uitdiensttreding en handige rekenvoorbeelden.',
    icon: 'coins',
    popular: true,
    relatedSlugs: ['vakantiegeld-berekenen', 'salarisverhoging-berekenen', 'parttime-salaris-berekenen', 'maandloon-naar-uurloon-berekenen']
  }
];

export function getCalculatorBySlug(slug: string): CalculatorMeta | undefined {
  return CALCULATORS.find(c => c.slug === slug);
}

export function getRelatedCalculators(slug: string): CalculatorMeta[] {
  const current = getCalculatorBySlug(slug);
  if (!current) return [];
  return current.relatedSlugs
    .map(s => getCalculatorBySlug(s))
    .filter((c): c is CalculatorMeta => Boolean(c));
}
