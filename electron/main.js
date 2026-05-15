const { app, BrowserWindow } = require('electron')
const path = require('path')
const { fork } = require('child_process')

let mainWindow
let nextProcess

const PORT = 3456

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Next.js sunucusu hazır olduğunda yükle
  const startUrl = `http://localhost:${PORT}`
  waitForServer(startUrl, 30000).then(() => {
    mainWindow.loadURL(startUrl)
  }).catch((err) => {
    console.error('Next.js sunucusu başlatılamadı:', err)
    app.quit()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startNextServer() {
  const isDev = !app.isPackaged

  let serverPath
  let cwd

  if (isDev) {
    // Geliştirme: standalone server.js kullan (next build gerekli)
    serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js')
    cwd = path.join(__dirname, '..')
  } else {
    // Production: extraResources içindeki standalone server
    serverPath = path.join(process.resourcesPath, 'app', 'server.js')
    cwd = path.join(process.resourcesPath, 'app')
  }

  console.log(`[Electron] Starting Next.js server: ${serverPath}`)
  console.log(`[Electron] CWD: ${cwd}`)

  // Next.js standalone server.js doğrudan çalıştırılabilir
  nextProcess = fork(serverPath, [], {
    cwd: cwd,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: 'localhost',
      NODE_ENV: 'production'
    },
    stdio: 'pipe'
  })

  nextProcess.stdout.on('data', (data) => {
    console.log(`[Next.js] ${data}`)
  })

  nextProcess.stderr.on('data', (data) => {
    console.error(`[Next.js ERROR] ${data}`)
  })

  nextProcess.on('close', (code) => {
    console.log(`Next.js process exited with code ${code}`)
  })
}

function waitForServer(url, timeout) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      const http = require('http')
      http.get(url, (res) => {
        resolve()
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Sunucu zaman aşımına uğradı'))
        } else {
          setTimeout(check, 500)
        }
      })
    }
    check()
  })
}

app.whenReady().then(() => {
  startNextServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
})
