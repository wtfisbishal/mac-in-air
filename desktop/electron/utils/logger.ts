const LOG_PREFIX = '[DesktopAgent]';

export function logInfo(context: string, message: string, data?: any) {
  console.log(`${LOG_PREFIX} [${context}] ${message}`, data ?? '');
}

export function logError(context: string, message: string, error?: any) {
  console.error(`${LOG_PREFIX} [${context}] ERROR: ${message}`, error ?? '');
}

export function logWarn(context: string, message: string, data?: any) {
  console.warn(`${LOG_PREFIX} [${context}] WARN: ${message}`, data ?? '');
}
