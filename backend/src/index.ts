import express from 'express';
import path from 'path';
import gameRouter from './routes/game';
import testRouter from './routes/test';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/game', gameRouter);

if (process.env.NODE_ENV === 'test') {
  app.use('/api/game', testRouter);
}

app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Reactor Rush backend running on port ${PORT}`);
});

export default app;
