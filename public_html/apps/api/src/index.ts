// Load environment variables FIRST
import './config/env.js';

import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
    try {
        await app.listen({ port: PORT, host: HOST });
        app.log.info(`🚀 API server running at http://${HOST}:${PORT}`);
        app.log.info(`📚 API docs available at http://${HOST}:${PORT}/docs`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
