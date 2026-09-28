// Kolory dla typów obiektów (opcjonalnie do użycia np. w tło, podpowiedzi)
const kolory = {
    "Morze": "#0074D9",
    "Cieśnina": "#2ECC40",
    "Półwysep": "#FFDC00",
    "Zatoka": "#FF4136",
    "Wyspa": "#B10DC9",
    "Rzeka": "#39CCCC",
    "Jezioro": "#7FDBFF",
    "Nizina": "#3D9970",
    "Wyżyna": "#F012BE",
    "Góry": "#111111",
    "Rów": "#85144b",
    "Mierzeja": "#FF851B",
    "Zalew": "#AAAAAA",
    "Pobrzeże": "#FF69B4",
    "Pojezierze": "#01FF70",
    "Kotlina" : "#8B4513",
    "Ocean" : "#001F3F",
    "Przylądek": "#FFD700",
    "Pustynia": "#F7B32B",
    "Kanał" : "#8B008B",
    "Szczyt" :"#3a143a",
    "Kontynent": "#2ECC40"
};

let currentIdx, pozostale, markers, selectedName, allowClick, donePoints;
let timerInterval, time, started, playerName;
let showNames = false;
let timeIncrement = 1;
let lastHitIdx = null;
let activeFxMarkers = [];

let trafienia = 0;
let pomylki = 0;
let region = "europa";
let version = "basic";
let liczbaObiektow = 0;

window.obiekty = [];

