document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("featureForm");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const type = document.getElementById("type").value;
        const name = document.getElementById("name").value;
        const description = document.getElementById("description").value;
        const image = document.getElementById("image").value;

        const coordinatesInput = document.getElementById("coordinates").value.trim();
        const coordPairs = coordinatesInput.split(";").map(pair => {
            const [lat, lng] = pair.trim().split(",").map(Number);
            return [lng, lat]; // GeoJSON formát = [lng, lat]
        });

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

        const feature = {
            type: "Feature",
            geometry: geometry,
            properties: {
                name: name,
                description: description,
                image: image,
                type: type
            }
        };

        console.log("✅ Nový GeoJSON objekt:");
        console.log(JSON.stringify(feature, null, 2));
        alert("Objekt vygenerován! Zkontroluj konzoli (F12).");
        form.reset();
    });
});
