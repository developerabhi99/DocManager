import express from 'express';
import path from 'path';

import cors from 'cors';
import router from './src/Route/index.js';

const app = express();

app.use(cors());

app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use('/api', router);

app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
