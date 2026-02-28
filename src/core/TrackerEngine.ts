import { Vessel, Stop, StopTime, Coordinates } from '../data/mockData';

export type VesselUpdateCallback = (vessels: Vessel[]) => void;

function calcDistance(p1: Coordinates, p2: Coordinates): number {
    const dx = p1.lon - p2.lon;
    const dy = p1.lat - p2.lat;
    return Math.sqrt(dx * dx + dy * dy);
}

function getSubPath(path: Coordinates[], start: Coordinates, end: Coordinates): Coordinates[] {
    // Find closest nodes in path to start and end
    let startIdx = 0;
    let endIdx = 0;
    let minStartDist = Infinity;
    let minEndDist = Infinity;

    for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const sd = calcDistance(p, start);
        if (sd < minStartDist) {
            minStartDist = sd;
            startIdx = i;
        }
        const ed = calcDistance(p, end);
        if (ed < minEndDist) {
            minEndDist = ed;
            endIdx = i;
        }
    }

    if (startIdx <= endIdx) {
        return path.slice(startIdx, endIdx + 1);
    } else {
        const sub = path.slice(endIdx, startIdx + 1);
        sub.reverse();
        return sub;
    }
}

function interpolateAlongSubPath(subPath: Coordinates[], progress: number): Coordinates {
    if (subPath.length === 0) return { lat: 0, lon: 0 };
    if (subPath.length === 1) return subPath[0];

    let totalDist = 0;
    const segments: number[] = [];
    for (let i = 0; i < subPath.length - 1; i++) {
        const d = calcDistance(subPath[i], subPath[i + 1]);
        segments.push(d);
        totalDist += d;
    }

    if (totalDist === 0) return subPath[0];

    const targetDist = totalDist * progress;
    let accumulated = 0;

    for (let i = 0; i < segments.length; i++) {
        const segDist = segments[i];
        if (accumulated + segDist >= targetDist) {
            const segProgress = segDist === 0 ? 0 : (targetDist - accumulated) / segDist;
            const p1 = subPath[i];
            const p2 = subPath[i + 1];
            return {
                lat: p1.lat + (p2.lat - p1.lat) * segProgress,
                lon: p1.lon + (p2.lon - p1.lon) * segProgress
            };
        }
        accumulated += segDist;
    }

    return subPath[subPath.length - 1]; // Fallback to last point
}

export class TrackerEngine {
    private vessels: Vessel[] = [];
    private stops: Map<string, Stop> = new Map();
    private routePath: Coordinates[];
    private updateCallbacks: VesselUpdateCallback[] = [];
    private updateInterval: number | null = null;
    private readonly REFRESH_RATE_MS = 1000;

    constructor(initialVessels: Vessel[], stops: Stop[], routePath: Coordinates[] = []) {
        this.vessels = [...initialVessels];
        stops.forEach(stop => this.stops.set(stop.id, stop));
        this.routePath = routePath;
    }

    /** Add a new vessel (e.g., from real-time GPS feed) */
    public addVessel(vessel: Vessel): void {
        this.vessels.push(vessel);
        this.notifyListeners();
    }

    public getCurrentTime(): Date {
        return new Date();
    }

    public start(): void {
        this.updatePositions(); // Initial update
        this.updateInterval = window.setInterval(() => {
            this.updatePositions();
        }, this.REFRESH_RATE_MS);
    }

