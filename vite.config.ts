import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import agentFiles from './scripts/agentFiles';
import fs from 'fs';
import type { Plugin } from 'vite';

/**
 * Dev only: the character builder's "Save to the room" button posts Coco's parameters here, and they are written to
 * components/pod/coco.params.json, which the room reads. Nothing like this exists in the built site.
 */
function builderSave(): Plugin {
  return {
    name: 'builder-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__builder/coco', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('not an object');
            fs.writeFileSync(path.resolve(__dirname, 'components/pod/coco.params.json'), JSON.stringify(data, null, 2) + '\n');
            res.end('ok');
          } catch (err) {
            res.statusCode = 400;
            res.end(String(err));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), agentFiles(), builderSave()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
