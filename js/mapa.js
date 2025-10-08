// Kolory dla typów obiektów
const kolory = {
    "Morze": "#2072c7",
    "Cieśnina": "#4caf50",
    "Półwysep": "#ff9800",
    "Zatoka": "#9c27b0",
    "Wyspa": "#e91e63",
    "Rzeka": "#009688",
    "Jezioro": "#2196f3",
    "Nizina": "#757575",
    "Wyżyna": "#6d4c41",
    "Góry": "#263238"
};

let lives, currentIdx, pozostale, markers, selectedName, allowClick, donePoints;
let timerInterval, time, started, playerName;
let showNames = false;
let timeIncrement = 1; // ile sekund dodajemy za każde "tyknięcie"

// Zmienna na obiekty mapy (ładowana dynamicznie)
window.obiekty = []; // Używaj window.obiekty do nadpisywania z ładowanego skryptu

// Mapa Leaflet
var map = L.map('map').setView([54, 15], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

// Funkcja do zmiany widoku mapy według regionu
function setMapView(region) {
    const views = {
        europa: {center: [54, 15], zoom: 4},
        azja: {center: [50, 90], zoom: 3},
        ameryka: {center: [15, -75], zoom: 3},
        australia: {center: [-25, 134], zoom: 4},
        afryka: {center: [2, 20], zoom: 4},
        polska: {center: [52, 19], zoom: 6}
    };
    const v = views[region] || views.europa;
    map.setView(v.center, v.zoom);
}

// Wygląd markerów, większy na smartfonach
function icon(color) {
    let size = (window.innerWidth < 700) ? 32 : 16;
    return L.divIcon({
        className: "custom-icon",
        iconSize: [size, size],
        html: `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff"></span>`
    });
}

// Renderowanie markerów na mapie
function renderMarkers() {
    if (markers) markers.forEach(m => map.removeLayer(m));
    markers = [];
    window.obiekty.forEach((p, idx) => {
        if (!pozostale.includes(idx)) return;
        const marker = L.marker([p[1], p[2]], { icon: icon(kolory[p[3]]) });
        marker.addTo(map)
            .on("click", () => markerClicked(idx))
            .on("touchstart", () => markerClicked(idx));
        if (showNames) marker.bindTooltip(p[0], {permanent:false});
        markers.push(marker);
    });
}

// Renderowanie listy zadań
function renderTaskList() {
    const list = document.getElementById("tasklist");
    list.innerHTML = "";
    pozostale.forEach(idx => {
        const typ = window.obiekty[idx][3];
        const kolor = kolory[typ];
        const li = document.createElement("li");
        li.textContent = window.obiekty[idx][0];
        li.style.color = kolor;
        li.onclick = () => selectName(idx);
        li.ontouchstart = () => selectName(idx);
        li.className = (idx === currentIdx) ? "selected" : "";
        list.appendChild(li);
    });
    donePoints.forEach(idx => {
        const typ = window.obiekty[idx][3];
        const kolor = kolory[typ];
        const li = document.createElement("li");
        li.textContent = window.obiekty[idx][0];
        li.style.color = kolor;
        li.className = "done";
        list.appendChild(li);
    });
}

// Timer gry – nie restartujemy czasu!
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

// Funkcja do zmiany tempa timera (bez restartu czasu)
function updateTimerSpeed() {
    // Po prostu zmieniamy wartość timeIncrement
    timeIncrement = showNames ? 2 : 1;
}

// Losowa kolejność zadań
function shuffle(array) {
    let a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Dynamiczne ładowanie obiektów mapy
function loadObiekty(region, version, callback) {
    const filename = `data/obiekty-${region}${version === 'ext' ? '-ext' : ''}.js`;

    // Usuń poprzedni skrypt obiektów jeśli jest
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

// Rozpoczęcie gry (po wyborze regionu i wersji)
function startGame() {
    playerName = document.getElementById("playerName").value.trim();
    if (!playerName) {
        alert("Podaj imię gracza!");
        return;
    }
    const region = document.getElementById('mapRegion').value;
    const version = document.getElementById('mapVersion').value;

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
        document.getElementById("lives").textContent = lives;
        document.getElementById("msg").textContent = "";
        document.getElementById("restart").style.display = "none";
        renderTaskList();
        renderMarkers();
        startTimer();
    });
}

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
    started = false;
    getBestScores();
    setMapView(document.getElementById('mapRegion').value);
}

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
        document.getElementById("msg").textContent = "Dobrze!";
        allowClick = false;
        currentIdx = null;
        selectedName = null;
        renderTaskList();
        renderMarkers();
        checkWin();
    } else {
        lives--;
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
        document.getElementById("msg").textContent = `Brawo, ${playerName}! Twój czas: ${time}s`;
        document.getElementById("restart").style.display = "";
        document.getElementById("endNow").disabled = true;
        started = false;
        submitScore(playerName, time);
        getBestScores();
    }
}

document.getElementById("endNow").onclick = function() {
    if (!started) return;
    stopTimer();
    document.getElementById("msg").textContent = `Quiz zakończony wcześniej! Wynik: ${time}s, odgadnięto ${donePoints.length}/${window.obiekty.length}.`;
    document.getElementById("restart").style.display = "";
    document.getElementById("endNow").disabled = true;
    started = false;
    submitScore(playerName, time);
    getBestScores();
};

function submitScore(name, time) {
    db.ref("scores").push({name, time: Number(time)});
}
function getBestScores() {
    db.ref("scores").orderByChild("time").limitToFirst(10).once("value", snap => {
        const vals = [];
        snap.forEach(child => {
            vals.push(child.val());
        });
        renderRanking(vals);
    });
}
function renderRanking(scores) {
    let html = `<table>
        <tr><th>Miejsce</th><th>Imię</th><th>Czas (s)</th></tr>`;
    if (!scores || !scores.length) {
        html += `<tr><td colspan="3">Brak wyników</td></tr></table>`;
        document.getElementById("rankingTable").innerHTML = html;
        return;
    }
    scores.sort((a,b)=>a.time-b.time);
    scores.forEach((s, i) => {
        let trClass = (i==0) ? "top1" : (i==1) ? "top2" : (i==2) ? "top3" : "";
        html += `<tr class="${trClass}"><td>${i+1}</td><td>${s.name}</td><td>${s.time}</td></tr>`;
    });
    html += `</table>`;
    document.getElementById("rankingTable").innerHTML = html;
}

// Eventy UI
document.getElementById("startBtn").onclick = startGame;
document.getElementById("restart").onclick = resetGame;

// Zmiana checkboxa w trakcie gry – tylko zmiana tempa timera, bez restartu!
document.getElementById("showNames").onchange = function() {
    showNames = this.checked;
    updateTimerSpeed();
    renderMarkers();
};

// Zmiana mapy/wersji resetuje grę
document.getElementById("mapRegion").onchange = resetGame;
document.getElementById("mapVersion").onchange = resetGame;

// Ranking od razu po załadowaniu
getBestScores();

// Ustaw domyślny widok na start
window.onload = function() {
    setMapView(document.getElementById('mapRegion').value);
};