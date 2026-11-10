import LoadingState from "./LoadingState.jsx";

export default function FilmExplorer({
  films,
  selectedFilm,
  onFilmChange,
  status,
  error,
  onRetry,
  onShowStarships,
}) {
  return (
    <section className="film-explorer" aria-labelledby="filmsTitle">
      <div className="film-heading">
        <div>
          <p className="eyebrow">GALACTIC ARCHIVE</p>
          <h2 id="filmsTitle">ข้อมูลแยกตามภาค</h2>
        </div>
        <label className="film-select-control" htmlFor="filmSelect">
          <span>เลือกภาค</span>
          <select
            id="filmSelect"
            value={selectedFilm?.url ?? "all"}
            disabled={status === "loading" || status === "error"}
            onChange={(event) => onFilmChange(event.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            {films.map((film) => (
              <option key={film.url} value={film.url}>
                ภาค {film.episode_id}: {film.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="film-description">
        เลือกภาคเพื่อดูตัวละครที่ปรากฏในภาพยนตร์ โดยรายการตัวละครด้านล่างจะแสดงเฉพาะตัวละครในภาคนั้น
      </p>
      {status === "loading" && (
        <div className="film-status" role="status" aria-live="polite">
          <LoadingState compact message="กำลังโหลดข้อมูลภาพยนตร์..." />
        </div>
      )}
      {status === "error" && (
        <div className="film-status" role="alert">
          <p>{error}</p>
          <button type="button" className="retry-button" onClick={onRetry}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      )}
      {status === "empty" && (
        <p className="film-status" role="status">
          ไม่พบข้อมูลภาพยนตร์
        </p>
      )}
      {status === "success" && films.length > 0 && selectedFilm && (
        <div>
          <div className="film-title-row">
            <h3>{selectedFilm.title}</h3>
            <span className="film-episode">EPISODE {selectedFilm.episode_id}</span>
          </div>
          <div className="film-ship-action">
            <p>มียานที่ปรากฏ {selectedFilm.starships.length} ลำ</p>
            <button
              className="search-submit"
              type="button"
              disabled={selectedFilm.starships.length === 0}
              onClick={() => onShowStarships(selectedFilm)}
            >
              ดูข้อมูลยาน
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
