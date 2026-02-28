import fs from 'fs';

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf8');
const genPath = fs.readFileSync('generated_path.ts', 'utf8');

// Replace everything between "export const routePath: Coordinates[] = [" and the closing "];"
const startPath = mockData.indexOf('export const routePath: Coordinates[] = [');
const endPath = mockData.indexOf('];', startPath) + 2;

if (startPath !== -1 && endPath !== -1) {
    mockData = mockData.slice(0, startPath) + genPath + mockData.slice(endPath);
}

// Now we need to update the stops array to take the exact coordinates of the closest point in routePath
function parseCoords(line) {
    const m = line.match(/lat:\s*([\d.-]+),\s*lon:\s*([\d.-]+)/);
    if (m) return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
    return null;
}

const pathCoords = [];
genPath.split('\n').forEach(line => {
    const c = parseCoords(line);
    if (c) pathCoords.push(c);
});

// Find and replace stops
const stopsMap = {
    'temple-meads': { lat: 51.451726, lon: -2.58149 }, // will match first approx
    'castle-park': { lat: 51.4566, lon: -2.5909 },
    'city-centre': { lat: 51.4508, lon: -2.5983 },
    'ss-great-britain': { lat: 51.4491, lon: -2.6083 },
    'mardyke': { lat: 51.4493, lon: -2.6123 },
    'hotwells': { lat: 51.4463, lon: -2.6173 }
};

function dist(p1, p2) {
    return Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2);
}

for (const [id, target] of Object.entries(stopsMap)) {
    let closest = pathCoords[0];
    let minDist = dist(target, closest);
    for (const p of pathCoords) {
        let d = dist(target, p);
        if (d < minDist) {
            minDist = d;
            closest = p;
        }
    }

    // regex replace inside stops array
    const stopRegex = new RegExp(`{ id: '${id}', name: '(.*?)', coords: {.*?}`, 'g');
    mockData = mockData.replace(stopRegex, `{ id: '${id}', name: '$1', coords: { lat: ${closest.lat}, lon: ${closest.lon} } }`);
}

fs.writeFileSync('src/data/mockData.ts', mockData);
console.log('Updated mockData.ts');
