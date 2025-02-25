// events.ts
// for all events propagation

import { create_new_project, getConfig, open_project, saveConfig, setConfig } from './configManager'
import { setActiveTab } from './launchPad'

export const init_launchpad_events = (): void => {
  side_nav_events()
  tab_nav_events()
  //   dialog_events()
  project_form_events()
  show_recent_projects()
}

const side_nav_events = (): void => {
  const tabs = document.querySelectorAll('.side-nav')
  const activeNav = getConfig('activeNav')

  console.log(activeNav)

  // Set the active navigation based on the store
  tabs.forEach((tab) => {
    const section = (tab as HTMLButtonElement).dataset.section
    if (section && section === activeNav) {
      tab.classList.add('active-nav')
      show_nav_content(section)
    }

    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove('active-nav'))

      // Add active class to the clicked tab
      tab.classList.add('active-nav')
      setConfig('activeNav', section)

      console.log(section)

      // Show the corresponding content
      if (section) {
        show_nav_content(section)
      }
    })
  })
}

const show_nav_content = (tab: string): void => {
  const contents = document.querySelectorAll('.nav-content')

  // Hide all sections
  contents.forEach((container) => container.classList.add('hidden'))

  // Find and show the selected section
  const activeContainer = document.getElementById(tab)
  activeContainer?.classList.remove('hidden')

  // Extra logic for Recent Projects (keeping your "active-tab" logic)
  const activeContainerChildren = activeContainer?.querySelectorAll('.tab-btn')

  if (activeContainerChildren) {
    activeContainerChildren.forEach((child) => child.classList.remove('active-tab'))
    const firstTab = activeContainerChildren[0]
    const firstTabSection = (firstTab as HTMLElement).dataset.section
    firstTab?.classList.add('active-tab')

    console.log((firstTab as HTMLElement).dataset.section)
    show_tab_content(firstTabSection)
  }
}

const tab_nav_events = (): void => {
  const tabs = document.querySelectorAll('.tab-btn')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active-tab'))
      tab.classList.add('active-tab')

      const section = (tab as HTMLButtonElement).dataset.section
      if (section) {
        if (tab.classList.contains('active-tab')) {
          show_tab_content(section)
        }
      }
    })
  })
}

const show_tab_content = (tab: string): void => {
  const project_contents = document.querySelectorAll('.projects-content')
  const template_contents = document.querySelectorAll('.templates-content')
  const docs_contents = document.querySelectorAll('.docs-content')

  // Hide all sections
  project_contents.forEach((container) => container.classList.add('hidden'))
  template_contents.forEach((container) => container.classList.add('hidden'))
  docs_contents.forEach((container) => container.classList.add('hidden'))

  // Find and show the selected section
  const activeContainer = document.getElementById(tab)
  activeContainer?.classList.remove('hidden')
}

const dialog_events = (): void => {
  const browser = document.getElementById('file-path-btn') as HTMLButtonElement
  const pathInput = document.getElementById('file-path-input') as HTMLInputElement

  pathInput.value = 'default location'

  browser.addEventListener('click', async () => {
    const selectedPath = await window.api.selectProjectLocation()
    if (selectedPath) {
      pathInput.value = selectedPath
    }
  })
}

