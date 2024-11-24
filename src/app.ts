import cors from 'cors';
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import httpStatus from 'http-status';
import { createServer } from 'node:http';
import { WEB_CACHE } from './config/config';
import morganLogger from './middleware/morganLogger';
import { stripeWebhook } from './modules/payment/stripeWebhook';
import router from './routes/route';
import socketServer from './socket/socket-server';
import globalError from './middleware/globalError';
import moment from 'moment';
import sendResponse from './libs/sendResponse';
import './scheduler_task/scheduler';

// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 100, // Limit each IP to 100 requests per windowMs
// });

const app: Application = express();

const httpServer = createServer(app);

// init socket server
socketServer.registerSocketServer(httpServer);

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://dev.mahfujurrahm535.com',
    'https://mahfujurrahm535.com',
    'https://mr-project-fiverr-system.vercel.app',
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

// middlewares
app.use(express.json());
app.use(cors(corsOptions));

// Apply morganLogger before other middlewares
app.use(morganLogger);

app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// app.use(limiter);
app.set('etag', WEB_CACHE);
app.use('/api/v1', router);


app.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Middleware to handle CORS headers for unsupported routes
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

app.get('/', async (req: Request, res: Response) => {
  try {
    const formattedDate = moment().format('DD MMMM YYYY hh.mm A');
    res.send(formattedDate);
  } catch (error) {
    res.send(error);
  }
});

app.all('*', (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.NOT_FOUND,
    success: false,
    message: 'Address not found',
    error: [
      {
        path: req.originalUrl,
        message: 'API Not Found',
      },
    ],
  });
});

app.use(globalError);

export default httpServer;
