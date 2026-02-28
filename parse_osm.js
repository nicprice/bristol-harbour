import fs from 'fs';

const data = JSON.parse(fs.readFileSync('osm_ferry.json', 'utf8'));

// nodes map
const nodes = {};
data.elements.forEach(el => {
    if (el.type === 'node') {
        nodes[el.id] = { lat: el.lat, lon: el.lon };
    }
});

const ways = data.elements.filter(el => el.type === 'way');

// Target route ways in order (approx)
// Temple Quay - Castle Park : 1409467466
// Castle Park - City Centre : 37034144
// City Centre - Wapping Wharf : 36992083
// Wapping Wharf - SS Great Britain : 1409467467
// SS Great Britain - Mardyke : 26199120
// Mardyke - The Cottage : 26199027

const orderedWayIds = [
    1409467466,
    37034144,
    36992083,
    1409467467,
    26199120,
    26199027
];

const fullPath = [];
const seenNodes = new Set();

for (const wid of orderedWayIds) {
    const way = ways.find(w => w.id === wid);
    if (!way) {
        console.error("Missing way", wid);
        continue;
    }

    // Check if we need to reverse the way to connect to previous
    let nodesInWay = way.nodes;
    if (fullPath.length > 0) {
        const lastNodeId = fullPath[fullPath.length - 1].id;
        if (nodesInWay[nodesInWay.length - 1] === lastNodeId) {
            nodesInWay = [...nodesInWay].reverse();
        }
    }

    for (const nid of nodesInWay) {
        if (!seenNodes.has(nid)) {
            const coord = nodes[nid];
            fullPath.push({ id: nid, ...coord });
            seenNodes.add(nid);
        }
    }
}

// Generate the output TS format
console.log('export const routePath: Coordinates[] = [');
for (const p of fullPath) {
    console.log(`    { lat: ${p.lat}, lon: ${p.lon} }, // node ${p.id}`);
}
console.log('];');
