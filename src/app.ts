import express,{ Request, Response }  from 'express';
import cors from 'cors';
import { MongoService } from './services/mongo.service';
import { initSampleRoutes } from './routes/sample.routes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

class App {
    public app: express.Application;
    private mongoService: MongoService;

    constructor() {
        this.app = express();
        this.mongoService = new MongoService(
            process.env['MONGODB_URI'] || 'mongodb://localhost:27017'
        );
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares(): void {
        // Security headers
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // CORS configuration
        const corsOptions: cors.CorsOptions = {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) return callback(null, true);

                const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
                    'http://localhost'
                ];

                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-API-Key'
            ],
            credentials: true,
            maxAge: 86400 // 24 hours
        };

        this.app.use(cors(corsOptions));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 50, // Limit each IP to 100 requests per windowMs
            message: {
                success: false,
                message: 'Too many requests from this IP, please try again later'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        // Apply rate limiting to API routes
        this.app.use('/api', limiter);

        // Stricter rate limiting for POST requests
        const createLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // Limit each IP to 10 create requests per windowMs
            message: {
                success: false,
                message: 'Too many creation requests, please try again later'
            }
        });

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging middleware
        this.app.use((req: Request, res: Response, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
            next();
        });

        // Apply stricter rate limiting to POST routes
        this.app.use('/api/data', (req: Request, res: Response, next) => {
            if (req.method === 'POST') {
                createLimiter(req, res, next);
            } else {
                next();
            }
        });
    }

    private initializeRoutes(): void {
        initSampleRoutes(this.app, this.mongoService);
    }

    public async start(port: number): Promise<void> {
        try {
            await this.mongoService.connect();

            this.app.listen(port, () => {
                console.log(`Server is running on port ${port}`);
                console.log(`Health check: http://localhost:${port}/health`);
                console.log(`API endpoints: http://localhost:${port}/api/data`);
            });

            process.on('SIGINT', async () => {
                console.log('\nReceived SIGINT. Gracefully shutting down...');
                await this.mongoService.disconnect();
                process.exit(0);
            });

        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}

export default App;