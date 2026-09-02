const NASA_API_KEY = "wLsuFJarE3B9kGQTeBkqGT1hgOfxeUeIAaJKWpZt";
const NASA_APOD_URL = "https://api.nasa.gov/planetary/apod";

const apodImage = document.getElementById("apod-image");
const apodTitle = document.getElementById("apod-title");
const apodExplanation = document.getElementById("apod-explanation");
const apodDate = document.getElementById("apod-date");
const apodDateDetail = document.getElementById("apod-date-detail");
const apodCopyright = document.getElementById("apod-copyright");
const apodDateInfo = document.getElementById("apod-date-info");
const apodMediaType = document.getElementById("apod-media-type");

const apodDateInput = document.getElementById("apod-date-input");
const loadDateButton = document.getElementById("load-date-btn");
const todayApodButton = document.getElementById("today-apod-btn");

const apodLoading = document.getElementById("apod-loading");
const apodImageContainer = document.getElementById("apod-image-container");

function getTodayDate() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date, month = "long") {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });
}

function getPreviousDate(date) {
  const previousDate = new Date(`${date}T00:00:00`);

  previousDate.setDate(previousDate.getDate() - 1);

  return `${previousDate.getFullYear()}-${String(
    previousDate.getMonth() + 1
  ).padStart(2, "0")}-${String(previousDate.getDate()).padStart(2, "0")}`;
}

async function fetchApod(date) {
  const url = `${NASA_APOD_URL}?api_key=${NASA_API_KEY}&date=${date}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA API Error: ${response.status}`);
  }

  return await response.json();
}

async function loadApod(date = getTodayDate()) {
  try {
    if (apodDateInput) {
      apodDateInput.value = date;
      apodDateInput.max = getTodayDate();

      const label = apodDateInput.parentElement?.querySelector("span");

      if (label) {
        label.textContent = formatDate(date, "short");
      }
    }

    if (apodLoading) {
      apodLoading.classList.remove("hidden");

      apodLoading.innerHTML = `
        <div
          class="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"
        ></div>

        <p class="text-slate-400">
          Loading astronomy picture...
        </p>
      `;
    }

    apodImage?.classList.add("hidden");

    if (apodImageContainer) {
      const oldVideo = apodImageContainer.querySelector(".apod-video");
      const oldOverlay = apodImageContainer.querySelector(".apod-overlay");

      oldVideo?.remove();
      oldOverlay?.remove();
    }

    let data;

    try {
      data = await fetchApod(date);
    } catch (error) {
      const previousDate = getPreviousDate(date);

      console.warn(`No APOD available for ${date}. Trying ${previousDate}...`);

      data = await fetchApod(previousDate);
    }

    const formattedDate = formatDate(data.date);

    if (apodDateInput) {
      apodDateInput.value = data.date;

      const label = apodDateInput.parentElement?.querySelector("span");

      if (label) {
        label.textContent = formatDate(data.date, "short");
      }
    }

    if (apodTitle) {
      apodTitle.textContent = data.title || "Astronomy Picture of the Day";
    }

    if (apodExplanation) {
      apodExplanation.textContent =
        data.explanation || "No explanation available.";
    }

    if (apodDate) {
      apodDate.textContent = `Astronomy Picture of the Day - ${formattedDate}`;
    }

    if (apodDateDetail) {
      apodDateDetail.innerHTML = `
        <i class="far fa-calendar mr-2"></i>
        ${formattedDate}
      `;
    }

    if (apodDateInfo) {
      apodDateInfo.textContent = formattedDate;
    }

    if (apodMediaType) {
      apodMediaType.textContent =
        data.media_type === "image" ? "Image" : "Video";
    }

    if (apodCopyright) {
      if (data.copyright) {
        apodCopyright.innerHTML = `
          <i class="fas fa-copyright mr-1"></i>
          Copyright: ${data.copyright.trim()}
        `;

        apodCopyright.classList.remove("hidden");
      } else {
        apodCopyright.classList.add("hidden");
      }
    }

    if (data.media_type === "image") {
      if (!apodImage) return;

      apodImage.src = data.url || data.hdurl || "";
      apodImage.alt = data.title || "NASA Astronomy Picture";

      apodImage.onload = () => {
        apodLoading?.classList.add("hidden");
        apodImage.classList.remove("hidden");
      };

      apodImage.onerror = () => {
        if (apodLoading) {
          apodLoading.classList.remove("hidden");

          apodLoading.innerHTML = `
            <i
              class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"
            ></i>

            <p class="text-slate-400">
              Failed to load astronomy image
            </p>
          `;
        }
      };

      if (apodImageContainer) {
        const overlay = document.createElement("div");

        overlay.className =
          "apod-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity";

        overlay.innerHTML = `
          <div class="absolute bottom-6 left-6 right-6">
            <a
              href="${data.hdurl || data.url}"
              target="_blank"
              rel="noopener noreferrer"
              class="block w-full py-3 bg-white/10 backdrop-blur-md rounded-lg font-semibold hover:bg-white/20 transition-colors text-center"
            >
              <i class="fas fa-expand mr-2"></i>
              View Full Resolution
            </a>
          </div>
        `;

        apodImageContainer.appendChild(overlay);
      }
    } else if (data.media_type === "video") {
      apodLoading?.classList.add("hidden");

      if (apodImageContainer) {
        const iframe = document.createElement("iframe");

        iframe.className = "apod-video w-full h-full min-h-[400px]";

        iframe.src = data.url;
        iframe.frameBorder = "0";
        iframe.allowFullscreen = true;

        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );

        apodImageContainer.appendChild(iframe);
      }
    }
  } catch (error) {
    console.error("APOD Error:", error);

    if (apodLoading) {
      apodLoading.classList.remove("hidden");

      apodLoading.innerHTML = `
        <i
          class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"
        ></i>

        <p class="text-slate-400">
          Failed to load astronomy picture
        </p>

        <p class="text-slate-500 text-sm mt-2">
          Please try again later
        </p>
      `;
    }
  }
}

