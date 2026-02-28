import https from 'https';
import fs from 'fs';

const query = `
[out:json][timeout:25];
// fetch area "Bristol" to search
area[name="Bristol"]->.searchArea;
// gather results
(
  // query part for: "route=ferry"
  way["route"="ferry"](area.searchArea);
  relation["route"="ferry"](area.searchArea);
);
// print results
out body;
>;
out skel qt;
`;

const postData = JSON.stringify({ data: query });
// The above is if we want to send it just via simple string it's easier to just form encoded it

const q = encodeURIComponent(`
[out:json];
(
  way["route"="ferry"](51.44,-2.63,51.46,-2.57);
);
out body;
>;
out skel qt;
`);

const options = {
    hostname: 'overpass-api.de',
    port: 443,
    path: `/api/interpreter?data=${q}`,
    method: 'GET',
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            fs.writeFileSync('osm_ferry.json', JSON.stringify(json, null, 2));
            console.log('Saved to osm_ferry.json', json.elements.length, 'elements');

            const ways = json.elements.filter(e => e.type === 'way');
            console.log('Found', ways.length, 'ways');
            for (const w of ways) {
                console.log('Way', w.id, w.tags?.name);
            }
        } catch (err) {
            console.error(err);
            console.log('Data:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});
req.end();