var map = L.map('map').setView([54, 15], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

function setMapView(region_) {
    const views = {
        europa: {center: [54, 15], zoom: 4},
        azja: {center: [50, 90], zoom: 3},
        ameryka: {center: [15, -75], zoom: 3},
        australia: {center: [-25, 134], zoom: 4},
        afryka: {center: [2, 20], zoom: 4},
        polska: {center: [52, 19], zoom: 6},
        swiat: {center: [20, 10], zoom: 2}
    };
    const v = views[region_] || views.europa;
    map.setView(v.center, v.zoom);
}

// ZMIANA: Użycie ikony SVG zamiast kolorowego punktu
function icon(typ) {
    let size = (window.innerWidth < 700) ? 32 : 24;
    // Użyj geoIconHTML z icons.js
    return L.divIcon({
        className: "custom-icon",
        iconSize: [size, size],
        html: geoIconHTML(typ, size)
    });
}

function renderMarkers() {
    if (markers) markers.forEach(m => map.removeLayer(m));
    markers = [];
    window.obiekty.forEach((p, idx) => {
        if (!pozostale.includes(idx)) return;
        const marker = L.marker([p[1], p[2]], { icon: icon(p[3]) });
        marker.addTo(map)
            .on("click", () => markerClicked(idx))
            .on("touchstart", () => markerClicked(idx));
        if (showNames) marker.bindTooltip(p[0], {permanent:false});
        markers.push(marker);
    });
}

function renderTaskList() {
    const list = document.getElementById("tasklist");
    list.innerHTML = "";
    pozostale.forEach(idx => {
        const typ = window.obiekty[idx][3];
        // Użyj geoIconHTML do listy
        const li = document.createElement("li");
        li.innerHTML = `${geoIconHTML(typ)}${window.obiekty[idx][0]}`;
        li.onclick = () => selectName(idx);
        li.ontouchstart = () => selectName(idx);
        li.className = (idx === currentIdx) ? "selected" : "";
        list.appendChild(li);
    });
    donePoints.forEach((idx, i) => {
        const typ = window.obiekty[idx][3];
        const li = document.createElement("li");
        li.innerHTML = `${geoIconHTML(typ)}${window.obiekty[idx][0]}`;
        li.className = (i === 0 && lastHitIdx === idx) ? "done just-done" : "done";
        list.appendChild(li);
    });
    document.getElementById("nextBtn").style.display = (started && currentIdx !== null && pozostale.length > 0) ? "" : "none";
}

function startTimer() {
    document.getElementById("timer").style.display = "";
    time = 0;
    document.getElementById("timeValue").textContent = time;
    stopTimer();
    timeIncrement = showNames ? 2 : 1;
    timerInterval = setInterval(() => {
        if (!started) return;
        time += timeIncrement;
        document.getElementById("timeValue").textContent = time;
    }, 1000);
}
function stopTimer() {
    clearInterval(timerInterval);
}

function updateTimerSpeed() {
    timeIncrement = showNames ? 2 : 1;
}

function shuffle(array) {
    let a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function loadObiekty(region_, version_, callback) {
    const filename = `data/obiekty-${region_}${version_ === 'ext' ? '-ext' : ''}.js`;
    const oldScript = document.getElementById('obiektyScript');
    if (oldScript) oldScript.remove();

    window.obiekty = [];

    const script = document.createElement('script');
    script.src = filename;
    script.id = 'obiektyScript';
    script.onload = () => {
        callback();
    };
    script.onerror = () => {
        alert('Brak danych dla wybranego regionu/wersji!');
        window.obiekty = [];
        callback();
    };
    document.body.appendChild(script);
}

function startGame() {
    playerName = document.getElementById("playerName").value.trim();
    if (!playerName) {
        alert("Podaj imię gracza!");
        return;
    }
    region = document.getElementById('mapRegion').value;
    version = document.getElementById('mapVersion').value;

    loadObiekty(region, version, () => {
        setMapView(region);
        document.getElementById("nameEntry").style.display = "none";
        document.getElementById("timer").style.display = "";
        document.getElementById("livesBox").style.display = "none"; // Ukryj box z życiami
        document.getElementById("showNamesLabel").style.display = "";
        document.getElementById("endNow").style.display = "";
        document.getElementById("endNow").disabled = false;
        clearAllFx();
        lastHitIdx = null;
        pozostale = shuffle(window.obiekty.map((p, idx) => idx));
        donePoints = [];
        currentIdx = null;
        selectedName = null;
        allowClick = false;
        showNames = document.getElementById("showNames").checked;
        started = true;
        time = 0;
        trafienia = 0;
        pomylki = 0;
        liczbaObiektow = window.obiekty.length;
        document.getElementById("msg").textContent = "";
        document.getElementById("restart").style.display = "none";
        document.getElementById("ranking").style.display = "none";
        renderTaskList();
        renderMarkers();
        if (pozostale.length > 0) {
            selectName(pozostale[0]);
        }
        startTimer();
    });
}

document.getElementById("nextBtn").onclick = function() {
    if (!started || currentIdx === null || pozostale.length === 0) return;
    const idxPos = pozostale.indexOf(currentIdx);
    if (idxPos > -1) {
        pozostale.splice(idxPos, 1);
        pozostale.push(currentIdx);
    }
    if (pozostale.length > 0) {
        selectName(pozostale[0]);
    } else {
        currentIdx = null;
        selectedName = null;
        renderTaskList();
    }
};

function selectName(idx) {
    currentIdx = idx;
    selectedName = window.obiekty[idx][0];
    allowClick = true;
    document.getElementById("msg").innerHTML = `Kliknij na mapie: <b>${selectedName}</b>`;
    renderTaskList();
}

function clearAllFx() {
    if (activeFxMarkers && activeFxMarkers.length) {
        activeFxMarkers.forEach(m => {
            try {
                if (map && map.hasLayer(m)) map.removeLayer(m);
            } catch (e) {}
        });
        activeFxMarkers = [];
    }
}

function getRandomTag(type) {
    const commonTags = ["TRAFIONY! 🎯", "ŚWIETNIE! ✨", "SUPER! 👏", "BRAWO! 🌟", "+1 ⭐", "EKSTRA! 🚀"];
    const tagsByType = {
        shatter: ["ROZBITO! 💥", "BAM! 🔨", "TRAFIONY! 🎯", "KRUSZ! ⚡"],
        pop: ["POOF! 💥", "POP! 🎈", "TRAFIONY! 🎯", "BUM! 💥"],
        vortex: ["ZUUUP! 🌀", "WIR! 🌪️", "SZOK! 😵", "SUPER! ✨"],
        rocket: ["ODLOT! 🚀", "WOOOSH! 💨", "W KOSMOS! 🌌", "BRAWO! 🌟"],
        splat: ["PLASK! 🥞", "PAC! 🎯", "PLOP! 💧", "TRAFIONY! 👏"],
        ghost: ["PA PA! 👻", "PAPA! 👋", "CUDOWNIE! 😇", "TRAFIONY! ✨"]
    };
    const pool = (tagsByType[type] || []).concat(commonTags);
    return pool[Math.floor(Math.random() * pool.length)];
}

function generateFxHtml(animType, typ, iconData, color, size, name) {
    const tagText = getRandomTag(animType);
    const tagHtml = `<div class="fx-tag">${tagText}</div>`;
    const ringHtml = `<div class="fx-ring" style="--col:${color};"></div>`;

    const particles = [
        { tx: '-34px', ty: '-32px', char: '✦' },
        { tx: '34px',  ty: '-32px', char: '★' },
        { tx: '-38px', ty: '20px',  char: '●' },
        { tx: '36px',  ty: '22px',  char: '✦' },
        { tx: '-14px', ty: '-42px', char: '★' },
        { tx: '16px',  ty: '-40px', char: '●' },
        { tx: '-24px', ty: '34px',  char: '✦' },
        { tx: '24px',  ty: '36px',  char: '★' }
    ];
    const particlesHtml = particles.map((p, i) =>
        `<div class="fx-particle" style="--tx:${p.tx}; --ty:${p.ty}; --col:${color}; --rot:${(i*45)+90}deg;">${p.char}</div>`
    ).join('');

    const iconImg = `<img class="icon-geopoint ${iconData.cls}" src="${iconData.file}" style="width:${size}px;height:${size}px;" alt="${typ}">`;

    if (animType === 'shatter') {
        const shardsHtml = [1, 2, 3, 4, 5, 6].map(num =>
            `<div class="fx-shard shard-${num}">${iconImg}</div>`
        ).join('');
        return `
            <div class="hit-fx-box fx-shatter">
                ${shardsHtml}
                ${ringHtml}
                ${particlesHtml}
                ${tagHtml}
            </div>
        `;
    }

    if (animType === 'pop') {
        return `
            <div class="hit-fx-box fx-pop">
                <div class="fx-icon-actor">${iconImg}</div>
                <div class="fx-comic-burst">💥</div>
                ${ringHtml}
                ${particlesHtml}
                ${tagHtml}
            </div>
        `;
    }

    if (animType === 'vortex') {
        return `
            <div class="hit-fx-box fx-vortex">
                <div class="fx-icon-actor">${iconImg}</div>
                <div class="fx-dizzy">💫</div>
                ${ringHtml}
                ${particlesHtml}
                ${tagHtml}
            </div>
        `;
    }

    if (animType === 'rocket') {
        return `
            <div class="hit-fx-box fx-rocket">
                <div class="fx-icon-actor">${iconImg}</div>
                <div class="fx-launch-smoke"><span>💨</span><span>🔥</span><span>💨</span></div>
                ${particlesHtml}
                ${tagHtml}
            </div>
        `;
    }

    if (animType === 'splat') {
        const dropsHtml = `
            <div class="fx-splat-drop" style="--tx:-26px; --ty:12px;">💧</div>
            <div class="fx-splat-drop" style="--tx:26px; --ty:12px;">💧</div>
            <div class="fx-splat-drop" style="--tx:-14px; --ty:20px; color:${color};">●</div>
            <div class="fx-splat-drop" style="--tx:14px; --ty:20px; color:${color};">●</div>
        `;
        return `
            <div class="hit-fx-box fx-splat">
                <div class="fx-icon-actor">${iconImg}</div>
                ${dropsHtml}
                ${tagHtml}
            </div>
        `;
    }

    if (animType === 'ghost') {
        return `
            <div class="hit-fx-box fx-ghost">
                <div class="fx-icon-actor">${iconImg}</div>
                <div class="fx-halo">😇</div>
                ${particlesHtml}
                ${tagHtml}
            </div>
        `;
    }

    return `
        <div class="hit-fx-box fx-shatter">
            <div class="fx-icon-actor">${iconImg}</div>
            ${ringHtml}
            ${particlesHtml}
            ${tagHtml}
        </div>
    `;
}

function playHitAnimation(lat, lon, typ, name) {
    const size = (window.innerWidth < 700) ? 32 : 24;
    const iconData = (typeof geoTypeIcon !== 'undefined' && geoTypeIcon[typ]) ? geoTypeIcon[typ] : { cls: "color-domyslna", file: "icons/domyslna.svg" };
    const color = (typeof kolory !== 'undefined' && kolory[typ]) ? kolory[typ] : "#0074D9";

    const animSelect = document.getElementById("animTypeSelect");
    let chosen = animSelect ? animSelect.value : "random";

    if (!chosen || chosen === "random") {
        const pool = ['shatter', 'shatter', 'pop', 'vortex', 'rocket', 'splat', 'ghost'];
        chosen = pool[Math.floor(Math.random() * pool.length)];
    }

    const fxHtml = generateFxHtml(chosen, typ, iconData, color, size, name);

    const fxMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: "hit-fx-marker",
            iconSize: [size, size],
            html: fxHtml
        }),
        interactive: false,
        zIndexOffset: 2500
    });

    fxMarker.addTo(map);
    activeFxMarkers.push(fxMarker);

    setTimeout(() => {
        try {
            if (map && map.hasLayer(fxMarker)) {
                map.removeLayer(fxMarker);
            }
        } catch (e) {}
        activeFxMarkers = activeFxMarkers.filter(m => m !== fxMarker);
    }, 1000);
}

