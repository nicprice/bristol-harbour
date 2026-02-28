import { TrackerEngine } from './src/core/TrackerEngine.ts';
import { mockVessels, stops, bristolFerriesRoute } from './src/data/mockData.ts';

const e = new TrackerEngine(mockVessels, stops, bristolFerriesRoute.path);
(e as any).getCurrentTime = () => new Date('2026-02-28T14:22:26.000Z');
(e as any).updatePositions();
console.log((e as any).vessels.map((v: any) => ({ name: v.name, status: v.status, coords: v.currentCoords, nextStopId: v.nextStopId })));
