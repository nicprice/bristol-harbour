import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockVessels, stops } from '../src/data/mockData';
import { getBoatTimetableHtml } from '../src/ui/timetableRenderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSsrTimetable() {
    const htmlPath = path.resolve(__dirname, '../timetable.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    const matilda = mockVessels.find(v => v.id === 'ferry-1')!;
    const brigantia = mockVessels.find(v => v.id === 'ferry-2')!;

    const matildaHtml = getBoatTimetableHtml(matilda, stops);
    const brigantiaHtml = getBoatTimetableHtml(brigantia, stops);

    // Replace the specific container contents in the HTML
    // We search for the <div class="table-wrapper"> inside the sections
    const matildaMatch = /<section id="matilda-timetable"[^>]*>[\s\S]*?<div class="table-wrapper">([\s\S]*?)<\/div>/;
    const brigantiaMatch = /<section id="brigantia-timetable"[^>]*>[\s\S]*?<div class="table-wrapper">([\s\S]*?)<\/div>/;

    html = html.replace(matildaMatch, (match, p1) => {
        return match.replace(p1, `\n                ${matildaHtml}\n            `);
    });

    html = html.replace(brigantiaMatch, (match, p1) => {
        return match.replace(p1, `\n                ${brigantiaHtml}\n            `);
    });

    fs.writeFileSync(htmlPath, html);
    console.log('Successfully injected SSR timetable HTML into timetable.html');
}

generateSsrTimetable().catch(console.error);