const project_form_events = (): void => {
  const nameInput = document.getElementById('project-name-input') as HTMLInputElement
  const presetInput = document.getElementById('project-preset-input') as HTMLSelectElement
  const pathInput = document.getElementById('file-path-input') as HTMLInputElement
  const browser = document.getElementById('file-path-btn') as HTMLButtonElement
  const createBtn = document.getElementById('create-project-btn') as HTMLButtonElement

  const newData = { name: '', preset: '', path: '' }

  // Unified toggle logic
  const toggleButton = () => {
    newData.name = nameInput.value.trim()
    newData.preset = presetInput.value
    newData.path = pathInput.value.trim()

    createBtn.disabled = !(newData.name && newData.preset && newData.path)
  }

  // Event listeners
  ;[nameInput, presetInput, pathInput].forEach((input) =>
    input.addEventListener('input', toggleButton)
  )

  // Handle file path selection
  browser.addEventListener('click', async () => {
    try {
      const selectedPath = await window.api.selectProjectLocation()
      if (selectedPath) {
        pathInput.value = selectedPath
        toggleButton()
      }
    } catch (err) {
      console.error('Failed to select project location:', err)
    }
  })

  // Handle form submission
  createBtn.addEventListener('click', () => {
    if (!createBtn.disabled) {
      create_new_project(newData)
      saveConfig(true)

      // Clear inputs
      ;[nameInput, presetInput, pathInput].forEach((input) => (input.value = ''))
      presetInput.value = presetInput.options[0].value

      // Switch to the 'recent-project' tab
      const recentTab = document.querySelector(
        '.tab-btn[data-section="recent-project"]'
      ) as HTMLButtonElement
      if (recentTab) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.remove('active-tab'))

        // Activate the recent-project tab
        recentTab.classList.add('active-tab')

        // Show the corresponding content
        show_tab_content('recent-project')
      }
    } else {
      console.warn('Project name, preset, and file path are required.')
    }
  })
}

export const show_recent_projects = async (): Promise<void> => {
  const launchPad = getConfig('launchpad')
  // const recents = launchPad?.recentProjects || []
  const container = document.getElementById('recent-project')

  if (!container) return

  try {
    // Fetch the updated config with recent projects
    const config = await window.api.fetchLaunchPadConfig()
    const recents = config.launchpad.recentProjects

    if (recents.length > 0) {
      // Clear the container first
      container.innerHTML = ''

      // Populate with updated recent projects
      recents.forEach((project) => {
        const el = document.createElement('div')
        const title = document.createElement('h3')
        const lastOpened = document.createElement('p')
        const actionsContainer = document.createElement('div')
        const project_open_btn = document.createElement('button')
        const project_delete_btn = document.createElement('button')

        el.classList.add('recent-project')
        title.classList.add('project-title')
        lastOpened.classList.add('project-last-opened')
        actionsContainer.classList.add('project-actions')
        project_open_btn.classList.add('project-action-btn')
        project_delete_btn.classList.add('project-action-btn')

        title.textContent = project.name
        lastOpened.textContent = `Last Opened: ${project.lastOpened}`
        project_open_btn.textContent = 'Open'
        project_delete_btn.textContent = 'Delete'

        project_delete_btn.addEventListener('click', () => {
          attach_btn_event(project.path, project.name)
        })

        project_open_btn.addEventListener('click', () => {
          open_project(project)
        })

        actionsContainer.appendChild(project_open_btn)
        actionsContainer.appendChild(project_delete_btn)

        el.appendChild(title)
        el.appendChild(lastOpened)
        el.appendChild(actionsContainer)

        container.appendChild(el)
      })
    } else {
      const el = document.createElement('div')
      const title = document.createElement('h3')

      el.classList.add('recent-project')
      title.classList.add('project-titlee')

      title.textContent = 'no projects created'

      el.appendChild(title)
      container.appendChild(el)
    }
  } catch (error) {
    console.error('Failed to reload recent projects:', error)
  }
}

const attach_btn_event = async (path: string, projectName: string): Promise<void> => {
  const container = document.getElementById('delete-msg-container') as HTMLDivElement
  const msgOutput = document.getElementById('delete-msg') as HTMLParagraphElement

  try {
    await window.api.deleteProject(path, projectName)
    show_recent_projects()

    if (container && msgOutput) {
      container.classList.remove('hidden')
      msgOutput.textContent = 'project deleted successfully'

      setTimeout(() => {
        container.classList.add('hidden')
      }, 3000);

    }

  } catch (error) {
    msgOutput.textContent = 'failed to delete project'
  }
}
