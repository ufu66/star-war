import { useEffect, useMemo, useRef, useState } from "react";
import { fetchStarship, resourceId } from "../api.js";
import LoadingState from "./LoadingState.jsx";

const SHIP_FACTS = [
  ["รุ่น", "model"],
  ["ผู้ผลิต", "manufacturer"],
  ["ประเภท", "starship_class"],
  ["ความยาว", "length"],
  ["ความเร็วในชั้นบรรยากาศ", "max_atmosphering_speed"],
  ["ลูกเรือ", "crew"],
  ["ผู้โดยสาร", "passengers"],
  ["ความจุสินค้า", "cargo_capacity"],
  ["ระยะเวลาที่เสบียงรองรับ", "consumables"],
  ["ค่า Hyperdrive", "hyperdrive_rating"],
  ["ความเร็ว MGLT", "MGLT"],
  ["ราคา (เครดิต)", "cost_in_credits"],
];

export default function StarshipDialog({ film, onClose }) {
  const dialogRef = useRef(null);
  const [ships, setShips] = useState([]);
  const [selectedShipId, setSelectedShipId] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const shipIds = useMemo(
    () => film?.starships.map((url) => resourceId(url, "starships")) ?? [],
    [film],
  );
  const selectedShip = ships.find((ship) => resourceId(ship.url, "starships") === selectedShipId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!film) {
      if (dialog?.open) dialog.close();
      return undefined;
    }

    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [film]);

  useEffect(() => {
    if (!film) return undefined;
    const controller = new AbortController();
    setShips([]);
    setSelectedShipId("");
    setError("");

    if (shipIds.length === 0) {
      setStatus("empty");
      return () => controller.abort();
    }

    if (shipIds.some((id) => !id)) {
      setError("ลิงก์ข้อมูลยานไม่ถูกต้อง");
      setStatus("error");
      return () => controller.abort();
    }

    setStatus("loading");
    Promise.all(shipIds.map((id) => fetchStarship(id, { signal: controller.signal })))
      .then((results) => {
        setShips(results);
        setSelectedShipId(resourceId(results[0].url, "starships") ?? "");
        setStatus(results.length ? "success" : "empty");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message);
          setStatus("error");
        }
      });

    return () => {
      controller.abort();
    };
  }, [film, retryCount, shipIds]);

  return (
    <dialog
      ref={dialogRef}
      id="shipDetailModal"
      className="ship-detail-dialog"
      aria-labelledby="shipDialogTitle"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {film && (
        <>
          <div className="dialog-topline">
            <span>
              STARSHIP RECORD <span>/</span> DETAIL
            </span>
            <button
              className="dialog-close"
              type="button"
              onClick={onClose}
              aria-label="ปิดข้อมูลยาน"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="ship-dialog-content">
            <p className="eyebrow">GALACTIC ARCHIVE / EPISODE {film.episode_id}</p>
            <h2 id="shipDialogTitle">ข้อมูลยาน</h2>
            {status !== "empty" && (
              <label className="ship-select-control" htmlFor="shipSelect">
                <span>เลือกยาน</span>
                <select
                  id="shipSelect"
                  value={selectedShipId}
                  disabled={status !== "success"}
                  onChange={(event) => setSelectedShipId(event.target.value)}
                >
                  {ships.map((ship) => (
                    <option
                      key={ship.url}
                      value={resourceId(ship.url, "starships")}
                    >
                      {ship.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {status === "loading" && (
              <LoadingState compact message="กำลังโหลดข้อมูลยาน..." />
            )}
            {status === "error" && (
              <div className="ship-status" role="alert">
                <p>โหลดข้อมูลยานไม่สำเร็จ: {error}</p>
                <button
                  type="button"
                  className="retry-button"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  ลองโหลดอีกครั้ง
                </button>
              </div>
            )}
            {status === "empty" && (
              <p className="ship-status" role="status">
                ภาคนี้ไม่มีข้อมูลยาน
              </p>
            )}
            {status === "success" && selectedShip && (
              <dl className="ship-facts">
                <div className="ship-fact-name">
                  <dt>ชื่อยาน</dt>
                  <dd>{selectedShip.name}</dd>
                </div>
                {SHIP_FACTS.map(([label, key]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{selectedShip[key] || "ไม่ทราบ"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}
