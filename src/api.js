import { normalizeName } from "./filterCharacters.mjs";

async function requestJson(path, signal) {
  const response = await fetch(path, { signal });
  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error("เซิร์ฟเวอร์ส่งข้อมูลที่อ่านไม่ได้");
  }

  if (!response.ok) {
    throw new Error(payload.error || `เซิร์ฟเวอร์ตอบกลับด้วยสถานะ ${response.status}`);
  }

  return payload;
}

export async function fetchPeople({ signal } = {}) {
  return requestJson("/api/people", signal);
}

export async function fetchFilms({ signal } = {}) {
  return requestJson("/api/films", signal);
}

export async function fetchStarship(id, { signal } = {}) {
  return requestJson(`/api/starships/${encodeURIComponent(id)}`, signal);
}

export async function fetchRelatedResource(swapiUrl, { signal } = {}) {
  let url;
  try {
    url = new URL(swapiUrl);
  } catch {
    throw new Error("ลิงก์ข้อมูลที่ได้รับไม่ถูกต้อง");
  }

  const match = url.pathname.match(/^\/api\/(species|planets)\/([1-9]\d*)\/?$/);
  if (url.hostname !== "swapi.dev" || !match) {
    throw new Error("ไม่รองรับลิงก์ข้อมูลที่ได้รับจาก SWAPI");
  }

  return requestJson(`/api/${match[1]}/${match[2]}`, signal);
}

export async function fetchCharacterImages() {
  const response = await fetch("https://akabab.github.io/starwars-api/api/all.json");
  if (!response.ok) {
    throw new Error(`แหล่งรูปภาพตอบกลับด้วยสถานะ ${response.status}`);
  }

  const characters = await response.json();
  return new Map(
    characters
      .filter((character) => character.name && character.image?.startsWith("https://"))
      .map((character) => [normalizeName(character.name), character.image]),
  );
}

export function resourceId(resourceUrl, resource) {
  const allowedResources = new Set(["people", "films", "starships", "species", "planets"]);
  if (!allowedResources.has(resource)) return null;
  const match = resourceUrl.match(/\/api\/([a-z]+)\/([1-9]\d*)\/?$/);
  return match?.[1] === resource ? match[2] : null;
}
