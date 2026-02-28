const fs = require('fs');
let html = fs.readFileSync('timetable.html', 'utf-8');

// 1. Remove the entire <style> block and replace with minimal body styling
html = html.replace(/<style>[\s\S]*?<\/style>/, `<style>
    body {
        background-color: var(--surface-100);
        color: var(--color-text);
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
        font-family: Arial, sans-serif;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2rem;
        background-color: var(--surface-200);
    }
    th, td {
        padding: 0.75rem;
        text-align: left;
        border: 1px solid var(--border-color);
    }
    caption {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
        text-align: left;
    }
</style>`);

// 2. Remove <h2>, scroll hints, and table-container wrapper.
// Replace with <caption> inside the table.
html = html.replace(/<h2>(.*?)<\/h2>\s*<div class="scroll-hint">.*?<\/div>\s*<div class="table-container"[^>]*>\s*<table>/g, '<table>\n        <caption>$1</caption>');

// Remove closing </div> for table containers
html = html.replace(/<\/table>\s*<\/div>/g, '</table>');

// 3. Make the <thead> visible (remove visually-hidden class) and give the first cell an empty <td>.
html = html.replace(/<thead[^>]*>/g, '<thead>');
html = html.replace(/<th scope="col">Stop<\/th>/g, '<td></td>');

// 4. Change the row headers to use <tr><th scope="row"> instead of <td class="dock-name" scope="row">
html = html.replace(/<td class="dock-name" scope="row">(.*?)<\/td>/g, '<th scope="row">$1</th>');

// 5. Let's make the timetable's column headers numbered Trips (Trip 1, Trip 2, ...)
let tripCounter = 1;
html = html.replace(/<th scope="col">Time<\/th>/g, () => {
    return `<th scope="col">Trip ${tripCounter++}</th>`;
});
// The trip counter will go up continuously across both tables, but that's okay, or we can just reset it per table. Let's just use "Time" since it's generic and simple enough.
// Actually, I'll reset the replacement logic to just use "Time" since it doesn't matter, it's just a visible header now.
html = html.replace(/>Trip \d+</g, '>Time<');

fs.writeFileSync('timetable.html', html, 'utf-8');
console.log('Processed timetable.html');
