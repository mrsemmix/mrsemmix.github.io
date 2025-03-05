/**
 * Simple logger utility for consistent logging format
 */

// Log levels
const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

// Current log level (can be changed at runtime)
let currentLogLevel = process.env.LOG_LEVEL || "INFO";

// Log level priority
const LOG_PRIORITY = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * Set the current log level
 * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
 */
function setLogLevel(level) {
  if (LOG_LEVELS[level]) {
    currentLogLevel = level;
    info("Logger", `Log level set to ${level}`);
  } else {
    error("Logger", `Invalid log level: ${level}`);
  }
}

/**
 * Check if a log level should be displayed
 * @param {string} level - Log level to check
 * @returns {boolean} - Whether the log should be displayed
 */
function shouldLog(level) {
  return LOG_PRIORITY[level] <= LOG_PRIORITY[currentLogLevel];
}

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
function formatLog(level, module, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${module}] ${message}`;
}

/**
 * Log an error message
 * @param {string} module - Module name
 * @param {string} message - Log message
 */
function error(module, message) {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    console.error(formatLog(LOG_LEVELS.ERROR, module, message));
  }
}

/**
 * Log a warning message
 * @param {string} module - Module name
 * @param {string} message - Log message
 */
function warn(module, message) {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(formatLog(LOG_LEVELS.WARN, module, message));
  }
}

/**
 * Log an info message
 * @param {string} module - Module name
 * @param {string} message - Log message
 */
function info(module, message) {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log(formatLog(LOG_LEVELS.INFO, module, message));
  }
}

/**
 * Log a debug message
 * @param {string} module - Module name
 * @param {string} message - Log message
 */
function debug(module, message) {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.log(formatLog(LOG_LEVELS.DEBUG, module, message));
  }
}

module.exports = {
  LOG_LEVELS,
  setLogLevel,
  error,
  warn,
  info,
  debug,
};
