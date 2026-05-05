import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static built files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve rasmlar (HD images)
app.use('/rasmlar', express.static(path.join(__dirname, 'rasmlar'), {
  maxAge: '30d',
  immutable: true
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PTest running on port ${PORT}`);
});
