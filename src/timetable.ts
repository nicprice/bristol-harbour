import './style.css';
import { mockVessels, stops } from './data/mockData';

function renderBoatTimetable(vesselId: string, containerId: string) {
    const vessel = mockVessels.find(v => v.id === vesselId);
    const container = document.querySelector(`#${containerId} .table-wrapper`);
    if (!vessel || !container || !vessel.schedule) return;

    let html = `<table class="sequential-timetable">
        <thead>
            <tr>
                <th scope="col">Time</th>
                <th scope="col">Stop</th>
            </tr>
        </thead>
        <tbody>`;

    vessel.schedule.forEach((item) => {
        const stopName = stops.find(s => s.id === item.stopId)?.name || item.stopId;
        const date = new Date(item.arrivalTime);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        html += `<tr>
            <td data-time-ms="${date.getTime()}" class="time-cell">${timeStr}</td>
            <td class="stop-cell">${stopName}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function updateHighlighting() {
    const now = Date.now();

    // Clear existing
    document.querySelectorAll('.next-stop-highlight').forEach(el => {
        el.classList.remove('next-stop-highlight');
    });

    mockVessels.forEach(vessel => {
        if (!vessel.schedule) return;

        // Find the next upcoming arrival
        let nextArrival = vessel.schedule.find(s => new Date(s.arrivalTime).getTime() >= now);

        // If between days or finished today, highlight the very first stop (usually first of tomorrow)
        if (!nextArrival) {
            nextArrival = vessel.schedule[0];
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