function markerClicked(idx) {
    if (!allowClick || currentIdx === null || !started) {
        document.getElementById("msg").textContent = "Najpierw wybierz nazwę z listy po prawej!";
        return;
    }
    if (idx === currentIdx) {
        const obj = window.obiekty[idx];
        if (obj) {
            playHitAnimation(obj[1], obj[2], obj[3], obj[0]);
        }
        lastHitIdx = idx;
        pozostale = pozostale.filter(i => i !== idx);
        donePoints.unshift(idx);
        trafienia++;

        const msgEl = document.getElementById("msg");
        msgEl.textContent = "Dobrze!";
        msgEl.className = "msg-hit";
        setTimeout(() => {
            if (msgEl.className === "msg-hit") msgEl.className = "";
        }, 450);

        allowClick = false;
        currentIdx = null;
        selectedName = null;
        renderTaskList();
        renderMarkers();
        if (pozostale.length > 0) {
            selectName(pozostale[0]);
        } else {
            checkWin();
        }
    } else {
        pomylki++;
        time += 10;
        document.getElementById("timeValue").textContent = time;
        document.getElementById("msg").textContent = `Źle! +10s.`;
    }
}

function checkWin() {
    if (pozostale.length === 0) {
        stopTimer();
        const punkty = Math.round((trafienia * 1000) / (time + (pomylki * 10)));
        document.getElementById("msg").innerHTML =
            `Brawo, ${playerName}!<br>
            Punkty: <b>${punkty}</b><br>
            Trafienia: <b>${trafienia}</b> / ${liczbaObiektow}<br>
            Pomyłki: <b>${pomylki}</b><br>
            Czas: <b>${time}s</b>`;
        document.getElementById("restart").style.display = "";
        document.getElementById("endNow").disabled = true;
        document.getElementById("ranking").style.display = "";
        started = false;
        submitScore(playerName, punkty, time, trafienia, pomylki, liczbaObiektow, region, version);
        getBestScores();
    }
}

