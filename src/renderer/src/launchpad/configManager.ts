import { show_recent_projects } from './events'
import { IProject } from './types'

interface ConfigStore {
  theme: string
  language: string
  launchpad: {
    recentProjects: []
    autoCheckUpdates: boolean
  }
  activeNav: string
  activeTab: string
}

const fetch = async () => {
  const config = await window.api.fetchLaunchPadConfig()
  const parsedConfig = JSON.stringify(config)

  localStorage.setItem('config', parsedConfig)
}

fetch()

const store = localStorage.getItem('config')

const defaultConfig = {
  theme: 'light',
  language: 'en',
  launchpad: {
    recentProjects: [],
    autoCheckUpdates: true
  },
  activeNav: 'projects',
  activeTab: 'recents'
}

export const initConfig = (): void => {
  if (store) return

  try {
    localStorage.setItem('config', JSON.stringify(defaultConfig))
    console.log('from init')
  } catch (error) {
    console.log('failed to init store')
  }
}

// Get config value
export const getConfig = (key: string): string | undefined => {
  let store = localStorage.getItem('config');
  if (!store) {
    initConfig();
    store = localStorage.getItem('config');
  }
  try {
    const parsedConfig: ConfigStore = JSON.parse(store || '{}');
    return parsedConfig[key] || defaultConfig[key];
  } catch (error) {
    console.error('failed to get config', error);
  }
};


// Set config value
export const setConfig = (key: string, value: unknown): void => {
  let store = localStorage.getItem('config')
  if (!store) {
    initConfig()
    store = localStorage.getItem('config')
  }
  try {
    if (store) {
      const parsedConfig: ConfigStore = JSON.parse(store)
      parsedConfig[key] = value
      localStorage.setItem('config', JSON.stringify(parsedConfig))

      saveConfig(true)
    }
  } catch (error) {
    console.error('failed to update the config', error)
  }
}

// project manager
export const create_new_project = async (data: IProject): Promise<void> => {
  await window.api.createProject(data);
  await fetch(); // 🔄 Immediately refresh config
  window.dispatchEvent(new Event('recentProjectsUpdated'));
};


export const open_project = async (project): Promise<void> => {
  console.log(project)

  try {
    await window.api.openProject(project.id)
  } catch (error) {
    console.log('failed to open project')
  }
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

const autoSave = async (): Promise<void> => {
  try {
    const localConfig = JSON.parse(localStorage.getItem('config') || '{}');

    // First, update the config
    await window.api.updateLaunchPadConfig(JSON.stringify(localConfig));

    // THEN fetch fresh data to confirm changes
    const updatedConfig = await window.api.fetchLaunchPadConfig();
    localStorage.setItem('config', JSON.stringify(updatedConfig));

    console.log('Config auto-saved with fresh data and local changes!');
  } catch (error) {
    console.error('Failed to auto-save config:', error);
  }
};


export const saveConfig = (onBlur: boolean): void => {
  if (onBlur) {
    autoSave() // Immediate save on blur
  } else {
    // Clear existing timer if any
    if (autoSaveTimer) clearTimeout(autoSaveTimer)

    // Debounce autosave after 5s of inactivity
    autoSaveTimer = setTimeout(autoSave, 5000)
  }
}

window.addEventListener('recentProjectsUpdated', () => {
  // console.log('reload projects')
  show_recent_projects()
})

// autosave after every 10s
saveConfig(false)
