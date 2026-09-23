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
    relatedSlugs: ['parttime-salaris-berekenen', 'overuren-berekenen', 'vakantiegeld-berekenen']
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
    relatedSlugs: ['thuiswerkvergoeding-berekenen', 'werkdagen-berekenen', 'uurloon-berekenen']
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
    description: 'Bereken de bruto uitbetaling van je overuren inclusief CAO-toeslagpercentage (125%, 150% of 200%) of tijd-voor-tijd compensatie.',
    metaDescription: 'Bereken je overurenvergoeding inclusief toeslag (zoals 125%, 150% of 200%). Bereken direct het bruto overwerkbedrag of tijd-voor-tijd uren.',
    icon: 'clock',
    popular: true,
    relatedSlugs: ['uurloon-berekenen', 'parttime-salaris-berekenen', 'werkdagen-berekenen']
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
    relatedSlugs: ['vakantiedagen-berekenen', 'reiskostenvergoeding-berekenen', 'thuiswerkvergoeding-berekenen']
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
    relatedSlugs: ['uurloon-berekenen', 'vakantiedagen-berekenen', 'vakantiegeld-berekenen']
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
