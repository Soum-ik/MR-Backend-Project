import express, { type Request, type Response, type Application, type NextFunction } from 'express'
import cors from 'cors'
import httpStatus from "http-status";
import helmet from 'helmet';
import { PORT } from './config/config';
import router from './routes/route';

// 
const app: Application = express()

const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://mr-project-fiverr-system.vercel.app'
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

// middlewares
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
}),)



// Web cache validation and conditional requests in Http
// app.set('etag', WEB_CACHE);


app.use('/api/v1', router)

app.get('/', (req: Request, res: Response) => {
    return res.json({message : "Hello world"})
})

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




app.listen(PORT, async () => {
    try {
        // await dbConnection();
        console.log(`Application listening on port ${PORT}`);
    } catch (error) {
        console.error('Error connecting to the database', error);
        process.exit(1);
    }
});