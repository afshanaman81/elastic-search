module.exports = class ElasticSearchError extends Error {
  constructor(type, message, code, ...params) {
    // Pass remaining arguments to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ElasticSearchError);
    }

    // custom information
    this.name = this.constructor.name;
    this.type = type;
    this.message = message || {};
    this.httpCode = code || 500;
  }
};
