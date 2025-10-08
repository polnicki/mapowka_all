// Map typ obiektu na nazwę klasy CSS i plik ikony SVG
const geoTypeIcon = {
  "Morze":      { cls: "color-morze",      file: "icons/morze.svg" },
  "Cieśnina":   { cls: "color-ciesnina",   file: "icons/ciesnina.svg" },
  "Półwysep":   { cls: "color-polwysep",   file: "icons/polwysep.svg" },
  "Zatoka":     { cls: "color-zatoka",     file: "icons/zatoka.svg" },
  "Wyspa":      { cls: "color-wyspa",      file: "icons/wyspa.svg" },
  "Rzeka":      { cls: "color-rzeka",      file: "icons/rzeka.svg" },
  "Jezioro":    { cls: "color-jezioro",    file: "icons/jezioro.svg" },
  "Nizina":     { cls: "color-nizina",     file: "icons/nizina.svg" },
  "Wyżyna":     { cls: "color-wyzyna",     file: "icons/wyzyna.svg" },
  "Góry":       { cls: "color-gory",       file: "icons/gory.svg" },
  "Rów":        { cls: "color-row",        file: "icons/row.svg" },
  "Mierzeja":   { cls: "color-mierzeja",   file: "icons/mierzeja.svg" },
  "Zalew":      { cls: "color-zalew",      file: "icons/zalew.svg" },
  "Pobrzeże":   { cls: "color-pobrzeze",   file: "icons/pobrzeze.svg" },
  "Pojezierze": { cls: "color-pojezierze", file: "icons/pojezierze.svg" },
  "Kotlina":    { cls: "color-kotlina",    file: "icons/kotlina.svg" },
  "Ocean":      { cls: "color-ocean",      file: "icons/ocean.svg" },
  "Przylądek":  { cls: "color-przyladek",  file: "icons/przyladek.svg" },
  "Pustynia":   { cls: "color-pustynia",   file: "icons/pustynia.svg" },
  "Kanał":      { cls: "color-kanal",      file: "icons/kanal.svg" }
};

// Dynamiczny generator HTML <img> z odpowiednią klasą CSS
function geoIconHTML(typ, size=24) {
  const icon = geoTypeIcon[typ] || geoTypeIcon["Morze"];
  return `<img class="icon-geopoint ${icon.cls}" src="${icon.file}" style="width:${size}px;height:${size}px;" alt="${typ}">`;
}

// Przykład użycia w JS (lista zadań):
// li.innerHTML = `${geoIconHTML(window.obiekty[idx][3])}${window.obiekty[idx][0]}`;

// Przykład użycia w Leaflet:
// L.marker([lat, lon], { icon: L.divIcon({
//   className: 'custom-icon',
//   html: geoIconHTML(typ, 32)
// })});