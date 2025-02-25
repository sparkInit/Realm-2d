// launchpad.ts
import { initConfig, getConfig, setConfig, saveConfig } from './configManager'
import { init_launchpad_events } from './events'

export const initLaunchPad = (): void => {
  initConfig()
  init_launchpad_events()
}
