import { app, BrowserWindow, nativeTheme } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { fork } from "child_process";
import fs from "fs";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendProcess; // track backend process

// Configurable backend port (keep in sync with your backend's config)
const BACKEND_PORT = 5000;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    center: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#f9fafb",
    icon: path.join(__dirname, "assets", "logoBG.png"),
    title: "African Garden Enterprise",
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(app.getAppPath(), "preload.js"),
      contextIsolation: true,
    },
  });

  if (app.isPackaged) {
    // Load built frontend
    win.loadFile(path.join(app.getAppPath(), "frontend/dist/index.html"));
  } else {
    // Dev: frontend served by Vite
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  }
}

function startBackend() {
  const backendPath = path.join(app.getAppPath(), "backend/src/server.js");

  if (!fs.existsSync(backendPath)) {
    console.error("Backend entry not found:", backendPath);
    return;
  }

  console.log("Starting backend from:", backendPath);

  // Use fork so Electron runs JS as Node (sets ELECTRON_RUN_AS_NODE)
  backendProcess = fork(backendPath, [], {
    cwd: path.join(app.getAppPath(), "backend"),
    stdio: "inherit",
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    execPath: process.execPath,
  });

  backendProcess.on("exit", (code) => {
    console.log(`Backend exited with code ${code}`);
  });

  backendProcess.on("error", (err) => {
    console.error("Backend failed to start:", err);
  });

  console.log("Backend process started with PID:", backendProcess.pid);
}

// Utility: wait for backend to be ready before creating window
function waitForBackend(retries = 20, interval = 500) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      console.log(`Checking backend health at http://localhost:${BACKEND_PORT}/api/health (${retries} retries left)`);
      
      http
        .get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
          console.log(`Backend health check response: ${res.statusCode}`);
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", (err) => {
          console.log(`Backend health check error: ${err.message}`);
          retry();
        });
    };

    const retry = () => {
      if (retries <= 0) return reject(new Error("Backend did not start"));
      retries--;
      setTimeout(attempt, interval);
    };

    attempt();
  });
}

app.whenReady().then(async () => {
  startBackend();

  try {
    // Wait for backend (optional: add a /api/health route in Express)
    await waitForBackend();
    console.log("✅ Backend is up, creating window...");
  } catch (err) {
    console.error("❌ Backend failed to start:", err);
  }

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendProcess) backendProcess.kill(); // cleanup
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
