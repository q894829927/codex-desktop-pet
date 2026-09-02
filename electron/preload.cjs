const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petAPI", {
  hide: () => ipcRenderer.invoke("pet:hide"),
  quit: () => ipcRenderer.invoke("pet:quit"),
  getSettings: () => ipcRenderer.invoke("pet:get-settings"),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke("pet:set-always-on-top", Boolean(enabled)),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke("pet:set-launch-at-login", Boolean(enabled)),
});
