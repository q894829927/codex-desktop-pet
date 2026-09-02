const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 620;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";

let mainWindow = null;
let tray = null;
let isQuitting = false;
let stateFile = null;
let saveTimer = null;
let appState = {
  bounds: null,
  alwaysOnTop: true,
};

function readState() {
  if (!stateFile || !fs.existsSync(stateFile)) return;

  try {
    const parsed = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    appState = {
      bounds: parsed.bounds || null,
      alwaysOnTop: parsed.alwaysOnTop !== false,
    };
  } catch (error) {
    console.warn("Failed to read desktop pet state:", error);
  }
}

function writeState() {
  if (!stateFile) return;

  try {
    fs.writeFileSync(stateFile, JSON.stringify(appState, null, 2), "utf8");
  } catch (error) {
    console.warn("Failed to persist desktop pet state:", error);
  }
}

function scheduleStateWrite() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeState, 180);
}

function defaultBounds() {
  const workArea = screen.getPrimaryDisplay().workArea;
  return {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: workArea.x + workArea.width - WINDOW_WIDTH - 24,
    y: workArea.y + workArea.height - WINDOW_HEIGHT - 24,
  };
}

function intersects(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function safeBounds(saved) {
  if (!saved || !Number.isFinite(saved.x) || !Number.isFinite(saved.y)) {
    return defaultBounds();
  }

  const candidate = {
    x: Math.round(saved.x),
    y: Math.round(saved.y),
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  };

  const visible = screen
    .getAllDisplays()
    .some((display) => intersects(candidate, display.workArea));

  return visible ? candidate : defaultBounds();
}

function petAssetPath() {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), "dist", "assets", "pet.png");
  }

  return path.join(__dirname, "..", "public", "assets", "pet.png");
}

function createWindow() {
  const bounds = safeBounds(appState.bounds);

  mainWindow = new BrowserWindow({
    ...bounds,
    title: "Codex Desktop Pet",
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: appState.alwaysOnTop,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setAlwaysOnTop(appState.alwaysOnTop, "floating");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  } else {
    mainWindow.loadURL(DEV_URL);
  }

  mainWindow.on("move", () => {
    if (!mainWindow) return;
    appState.bounds = mainWindow.getBounds();
    scheduleStateWrite();
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return;
    }

    appState.bounds = mainWindow.getBounds();
    writeState();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const source = nativeImage.createFromPath(petAssetPath());
  const icon = source.isEmpty() ? nativeImage.createEmpty() : source.resize({ width: 24, height: 24 });

  tray = new Tray(icon);
  tray.setToolTip("Codex Desktop Pet");

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "显示桌宠",
        click: () => {
          if (!mainWindow) createWindow();
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: "隐藏桌宠",
        click: () => mainWindow?.hide(),
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );

  tray.on("double-click", () => {
    if (!mainWindow) createWindow();
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });
}

function registerIpc() {
  ipcMain.handle("pet:hide", () => mainWindow?.hide());

  ipcMain.handle("pet:quit", () => {
    isQuitting = true;
    app.quit();
  });

  ipcMain.handle("pet:get-settings", () => ({
    alwaysOnTop: appState.alwaysOnTop,
    launchAtLogin: app.getLoginItemSettings().openAtLogin,
    launchAtLoginSupported: app.isPackaged && ["win32", "darwin"].includes(process.platform),
  }));

  ipcMain.handle("pet:set-always-on-top", (_event, enabled) => {
    appState.alwaysOnTop = Boolean(enabled);
    mainWindow?.setAlwaysOnTop(appState.alwaysOnTop, "floating");
    writeState();
    return appState.alwaysOnTop;
  });

  ipcMain.handle("pet:set-launch-at-login", (_event, enabled) => {
    const supported = app.isPackaged && ["win32", "darwin"].includes(process.platform);
    if (!supported) {
      return { enabled: false, supported: false };
    }

    app.setLoginItemSettings({ openAtLogin: Boolean(enabled) });
    return {
      enabled: app.getLoginItemSettings().openAtLogin,
      supported: true,
    };
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.codex.desktop.pet");
  }

  stateFile = path.join(app.getPath("userData"), "desktop-pet-state.json");
  readState();
  registerIpc();
  createWindow();
  createTray();

  app.on("activate", () => {
    if (!mainWindow) createWindow();
    mainWindow.show();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  if (mainWindow) appState.bounds = mainWindow.getBounds();
  writeState();
});

app.on("window-all-closed", () => {
  // Tray owns application lifetime. Use the tray menu to quit.
});
