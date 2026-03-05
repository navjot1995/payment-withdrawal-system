import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import logger from '../utils/logger.js';

const securityMiddleware = {
    // Basic security headers
    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }),

    // Prevent MongoDB injection
    sanitize: mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            logger.warn(`Potential injection attempt blocked: ${key}`);
        }
    }),

    // Validate content type
    validateContentType: (req, res, next) => {
        if (req.method === 'POST' || req.method === 'PUT') {
            const contentType = req.headers['content-type'];
            if (!contentType || !contentType.includes('application/json')) {
                return res.status(415).json({
                    error: 'Unsupported Media Type',
                    message: 'Content-Type must be application/json'
                });
            }
        }
        next();
    },

    // Input validation middleware
    validateInput: (schema) => {
        return (req, res, next) => {
            const { error } = schema.validate(req.body, { abortEarly: false });

            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }));

                return res.status(400).json({
                    error: 'Validation Error',
                    details: errors
                });
            }

            next();
        };
    },

    // Request ID middleware
    requestId: (req, res, next) => {
        req.requestId = req.headers['x-request-id'] ||
            req.headers['x-correlation-id'] ||
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        res.setHeader('X-Request-ID', req.requestId);
        next();
    },

    // IP whitelist for admin endpoints
    ipWhitelist: (allowedIps) => {
        return (req, res, next) => {
            const clientIp = req.ip || req.connection.remoteAddress;

            if (!allowedIps.includes(clientIp)) {
                logger.warn(`Blocked access from unauthorized IP: ${clientIp}`);
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Access denied from this IP address'
                });
            }

            next();
        };
    },

    // Audit logging
    auditLog: (req, res, next) => {
        const startTime = Date.now();

        logger.info('Incoming request', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id
        });

        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const responseTime = Date.now() - startTime;

            logger.info('Request completed', {
                requestId: req.requestId,
                statusCode: res.statusCode,
                responseTime,
                userId: req.user?.id
            });

            originalEnd.call(this, chunk, encoding);
        };

        next();
    }
};

export default securityMiddleware;