    public stop(): void {
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    public onUpdate(callback: VesselUpdateCallback): void {
        this.updateCallbacks.push(callback);
    }

    public injectGpsReading(vesselId: string, coords: Coordinates, time: Date = new Date()): void {
        const vessel = this.vessels.find(v => v.id === vesselId);
        if (vessel) {
            vessel.positionSource = 'GPS';
            vessel.currentCoords = { ...coords };
            vessel.status = 'Live';
            vessel.lastUpdated = time.toISOString();
            this.notifyListeners();
        }
    }

    private updatePositions(): void {
        const currentTime = this.getCurrentTime();

        this.vessels.forEach(vessel => {
            if (vessel.positionSource === 'GPS') {
                // If we haven't received a GPS update in 2 minutes (120,000ms), fallback to timetable
                let isStale = false;
                if (vessel.lastUpdated) {
                    const lastUpd = new Date(vessel.lastUpdated).getTime();
                    if (currentTime.getTime() - lastUpd > 120000) {
                        isStale = true;
                    }
                } else {
                    isStale = true;
                }

                if (isStale) {
                    // Fallback to timetable interpolation
                    vessel.status = 'Estimated'; // mark as fallback
                    if (vessel.schedule) {
                        this.interpolateTimetablePosition(vessel, currentTime);
                    }
                } else {
                    vessel.status = 'Live';
                }
            } else if (vessel.positionSource === 'TIMETABLE' && vessel.schedule) {
                this.interpolateTimetablePosition(vessel, currentTime);
            }
        });

        this.notifyListeners();
    }

    private interpolateTimetablePosition(vessel: Vessel, currentTime: Date): void {
        const schedule = vessel.schedule!;

        let previousStop: StopTime | null = null;
        let nextStop: StopTime | null = null;

        for (let i = 0; i < schedule.length; i++) {
            const stopTime = schedule[i];
            const arrival = new Date(stopTime.arrivalTime);
            const departure = new Date(stopTime.departureTime);

            if (currentTime >= arrival && currentTime <= departure) {
                const stop = this.stops.get(stopTime.stopId);
                if (stop) {
                    vessel.currentCoords = { ...stop.coords };
                    vessel.status = stopTime.stopId.startsWith('mooring') ? 'Moored' : 'Scheduled';
                }
                // When docked, the NEXT stop is the following one in the schedule
                if (i + 1 < schedule.length) {
                    vessel.nextStopId = schedule[i + 1].stopId;
                    vessel.nextArrivalTime = schedule[i + 1].arrivalTime;
                } else {
                    vessel.nextStopId = undefined;
                    vessel.nextArrivalTime = undefined;
                }
                return;
            }

            if (currentTime < arrival) {
                nextStop = stopTime;
                vessel.nextStopId = nextStop.stopId;
                vessel.nextArrivalTime = nextStop.arrivalTime;
                if (i > 0) {
                    previousStop = schedule[i - 1];
                }
                break;
            }
        }

        if (previousStop && nextStop) {
            const prevDep = new Date(previousStop.departureTime).getTime();
            const nextArr = new Date(nextStop.arrivalTime).getTime();
            const curr = currentTime.getTime();

            const progress = (curr - prevDep) / (nextArr - prevDep);
            const clampedProgress = Math.max(0, Math.min(1, progress));

            const startStop = this.stops.get(previousStop.stopId);
            const endStop = this.stops.get(nextStop.stopId);

            if (startStop && endStop) {
                const subPath = getSubPath(this.routePath, startStop.coords, endStop.coords);
                vessel.currentCoords = interpolateAlongSubPath(subPath, clampedProgress);
                vessel.status = 'Estimated';
            }
        } else if (!nextStop && schedule.length > 0) {
            const lastStop = schedule[schedule.length - 1];
            const stop = this.stops.get(lastStop.stopId);
            if (stop) {
                vessel.currentCoords = { ...stop.coords };
                vessel.status = lastStop.stopId.startsWith('mooring') ? 'Moored' : 'Scheduled';
            }
        } else if (!previousStop && schedule.length > 0) {
            const firstStop = schedule[0];
            const stop = this.stops.get(firstStop.stopId);
            if (stop) {
                vessel.currentCoords = { ...stop.coords };
                vessel.status = firstStop.stopId.startsWith('mooring') ? 'Moored' : 'Scheduled';
            }
        }
    }

    private notifyListeners(): void {
        const copy = JSON.parse(JSON.stringify(this.vessels));
        this.updateCallbacks.forEach(cb => cb(copy));
    }
}
