import fs from 'fs';

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf8');

// We have land coordinates, we put them into the 'stops' array.
// But we still have our detailed routePath.
// TrackerEngine needs to know how to map a Stop to a Route Node so that it knows where the ferry is on the water when it is "at" a stop.
// The easiest and cleanest way to do this is to add a `waterNodeId` or `waterNodeIndex` to the Stop interface.
// Alternatively, since our 'routePath' currently directly references 'stops[i].coords' at the boundary waypoints,
// if we change stops[i].coords to land coordinates, the routePath will BREAK (the boats will travel over land to reach the stops).
// So what we must do is:
// 1. Give `Stop` a `landCoords` property for rendering the marker.
// 2. Keep `coords` as the water coordinates for routing.
// This is perfectly aligned with the spec and the real world (node on the water, marker on the land).

const landCoordsData = {
    'temple-meads': { lat: 51.4516, lon: -2.5815 },
    'castle-park': { lat: 51.4558, lon: -2.5881 },
    'city-centre': { lat: 51.4536, lon: -2.5975 }, // Centre is closer to 51.4536, -2.5975 than the cascade steps
    'ss-great-britain': { lat: 51.44917, lon: -2.6084 },
    'mardyke': { lat: 51.4501, lon: -2.6105 },
    'hotwells': { lat: 51.4469, lon: -2.6148 }
};

// Update Stop interface
mockData = mockData.replace(
    /export interface Stop \{\n    id: string;\n    name: string;\n    coords: Coordinates;\n\}/g,
    `export interface Stop {\n    id: string;\n    name: string;\n    coords: Coordinates; // Water coordinate for routing\n    landCoords?: Coordinates; // Land coordinate for marker rendering\n}`
);

// Update Stops array
for (const [id, landCoord] of Object.entries(landCoordsData)) {
    // Find the stop object
    const r = new RegExp(`({ id: '${id}', name: '[^']+', coords: { lat: [\\d.-]+, lon: [\\d.-]+ } )}`);
    mockData = mockData.replace(r, `$1, landCoords: { lat: ${landCoord.lat}, lon: ${landCoord.lon} } }`);
}

fs.writeFileSync('src/data/mockData.ts', mockData);
console.log("Updated mockData.ts with landCoords");
