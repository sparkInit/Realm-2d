const loaderFillers = [
  'Initializing core modules...',
  'Loading project configuration...',
  'Verifying file integrity...',
  'Checking dependencies...',
  'Establishing graphics pipeline...',
  'Loading asset manager...',
  'Applying user preferences...',
  'Scanning for plugins...',
  'Optimizing runtime environment...',
  'Setting up physics engine...',
  'Allocating memory buffers...',
  'Parsing scene graph...',
  'Loading input handlers...',
  'Applying post-processing effects...',
  'Building UI components...',
  'Finalizing render pipeline...',
  'Performing security checks...',
  'Initializing scripting runtime...',
  'Applying placeholder shaders...',
  'Loading audio drivers...',
  'Running startup diagnostics...',
  'Validating network protocols...',
  'Caching precompiled assets...',
  'Synchronizing project metadata...',
  'Optimizing build cache...',
  'Checking system compatibility...',
  'Starting background services...',
  'Rendering launch context...',
  'Finalizing environment setup...',
  'Launching editor workspace...'
]

let index = 0
const loaderText = document.getElementById('loader-text')

const cycleLoader = async () => {
  if (index < loaderFillers.length) {
    loaderText.textContent = loaderFillers[index]
    index++
    setTimeout(cycleLoader, 5) // Change text every 1.5 sec
  } else {
    loaderText.textContent = 'Project ready. Launching! 🚀'
    await window.api.closeLoader()
  }
}

cycleLoader()