if (apodDateInput) {
  const today = getTodayDate();

  apodDateInput.max = today;
  apodDateInput.value = today;

  const label = apodDateInput.parentElement?.querySelector("span");

  if (label) {
    label.textContent = formatDate(today, "short");
  }

  apodDateInput.addEventListener("change", () => {
    if (!apodDateInput.value) return;

    const label = apodDateInput.parentElement?.querySelector("span");

    if (label) {
      label.textContent = formatDate(apodDateInput.value, "short");
    }
  });

  apodDateInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && apodDateInput.value) {
      loadApod(apodDateInput.value);
    }
  });
}

loadDateButton?.addEventListener("click", () => {
  if (apodDateInput?.value) {
    loadApod(apodDateInput.value);
  }
});

todayApodButton?.addEventListener("click", () => {
  const today = getTodayDate();

  if (apodDateInput) {
    apodDateInput.value = today;

    const label = apodDateInput.parentElement?.querySelector("span");

    if (label) {
      label.textContent = formatDate(today, "short");
    }
  }

  loadApod(today);
});

const initialToday = getTodayDate();

if (apodDateInput) {
  apodDateInput.value = initialToday;
}

loadApod(initialToday);

// ========================================
// PLANETS
// ========================================

const SOLAR_SYSTEM_URL =
  "https://solar-system-opendata-proxy.vercel.app/api/planets";

let planetsData = [];

async function getPlanets() {
  const response = await fetch(SOLAR_SYSTEM_URL);

  if (!response.ok) {
    throw new Error(`Planets API Error: ${response.status}`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.bodies)) {
    throw new Error("Invalid planets API response");
  }

  return data.bodies.filter((planet) => planet.isPlanet);
}

