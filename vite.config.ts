import { defineConfig } from 'vite';

export default defineConfig({
    base: '/bristol-harbour/',
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                map: 'map.html',
                timetable: 'timetable.html',
                nearest: 'nearest.html'
            }
        }
    }
});
