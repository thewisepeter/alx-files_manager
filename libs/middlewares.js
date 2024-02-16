import express from 'express';

/**
 * Add middleware to the given express application.
 * @param {express.Express} api The express application.
 */
const injectMiddleware = (api) => {
  api.use(express.json({ limit: '200mb' }));
};

export default injectMiddleware;
