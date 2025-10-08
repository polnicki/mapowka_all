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
    "Kanał" : "#8B008B"
};

let lives, currentIdx, pozostale, markers, selectedName, allowClick, donePoints;
let timerInterval, time, started, playerName;
let showNames = false;
let timeIncrement = 1;

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
        polska: {center: [52, 19], zoom: 6}
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
    donePoints.forEach(idx => {
        const typ = window.obiekty[idx][3];
        const li = document.createElement("li");
        li.innerHTML = `${geoIconHTML(typ)}${window.obiekty[idx][0]}`;
        li.className = "done";
        list.appendChild(li);
    });
    document.getElementById("nextBtn").style.display = (started && currentIdx !== null && pozostale.length > 0) ? "" : "none";
}

function startTimer() {
    document.getElementById("timer").style.display = "";
    time = 0;
    document.getElementById("timeValue").textContent = time;
    stopTimer();
    timeIncrement = showNames ? 3 : 1;
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
        document.getElementById("livesBox").style.display = "";
        document.getElementById("showNamesLabel").style.display = "";
        document.getElementById("endNow").style.display = "";
        document.getElementById("endNow").disabled = false;
        lives = 15;
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
        document.getElementById("lives").textContent = lives;
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

function markerClicked(idx) {
    if (!allowClick || currentIdx === null || !started) {
        document.getElementById("msg").textContent = "Najpierw wybierz nazwę z listy po prawej!";
        return;
    }
    if (idx === currentIdx) {
        pozostale = pozostale.filter(i => i !== idx);
        donePoints.unshift(idx);
        trafienia++;
        document.getElementById("msg").textContent = "Dobrze!";
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
        lives--;
        pomylki++;
        time += 10;
        document.getElementById("lives").textContent = lives;
        document.getElementById("timeValue").textContent = time;
        document.getElementById("msg").textContent = `Źle! +10s. Pozostało żyć: ${lives}`;
        if (lives <= 0) {
            document.getElementById("msg").textContent = "Koniec gry! Spróbuj ponownie.";
            document.getElementById("restart").style.display = "";
            document.getElementById("endNow").disabled = true;
            stopTimer();
            started = false;
        }
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

document.getElementById("endNow").onclick = function() {
    if (!started) return;
    stopTimer();
    const punkty = Math.round((trafienia * 1000) / (time + (pomylki * 10)));
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
function renderRanking(scores, region_, version_) {
    let wersjaLabel = version_ === "ext" ? "Rozszerzona" : "Podstawowa";
    let html = `<h3>TOP 10 — ${region_.charAt(0).toUpperCase() + region_.slice(1)} (${wersjaLabel})</h3>
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