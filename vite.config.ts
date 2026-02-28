import { defineConfig } from 'vite';

export default defineConfig({
    base: '/bristol-harbour/',
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                timetable: 'timetable.html',
            }
        }
    }
});
