//============================== Inicializace mapy ==============================
var mapOptions = {
    center: [49.829288, 18.168233],
    zoom: 13
};

var map = new L.map('map', mapOptions);
var basemap = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
map.addLayer(basemap);

//============================== Layer Groups ==============================
var pointLayer = L.layerGroup().addTo(map);
var lineLayer = L.layerGroup().addTo(map);
var polygonLayer = L.layerGroup().addTo(map);

//============================== Načtení GeoJSON ==============================

fetch("data/map.geojson")
    .then(response => response.json())
    .then(geojson => {
        L.geoJSON(geojson, {
            onEachFeature: function (feature, layer) {
                let props = feature.properties || {};
                let popupContent = `<b>${props.name || "Bez názvu"}</b><br>`;
                if (props.image) {
                    popupContent += `<img src="${props.image}" width="150" height="100"><br>`;
                }
                if (props.description) {
                    popupContent += `${props.description}<br>`;
                }

                if (feature.geometry.type === "Point") {
                    const coords = feature.geometry.coordinates;
                    const lat = coords[1];
                    const lng = coords[0];
                    const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                    const mapyCzLink = `https://mapy.cz/zakladni?source=coor&id=${lng},${lat}`;

                    popupContent += `
                        <a href="${googleMapsNavUrl}" target="_blank">Navigace (Google Maps)</a><br>
                        <a href="${mapyCzLink}" target="_blank">Zobrazit v Mapy.cz</a>
                    `;
                }

                layer.bindPopup(popupContent);
                if (props.name) {
                    layer.bindTooltip(props.name, { permanent: false, direction: "right" });
                }

                // Přidání do správné vrstvy
                switch (feature.geometry.type) {
                    case "Point":
                        pointLayer.addLayer(layer);
                        break;
                    case "LineString":
                        lineLayer.addLayer(layer);
                        break;
                    case "Polygon":
                    case "MultiPolygon":
                        polygonLayer.addLayer(layer);
                        break;
                }
            }
        });
    })
    .catch(err => console.error("Chyba při načítání GeoJSON:", err));

//============================== Filtrování vrstev ==============================

document.getElementById("togglePoints").addEventListener("change", function () {
    this.checked ? map.addLayer(pointLayer) : map.removeLayer(pointLayer);
});

document.getElementById("toggleLines").addEventListener("change", function () {
    this.checked ? map.addLayer(lineLayer) : map.removeLayer(lineLayer);
});

document.getElementById("togglePolygons").addEventListener("change", function () {
    this.checked ? map.addLayer(polygonLayer) : map.removeLayer(polygonLayer);
});
