const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("monitorApi", {
  checkOnce: (config) => ipcRenderer.invoke("check-once", config),
  startMonitoring: (config) => ipcRenderer.invoke("start-monitoring", config),
  stopMonitoring: () => ipcRenderer.invoke("stop-monitoring"),
  testBark: (barkKey) => ipcRenderer.invoke("test-bark", barkKey),
  openAppointmentPage: () => ipcRenderer.invoke("open-appointment-page"),
  onLog: (handler) => {
    const wrapped = (_event, payload) => handler(payload);
    ipcRenderer.on("log", wrapped);
    return () => ipcRenderer.removeListener("log", wrapped);
  },
  onStatus: (handler) => {
    const wrapped = (_event, payload) => handler(payload);
    ipcRenderer.on("status", wrapped);
    return () => ipcRenderer.removeListener("status", wrapped);
  },
  onMonitoringState: (handler) => {
    const wrapped = (_event, payload) => handler(payload);
    ipcRenderer.on("monitoring-state", wrapped);
    return () => ipcRenderer.removeListener("monitoring-state", wrapped);
  }
});
