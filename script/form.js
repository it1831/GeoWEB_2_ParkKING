document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("featureForm");

    // Načtení existujícího GeoJSON souboru
    fetch('data/map.geojson')
        .then(response => {
            if (!response.ok) {
                return { type: "FeatureCollection", features: [] }; // Pokud soubor neexistuje, vrátí prázdný GeoJSON
            }
            return response.json();
        })
        .then(initialGeojson => {
            // Načtení dat z localStorage nebo použití prázdného GeoJSON
            let geojsonData = JSON.parse(localStorage.getItem('parkingData')) || {
                "type": "FeatureCollection",
                "features": []
            };

            // Kombinace původních dat z map.geojson s daty z localStorage
            geojsonData.features = [...initialGeojson.features, ...geojsonData.features];
            localStorage.setItem('parkingData', JSON.stringify(geojsonData)); // Uložení kombinovaných dat

            form.addEventListener("submit", function (e) {
                e.preventDefault();

                // Získání hodnot z formuláře
                const type = document.getElementById("type").value;
                const name = document.getElementById("name").value;
                const description = document.getElementById("description").value;
                const image = document.getElementById("image").value;
                const coordinatesInput = document.getElementById("coordinates").value.trim();

                // Převod souřadnic na pole [lng, lat]
                const coordPairs = coordinatesInput.split(";").map(pair => {
                    const [lat, lng] = pair.trim().split(",").map(Number);
                    if (isNaN(lat) || isNaN(lng)) {
                        throw new Error("Neplatné souřadnice");
                    }
                    return [lng, lat]; // GeoJSON formát = [lng, lat]
                });

                // Validace podle typu
                if (type === "point" && coordPairs.length !== 1) {
                    alert("Bod musí mít přesně jednu dvojici souřadnic!");
                    return;
                } else if (type === "line" && coordPairs.length < 2) {
                    alert("Linie musí mít alespoň dvě dvojice souřadnic!");
                    return;
                } else if (type === "polygon" && coordPairs.length < 3) {
                    alert("Polygon musí mít alespoň tři dvojice souřadnic!");
                    return;
                }

                // Vytvoření geometrie podle typu
                let geometry = {};
                if (type === "point") {
                    geometry = {
                        type: "Point",
                        coordinates: coordPairs[0]
                    };
                } else if (type === "line") {
                    geometry = {
                        type: "LineString",
                        coordinates: coordPairs
                    };
                } else if (type === "polygon") {
                    geometry = {
                        type: "Polygon",
                        coordinates: [coordPairs]
                    };
                }

                // Vytvoření GeoJSON objektu
                const feature = {
                    type: "Feature",
                    geometry: geometry,
                    properties: {
                        name: name || "Bez názvu",
                        description: description || "",
                        image: image || "",
                        type: type
                    }
                };

                // Načtení aktuálních dat z localStorage
                let updatedGeojsonData = JSON.parse(localStorage.getItem('parkingData')) || {
                    "type": "FeatureCollection",
                    "features": []
                };

                // Přidání nového objektu
                updatedGeojsonData.features.push(feature);

                // Uložení zpět do localStorage
                localStorage.setItem('parkingData', JSON.stringify(updatedGeojsonData));

                // Výpis do konzole pro kontrolu
                console.log("✅ Nový GeoJSON objekt:");
                console.log(JSON.stringify(feature, null, 2));
                alert("Objekt přidán! Zobrazí se na mapě.");
                form.reset();
            });
        })
        .catch(error => {
            console.error("Chyba při načítání map.geojson:", error);
            alert("Nepodařilo se načíst map.geojson, pokračujeme s prázdnými daty.");
        });
});