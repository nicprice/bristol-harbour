import { TrackerEngine } from './src/core/TrackerEngine.ts';
import { mockVessels, stops, bristolFerriesRoute } from './src/data/mockData.ts';

const e = new TrackerEngine(mockVessels, stops, bristolFerriesRoute.path);

const cc = stops.find(s => s.id === 'city-centre');
const ww = stops.find(s => s.id === 'wapping-wharf');

// We have access to the internals if we dupe it, but wait, `test3.ts` showed coords WERE computed:
// [ { lat: 51.449, lon: -2.598 }, { lat: 51.448, lon: -2.598 } ]
console.log(cc?.coords, ww?.coords);
