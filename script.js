const PEOPLE_API_URL = "https://swapi.dev/api/people/";
const CHARACTER_IMAGES_API_URL = "https://akabab.github.io/starwars-api/api/all.json";
const LIKED_STORAGE_KEY = "swapi-liked-people";

const characterList = document.getElementById("characterList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const resultCount = document.getElementById("resultCount");
const detailModal = document.getElementById("detailModal");
const allViewButton = document.getElementById("allViewButton");
const likedViewButton = document.getElementById("likedViewButton");

let allCharacters = [];
let displayedCharacters = [];
let viewMode = "all";
let detailRequestId = 0;
let likedCharacterIds = loadLikedCharacters();

function loadLikedCharacters() {
    try {
        return new Set(JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) || "[]"));
    } catch {
        return new Set();
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function characterId(character) {
    return character.url.match(/\/people\/(\d+)\/?$/)?.[1] ?? character.url;
}

function normalizeCharacterName(name) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function fetchCharacterImages() {
    try {
        const response = await fetch(CHARACTER_IMAGES_API_URL);
        if (!response.ok) return new Map();

        const characters = await response.json();
        return new Map(characters
            .filter((character) => character.name && character.image?.startsWith("https://"))
            .map((character) => [normalizeCharacterName(character.name), character.image]));
    } catch {
        return new Map();
    }
}

function renderCharacterImage(character) {
    const initials = escapeHtml(character.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase());
    const image = character.image
        ? `<img class="character-image" src="${escapeHtml(character.image)}" alt="ภาพ ${escapeHtml(character.name)}" loading="lazy" decoding="async">`
        : "";

    return `${image}<span class="image-fallback" ${image ? "hidden" : ""} aria-hidden="true">${initials}</span>`;
}

function renderLikeButton(character) {
    const id = escapeHtml(characterId(character));
    const liked = likedCharacterIds.has(characterId(character));
    const label = `${liked ? "เลิกถูกใจ" : "เพิ่มในรายการถูกใจ"} ${escapeHtml(character.name)}`;

    return `
        <button type="button" data-action="like" data-id="${id}" class="like-button ${liked ? "liked" : ""}" aria-label="${label}" aria-pressed="${liked}" title="${label}">
            <span class="heart-icon" aria-hidden="true">${liked ? "♥" : "♡"}</span>
        </button>
    `;
}

function enableImageFallbacks(container) {
    container.querySelectorAll(".character-image").forEach((image) => {
        image.addEventListener("error", () => {
            image.hidden = true;
            image.nextElementSibling.hidden = false;
        }, { once: true });
    });
}

async function fetchPeople() {
    characterList.innerHTML = "<p>กำลังโหลดข้อมูลตัวละคร...</p>";

    try {
        const people = [];
        let nextPage = PEOPLE_API_URL;
        const imagesPromise = fetchCharacterImages();

        while (nextPage) {
            const response = await fetch(nextPage);
            if (!response.ok) {
                throw new Error(`SWAPI ตอบกลับด้วยสถานะ ${response.status}`);
            }

            const data = await response.json();
            people.push(...data.results);
            nextPage = data.next;
        }

        const imagesByName = await imagesPromise;
        allCharacters = people.map((character) => ({
            ...character,
            image: imagesByName.get(normalizeCharacterName(character.name)) ?? ""
        }));
        renderCurrentView();
    } catch (error) {
        resultCount.textContent = "";
        characterList.innerHTML = `<p role="alert">โหลดข้อมูลไม่สำเร็จ: ${escapeHtml(error.message)}</p>`;
    }
}

function getCurrentCharacters() {
    if (viewMode === "liked") {
        return allCharacters.filter((character) => likedCharacterIds.has(characterId(character)));
    }

    if (viewMode === "search") {
        const query = searchInput.value.trim().toLocaleLowerCase();
        return allCharacters.filter((character) => character.name.toLocaleLowerCase().includes(query));
    }

    return [...allCharacters];
}

function sortCharacters() {
    const characters = getCurrentCharacters();
    const direction = sortSelect.value;

    if (direction === "name") {
        characters.sort((first, second) => first.name.localeCompare(second.name));
    } else if (direction === "ageAsc" || direction === "ageDesc") {
        const multiplier = direction === "ageAsc" ? 1 : -1;
        characters.sort((first, second) => {
            const firstYear = Number.parseFloat(first.birth_year);
            const secondYear = Number.parseFloat(second.birth_year);
            const firstKnown = Number.isFinite(firstYear);
            const secondKnown = Number.isFinite(secondYear);

            if (!firstKnown || !secondKnown) {
                return Number(secondKnown) - Number(firstKnown);
            }

            return (firstYear - secondYear) * multiplier;
        });
    }

    displayedCharacters = characters;
    renderCharacters();
}

function renderCharacters() {
    resultCount.textContent = `พบ ${displayedCharacters.length} ตัวละคร`;

    if (displayedCharacters.length === 0) {
        characterList.innerHTML = "<p class=\"empty-state\">ไม่พบตัวละคร</p>";
        return;
    }

    characterList.innerHTML = displayedCharacters.map((character) => {
        const id = escapeHtml(characterId(character));
        const displayId = escapeHtml(String(characterId(character)).padStart(3, "0"));
        return `
            <article class="card">
                <div class="character-image-frame">
                    ${renderCharacterImage(character)}
                    ${renderLikeButton(character)}
                </div>
                <div class="card-body">
                    <p class="record-id">PERSONNEL <span>/</span> ${displayId}</p>
                    <h2>${escapeHtml(character.name)}</h2>
                    <div class="card-meta">
                        <span><small>ปีเกิด</small>${escapeHtml(character.birth_year)}</span>
                        <span><small>เพศ</small>${escapeHtml(character.gender)}</span>
                    </div>
                    <button class="detail-button" type="button" data-action="detail" data-id="${id}" aria-label="เปิดรายละเอียด ${escapeHtml(character.name)}">
                        <span>เปิดแฟ้มประวัติ</span>
                        <span class="detail-arrow" aria-hidden="true">↗</span>
                    </button>
                </div>
            </article>
        `;
    }).join("");
    enableImageFallbacks(characterList);
}

function updateViewButtons() {
    const showingLiked = viewMode === "liked";
    allViewButton.setAttribute("aria-pressed", String(!showingLiked));
    likedViewButton.setAttribute("aria-pressed", String(showingLiked));
}

function searchCharacter(event) {
    event?.preventDefault();
    viewMode = searchInput.value.trim() ? "search" : "all";
    renderCurrentView();
}

function showAll() {
    viewMode = "all";
    searchInput.value = "";
    renderCurrentView();
}

function showLiked() {
    viewMode = "liked";
    renderCurrentView();
}

function renderCurrentView() {
    updateViewButtons();
    displayedCharacters = getCurrentCharacters();
    sortCharacters();
}

function toggleLike(id) {
    if (likedCharacterIds.has(id)) {
        likedCharacterIds.delete(id);
    } else {
        likedCharacterIds.add(id);
    }

    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...likedCharacterIds]));
    renderCurrentView();
}

