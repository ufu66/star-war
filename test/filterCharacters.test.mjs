import test from "node:test";
import assert from "node:assert/strict";
import { filterCharacters } from "../src/filterCharacters.mjs";

const characters = [
  { name: "Luke Skywalker", url: "https://swapi.dev/api/people/1/", birth_year: "19BBY" },
  { name: "C-3PO", url: "https://swapi.dev/api/people/2/", birth_year: "112BBY" },
  { name: "Leia Organa", url: "https://swapi.dev/api/people/5/", birth_year: "19BBY" },
  { name: "Obi-Wan Kenobi", url: "https://swapi.dev/api/people/10/", birth_year: "57BBY" },
];

const defaultOptions = {
  characters,
  filmCharacterUrls: null,
  likedIds: new Set(),
  viewMode: "all",
  query: "",
  sort: "",
};

test("filters characters in a film by URL membership", () => {
  const result = filterCharacters({
    ...defaultOptions,
    filmCharacterUrls: new Set([
      "https://swapi.dev/api/people/1/",
      "https://swapi.dev/api/people/10/",
    ]),
  });

  assert.deepEqual(result.map((person) => person.name), ["Luke Skywalker", "Obi-Wan Kenobi"]);
});

test("combines favorites and case-insensitive search with the film filter", () => {
  const result = filterCharacters({
    ...defaultOptions,
    filmCharacterUrls: new Set([
      "https://swapi.dev/api/people/1/",
      "https://swapi.dev/api/people/5/",
      "https://swapi.dev/api/people/10/",
    ]),
    likedIds: new Set(["1", "5"]),
    viewMode: "liked",
    query: "LEIA",
  });

  assert.deepEqual(result.map((person) => person.name), ["Leia Organa"]);
});

test("sorts known birth years while placing unknown years after them", () => {
  const result = filterCharacters({
    ...defaultOptions,
    characters: [...characters, {
      name: "Unknown",
      url: "https://swapi.dev/api/people/20/",
      birth_year: "unknown",
    }],
    sort: "ageAsc",
  });

  assert.deepEqual(result.map((person) => person.name), [
    "Luke Skywalker",
    "Leia Organa",
    "Obi-Wan Kenobi",
    "C-3PO",
    "Unknown",
  ]);
});