function renderPlanets(planets) {
  const container = document.getElementById("planets-grid");

  if (!container) return;

  container.innerHTML = planets
    .map((planet) => {
      const name = planet.englishName || planet.name || "Unknown";

      const distance =
        typeof planet.semimajorAxis === "number"
          ? (planet.semimajorAxis / 149597870.7).toFixed(2)
          : "N/A";

      const image = planet.image || "";

      return `
        <div
          class="planet-card bg-slate-800/50 border border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group hover:border-blue-500/50"
          data-planet-id="${planet.id}"
        >

          <div class="relative mb-3 h-24 flex items-center justify-center">

            ${
              image
                ? `
              <img
                class="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300"
                src="${image}"
                alt="${name}"
                loading="lazy"
                onerror="this.style.display='none'"
              >
            `
                : `
              <div class="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                <i class="fas fa-globe text-2xl text-slate-500"></i>
              </div>
            `
            }

          </div>

          <h4 class="font-semibold text-center text-sm">
            ${name}
          </h4>

          <p class="text-xs text-slate-400 text-center mt-1">
            ${distance} AU
          </p>

          ${
            planet.type
              ? `
            <p class="text-xs text-blue-400 text-center mt-1">
              ${planet.type}
            </p>
          `
              : ""
          }

        </div>
      `;
    })
    .join("");
}

function renderPlanetDetails(planet) {
  if (!planet) return;

  const set = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  };

  const planetName = planet.englishName || planet.name || "Unknown";

  set("planet-detail-name", planetName);

  set(
    "planet-detail-description",
    planet.description || "No description is available for this planet."
  );

  const image = document.getElementById("planet-detail-image");

  if (image) {
    if (planet.image) {
      image.src = planet.image;
      image.alt = planetName;

      image.onerror = () => {
        image.style.display = "none";
      };
    } else {
      image.removeAttribute("src");
      image.alt = planetName;
    }
  }

  set(
    "planet-distance",
    typeof planet.semimajorAxis === "number"
      ? `${(planet.semimajorAxis / 1e6).toFixed(1)}M km`
      : "N/A"
  );

  set(
    "planet-radius",
    typeof planet.meanRadius === "number"
      ? `${planet.meanRadius.toFixed(0)} km`
      : "N/A"
  );

  set(
    "planet-mass",
    planet.mass &&
      typeof planet.mass.massValue === "number" &&
      typeof planet.mass.massExponent === "number"
      ? `${planet.mass.massValue} × 10^${planet.mass.massExponent} kg`
      : "N/A"
  );

  set(
    "planet-density",
    typeof planet.density === "number"
      ? `${planet.density.toFixed(2)} g/cm³`
      : "N/A"
  );

  set(
    "planet-orbital-period",
    typeof planet.sideralOrbit === "number"
      ? planet.sideralOrbit > 365.25
        ? `${(planet.sideralOrbit / 365.25).toFixed(2)} years`
        : `${planet.sideralOrbit.toFixed(2)} days`
      : "N/A"
  );

  set(
    "planet-rotation",
    typeof planet.sideralRotation === "number"
      ? `${Math.abs(planet.sideralRotation).toFixed(2)} hours`
      : "N/A"
  );

  set("planet-moons", Array.isArray(planet.moons) ? planet.moons.length : 0);

  set(
    "planet-gravity",
    typeof planet.gravity === "number"
      ? `${planet.gravity.toFixed(2)} m/s²`
      : "N/A"
  );

  set("planet-discoverer", planet.discoveredBy || "Known since antiquity");

  set("planet-discovery-date", planet.discoveryDate || "Ancient times");

  set("planet-body-type", planet.type || planet.bodyType || "Planet");

  set(
    "planet-volume",
    planet.vol &&
      typeof planet.vol.volValue === "number" &&
      typeof planet.vol.volExponent === "number"
      ? `${planet.vol.volValue} × 10^${planet.vol.volExponent} km³`
      : "N/A"
  );

  set(
    "planet-perihelion",
    typeof planet.perihelion === "number"
      ? `${(planet.perihelion / 1e6).toFixed(1)}M km`
      : "N/A"
  );

  set(
    "planet-aphelion",
    typeof planet.aphelion === "number"
      ? `${(planet.aphelion / 1e6).toFixed(1)}M km`
      : "N/A"
  );

  set(
    "planet-eccentricity",
    typeof planet.eccentricity === "number"
      ? planet.eccentricity.toFixed(5)
      : "N/A"
  );

  set(
    "planet-inclination",
    typeof planet.inclination === "number"
      ? `${planet.inclination.toFixed(2)}°`
      : "N/A"
  );

  set(
    "planet-axial-tilt",
    typeof planet.axialTilt === "number"
      ? `${planet.axialTilt.toFixed(2)}°`
      : "N/A"
  );

  set(
    "planet-temp",
    typeof planet.avgTemp === "number" ? `${planet.avgTemp}°C` : "N/A"
  );

  set(
    "planet-escape",
    typeof planet.escape === "number"
      ? `${(planet.escape / 1000).toFixed(2)} km/s`
      : "N/A"
  );

  const moonsContainer = document.getElementById("planet-moons-list");

  if (moonsContainer) {
    if (Array.isArray(planet.moons) && planet.moons.length > 0) {
      moonsContainer.innerHTML = planet.moons
        .map((moon) => {
          const moonName = typeof moon === "object" ? moon.moon : moon;

          return `
            <span
              class="px-3 py-1 bg-slate-700/70 rounded-full text-xs text-slate-300"
            >
              ${moonName || "Unknown moon"}
            </span>
          `;
        })
        .join("");
    } else {
      moonsContainer.innerHTML = `
        <span class="text-slate-500 text-sm">
          No known moons
        </span>
      `;
    }
  }

  const facts = [
    planet.mass && typeof planet.mass.massValue === "number"
      ? `Mass: ${planet.mass.massValue} × 10^${planet.mass.massExponent} kg`
      : null,

    typeof planet.gravity === "number"
      ? `Surface gravity: ${planet.gravity} m/s²`
      : null,

    typeof planet.density === "number"
      ? `Density: ${planet.density} g/cm³`
      : null,

    typeof planet.axialTilt === "number"
      ? `Axial tilt: ${planet.axialTilt}°`
      : null,

    planet.discoveredBy ? `Discovered by: ${planet.discoveredBy}` : null,

    planet.type ? `Type: ${planet.type}` : null,
  ]
    .filter(Boolean)
    .slice(0, 4);

  const factsContainer = document.getElementById("planet-facts");

  if (factsContainer) {
    factsContainer.innerHTML = facts
      .map(
        (fact) => `
          <li class="flex items-start">
            <i class="fas fa-check text-green-400 mt-1 mr-2"></i>

            <span class="text-slate-300">
              ${fact}
            </span>
          </li>
        `
      )
      .join("");
  }
}

