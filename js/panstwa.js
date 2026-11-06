let currentIdx, pozostale, markers, selectedName, allowClick, donePoints;
let timerInterval, time, started, playerName;
let showNames = false;
let timeIncrement = 1;
let lastHitIdx = null;
let activeFxMarkers = [];

let trafienia = 0;
let pomylki = 0;
let region = "europa";
let quizMode = "panstwa";
let version = "basic";
let liczbaObiektow = 0;

window.obiekty = [];
window.panstwaData = [];

var map = L.map('map').setView([54, 15], 4);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_53ep_1_2a8fc576dd606b500308b16b', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

function setMapView(region_) {
    const views = {
        europa: {center: [54, 15], zoom: 4},
        azja: {center: [35, 90], zoom: 3},
        afryka: {center: [2, 20], zoom: 3},
        "ameryka-pn": {center: [40, -100], zoom: 3},
        "ameryka-pd": {center: [-15, -60], zoom: 3},
        australia: {center: [-25, 135], zoom: 4},
        swiat: {center: [20, 10], zoom: 2}
    };
    const v = views[region_] || views.europa;
    map.setView(v.center, v.zoom);
}

function icon(typ) {
    let size = (window.innerWidth < 700) ? 32 : 24;
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

function shuffle(array) {
    let a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function loadObiekty(region_, version_, callback) {
    const filename = `data/panstwa-${region_}${version_ === 'ext' ? '-ext' : ''}.js`;
    const oldScript = document.getElementById('obiektyScript');
    if (oldScript) oldScript.remove();

    window.panstwaData = [];
    window.obiekty = [];

    const script = document.createElement('script');
    script.src = filename;
    script.id = 'obiektyScript';
    script.onload = () => {
        window.obiekty = [];
        if (window.panstwaData) {
            window.panstwaData.forEach(item => {
                if (quizMode === 'panstwa' || quizMode === 'miks') {
                    window.obiekty.push([item.country, item.cLat, item.cLng, "Państwo"]);
                }
                if (quizMode === 'stolice' || quizMode === 'miks') {
                    window.obiekty.push([item.capital + " (" + item.country + ")", item.capLat, item.capLng, "Stolica"]);
                }
            });
        }
        callback();
    };
    script.onerror = () => {
        alert('Brak danych dla wybranego regionu/wersji!');
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
    quizMode = document.getElementById('quizMode').value;
    version = document.getElementById('mapVersion').value;

    loadObiekty(region, version, () => {
        setMapView(region);
        document.getElementById("nameEntry").style.display = "none";
        document.getElementById("timer").style.display = "";
        document.getElementById("livesBox").style.display = "none";
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
    const prefix = window.obiekty[idx][3] === "Państwo" ? "państwo" : "stolicę";
    document.getElementById("msg").innerHTML = `Kliknij na mapie ${prefix}: <b>${selectedName}</b>`;
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

    return `
        <div class="hit-fx-box fx-pop">
            <div class="fx-icon-actor">${iconImg}</div>
            ${ringHtml}
            ${particlesHtml}
            ${tagHtml}
        </div>
    `;
}

function animateHit(lat, lng, typ, name) {
    const iconData = geoTypeIcon[typ] || geoTypeIcon["domyslna"];
    const colorMap = {
        "Państwo": "#FF4136",
        "Stolica": "#FFD700"
    };
    const color = colorMap[typ] || "#0074D9";
    const size = (window.innerWidth < 700) ? 36 : 28;

    let selectedAnim = document.getElementById("animTypeSelect").value;
    const animTypes = ['shatter', 'pop', 'vortex', 'rocket', 'splat', 'ghost'];
    let animType = selectedAnim;
    if (animType === 'random') {
        animType = animTypes[Math.floor(Math.random() * animTypes.length)];
    }

    const fxHtml = generateFxHtml(animType, typ, iconData, color, size, name);
    const fxIcon = L.divIcon({
        className: 'custom-fx-icon',
        html: fxHtml,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    });

    const fxMarker = L.marker([lat, lng], { icon: fxIcon, zIndexOffset: 1000 }).addTo(map);
    activeFxMarkers.push(fxMarker);

    setTimeout(() => {
        try {
            if (map && map.hasLayer(fxMarker)) {
                map.removeLayer(fxMarker);
            }
        } catch (e) {}
    }, 1200);
}

function markerClicked(idx) {
    if (!started || !allowClick) return;
    const p = window.obiekty[idx];
    if (idx === currentIdx) {
        trafienia++;
        allowClick = false;
        lastHitIdx = idx;
        animateHit(p[1], p[2], p[3], p[0]);

        const posIdx = pozostale.indexOf(idx);
        if (posIdx > -1) pozostale.splice(posIdx, 1);
        donePoints.unshift(idx);

        document.getElementById("msg").innerHTML = `<span style="color:#2ECC40;">Trafiono: <b>${p[0]}</b>!</span>`;

        if (pozostale.length > 0) {
            currentIdx = pozostale[0];
            selectName(currentIdx);
        } else {
            currentIdx = null;
            selectedName = null;
            stopTimer();
            document.getElementById("msg").innerHTML = `<span style="color:#0074D9; font-size:1.2em;">Gratulacje! Ukończyłeś zadanie w czasie ${time}s! 🏆</span>`;
            document.getElementById("nextBtn").style.display = "none";
            document.getElementById("restart").style.display = "";
            document.getElementById("endNow").disabled = true;
            document.getElementById("ranking").style.display = "";
            started = false;
            submitScore(playerName, trafienia, time, trafienia, pomylki, liczbaObiektow, region, quizMode, version);
        }
        renderMarkers();
        renderTaskList();
    } else {
        pomylki++;
        document.getElementById("msg").innerHTML = `<span style="color:#FF4136;">Błędny wybór (${p[0]}). Szukaj dalej: <b>${selectedName}</b></span>`;
    }
}

document.getElementById("endNow").onclick = function() {
    if (!started) return;
    stopTimer();
    let punkty = trafienia;
    document.getElementById("msg").innerHTML = `<span style="color:#FF4136;">Zakończono przed czasem. Trafienia: ${punkty}/${liczbaObiektow}, Czas: ${time}s</span>`;
    document.getElementById("restart").style.display = "";
    document.getElementById("endNow").disabled = true;
    document.getElementById("ranking").style.display = "";
    started = false;
    submitScore(playerName, punkty, time, trafienia, pomylki, liczbaObiektow, region, quizMode, version);
};

document.getElementById("restart").onclick = function() {
    document.getElementById("nameEntry").style.display = "";
    document.getElementById("timer").style.display = "none";
    document.getElementById("livesBox").style.display = "none";
    document.getElementById("showNamesLabel").style.display = "none";
    document.getElementById("endNow").style.display = "none";
    document.getElementById("restart").style.display = "none";
    document.getElementById("ranking").style.display = "none";
    document.getElementById("nextBtn").style.display = "none";
    document.getElementById("msg").textContent = "";
    clearAllFx();
    if (markers) markers.forEach(m => map.removeLayer(m));
    markers = [];
    window.obiekty = [];
    document.getElementById("tasklist").innerHTML = "";
};

document.getElementById("showNames").onchange = function() {
    showNames = this.checked;
    updateTimerSpeed();
    renderMarkers();
};

function updateTimerSpeed() {
    timeIncrement = showNames ? 2 : 1;
}

function submitScore(name, punkty, time, trafienia, pomylki, liczbaObiektow, region_, mode_, version_) {
    db.ref("scores/panstwa/" + region_ + "/" + mode_ + "/" + version_).push({
        name, punkty, time, trafienia, pomylki, liczbaObiektow
    }, (error) => {
        if (!error) {
            getBestScores(region_, mode_, version_);
        }
    });
}

function getBestScores(region_, mode_, version_) {
    db.ref("scores/panstwa/" + region_ + "/" + mode_ + "/" + version_).orderByChild("punkty").limitToLast(10).once("value", snap => {
        const vals = [];
        snap.forEach(child => {
            vals.push(child.val());
        });
        vals.sort((a,b) => {
            if (b.punkty !== a.punkty) return b.punkty - a.punkty;
            return a.time - b.time;
        });
        renderRanking(vals, region_, mode_, version_);
    });
}

const regionNames = {
    europa: "Europa",
    azja: "Azja",
    afryka: "Afryka",
    "ameryka-pn": "Ameryka Północna",
    "ameryka-pd": "Ameryka Południowa",
    australia: "Australia i Oceania",
    swiat: "Świat"
};

const modeNames = {
    panstwa: "Zgadywanie Państw",
    stolice: "Zgadywanie Stolic",
    miks: "Państwa i Stolice"
};

function renderRanking(scores, region_, mode_, version_) {
    let wersjaLabel = version_ === "ext" ? "Rozszerzona" : "Podstawowa";
    let regionLabel = regionNames[region_] || region_;
    let modeLabel = modeNames[mode_] || mode_;

    let html = `<h3>Wyniki: ${regionLabel} (${modeLabel} - ${wersjaLabel})</h3><table>`;
    html += `<tr><th>Miejsce</th><th>Gracz</th><th>Punkty</th><th>Czas</th><th>Trafienia</th><th>Pomyłki</th></tr>`;

    if (!scores || !scores.length) {
        html += `<tr><td colspan="6">Brak wyników</td></tr></table>`;
        document.getElementById("rankingTable").innerHTML = html;
        return;
    }

    scores.forEach((s, idx) => {
        let cls = "";
        if (idx === 0) cls = "top1";
        else if (idx === 1) cls = "top2";
        else if (idx === 2) cls = "top3";

        html += `<tr class="${cls}">
            <td>${idx + 1}</td>
            <td>${escapeHtml(s.name)}</td>
            <td><b>${s.punkty}</b></td>
            <td>${s.time}s</td>
            <td>${s.trafienia}</td>
            <td>${s.pomylki}</td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById("rankingTable").innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.getElementById("startBtn").onclick = startGame;