// ZMIANA: Punktacja za wcześniejsze zakończenie (kara jeśli nie wszystkie trafione)
document.getElementById("endNow").onclick = function() {
    if (!started) return;
    stopTimer();
    let punkty;
    if (trafienia < liczbaObiektow) {
        // Kara: mocno ograniczone punkty, proporcjonalnie do trafień (możesz ustawić punkty = 0 jeśli chcesz)
        punkty = Math.round((trafienia * 250) / (time + (pomylki * 10)));
    } else {
        // Standardowa punktacja gdy wszystkie obiekty odgadnięte
        punkty = Math.round((trafienia * 1000) / (time + (pomylki * 10)));
    }
    document.getElementById("msg").innerHTML =
        `Quiz zakończony wcześniej!<br>
        Punkty: <b>${punkty}</b><br>
        Trafienia: <b>${trafienia}</b> / ${liczbaObiektow}<br>
        Pomyłki: <b>${pomylki}</b><br>
        Czas: <b>${time}s</b>`;
    document.getElementById("restart").style.display = "";
    document.getElementById("endNow").disabled = true;
    document.getElementById("ranking").style.display = "";
    started = false;
    submitScore(playerName, punkty, time, trafienia, pomylki, liczbaObiektow, region, version);
    getBestScores();
};

