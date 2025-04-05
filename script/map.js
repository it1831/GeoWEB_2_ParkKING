//============================== Inicializace mapy ==============================
var mapOptions = {
    center: [49.829288, 18.168233], // Původní střed
    zoom: 13
};

var map = new L.map('map', mapOptions);
var basemap = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
map.addLayer(basemap);

//============================== Layer Groups ==============================
var pointLayer = L.layerGroup().addTo(map);
var lineLayer = L.layerGroup().addTo(map);
var polygonLayer = L.layerGroup().addTo(map);

// Funkce pro přidání GeoJSON dat do vrstev
function addGeoJSONToLayers(geojson) {
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
}

//============================== Načtení GeoJSON ==============================

// Načtení dat z data/map.geojson
fetch("data/map.geojson")
    .then(response => {
        if (!response.ok) {
            return { type: "FeatureCollection", features: [] }; // Pokud soubor neexistuje
        }
        return response.json();
    })
    .then(geojsonFromFile => {
        // Načtení dat z localStorage
        let geojsonFromLocalStorage = JSON.parse(localStorage.getItem('parkingData')) || {
            "type": "FeatureCollection",
            "features": []
        };

        // Kombinace dat z obou zdrojů
        let combinedGeojson = {
            "type": "FeatureCollection",
            "features": [...geojsonFromFile.features, ...geojsonFromLocalStorage.features]
        };

        // Přidání kombinovaných dat do vrstev
        addGeoJSONToLayers(combinedGeojson);

        // Přizpůsobení zobrazení podle dat
        if (combinedGeojson.features.length > 0) {
            const allLayers = L.featureGroup([pointLayer, lineLayer, polygonLayer]);
            map.fitBounds(allLayers.getBounds());
        }
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