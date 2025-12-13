const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const { getMarketData, getKlineData, getCoinList } = require('./coingecko');
const { getGlobalIndices, getMetalsData, getFxData, searchAssets } = require('./alphavantage');


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

// Mock data
const mockFuture = {
  symbol: 'CL',
  name: 'Crude Oil Future',
  category: 'future',
  price: 80.50,
  change: 1.25,
  changePercent: 1.57,
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

  let data = [];
  switch (category) {
    case 'crypto':
      data = await getMarketData();
      break;
    case 'index':
      data = await getGlobalIndices();
      break;
    case 'metal':
      data = await getMetalsData();
      break;
    case 'fx':
      data = await getFxData();
      break;
    case 'future':
      data = [mockFuture]; // Mock data for futures
      break;
    default:
      reply.code(400).send({ error: 'Invalid or missing category' });
      return;
  }

  return data;
});

fastify.get('/ticker', async (request, reply) => {
    const { symbol, category } = request.query;
    if (!symbol) {
        reply.code(400).send({ error: 'Missing required query parameter: symbol' });
        return;
    }

    // This is a simplified implementation. A real app would have a more robust
    // way to look up tickers from different sources.
    const allMarkets = await Promise.all([
        getMarketData(),
        getGlobalIndices(),
        getMetalsData(),
        getFxData(),
        [mockFuture],
    ]).then(results => results.flat());

    const ticker = allMarkets.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());

    if (ticker) {
        return ticker;
    } else {
        reply.code(404).send({ error: `Ticker ${symbol} not found` });
    }
});

fastify.get('/kline', async (request, reply) => {
    const { symbol, interval, category } = request.query;

    if (!symbol || !interval) {
        reply.code(400).send({ error: 'Missing required query parameters: symbol, interval' });
        return;
    }

    if (category === 'crypto') {
        const coinList = await getCoinList();
        if (!coinList) {
            reply.code(500).send({ error: 'Could not fetch coin list' });
            return;
        }
        const coinId = coinList.get(symbol.toUpperCase());

        if (coinId) {
            const days = interval.includes('d') ? '365' : interval.includes('h') ? '30' : '1';
            const data = await getKlineData(coinId, days);
            if (data) {
                return data;
            } else {
                reply.code(404).send({ error: `Kline data not found for symbol ${symbol}` });
                return;
            }
        } else {
            reply.code(404).send({ error: `Symbol ${symbol} not found` });
            return;
        }
    }

    return [mockKline];
});

fastify.get('/search', async (request, reply) => {
    const { query } = request.query;
    if (!query) {
        reply.code(400).send({ error: 'Missing required query parameter: query' });
        return;
    }
    const data = await searchAssets(query);
    return data;
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