function renderPlanetComparison(planets) {
  const tbody = document.getElementById("planet-comparison-tbody");

  if (!tbody) return;

  const earth = planets.find(
    (planet) => (planet.englishName || "").toLowerCase() === "earth"
  );

  const earthMass =
    earth?.mass?.massValue && earth?.mass?.massExponent
      ? earth.mass.massValue * Math.pow(10, earth.mass.massExponent)
      : 1;

  tbody.innerHTML = planets
    .map((planet) => {
      const key = (planet.englishName || planet.name || "").toLowerCase();

      const distance =
        typeof planet.semimajorAxis === "number"
          ? (planet.semimajorAxis / 149597870.7).toFixed(2)
          : "N/A";

      const diameter =
        typeof planet.meanRadius === "number"
          ? Math.round(planet.meanRadius * 2).toLocaleString()
          : "N/A";

      const mass =
        planet.mass &&
        typeof planet.mass.massValue === "number" &&
        typeof planet.mass.massExponent === "number"
          ? (
              (planet.mass.massValue * Math.pow(10, planet.mass.massExponent)) /
              earthMass
            ).toFixed(3)
          : "N/A";

      let orbit = "N/A";

      if (typeof planet.sideralOrbit === "number") {
        if (planet.sideralOrbit > 365.25) {
          orbit = `${(planet.sideralOrbit / 365.25).toFixed(1)} years`;
        } else {
          orbit = `${planet.sideralOrbit.toFixed(0)} days`;
        }
      }

      const type = planet.type || planet.bodyType || "Planet";

      let typeBackground = "rgba(59, 130, 246, 0.5)";

      let typeColor = "#60a5fa";

      if (type === "Terrestrial") {
        typeBackground = "rgba(249, 115, 22, 0.5)";
        typeColor = "#fb923c";
      }

      if (type === "Gas Giant") {
        typeBackground = "rgba(168, 85, 247, 0.5)";
        typeColor = "#c084fc";
      }

      if (type === "Ice Giant") {
        typeBackground = "rgba(59, 130, 246, 0.5)";
        typeColor = "#60a5fa";
      }

      return `
        <tr
          class="${
            key === "earth"
              ? "hover:bg-slate-800/30 transition-colors bg-blue-500/5"
              : "hover:bg-slate-800/30 transition-colors"
          }"
        >

          <td
            class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10"
          >

            <div class="flex items-center space-x-2 md:space-x-3">

              <div
                class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-700"
              >

                ${
                  planet.image
                    ? `
                    <img
                      src="${planet.image}"
                      alt="${planet.englishName}"
                      class="w-full h-full object-contain"
                      loading="lazy"
                    >
                  `
                    : `
                    <div class="w-full h-full flex items-center justify-center">
                      <i class="fas fa-globe text-slate-500"></i>
                    </div>
                  `
                }

              </div>

              <span
                class="font-semibold text-sm md:text-base whitespace-nowrap"
              >
                ${planet.englishName || planet.name}
              </span>

            </div>

          </td>

          <td
            class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap"
          >
            ${distance} AU
          </td>

          <td
            class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap"
          >
            ${diameter} km
          </td>

          <td
            class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap"
          >
            ${mass} Earth
          </td>

          <td
            class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap"
          >
            ${orbit}
          </td>

          <td
            class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap"
          >
            ${Array.isArray(planet.moons) ? planet.moons.length : 0}
          </td>

          <td
            class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap"
          >

            <span
              class="px-2 py-1 rounded text-xs"
              style="
                background-color:${typeBackground};
                color:${typeColor};
              "
            >
              ${type}
            </span>

          </td>

        </tr>
      `;
    })
    .join("");
}

