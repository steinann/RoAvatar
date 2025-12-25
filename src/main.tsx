import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const darkTheme = document.getElementById("style-dark-theme")
const lightTheme = document.getElementById("style-light-theme")

const urlParams = new URLSearchParams(window.location.search)
const theme = urlParams.get("theme")

if (theme === "light") {
  darkTheme?.remove()
} else if (theme === "dark") {
  lightTheme?.remove()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)