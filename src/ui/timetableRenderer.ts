import { Vessel, Stop, StopTime } from '../data/mockData';

export function getBoatTimetableHtml(vessel: Vessel, stops: Stop[]) {
    if (!vessel || !vessel.schedule) return '';

    let html = `<table class="sequential-timetable">
        <thead>
            <tr>
                <th scope="col">Time</th>
                <th scope="col">Stop</th>
            </tr>
        </thead>
        <tbody>`;

    vessel.schedule.forEach((item: StopTime) => {
        const stopName = stops.find(s => s.id === item.stopId)?.name || item.stopId;
        const date = new Date(item.arrivalTime);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        html += `<tr>
            <td data-time-ms="${date.getTime()}" class="time-cell">${timeStr}</td>
            <td class="stop-cell">${stopName}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    return html;
}
