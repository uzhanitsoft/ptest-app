import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-rasmlar',
      configureServer(server) {
        server.middlewares.use('/rasmlar', (req, res, next) => {
          const filePath = path.join(
            path.resolve(__dirname, '..', 'rasmlar'),
            decodeURIComponent(req.url)
          );
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'image/webp');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      }
    }
  ]
});