async function fetchRelatedName(urls) {
    if (!urls?.length) {
        return "ไม่ทราบ";
    }

    const names = await Promise.all(urls.map(async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            return data.name;
        } catch {
            return null;
        }
    }));

    return names.filter(Boolean).join(", ") || "ไม่ทราบ";
}

async function showCharacterDetail(id) {
    const character = allCharacters.find((item) => characterId(item) === id);
    if (!character) return;

    const requestId = ++detailRequestId;
    const detailImage = document.getElementById("detailImage");
    detailImage.innerHTML = renderCharacterImage(character);
    enableImageFallbacks(detailImage);
    document.getElementById("detailName").textContent = character.name;
    document.getElementById("detailSpecies").textContent = "สายพันธุ์: กำลังโหลด...";
    document.getElementById("detailGender").textContent = `เพศ: ${character.gender}`;
    document.getElementById("detailAge").textContent = `ปีเกิด: ${character.birth_year}`;
    document.getElementById("detailSkin").textContent = `สีผิว: ${character.skin_color}`;
    document.getElementById("detailPlanet").textContent = "ดาวบ้านเกิด: กำลังโหลด...";
    detailModal.showModal();

    const [species, homeworld] = await Promise.all([
        fetchRelatedName(character.species),
        fetchRelatedName(character.homeworld ? [character.homeworld] : [])
    ]);

    if (requestId !== detailRequestId) return;
    document.getElementById("detailSpecies").textContent = `สายพันธุ์: ${species}`;
    document.getElementById("detailPlanet").textContent = `ดาวบ้านเกิด: ${homeworld}`;
}

function closeDetail() {
    detailRequestId++;
    if (detailModal.open) {
        detailModal.close();
    }
}

detailModal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDetail();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailModal.open) {
        event.preventDefault();
        closeDetail();
    }
});

detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) {
        closeDetail();
    }
});

characterList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "like") {
        toggleLike(button.dataset.id);
    } else if (button.dataset.action === "detail") {
        showCharacterDetail(button.dataset.id);
    }
});

window.searchCharacter = searchCharacter;
window.showAll = showAll;
window.showLiked = showLiked;
window.sortCharacters = sortCharacters;
window.closeDetail = closeDetail;

fetchPeople();