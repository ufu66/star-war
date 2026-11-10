export function normalizeName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function filterCharacters({
  characters,
  filmCharacterUrls,
  likedIds,
  viewMode,
  query,
  sort,
}) {
  const normalizedQuery = normalizeName(query);
  const filtered = [];

  for (const character of characters) {
    const id = character.url.match(/\/people\/(\d+)\/?$/)?.[1] ?? character.url;
    if (viewMode === "liked" && !likedIds.has(id)) continue;
    if (normalizedQuery && !normalizeName(character.name).includes(normalizedQuery)) continue;
    if (filmCharacterUrls && !filmCharacterUrls.has(character.url)) continue;
    filtered.push(character);
  }

  if (sort === "name") {
    filtered.sort((first, second) => first.name.localeCompare(second.name));
  } else if (sort === "ageAsc" || sort === "ageDesc") {
    const multiplier = sort === "ageAsc" ? 1 : -1;
    filtered.sort((first, second) => {
      const firstYear = Number.parseFloat(first.birth_year);
      const secondYear = Number.parseFloat(second.birth_year);
      const firstKnown = Number.isFinite(firstYear);
      const secondKnown = Number.isFinite(secondYear);
      if (!firstKnown || !secondKnown) return Number(secondKnown) - Number(firstKnown);
      return (firstYear - secondYear) * multiplier;
    });
  }

  return filtered;
}
