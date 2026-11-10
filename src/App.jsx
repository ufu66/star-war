import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCharacterImages,
  fetchFilms,
  fetchPeople,
} from "./api.js";
import { filterCharacters, normalizeName } from "./filterCharacters.mjs";
import CharacterDetailDialog from "./components/CharacterDetailDialog.jsx";
import CharacterGrid from "./components/CharacterGrid.jsx";
import CharacterToolbar from "./components/CharacterToolbar.jsx";
import FilmExplorer from "./components/FilmExplorer.jsx";
import StarshipDialog from "./components/StarshipDialog.jsx";

const FAVORITES_KEY = "swapi-liked-people";

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export default function App() {
  const [peopleState, setPeopleState] = useState({ status: "loading", data: [], error: "" });
  const [filmState, setFilmState] = useState({ status: "loading", data: [], error: "" });
  const [filmUrl, setFilmUrl] = useState("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [sort, setSort] = useState("");
  const [likedIds, setLikedIds] = useState(loadFavorites);
  const [favoriteSaveError, setFavoriteSaveError] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [starshipFilm, setStarshipFilm] = useState(null);

  const selectedFilm = filmState.data.find((film) => film.url === filmUrl) ?? null;
  const filmCharacterUrls = useMemo(
    () => (selectedFilm ? new Set(selectedFilm.characters) : null),
    [selectedFilm],
  );

  const loadPeople = useCallback(async (signal) => {
    setPeopleState((current) => ({
      ...current,
      status: current.data.length ? "success" : "loading",
      error: "",
    }));

    try {
      const [peoplePayload, imageMap] = await Promise.all([
        fetchPeople({ signal }),
        fetchCharacterImages().catch(() => new Map()),
      ]);
      if (signal?.aborted) return;
      const people = peoplePayload.results.map((person) => ({
        ...person,
        image: imageMap.get(normalizeName(person.name)) ?? "",
      }));
      setPeopleState({ status: "success", data: people, error: "" });
    } catch (error) {
      if (error.name !== "AbortError") {
        setPeopleState((current) => ({
          ...current,
          status: "error",
          error: error.message,
        }));
      }
    }
  }, []);

  const loadFilms = useCallback(async (signal) => {
    setFilmState((current) => ({
      ...current,
      status: current.data.length ? "success" : "loading",
      error: "",
    }));

    try {
      const payload = await fetchFilms({ signal });
      if (signal?.aborted) return;
      const films = [...payload.results].sort(
        (first, second) => first.episode_id - second.episode_id,
      );
      setFilmState({
        status: films.length ? "success" : "empty",
        data: films,
        error: "",
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        setFilmState((current) => ({
          ...current,
          status: "error",
          error: `โหลดข้อมูลภาพยนตร์ไม่สำเร็จ: ${error.message}`,
        }));
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadPeople(controller.signal);
    loadFilms(controller.signal);
    return () => controller.abort();
  }, [loadFilms, loadPeople]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...likedIds]));
      setFavoriteSaveError("");
    } catch {
      setFavoriteSaveError("บันทึกรายการถูกใจในเบราว์เซอร์ไม่สำเร็จ");
    }
  }, [likedIds]);

  const visibleCharacters = useMemo(() => {
    return filterCharacters({
      characters: peopleState.data,
      filmCharacterUrls,
      likedIds,
      viewMode,
      query,
      sort,
    });
  }, [filmCharacterUrls, likedIds, peopleState.data, query, sort, viewMode]);

  function changeFilm(value) {
    setFilmUrl(value);
    setQuery("");
    setViewMode("all");
    setStarshipFilm(null);
  }

  function toggleLike(id) {
    setLikedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="app-shell">
      <main>
        <section className="page-heading" aria-labelledby="pageTitle">
          <div>
            <h1 id="pageTitle">
              <img className="brand-title-logo" src="/Star_wars_logo.gif" alt="Star Wars" />
            </h1>
          </div>
          <div className="results-summary">
            <p id="resultCount" role="status" aria-live="polite">
              {peopleState.status === "success"
                ? `พบ ${visibleCharacters.length} ตัวละคร`
                : peopleState.status === "error"
                  ? "โหลดข้อมูลไม่สำเร็จ"
                  : "กำลังโหลดข้อมูล..."}
            </p>
          </div>
        </section>

        <FilmExplorer
          films={filmState.data}
          selectedFilm={selectedFilm}
          onFilmChange={changeFilm}
          status={filmState.status}
          error={filmState.error}
          onRetry={() => {
            const controller = new AbortController();
            loadFilms(controller.signal);
          }}
          onShowStarships={setStarshipFilm}
        />

        <CharacterToolbar
          query={query}
          onQueryChange={setQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sort={sort}
          onSortChange={setSort}
        />

        {(peopleState.error && peopleState.status === "success" || favoriteSaveError) && (
          <p className="inline-error" role="alert">
            {favoriteSaveError || peopleState.error}
          </p>
        )}
        <CharacterGrid
          status={peopleState.status}
          error={peopleState.error}
          characters={visibleCharacters}
          likedIds={likedIds}
          onRetry={() => loadPeople()}
          onToggleLike={toggleLike}
          onShowDetail={setSelectedCharacter}
        />
      </main>

      <CharacterDetailDialog
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
      />
      <StarshipDialog
        film={starshipFilm}
        onClose={() => setStarshipFilm(null)}
      />
    </div>
  );
}
