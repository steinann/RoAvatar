import { defineConfig, normalizePath } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'node:path'
import fs from 'node:fs'

const primaryPath = path.resolve(__dirname, "thirdparty/draco/javascript/draco_decoder.js")
const fallbackPath = path.resolve(__dirname, "node_modules/roavatar-renderer/dist/draco_decoder.js")

const chosenPath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(chosenPath),
          dest: ""
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "react/[name].js",
        chunkFileNames: "react/[name].js",
        assetFileNames: "react/[name].css"
      }
    },
    minify: false
  }
})
