import express from 'express';

import cors from 'cors';
import router from './src/Route/index.js';

const app = express();

app.use(cors());

app.use(express.json());   

app.use('/api', router);

app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