function resetGame() {
    clearAllFx();
    lastHitIdx = null;
    stopTimer();
    document.getElementById("nameEntry").style.display = "";
    document.getElementById("timer").style.display = "none";
    document.getElementById("livesBox").style.display = "none";
    document.getElementById("showNamesLabel").style.display = "none";
    document.getElementById("endNow").style.display = "none";
    document.getElementById("tasklist").innerHTML = "";
    document.getElementById("msg").textContent = "";
    document.getElementById("restart").style.display = "none";
    document.getElementById("nextBtn").style.display = "none";
    document.getElementById("ranking").style.display = "none";
    started = false;
    currentIdx = null;
    selectedName = null;
    allowClick = false;
    pozostale = [];
    donePoints = [];
    setMapView(document.getElementById('mapRegion').value);
}

function submitScore(name, punkty, time, trafienia, pomylki, liczbaObiektow, region_, version_) {
    db.ref("scores/" + region_ + "/" + version_).push({name, punkty, time, trafienia, pomylki, liczbaObiektow});
}
function getBestScores() {
    region = document.getElementById('mapRegion').value || "europa";
    version = document.getElementById('mapVersion').value || "basic";
    db.ref("scores/" + region + "/" + version).orderByChild("punkty").limitToLast(10).once("value", snap => {
        const vals = [];
        snap.forEach(child => {
            vals.push(child.val());
        });
        vals.sort((a,b)=>b.punkty-a.punkty);
        renderRanking(vals, region, version);
    });
}
const regionNames = {
    europa: "Europa",
    azja: "Azja",
    ameryka: "Ameryka",
    australia: "Australia",
    afryka: "Afryka",
    polska: "Polska",
    swiat: "Świat (kontynenty)"
};

function renderRanking(scores, region_, version_) {
    let wersjaLabel = version_ === "ext" ? "Rozszerzona" : "Podstawowa";
    let regionLabel = regionNames[region_] || (region_.charAt(0).toUpperCase() + region_.slice(1));
    let html = `<h3>TOP 10 — ${regionLabel} (${wersjaLabel})</h3>
        <table>
        <tr>
            <th>Miejsce</th>
            <th>Imię</th>
            <th>Punkty</th>
            <th>Czas (s)</th>
            <th>Trafienia</th>
            <th>Pomyłki</th>
            <th>Obiektów</th>
        </tr>`;
    if (!scores || !scores.length) {
        html += `<tr><td colspan="7">Brak wyników</td></tr></table>`;
        document.getElementById("rankingTable").innerHTML = html;
        return;
    }
    scores.forEach((s, i) => {
        let trClass = (i==0) ? "top1" : (i==1) ? "top2" : (i==2) ? "top3" : "";
        html += `<tr class="${trClass}">
            <td>${i+1}</td>
            <td>${s.name}</td>
            <td>${s.punkty}</td>
            <td>${s.time}</td>
            <td>${s.trafienia}</td>
            <td>${s.pomylki || 0}</td>
            <td>${s.liczbaObiektow || ''}</td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById("rankingTable").innerHTML = html;
}

// Eventy UI
document.getElementById("startBtn").onclick = startGame;
document.getElementById("restart").onclick = resetGame;

document.getElementById("showNames").onchange = function() {
    showNames = this.checked;
    updateTimerSpeed();
    renderMarkers();
};

document.getElementById("mapRegion").onchange = function() {
    resetGame();
    getBestScores();
};
document.getElementById("mapVersion").onchange = function() {
    resetGame();
    getBestScores();
};

getBestScores();

window.onload = function() {
    setMapView(document.getElementById('mapRegion').value);
};