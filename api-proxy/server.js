const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const { getMarketData } = require('./coingecko');


// Register Swagger
const swaggerFile = fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8')
const swaggerDocument = yaml.parse(swaggerFile)

fastify.register(require('@fastify/swagger'), {
  mode: 'static',
  specification: {
    document: swaggerDocument,
  }
})

fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/documentation',
})

// Mock data conforming to the UnifiedTicker and UnifiedKline schemas
const mockTicker = {
  symbol: 'SPY',
  name: 'S&P 500 ETF',
  category: 'index',
  price: 500.50,
  change: 5.00,
  changePercent: 1.00,
  timestamp: Date.now(),
};

const mockKline = {
  time: new Date(Date.now() - (24 * 60 * 60 * 1000)).getTime(),
  open: 495.00,
  high: 501.00,
  low: 494.50,
  close: 500.50,
  volume: 100000000,
};

// Routes
fastify.get('/markets', async (request, reply) => {
  const { category } = request.query;

  if (category === 'crypto') {
    const data = await getMarketData();
    return data;
  }

  // Return mock data for other categories for now
  return [mockTicker];
});

fastify.get('/ticker', async (request, reply) => {
  return mockTicker;
});

fastify.get('/kline', async (request, reply) => {
  return [mockKline];
});

fastify.get('/search', async (request, reply) => {
  return [mockTicker];
});

// Start the server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
