const https = require('https');

const overpassQuery = `
  [out:json][timeout:25];
  area["name"="Bristol"]->.searchArea;
  (
    node["amenity"="ferry_terminal"](area.searchArea);
    way["amenity"="ferry_terminal"](area.searchArea);
    node["public_transport"="station"]["station"="ferry"](area.searchArea);
    way["public_transport"="station"]["station"="ferry"](area.searchArea);
    node["man_made"="pier"]["mooring"="ferry"](area.searchArea);
    node["man_made"="pier"](51.445,-2.62,51.456,-2.58);
  );
  out center;
`;

const options = {
    hostname: 'overpass-api.de',
    path: `/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
    method: 'GET',
    headers: {
        'User-Agent': 'NodeJS/BristolHarbourFerryTracker'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.elements) {
                parsed.elements.forEach(el => {
                    const lat = el.lat || (el.center && el.center.lat);
                    const lon = el.lon || (el.center && el.center.lon);
                    const name = el.tags ? el.tags.name : 'Unknown';
                    console.log(`Name: ${name}, Lat: ${lat}, Lon: ${lon}, Tags:`, el.tags);
                });
            } else {
                console.log("No elements found.");
            }
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });
});

req.on('error', (e) => {
    console.error("Request failed:", e);
});

req.end();
