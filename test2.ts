import { mockVessels } from './src/data/mockData.ts';
const now = new Date('2026-02-28T14:22:26Z');
const sched = mockVessels[0].schedule;
console.log('Now:', now.toISOString());
console.log('First stop:', sched[0].arrivalTime);
console.log('Last stop:', sched[sched.length - 1].arrivalTime);

const currentStop = sched.find(s => now >= new Date(s.arrivalTime) && now <= new Date(s.departureTime));
console.log('currentStop:', currentStop);
const nextStop = sched.find(s => now < new Date(s.arrivalTime));
console.log('nextStop:', nextStop);
