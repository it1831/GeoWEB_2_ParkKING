//============================== Inicializace mapy ==============================
var mapOptions = {
    center: [49.829288, 18.168233], // Původní střed
    zoom: 13
};

var map = new L.map('map', mapOptions);
var basemap = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
map.addLayer(basemap);

// Samostatné vrstvy pro různé typy geometrie
var pointLayer = L.layerGroup().addTo(map);
var lineLayer = L.layerGroup().addTo(map);
var polygonLayer = L.layerGroup().addTo(map);

// Funkce pro opravu nevalidního GeoJSON
function fixGeoJSON(geojson) {
    if (!geojson || !geojson.features) return geojson;
    geojson.features = geojson.features.map(feature => {
        if (feature.geometry && feature.geometry.tyspe) {
            feature.geometry.type = feature.geometry.tyspe;
            delete feature.geometry.tyspe;
            console.warn("Opraven překlep 'tyspe' na 'type' v geometrii:", feature.properties.name);
        }
        return feature;
    });
    return geojson;
}

// Funkce pro přidání GeoJSON dat do příslušných vrstev
function addGeoJSONToLayers(geojson) {
    pointLayer.clearLayers();
    lineLayer.clearLayers();
    polygonLayer.clearLayers();

    if (!geojson || !Array.isArray(geojson.features)) {
        console.error("Neplatný GeoJSON objekt:", geojson);
        return;
    }

    geojson.features.forEach(feature => {
        try {
            let targetLayer;
            switch (feature.geometry.type) {
                case "Point":
                    targetLayer = pointLayer;
                    break;
                case "LineString":
                    targetLayer = lineLayer;
                    break;
                case "Polygon":
                    targetLayer = polygonLayer;
                    break;
                default:
                    console.warn("Neznámý typ geometrie:", feature.geometry.type);
                    return;
            }

            L.geoJSON(feature, {
                onEachFeature: function(feat, layer) {
                    let props = feat.properties || {};
                    let popupContent = `<b>${props.name || "Bez názvu"}</b><br>`;
                    
                    if (props.image) {
                        popupContent += `<img src="${props.image}" width="150" height="100"><br>`;
                    }
                    if (props.description) {
                        popupContent += `${props.description}<br>`;
                    }

                    if (feat.geometry.type === "Point") {
                        const coords = feat.geometry.coordinates;
                        const lat = coords[1];
                        const lng = coords[0];
                        popupContent += `
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank">Navigace (Google Maps)</a><br>
                            <a href="https://mapy.cz/zakladni?source=coor&id=${lng},${lat}" target="_blank">Zobrazit v Mapy.cz</a>
                        `;
                    }

                    layer.bindPopup(popupContent);
                    if (props.name) {
                        layer.bindTooltip(props.name, { permanent: false, direction: "right" });
                    }
                },
                filter: function(feat) {
                    const featureType = feat.properties?.typ;
                    return !featureType || filters[featureType] === true;
                }
            }).addTo(targetLayer);
        } catch (e) {
            console.error("Chyba při zpracování feature:", feature, e);
        }
    });
}

// Načtení GeoJSON
let combinedGeojson = {
    "type": "FeatureCollection",
    "features": []
};

function loadAndCombineGeoJSON() {
    fetch("data/map.geojson")
        .then(response => {
            if (!response.ok) {
                console.warn("Soubor map.geojson nenalezen, vracím prázdný GeoJSON");
                return { type: "FeatureCollection", features: [] };
            }
            return response.json();
        })
        .then(geojsonFromFile => {
            let geojsonFromLocalStorage;
            try {
                geojsonFromLocalStorage = JSON.parse(localStorage.getItem('parkingData')) || {
                    "type": "FeatureCollection",
                    "features": []
                };
            } catch (e) {
                console.warn("Chyba při parsování localStorage, použiji prázdný objekt:", e);
                geojsonFromLocalStorage = { "type": "FeatureCollection", "features": [] };
            }

            const fileFeatures = Array.isArray(geojsonFromFile.features) ? geojsonFromFile.features : [];
            const localFeatures = Array.isArray(geojsonFromLocalStorage.features) ? geojsonFromLocalStorage.features : [];

            combinedGeojson = {
                "type": "FeatureCollection",
                "features": [...fileFeatures, ...localFeatures]
            };

            combinedGeojson = fixGeoJSON(combinedGeojson);
            addGeoJSONToLayers(combinedGeojson);

            if (combinedGeojson.features.length > 0) {
                const bounds = L.featureGroup([pointLayer, lineLayer, polygonLayer]).getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds);
                }
            }
        })
        .catch(err => console.error("Chyba při načítání GeoJSON:", err));
}

// Filtrování podle typu (školní, nemocnice, atd.)
const filters = {
    'školní': true,
    'nemocnice': true,
    'obchody': true,
    'otevřené': true
};

// Kontrolní panel filtrů podle typu
const filterControl = L.control({ position: 'topright' });
filterControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'filter-control leaflet-bar');
    div.innerHTML = `
        <div style="background:white; padding:10px;">
            <label><input type="checkbox" class="filter-checkbox" value="školní" checked> Školní</label><br>
            <label><input type="checkbox" class="filter-checkbox" value="nemocnice" checked> Nemocnice</label><br>
            <label><input type="checkbox" class="filter-checkbox" value="obchody" checked> Obchody</label><br>
            <label><input type="checkbox" class="filter-checkbox" value="otevřené" checked> Otevřené</label><br>
        </div>
    `;

    L.DomEvent.disableClickPropagation(div);
    
    div.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            filters[this.value] = this.checked;
            addGeoJSONToLayers(combinedGeojson);
        });
    });

    return div;
};
filterControl.addTo(map);

// Přidání posluchačů pro tlačítka zobrazení/schování vrstev
document.getElementById('togglePoints').addEventListener('change', function() {
    if (this.checked) {
        map.addLayer(pointLayer);
    } else {
        map.removeLayer(pointLayer);
    }
});

document.getElementById('toggleLines').addEventListener('change', function() {
    if (this.checked) {
        map.addLayer(lineLayer);
    } else {
        map.removeLayer(lineLayer);
    }
});

document.getElementById('togglePolygons').addEventListener('change', function() {
    if (this.checked) {
        map.addLayer(polygonLayer);
    } else {
        map.removeLayer(polygonLayer);
    }
});

// Inicializace mapy
loadAndCombineGeoJSON();