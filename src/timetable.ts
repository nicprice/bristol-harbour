import './style.css';
import { mockVessels, stops } from './data/mockData';
import { getBoatTimetableHtml } from './ui/timetableRenderer';

function renderBoatTimetable(vesselId: string, containerId: string) {
    const vessel = mockVessels.find(v => v.id === vesselId);
    const container = document.querySelector(`#${containerId} .table-wrapper`);
    if (!vessel || !container || !vessel.schedule) return;

    // Progressive enhancement: only render if empty
    if (container.innerHTML.trim() === '') {
        container.innerHTML = getBoatTimetableHtml(vessel, stops);
    }
}

function updateHighlighting() {
    const now = Date.now();

    // Clear existing
    document.querySelectorAll('.next-stop-highlight').forEach(el => {
        el.classList.remove('next-stop-highlight');
    });

    mockVessels.forEach(vessel => {
        if (!vessel.schedule) return;

        // Find the next upcoming arrival (excluding moorings)
        let nextArrival = vessel.schedule.find(s =>
            !s.stopId.startsWith('mooring') &&
            new Date(s.arrivalTime).getTime() >= now
        );

        // If between days or finished today, highlight the very first passenger stop
        if (!nextArrival) {
            nextArrival = vessel.schedule.find(s => !s.stopId.startsWith('mooring'));
        }

        if (nextArrival) {
            const arrivalMs = new Date(nextArrival.arrivalTime).getTime();
            // Find the cell in this boat's table that matches this timestamp
            const containerId = vessel.name === 'Matilda' ? 'matilda-timetable' : 'brigantia-timetable';
            const cell = document.querySelector(`#${containerId} .time-cell[data-time-ms="${arrivalMs}"]`);
            if (cell) {
                cell.classList.add('next-stop-highlight');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderBoatTimetable('ferry-1', 'matilda-timetable');
    renderBoatTimetable('ferry-2', 'brigantia-timetable');
    updateHighlighting();
    setInterval(updateHighlighting, 30000);
});
