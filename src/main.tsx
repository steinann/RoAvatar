import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FLAGS, RBXRenderer } from 'roavatar-renderer'

const darkTheme = document.getElementById("style-dark-theme")
const lightTheme = document.getElementById("style-light-theme")

const urlParams = new URLSearchParams(window.location.search)
const theme = urlParams.get("theme")

if (theme === "light") {
  darkTheme?.remove()
} else if (theme === "dark") {
  lightTheme?.remove()
}

FLAGS.UPDATE_SKELETON = true
FLAGS.ANIMATE_SKELETON = true
FLAGS.SHOW_SKELETON_HELPER = false
FLAGS.USE_LOCAL_SKELETONDESC = false
FLAGS.ENABLE_API_MESH_CACHE = false
FLAGS.ENABLE_API_RBX_CACHE = false
FLAGS.HIDE_LAYERED_CLOTHING = false
FLAGS.HSR_SHOW_RAY = false
FLAGS.ENABLE_HSR = true
FLAGS.CACHE_HSR_HITS = true
RBXRenderer.fullSetup()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)