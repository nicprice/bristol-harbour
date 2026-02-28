import { stops, bristolFerriesRoute } from './src/data/mockData.ts';
const cc = stops.find(s => s.id === 'city-centre');
const ww = stops.find(s => s.id === 'wapping-wharf');
console.log('CC:', cc.coords);
console.log('WW:', ww.coords);

const calcDistance = (p1: any, p2: any) => Math.sqrt((p1.lon - p2.lon) ** 2 + (p1.lat - p2.lat) ** 2);
function getSubPath(path: any[], start: any, end: any) {
    let startIdx = 0; let endIdx = 0;
    let minStartDist = Infinity; let minEndDist = Infinity;
    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const sd = calcDistance(p, start);
        if (sd < minStartDist) { minStartDist = sd; startIdx = i; }
        const ed = calcDistance(p, end);
        if (ed < minEndDist) { minEndDist = ed; endIdx = i; }
    }
    if (startIdx <= endIdx) { return path.slice(startIdx, endIdx + 1); }
    else { const sub = path.slice(endIdx, startIdx + 1); sub.reverse(); return sub; }
}

const subPath = getSubPath(bristolFerriesRoute.path, cc!.coords, ww!.coords);
console.log('Subpath:', subPath);
