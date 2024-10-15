import express, { type Request, type Response, type Application, type NextFunction } from 'express'
import cors from 'cors'
import httpStatus from "http-status";
import helmet from 'helmet';
import { WEB_CACHE } from './config/config';
import router from './routes/route';
import socketServer from './socket/socket-server';
import { createServer } from 'node:http'
import rateLimit from "express-rate-limit";
import morganLogger from './middleware/morganLogger';


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
});

const app: Application = express()
export const httpServer = createServer(app);


// init socket server
socketServer.registerSocketServer(httpServer);


const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://dev.mahfujurrahm535.com',
        'https://mahfujurrahm535.com',
        'https://mr-project-fiverr-system.vercel.app'
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

// middlewares
app.use(cors(corsOptions));

// Apply morganLogger before other middlewares
app.use(morganLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet())

app.use(limiter);
app.set('etag', WEB_CACHE);
app.use('/api/v1', router)

// Middleware to handle CORS headers for unsupported routes
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
})

// Middleware to handle 404 (Not Found) errors
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Not Found",
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API Not Found",
            },
        ],
        statusCode: httpStatus.NOT_FOUND,
    });
    next();
});
