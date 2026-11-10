import { useState } from "react";

function CharacterPortrait({ character }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = character.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {character.image && !imageFailed && (
        <img
          className="character-image"
          src={character.image}
          alt={`ภาพ ${character.name}`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      )}
      {(!character.image || imageFailed) && (
        <span className="image-fallback" aria-hidden="true">
          {initials}
        </span>
      )}
    </>
  );
}

export default function CharacterCard({
  character,
  liked,
  onToggleLike,
  onShowDetail,
}) {
  const id = character.url.match(/\/people\/(\d+)\/?$/)?.[1] ?? character.url;
  const displayId = String(id).padStart(3, "0");

  return (
    <article className="card">
      <div className="character-image-frame">
        <CharacterPortrait character={character} />
        <button
          type="button"
          className={`like-button${liked ? " liked" : ""}`}
          aria-label={`${liked ? "เลิกถูกใจ" : "เพิ่มในรายการถูกใจ"} ${character.name}`}
          aria-pressed={liked}
          title={`${liked ? "เลิกถูกใจ" : "เพิ่มในรายการถูกใจ"} ${character.name}`}
          onClick={() => onToggleLike(id)}
        >
          <span className="heart-icon" aria-hidden="true">
            {liked ? "♥" : "♡"}
          </span>
        </button>
      </div>
      <div className="card-body">
        <p className="record-id">
          PERSONNEL <span>/</span> {displayId}
        </p>
        <h2>{character.name}</h2>
        <div className="card-meta">
          <span>
            <small>ปีเกิด</small>
            {character.birth_year}
          </span>
          <span>
            <small>เพศ</small>
            {character.gender}
          </span>
        </div>
        <button
          className="detail-button"
          type="button"
          aria-label={`เปิดรายละเอียด ${character.name}`}
          onClick={() => onShowDetail(character)}
        >
          <span>เปิดแฟ้มประวัติ</span>
          <span className="detail-arrow" aria-hidden="true">
            ↗
          </span>
        </button>
      </div>
    </article>
  );
}
