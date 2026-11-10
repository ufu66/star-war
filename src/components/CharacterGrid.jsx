import CharacterCard from "./CharacterCard.jsx";
import LoadingState from "./LoadingState.jsx";

export default function CharacterGrid({
  status,
  error,
  characters,
  likedIds,
  onRetry,
  onToggleLike,
  onShowDetail,
}) {
  if (status === "loading") {
    return (
      <section className="characters" aria-label="รายชื่อตัวละคร" aria-busy="true">
        <LoadingState message="กำลังโหลดข้อมูลตัวละคร..." />
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="characters" aria-label="รายชื่อตัวละคร">
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button type="button" className="retry-button" onClick={onRetry}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      </section>
    );
  }

  if (characters.length === 0) {
    return (
      <section className="characters" aria-label="รายชื่อตัวละคร">
        <p className="empty-state" role="status">
          ไม่พบตัวละครที่ตรงกับเงื่อนไข
        </p>
      </section>
    );
  }

  return (
    <section className="characters" aria-label="รายชื่อตัวละคร">
      {characters.map((character) => {
        const id =
          character.url.match(/\/people\/(\d+)\/?$/)?.[1] ?? character.url;
        return (
          <CharacterCard
            key={character.url}
            character={character}
            liked={likedIds.has(id)}
            onToggleLike={onToggleLike}
            onShowDetail={onShowDetail}
          />
        );
      })}
    </section>
  );
}
