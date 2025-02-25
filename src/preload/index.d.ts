import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fetchLaunchPadConfig: () => Promise<string>
      updateLaunchPadConfig: (config: string) => Promise<void>
      selectProjectLocation: () => Promise<string | null>
      createProject: (project: object) => Promise<void>
      deleteProject: (path: string, projectName: string) => Promise<void>
      openProject: (projectId: string) => Promise<void>
      closeLoader: () => Promise<void>
    }
  }
}
