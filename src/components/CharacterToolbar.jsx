export default function CharacterToolbar({
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
}) {
  return (
    <section className="toolbar" aria-label="ค้นหาและจัดเรียงตัวละคร">
      <form className="search-form" onSubmit={(event) => event.preventDefault()}>
        <label className="search-field" htmlFor="searchInput">
          <span className="search-icon" aria-hidden="true" />
          <input
            type="search"
            id="searchInput"
            placeholder="ค้นหาชื่อตัวละคร..."
            autoComplete="off"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <button className="search-submit" type="submit">
          <span className="search-submit-icon" aria-hidden="true" />
          <span>ค้นหา</span>
        </button>
      </form>

      <div className="view-switch" role="group" aria-label="เลือกมุมมองตัวละคร">
        <button
          className="view-button"
          type="button"
          aria-pressed={viewMode === "all"}
          onClick={() => onViewModeChange("all")}
        >
          <span className="view-symbol" aria-hidden="true">
            ◈
          </span>
          <span>ทั้งหมด</span>
        </button>
        <button
          className="view-button"
          type="button"
          aria-pressed={viewMode === "liked"}
          onClick={() => onViewModeChange("liked")}
        >
          <span className="view-heart" aria-hidden="true">
            ♥
          </span>
          <span>ถูกใจ</span>
        </button>
      </div>

      <label className="sort-control" htmlFor="sortSelect">
        <span>เรียงตาม</span>
        <select
          id="sortSelect"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="">ค่าเริ่มต้น</option>
          <option value="name">ชื่อ A-Z</option>
          <option value="ageAsc">ปีเกิด น้อย → มาก</option>
          <option value="ageDesc">ปีเกิด มาก → น้อย</option>
        </select>
      </label>
    </section>
  );
}
