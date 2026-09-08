// Avant V2.1, Testimonials et AgentCard redéfinissaient chacun leur propre
// version de cette fonction, avec un résultat différent pour les noms
// composés (ex. "Jean Dupont" → "JE" côté Testimonials, "JD" côté
// AgentCard). Version canonique : initiale de chacun des deux premiers mots.
export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
