import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ipcRenderer } from 'electron/renderer'

// Custom APIs for renderer
const api = {
  fetchLaunchPadConfig: (): Promise<string> => ipcRenderer.invoke('fetch-config'),
  updateLaunchPadConfig: (config: string): Promise<void> => ipcRenderer.invoke('update-config', config),
  selectProjectLocation: (): Promise<string | null> => ipcRenderer.invoke('open-file-dialog'),
  createProject: (project: object): Promise<void> => ipcRenderer.invoke('create-project', project),
  deleteProject: (path: string, projectName: string): Promise<void> => ipcRenderer.invoke('delete-project', path, projectName),
  openProject: (projectId: string): Promise<void> => ipcRenderer.invoke('open-project', projectId),
  closeLoader: (): Promise<void> => ipcRenderer.invoke('close-loader')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
