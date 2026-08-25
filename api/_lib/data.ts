/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by scripts/genapidata.mjs from src/data/candidates.ts and
 * src/data/quiz.ts. Regenerate with `npm run gen:api`; `npm run check:api`
 * fails if this has drifted from the app's own data.
 *
 * `x` and `y` are the plan's position on the political compass, −1…+1, with
 * +y meaning conservative. Deliberately precomputed: the functions need the
 * coordinates, not the eight-dimension scoring model that produces them.
 */
export interface ApiCandidate {
  slug: string;
  name: string;
  party: string;
  number: number;
  color: string;
  x: number;
  y: number;
}

export const CANDIDATES: ApiCandidate[] = [
  { slug: "lula", name: "Lula", party: "PT", number: 13, color: "#D6352C", x: -0.541667, y: -0.275 },
  { slug: "flavio-bolsonaro", name: "Flávio Bolsonaro", party: "PL", number: 22, color: "#1B3F8F", x: 0.583333, y: 0.625 },
  { slug: "ronaldo-caiado", name: "Ronaldo Caiado", party: "PSD", number: 55, color: "#2F6FB7", x: 0.583333, y: 0.3 },
  { slug: "zema", name: "Zema", party: "NOVO", number: 30, color: "#F26522", x: 0.958333, y: 0.625 },
  { slug: "renan-santos", name: "Renan Santos", party: "MISSÃO", number: 14, color: "#D9A404", x: 0.583333, y: 0.55 },
  { slug: "augusto-cury", name: "Augusto Cury", party: "AVANTE", number: 70, color: "#E87722", x: 0.458333, y: 0.225 },
  { slug: "edmilson-costa", name: "Edmilson Costa", party: "PCB", number: 21, color: "#A93226", x: -0.875, y: -0.7 },
  { slug: "hertz-dias", name: "Hertz Dias", party: "PSTU", number: 16, color: "#8E1E1E", x: -0.916667, y: -0.85 },
  { slug: "rui-costa-pimenta", name: "Rui Costa Pimenta", party: "PCO", number: 29, color: "#6E1414", x: -1, y: -0.625 },
  { slug: "samara", name: "Samara", party: "UP", number: 80, color: "#B03052", x: -0.833333, y: -0.775 },
  { slug: "clariana-barao", name: "Clariana Barão", party: "DC", number: 27, color: "#1F7A5C", x: 0.208333, y: 0.2 },
  { slug: "wilson-grassi", name: "Wilson Grassi", party: "DEMOCRATA", number: 35, color: "#145C9E", x: 0.375, y: 0.4 },
];
