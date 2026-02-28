import { mockVessels } from './src/data/mockData.ts';
const now = new Date('2026-02-28T14:22:26Z');
for (const v of mockVessels) {
    const currentStop = v.schedule!.find(s => now >= new Date(s.arrivalTime) && now <= new Date(s.departureTime));
    const nextStop = v.schedule!.find(s => now < new Date(s.arrivalTime));
    const prevStopIndex = v.schedule!.indexOf(nextStop!) - 1;
    const prevStop = prevStopIndex >= 0 ? v.schedule![prevStopIndex] : null;
    console.log(v.name);
    console.log('  prev:', prevStop?.stopId, prevStop?.departureTime);
    console.log('  curr:', currentStop?.stopId);
    console.log('  next:', nextStop?.stopId, nextStop?.arrivalTime);
}
