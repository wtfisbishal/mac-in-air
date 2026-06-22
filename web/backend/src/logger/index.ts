import { logger } from './loki';

export const loggerInfo = (message: string, opt?: any) => {
    if (!logger) {
        return;
    }
    if (opt) {
        logger.info(message, opt);
    } else {
        logger.info(message);
    }
};

export const loggerError = (message: string, opt?: any) => {
    if (!logger) {
        return;
    }
    if (opt) {
        logger.error(message, opt);
    } else {
        logger.error(message);
    }
};

export const loggerWarning = (message: string, opt?: any) => {
    if (!logger) {
        return;
    }
    if (opt) {
        logger.warn(message, opt);
    } else {
        logger.warn(message);
    }
};