function setupPlanetClick() {
  const container = document.getElementById("planets-grid");

  if (!container) return;

  if (container.dataset.listenerAttached === "true") {
    return;
  }

  container.dataset.listenerAttached = "true";

  container.addEventListener("click", (event) => {
    const card = event.target.closest(".planet-card");

    if (!card) return;

    const planet = planetsData.find(
      (item) => String(item.id) === String(card.dataset.planetId)
    );

    if (!planet) return;

    renderPlanetDetails(planet);

    document.querySelectorAll(".planet-card").forEach((item) => {
      item.classList.remove("border-blue-500");
      item.classList.add("border-slate-700");
    });

    card.classList.remove("border-slate-700");
    card.classList.add("border-blue-500");
  });
}

async function loadPlanets() {
  const container = document.getElementById("planets-grid");

  if (container) {
    container.innerHTML = `
      <div
        class="col-span-full flex flex-col items-center justify-center py-12"
      >

        <div
          class="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"
        ></div>

        <p class="text-slate-400">
          Loading planets...
        </p>

      </div>
    `;
  }

  try {
    planetsData = await getPlanets();

    if (!planetsData.length) {
      throw new Error("No planets returned from API");
    }

    renderPlanets(planetsData);
    renderPlanetComparison(planetsData);

    const earth = planetsData.find(
      (planet) => (planet.englishName || "").toLowerCase() === "earth"
    );

    renderPlanetDetails(earth || planetsData[0]);

    setupPlanetClick();
  } catch (error) {
    console.error("Planets Error:", error);

    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">

          <i
            class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"
          ></i>

          <p class="text-slate-400">
            Failed to load planets data.
          </p>

          <p class="text-slate-500 text-sm mt-2">
            Please try again later.
          </p>

        </div>
      `;
    }
  }
}

loadPlanets();

// ========================================
// LAUNCHES
// ========================================

const LAUNCHES_API_URL =
  "https://lldev.thespacedevs.com/2.3.0/launches/upcoming/?limit=10";

const launchesGrid = document.getElementById("launches-grid");

const featuredLaunch = document.getElementById("featured-launch");

const launchesCount = document.getElementById("launches-count");

const mobileCount = document.getElementById("launches-count-mobile");

function getStatusColor(status) {
  return (
    {
      Go: "green",
      Success: "green",
      TBD: "yellow",
      TBC: "yellow",
      Hold: "red",
    }[status] || "blue"
  );
}

function getLaunchImage(launch) {
  return (
    launch.image?.image_url ||
    launch.image?.thumbnail_url ||
    launch.rocket?.configuration?.image_url ||
    ""
  );
}

function launchDate(date, short = false) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString(
    "en-US",
    short
      ? {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      : {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
  );
}

function launchTime(date) {
  if (!date) return "Unknown";

  return (
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

function getDaysUntilLaunch(date) {
  if (!date) return 0;

  const difference = new Date(date) - new Date();

  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

function renderLaunchImage(launch, featured = false) {
  const image = getLaunchImage(launch);

  if (!image) {
    return `
      <div
        class="flex items-center justify-center h-full min-h-[400px] bg-slate-900/50 rounded-2xl"
      >
        <div class="text-center">

          <i
            class="fas fa-rocket text-6xl text-slate-700 mb-4"
          ></i>

          <p class="text-slate-500">
            No image available
          </p>

        </div>
      </div>
    `;
  }

  return `
    <img
      src="${image}"
      alt="${launch.name || "Launch"}"
      class="w-full ${
        featured
          ? "h-full min-h-[400px]"
          : "h-48 group-hover:scale-110 transition-transform duration-500"
      } object-cover"
      onerror="
        this.onerror=null;
        this.src='./assets/images/launch-placeholder.png';
      "
    />
  `;
}

function renderFeaturedLaunch(launch) {
  if (!featuredLaunch || !launch) return;

  const status = launch.status?.abbrev || "TBD";

  const statusColor = getStatusColor(status);

  const days = getDaysUntilLaunch(launch.net);

  const location = launch.pad?.location?.name || "Unknown";

  const country = launch.pad?.location?.country?.name || "Unknown";

  featuredLaunch.innerHTML = `
    <div
      class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all"
    >

      <div
        class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
      ></div>

      <div
        class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8"
      >

        <div class="flex flex-col justify-between">

          <div>

            <div class="flex items-center gap-3 mb-4">

              <span
                class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2"
              >
                <i class="fas fa-star"></i>
                Featured Launch
              </span>

              <span
                class="px-4 py-1.5 bg-${statusColor}-500/20 text-${statusColor}-400 rounded-full text-sm font-semibold"
              >
                ${status}
              </span>

            </div>

            <h3
              class="text-3xl font-bold mb-3 leading-tight"
            >
              ${launch.name}
            </h3>

            <div
              class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400"
            >

              <div class="flex items-center gap-2">

                <i class="fas fa-building"></i>

                <span>
                  ${launch.launch_service_provider?.name || "Unknown"}
                </span>

              </div>

              <div class="flex items-center gap-2">

                <i class="fas fa-rocket"></i>

                <span>
                  ${launch.rocket?.configuration?.name || "N/A"}
                </span>

              </div>

            </div>

            ${
              days > 0
                ? `
                  <div
                    class="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6"
                  >

                    <i
                      class="fas fa-clock text-2xl text-blue-400"
                    ></i>

                    <div>

                      <p
                        class="text-2xl font-bold text-blue-400"
                      >
                        ${days}
                      </p>

                      <p
                        class="text-xs text-slate-400"
                      >
                        Days Until Launch
                      </p>

                    </div>

                  </div>
                `
                : ""
            }

            <div
              class="grid xl:grid-cols-2 gap-4 mb-6"
            >

              <div
                class="bg-slate-900/50 rounded-xl p-4"
              >

                <p
                  class="text-xs text-slate-400 mb-1"
                >
                  <i class="fas fa-calendar"></i>
                  Launch Date
                </p>

                <p class="font-semibold">
                  ${launchDate(launch.net)}
                </p>

              </div>

              <div
                class="bg-slate-900/50 rounded-xl p-4"
              >

                <p
                  class="text-xs text-slate-400 mb-1"
                >
                  <i class="fas fa-clock"></i>
                  Launch Time
                </p>

                <p class="font-semibold">
                  ${launchTime(launch.net)}
                </p>

              </div>

              <div
                class="bg-slate-900/50 rounded-xl p-4"
              >

                <p
                  class="text-xs text-slate-400 mb-1"
                >
                  <i class="fas fa-map-marker-alt"></i>
                  Location
                </p>

                <p
                  class="font-semibold text-sm"
                >
                  ${location}
                </p>

              </div>

              <div
                class="bg-slate-900/50 rounded-xl p-4"
              >

                <p
                  class="text-xs text-slate-400 mb-1"
                >
                  <i class="fas fa-globe"></i>
                  Country
                </p>

                <p class="font-semibold">
                  ${country}
                </p>

              </div>

            </div>

            <p
              class="text-slate-300 leading-relaxed mb-6"
            >
              ${
                launch.mission?.description ||
                "Mission details will be available closer to launch date."
              }
            </p>

          </div>

          <div
            class="flex flex-col md:flex-row gap-3"
          >

            <button
              class="flex-1 px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
            >
              <i class="fas fa-info-circle"></i>
              View Full Details
            </button>

            <div
              class="icons self-end md:self-center flex gap-2"
            >

              <button
                class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
              >
                <i class="far fa-heart"></i>
              </button>

              <button
                class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
              >
                <i class="fas fa-bell"></i>
              </button>

            </div>

          </div>

        </div>

        <div class="relative">

          <div
            class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50"
          >

            ${renderLaunchImage(launch, true)}

            <div
              class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"
            ></div>

          </div>

        </div>

      </div>

    </div>
  `;
}

function renderLaunches(launches) {
  if (!launchesGrid) return;

  launchesGrid.innerHTML = launches
    .map((launch) => {
      const status = launch.status?.abbrev || "TBD";

      const color = getStatusColor(status);

      const image =
        getLaunchImage(launch) || "./assets/images/launch-placeholder.png";

      return `
        <div
          class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer"
        >

          <div
            class="relative h-48 overflow-hidden bg-slate-900/50"
          >

            <img
              src="${image}"
              alt="${launch.name || "Launch"}"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onerror="
                this.onerror=null;
                this.src='./assets/images/launch-placeholder.png';
              "
            />

            <div
              class="absolute top-3 right-3"
            >

              <span
                class="px-3 py-1 bg-${color}-500/90 text-white backdrop-blur-sm rounded-full text-xs font-semibold"
              >
                ${status}
              </span>

            </div>

          </div>

          <div class="p-5">

            <div class="mb-3">

              <h4
                class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors"
              >
                ${launch.name}
              </h4>

              <p
                class="text-sm text-slate-400"
              >
                <i class="fas fa-building text-xs"></i>
                ${launch.launch_service_provider?.name || "Unknown"}
              </p>

            </div>

            <div class="space-y-2 mb-4">

              <div
                class="flex items-center gap-2 text-sm"
              >

                <i
                  class="fas fa-calendar text-slate-500 w-4"
                ></i>

                <span
                  class="text-slate-300"
                >
                  ${launchDate(launch.net, true)}
                </span>

              </div>

              <div
                class="flex items-center gap-2 text-sm"
              >

                <i
                  class="fas fa-clock text-slate-500 w-4"
                ></i>

                <span
                  class="text-slate-300"
                >
                  ${launchTime(launch.net)}
                </span>

              </div>

              <div
                class="flex items-center gap-2 text-sm"
              >

                <i
                  class="fas fa-rocket text-slate-500 w-4"
                ></i>

                <span
                  class="text-slate-300"
                >
                  ${launch.rocket?.configuration?.name || "N/A"}
                </span>

              </div>

              <div
                class="flex items-center gap-2 text-sm"
              >

                <i
                  class="fas fa-map-marker-alt text-slate-500 w-4"
                ></i>

                <span
                  class="text-slate-300 line-clamp-1"
                >
                  ${launch.pad?.location?.name || "Unknown"}
                </span>

              </div>

            </div>

            <div
              class="flex items-center gap-2 pt-4 border-t border-slate-700"
            >

              <button
                class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold"
              >
                Details
              </button>

              <button
                class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <i class="far fa-heart"></i>
              </button>

            </div>

          </div>

        </div>
      `;
    })
    .join("");
}

async function loadLaunches() {
  try {
    const response = await fetch(LAUNCHES_API_URL);

    if (!response.ok) {
      throw new Error(`Launches API Error: ${response.status}`);
    }

    const data = await response.json();

    const launches = data.results || [];

    if (!launches.length) {
      throw new Error("No upcoming launches found");
    }

    if (launchesCount) {
      launchesCount.textContent = `${launches.length} Launches`;
    }

    if (mobileCount) {
      mobileCount.textContent = launches.length;
    }

    renderFeaturedLaunch(launches[0]);
    renderLaunches(launches.slice(1));
  } catch (error) {
    console.error("Launches Error:", error);

    const message = `
      <div
        class="col-span-full text-center py-12"
      >

        <i
          class="fas fa-exclamation-triangle text-red-400 text-5xl mb-4"
        ></i>

        <p
          class="text-slate-400 text-lg"
        >
          Failed to load launches data
        </p>

      </div>
    `;

    if (featuredLaunch) {
      featuredLaunch.innerHTML = message;
    }

    if (launchesGrid) {
      launchesGrid.innerHTML = message;
    }
  }
}

loadLaunches();

// ========================================
// NAVIGATION
// ========================================

const navLinks = document.querySelectorAll(".nav-link");

const sections = document.querySelectorAll(".app-section");

function showSection(sectionId) {
  sections.forEach((section) => {
    section.classList.add("hidden");
  });

  document
    .querySelectorAll(`[data-section="${sectionId}"]`)
    .forEach((section) => {
      section.classList.remove("hidden");
    });

  navLinks.forEach((link) => {
    const active = link.dataset.section === sectionId;

    link.classList.toggle("bg-blue-500/10", active);

    link.classList.toggle("text-blue-400", active);

    link.classList.toggle("text-slate-300", !active);

    if (!active) {
      link.classList.add("hover:bg-slate-800");
    }
  });

  window.scrollTo(0, 0);
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    showSection(link.dataset.section);

    closeSidebar();
  });
});

showSection("today-in-space");

// ========================================
// SIDEBAR
// ========================================

const sidebar = document.getElementById("sidebar");

const sidebarToggle = document.getElementById("sidebar-toggle");

let sidebarOverlay = null;

function openSidebar() {
  if (!sidebar) return;

  sidebar.classList.add("sidebar-open");

  if (!sidebarOverlay) {
    sidebarOverlay = document.createElement("div");

    sidebarOverlay.className = "sidebar-overlay";

    sidebarOverlay.addEventListener("click", closeSidebar);

    document.body.appendChild(sidebarOverlay);
  }
}

function closeSidebar() {
  sidebar?.classList.remove("sidebar-open");

  sidebarOverlay?.remove();

  sidebarOverlay = null;
}

sidebarToggle?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (sidebar?.classList.contains("sidebar-open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
});
