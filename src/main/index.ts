import { debounce } from 'lodash'
import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Notification,
  dialog,
  Menu,
  Tray,
  screen
} from 'electron'
import { join } from 'path'
import path from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null
let splash: BrowserWindow | null
let editor: BrowserWindow | null
let tray: Tray | null
let isQuitting = false // Custom flag

const createSplash = (): void => {
  splash = new BrowserWindow({
    width: 800,
    height: 300,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    movable: false,
    resizable: false,
    hasShadow: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // splash.loadFile('../../src/renderer/splash.html')
  splash.loadFile(join(__dirname, '../../src/renderer/splash.html'))
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 970,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    maximizable: false,
    resizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('resize', () => {
    if (!mainWindow.isMaximized()) {
      mainWindow.setBounds({ width: 1200, height: 800 })
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Override close to hide instead of quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createEditor(): void {
  // Create the browser window.
  editor = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    maximizable: true,
    resizable: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // const handleResize = debounce(() => {
  //   if (!editor?.isMaximized()) {
  //     const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  //     editor?.setBounds({ x: 0, y: 0, width, height });
  //   }
  // }, 100); // Adjust the debounce delay as needed

  // editor.on('resize', handleResize);

  editor.on('will-resize', (event) => {
    if (!editor?.isMaximized()) {
      event.preventDefault() // Prevent manual resizing
    }
  })

  editor.on('ready-to-show', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    editor?.setBounds({ x: 0, y: 0, width, height })
    // editor?.maximize()
    editor?.show()
  })

  editor.on('close', () => {
    editor = null
    if (mainWindow) {
      mainWindow.show() // Resurface the main window from the tray
      mainWindow.focus() // Focus on the main window
    }
  })

  editor.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    editor.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/editor.html`)
  } else {
    editor.loadFile(join(__dirname, '../renderer/editor.html'))
  }
}

// Define the target directory
const appDataDir = path.join(app.getPath('appData'), 'R2D')

// Ensure the directory exists
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true })
}

// Set the userData path to the R2D directory
app.setPath('userData', appDataDir)

// Directory names and default config
const baseSubDirs = ['config', 'plugins', 'updates', 'themes', 'docs']
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

type RecentProject = {
  id: string
  name: string
  path: string
  preset: string
  createdAt: string
  structure: string[]
  lastOpened: string
}

interface IConfig {
  theme: string
  language: string
  launchpad: {
    recentProjects: RecentProject[]
    autoCheckUpdates: boolean
  }
  activeNav: string
  activeTab: string
}

// Initialize directories and config
export const initR2DDirectories = (): void => {
  const baseDir = path.join(app.getPath('appData'), 'R2D')

  try {
    // Create base and subdirectories if they don't exist
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
      baseSubDirs.forEach((subDir) => {
        fs.mkdirSync(path.join(baseDir, subDir))
      })
    }

    baseSubDirs.forEach((subdir) => {
      const dir = path.join(baseDir, subdir)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })

    // Initialize config if missing
    const configPath = path.join(baseDir, 'config', 'launchPadConfig.json')
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
      console.log('Default config created.')
    }
  } catch (error: any) {
    console.error('Failed to initialize R2D:', error)
  }
}

initR2DDirectories()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Override close to hide instead of quitting
  // mainWindow.on('close', (event) => {
  //   if (!isQuitting) {
  //     event.preventDefault()
  //     mainWindow?.hide()
  //   }
  // })

  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show LaunchPad',
      click: (): void => mainWindow?.show()
    },
    {
      label: 'Quit',
      click: (): void => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('R2D LaunchPad')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => mainWindow?.show())

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('fetch-config', () => {
    const configPath = path.join(app.getPath('appData'), 'R2D', 'config', 'launchPadConfig.json')

    try {
      // Ensure directories exist
      initR2DDirectories()

      // Read config if available
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8')
        return JSON.parse(configData)
      } else {
        console.warn('Config file missing, returning default config.')
        return defaultConfig
      }
    } catch (error: any) {
      new Notification({
        title: 'Error: 0x501',
        subtitle: 'Failed to read config file',
        body: error.message
      }).show()

      console.error('Failed to fetch config:', error)
      return defaultConfig
    }
  })

  let isWriting = false

  const deepMerge = (target: any, source: any): any => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        if (!Array.isArray(target[key])) {
          target[key] = [];
        }
  
        // Merge arrays and remove duplicates based on object properties
        const combinedArray = [...target[key], ...source[key]];
  
        // Deduplicate by 'id' or stringify fallback
        const dedupedArray = combinedArray.filter(
          (item, index, self) =>
            index === self.findIndex((t) => 
              typeof t === 'object' && t !== null && t.id !== undefined 
                ? t.id === item.id 
                : JSON.stringify(t) === JSON.stringify(item)
            )
        );
  
        target[key] = dedupedArray;
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };
  

  ipcMain.handle('update-config', async (_, config: string) => {
    const configPath = path.join(app.getPath('appData'), 'R2D', 'config', 'launchPadConfig.json')

    try {
      initR2DDirectories()

      // Fetch the latest config
      let latestConfig = {}
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8')
        latestConfig = JSON.parse(configData)
      }

      // Merge the latest config with the new config
      const newConfig = JSON.parse(config)
      const mergedConfig = deepMerge(latestConfig, newConfig)

      // Write the merged config to the file
      if (isWriting) {
        console.log('Update Config: Already writing')
        return
      } else {
        console.log('Update Config: Casual update')
      }
      // console.log('Update Config: Writing config:', JSON.stringify(mergedConfig, null, 2))
      fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), 'utf-8')
      console.log(`Config updated at ${configPath}`)
      return { success: true }
    } catch (error) {
      const errorCode = 'R2D-CFG-4'
      new Notification({
        title: `Error: ${errorCode}`,
        subtitle: 'Failed to update config file',
        body: error.message
      }).show()

      console.error('Failed to update config:', error)
    }
  })

  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: app.getPath('documents'),
      title: 'Select Project Location'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('close-loader', () => {
    if (splash) {
      splash.close()
      splash = null

      // main window will default to tray
      mainWindow?.close()

      // check instance of editor
      if (editor) return
      else createEditor()
    }
  })

  interface IProject {
    name: string
    preset: string
    path: string
  }

  ipcMain.handle('create-project', (_, project: IProject) => {
    if (isWriting) {
      console.log('Create Project: Already writing')
      return { success: false, message: 'Write in progress' }
    }

    isWriting = true

    try {
      // Git initialization disabled for now
      const projectPath = path.join(project.path, project.name)
      const globalConfigPath = path.join(
        app.getPath('appData'),
        'R2D',
        'config',
        'launchPadConfig.json'
      )

      // console.log(`Creating project at ${projectPath}`)
      // console.log(`Global config path: ${globalConfigPath}`)

      // Read and parse global config
      if (!fs.existsSync(globalConfigPath)) {
        console.warn('Global config file not found.')
        return
      }
      const configContent = fs.readFileSync(globalConfigPath, 'utf-8')
      const parsedGlobalConfig: IConfig = JSON.parse(configContent)

      // Create project directory
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true })
        // console.log(`Project directory created at ${projectPath}`)
      }

      // Initialize project files for 'new_game'
      const folders = ['assets', 'scenes', 'scripts', 'config']
      folders.forEach((folder) => {
        const folderPath = path.join(projectPath, folder)
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath)
          // console.log(`Folder created at ${folderPath}`)
        }
      })

      // Write project.json
      const configPath = path.join(projectPath, 'config', 'project.json')
      const snapShot = {
        id: crypto.randomUUID(),
        name: project.name,
        path: project.path,
        preset: project.preset,
        createdAt: new Date().toISOString(),
        structure: folders,
        lastOpened: 'never'
      }

      fs.writeFileSync(configPath, JSON.stringify(snapShot, null, 2))
      console.log(`Project config written at ${configPath}`)

      // Update global config if not already present
      const alreadyExists = parsedGlobalConfig.launchpad.recentProjects.some((p) => {
        return (
          path.normalize(path.join(p.path, p.name)).toLowerCase() ===
          path.normalize(path.join(snapShot.path, snapShot.name)).toLowerCase()
        )
      })

      if (!alreadyExists) {
        parsedGlobalConfig.launchpad.recentProjects.push(snapShot)
        fs.writeFileSync(globalConfigPath, JSON.stringify(parsedGlobalConfig, null, 2), 'utf-8')
        console.log(`Project added to global config at ${globalConfigPath}`)
        console.log('Updated global config:', JSON.stringify(parsedGlobalConfig, null, 2))
      } else {
        console.log('Project already exists in recentProjects.')
      }

      console.log(`Project '${project.name}' created successfully at ${projectPath}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      isWriting = false
    }
  })

  ipcMain.handle('delete-project', async (_, fullProjectPath: string, projectName: string) => {
    try {
      isWriting = true

      // Determine the target project folder.
      // If the basename of the fullProjectPath matches the projectName, then the fullProjectPath is already the project folder.
      // Otherwise, assume fullProjectPath is the parent directory and join it with the projectName.
      let targetProjectFolder = fullProjectPath
      if (path.basename(fullProjectPath).toLowerCase() !== projectName.toLowerCase()) {
        targetProjectFolder = path.join(fullProjectPath, projectName)
      }

      // Validate that the target project folder exists
      if (!fs.existsSync(targetProjectFolder)) {
        console.warn(`Project folder does not exist: ${targetProjectFolder}`)
        return
      }

      // Delete only the specific project folder
      fs.rmSync(targetProjectFolder, { recursive: true, force: true })

      // Update launchPadConfig.json to remove the project reference
      const globalConfigPath = path.join(
        app.getPath('appData'),
        'R2D',
        'config',
        'launchPadConfig.json'
      )

      const config = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8'))

      const normalizePath = (p: string) => path.normalize(p).toLowerCase()

      config.launchpad.recentProjects = config.launchpad.recentProjects.filter(
        (project: { path: string; name: string }) => {
          const fullProjectPath = path.join(project.path, project.name)
          return normalizePath(fullProjectPath) !== normalizePath(targetProjectFolder)
        }
      )

      // Write back the updated config
      fs.writeFileSync(globalConfigPath, JSON.stringify(config, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to delete project:', error)
    } finally {
      isWriting = false
    }
  })

  ipcMain.handle('open-project', (_, projectId: string) => {
    if (splash) return
    else createSplash()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
