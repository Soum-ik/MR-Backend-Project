import { Server } from 'http';
import { httpServer } from './app';
import { PORT, NODE_ENV } from './config/config';
import { print } from './helper/colorConsolePrint.ts/colorizedConsole';

let server: Server;


async function main() {
    try {
        server = httpServer.listen(PORT, () => {
            if (NODE_ENV === "development") {
                print.green(
                    `✔ Server started at http://localhost:${PORT}`,
                );
            } else {
                print.green(`✔ Server started at ${PORT} `);
            }
        });
    } catch (err) {
        print.red('Error starting server:', err);
    }

    // handle unHandledRejection
    process.on('unhandledRejection', (err) => {
        print.red('UNHANDLED REJECTION... 💥. Process Terminated', err);

        if (server) {
            server.close(() => {
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });
}

main();


// handle uncaughtExceptions
process.on('uncaughtException', (err) => {
    print.red('Uncaught Exception...😓. Process Terminated', err);
    process.exit(1);
});


process.on('SIGTERM', (err) => {
    print.yellow('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        print.red('💥 Process terminated!', err);
        process.exit(1);
    });
});