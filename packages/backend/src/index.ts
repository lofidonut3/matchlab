import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/index.js';
import routes from './routes/index.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 MatchLab API server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
});

export default app;
