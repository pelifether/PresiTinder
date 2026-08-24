/** Resolve a public asset against the deploy base (the site lives on a subpath). */
export const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
