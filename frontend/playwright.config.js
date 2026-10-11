import os from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// The backend runs on a throwaway database, recreated at every run, so db.sqlite is never touched
const DB_PATH = path.join(os.tmpdir(), 'oqm-e2e.sqlite')

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node init-db.js && node index.js',
      cwd: '../backend',
      env: { DB_PATH },
      port: 3000,
      // A backend already running would use the real db.sqlite: fail instead of reusing it
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  ],
})
