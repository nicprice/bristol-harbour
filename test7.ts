import { TrackerEngine } from './src/core/TrackerEngine.ts';
import { mockVessels, stops, bristolFerriesRoute } from './src/data/mockData.ts';

const e = new TrackerEngine(mockVessels, stops, bristolFerriesRoute.path);

const testTimes = ['2026-02-28T14:22:26Z', '2026-02-28T14:35:00Z', '2026-02-28T14:45:00Z'];

for (const time of testTimes) {
    (e as any).getCurrentTime = () => new Date(time);
    (e as any).updatePositions();
    console.log(`At ${time}:`);
    console.log(JSON.stringify((e as any).vessels.map((v: any) => v.currentCoords), null, 2));
}
