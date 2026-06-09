const slideIds = ["board", "free", "poster", "upcoming"];
const rotationMs = 24000;
let activeIndex = 0;
let rotate = true;
let timer;
let fullSchedule = [];
let freeMatches = [];

const dateFormat = new Intl.DateTimeFormat("en-SG", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Singapore",
});

const clockFormat = new Intl.DateTimeFormat("en-SG", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Singapore",
});

function sgtDate(date, time) {
  return new Date(`${date}T${time}:00+08:00`);
}

function byStart(a, b) {
  return a.startsAt - b.startsAt;
}

function normalizeFixture(value) {
  return value
    .toLowerCase()
    .replaceAll("south korea", "korea")
    .replaceAll("korea republic", "korea")
    .replaceAll("czech republic", "czech")
    .replaceAll("czechia", "czech")
    .replaceAll("republic", "")
    .replaceAll("bosnia and herzegovina", "bosnia-herzegovina")
    .replaceAll("bosnia & herzegovina", "bosnia-herzegovina")
    .replaceAll("cote d'ivoire", "ivory coast")
    .replaceAll("dr congo", "congo dr")
    .replaceAll("cabo verde", "cape verde")
    .replace(/\bv\b/g, "vs")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isFreeMatch(match) {
  const normalized = normalizeFixture(match.fixture ?? match.match);
  const startTime = match.startsAt?.getTime();
  return freeMatches.some((freeMatch) => (
    normalizeFixture(freeMatch.match) === normalized ||
    (startTime && freeMatch.startsAt.getTime() === startTime)
  ));
}

function getUpcoming(items, now = new Date()) {
  return items.filter((item) => item.startsAt > now).sort(byStart);
}

function showSlide(id) {
  activeIndex = slideIds.indexOf(id);
  if (activeIndex < 0) activeIndex = 0;

  document.querySelectorAll(".slide").forEach((slide) => {
    slide.classList.toggle("active", slide.dataset.slide === slideIds[activeIndex]);
  });

  document.querySelectorAll("[data-slide-link]").forEach((button) => {
    button.classList.toggle("active", button.dataset.slideLink === slideIds[activeIndex]);
  });
}

function startRotation() {
  clearInterval(timer);
  if (!rotate) return;
  timer = setInterval(() => {
    activeIndex = (activeIndex + 1) % slideIds.length;
    showSlide(slideIds[activeIndex]);
  }, rotationMs);
}

function renderClock() {
  document.getElementById("clock").textContent = `${clockFormat.format(new Date())} SGT`;
}

function renderNextMatch() {
  const upcoming = getUpcoming(fullSchedule);
  const next = upcoming[0] ?? fullSchedule.at(-1);
  const free = next ? isFreeMatch(next) : false;
  document.getElementById("nextMatch").innerHTML = next
    ? `<small>Next match${free ? " | free-to-air" : ""}</small>
       <strong>${next.fixture}</strong>
       <span>${dateFormat.format(next.startsAt)} at ${next.singaporeTime} SGT | ${next.stage} | ${next.city}</span>`
    : "<small>Schedule complete</small><strong>The tournament has wrapped.</strong>";
}

function renderFreeHighlights() {
  const upcomingFree = getUpcoming(freeMatches).slice(0, 8);
  const list = upcomingFree.length ? upcomingFree : freeMatches.slice(-8);
  document.getElementById("freeHighlights").innerHTML = list
    .map((match) => `
      <div class="highlight-item">
        <span>${dateFormat.format(match.startsAt)} | ${match.displayTime} SGT | ${match.group}</span>
        <strong>${match.match}</strong>
      </div>`)
    .join("");
}

function renderUpcomingMini() {
  const upcoming = getUpcoming(fullSchedule).slice(0, 6);
  document.getElementById("upcomingMini").innerHTML = upcoming
    .map((match) => `
      <div class="mini-item">
        <span>${dateFormat.format(match.startsAt)} | ${match.singaporeTime} SGT${isFreeMatch(match) ? " | Free" : ""}</span>
        <strong>${match.fixture}</strong>
      </div>`)
    .join("");
}

function renderFreeTable() {
  const now = new Date();
  const nextFree = getUpcoming(freeMatches, now)[0];
  document.getElementById("freeTable").innerHTML = freeMatches
    .map((match) => {
      const isNext = nextFree && match.startsAt.getTime() === nextFree.startsAt.getTime();
      return `<tr class="${isNext ? "next-free" : ""}">
        <td>${dateFormat.format(match.startsAt)}</td>
        <td>${match.displayTime}</td>
        <td>${match.group}</td>
        <td>${match.match}</td>
      </tr>`;
    })
    .join("");
}

function renderUpcomingGrid() {
  const upcoming = getUpcoming(fullSchedule).slice(0, 12);
  document.getElementById("upcomingGrid").innerHTML = upcoming
    .map((match) => `
      <article class="upcoming-card">
        <span class="date-pill">${dateFormat.format(match.startsAt)} | ${match.singaporeTime} SGT</span>
        <small>${match.stage} | ${match.city}</small>
        <strong>${match.fixture}</strong>
        <span>Match ${match.match}</span>
        ${isFreeMatch(match) ? '<span class="free-tag">Free on Channel 5 + mewatch</span>' : ""}
      </article>`)
    .join("");
}

function hydrateData(scheduleData, freeData) {
  fullSchedule = scheduleData
    .map((match) => ({
      ...match,
      startsAt: sgtDate(match.singaporeDate, match.singaporeTime),
    }))
    .sort(byStart);

  freeMatches = freeData
    .map((match) => ({
      ...match,
      startsAt: sgtDate(match.date, match.time),
    }))
    .sort(byStart);
}

async function loadData() {
  if (window.WORLD_CUP_TV_DATA) {
    return window.WORLD_CUP_TV_DATA;
  }

  const [scheduleResponse, freeResponse] = await Promise.all([
    fetch("./world-cup-2026-sgt-schedule.json"),
    fetch("./data/free-matches.json"),
  ]);
  return {
    schedule: await scheduleResponse.json(),
    freeMatches: await freeResponse.json(),
  };
}

async function init() {
  const data = await loadData();
  hydrateData(data.schedule, data.freeMatches);

  renderClock();
  renderNextMatch();
  renderFreeHighlights();
  renderUpcomingMini();
  renderFreeTable();
  renderUpcomingGrid();

  setInterval(() => {
    renderClock();
    renderNextMatch();
    renderFreeHighlights();
    renderUpcomingMini();
    renderFreeTable();
    renderUpcomingGrid();
  }, 60_000);

  document.querySelectorAll("[data-slide-link]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      showSlide(button.dataset.slideLink);
      startRotation();
    });
  });

  document.getElementById("rotateToggle").addEventListener("click", () => {
    rotate = !rotate;
    document.getElementById("rotateToggle").textContent = rotate ? "Pause" : "Resume";
    startRotation();
  });

  document.getElementById("fullscreenButton").addEventListener("click", async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") showSlide(slideIds[(activeIndex + 1) % slideIds.length]);
    if (event.key === "ArrowLeft") showSlide(slideIds[(activeIndex + slideIds.length - 1) % slideIds.length]);
    if (event.key.toLowerCase() === "f") document.getElementById("fullscreenButton").click();
  });

  const params = new URLSearchParams(window.location.search);
  const requestedSlide = params.get("slide");
  if (requestedSlide && slideIds.includes(requestedSlide)) showSlide(requestedSlide);
  if (params.get("autorotate") === "0") {
    rotate = false;
    document.getElementById("rotateToggle").textContent = "Resume";
  }
  startRotation();
}

init().catch((error) => {
  document.body.innerHTML = `<pre style="padding:24px;color:white">${error.stack}</pre>`;
});
