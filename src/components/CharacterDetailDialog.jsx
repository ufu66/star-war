import { useEffect, useRef, useState } from "react";
import { fetchRelatedResource } from "../api.js";
import LoadingState from "./LoadingState.jsx";

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
      {character.image && !imageFailed ? (
        <img
          className="character-image"
          src={character.image}
          alt={`ภาพ ${character.name}`}
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="image-fallback" aria-hidden="true">
          {initials}
        </span>
      )}
    </>
  );
}

export default function CharacterDetailDialog({ character, onClose }) {
  const dialogRef = useRef(null);
  const [details, setDetails] = useState({ status: "idle", species: "", planet: "" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!character) {
      if (dialog?.open) dialog.close();
      return undefined;
    }

    if (!dialog.open) dialog.showModal();
    const controller = new AbortController();
    setDetails({ status: "loading", species: "", planet: "" });

    Promise.all([
      character.species[0]
        ? fetchRelatedResource(character.species[0], { signal: controller.signal })
        : Promise.resolve(null),
      character.homeworld
        ? fetchRelatedResource(character.homeworld, { signal: controller.signal })
        : Promise.resolve(null),
    ])
      .then(([species, planet]) => {
        setDetails({
          status: "success",
          species: species?.name ?? "ไม่ทราบ",
          planet: planet?.name ?? "ไม่ทราบ",
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setDetails({ status: "error", species: "", planet: "" });
        }
      });

    return () => {
      controller.abort();
      if (dialog.open) dialog.close();
    };
  }, [character]);

  return (
    <dialog
      ref={dialogRef}
      id="detailModal"
      className="detail-dialog"
      aria-labelledby="detailName"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {character && (
        <>
          <div className="dialog-topline">
            <span>
              PERSONNEL RECORD <span>/</span> DETAIL
            </span>
            <button
              className="dialog-close"
              type="button"
              onClick={onClose}
              aria-label="ปิดรายละเอียด"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="dialog-content">
            <div className="character-image-frame detail-image-frame">
              <CharacterPortrait character={character} />
            </div>
            <div className="dialog-information">
              <p className="eyebrow">GALACTIC ARCHIVE</p>
              <h2 id="detailName">{character.name}</h2>
              {details.status === "loading" && (
                <LoadingState compact message="กำลังโหลดข้อมูลเพิ่มเติม..." />
              )}
              {details.status === "error" && (
                <p className="detail-error" role="alert">
                  โหลดข้อมูลสายพันธุ์และดาวบ้านเกิดไม่สำเร็จ
                </p>
              )}
              <div className="detail-facts">
                {details.status === "success" && (
                  <>
                    <p>สายพันธุ์: {details.species}</p>
                    <p>ดาวบ้านเกิด: {details.planet}</p>
                  </>
                )}
                <p>เพศ: {character.gender}</p>
                <p>ปีเกิด: {character.birth_year}</p>
                <p>สีผิว: {character.skin_color}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
