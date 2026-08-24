export interface Candidate {
  slug: string;
  name: string;
  fullName: string;
  party: string;
  number: number;
  color: string;
  planTitle?: string;
}

export const CANDIDATES: Candidate[] = [
  {
    slug: "lula",
    name: "Lula",
    fullName: "Luiz Inácio Lula da Silva",
    party: "PT",
    number: 13,
    color: "#D6352C",
  },
  {
    slug: "flavio-bolsonaro",
    name: "Flávio Bolsonaro",
    fullName: "Flávio Nantes Bolsonaro",
    party: "PL",
    number: 22,
    color: "#1B3F8F",
  },
  {
    slug: "ronaldo-caiado",
    name: "Ronaldo Caiado",
    fullName: "Ronaldo Ramos Caiado",
    party: "PSD",
    number: 55,
    color: "#2F6FB7",
  },
  {
    slug: "zema",
    name: "Zema",
    fullName: "Romeu Zema Neto",
    party: "NOVO",
    number: 30,
    color: "#F26522",
  },
  {
    slug: "renan-santos",
    name: "Renan Santos",
    fullName: "Renan Antônio Ferreira dos Santos",
    party: "MISSÃO",
    number: 14,
    color: "#D9A404",
  },
  {
    slug: "augusto-cury",
    name: "Augusto Cury",
    fullName: "Augusto Jorge Cury",
    party: "AVANTE",
    number: 70,
    color: "#E87722",
  },
  {
    slug: "edmilson-costa",
    name: "Edmilson Costa",
    fullName: "Edmilson Silva Costa",
    party: "PCB",
    number: 21,
    color: "#A93226",
  },
  {
    slug: "hertz-dias",
    name: "Hertz Dias",
    fullName: "Hertz da Conceição Dias",
    party: "PSTU",
    number: 16,
    color: "#8E1E1E",
  },
  {
    slug: "rui-costa-pimenta",
    name: "Rui Costa Pimenta",
    fullName: "Rui Costa Pimenta",
    party: "PCO",
    number: 29,
    color: "#6E1414",
  },
  {
    slug: "samara",
    name: "Samara",
    fullName: "Samara Martins da Silva Feitosa",
    party: "UP",
    number: 80,
    color: "#B03052",
  },
  {
    slug: "clariana-barao",
    name: "Clariana Barão",
    fullName: "Clariana Zacarkim Barão",
    party: "DC",
    number: 27,
    color: "#1F7A5C",
  },
  {
    slug: "wilson-grassi",
    name: "Wilson Grassi",
    fullName: "Wilson Grassi Junior",
    party: "DEMOCRATA",
    number: 35,
    color: "#145C9E",
  },
];

export const bySlug = Object.fromEntries(CANDIDATES.map((c) => [c.slug, c]));
