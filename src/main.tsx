import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { API, Authentication, exposeAPI, exposeMesh, FLAGS, Outfit, OutfitRenderer, RBXRenderer } from 'roavatar-renderer'
import { CONFIG } from './react/generic/config.ts'

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
FLAGS.ENABLE_API_MESH_CACHE = true
FLAGS.ENABLE_API_RBX_CACHE = false
FLAGS.HIDE_LAYERED_CLOTHING = false
FLAGS.HSR_SHOW_RAY = false
FLAGS.ENABLE_HSR = true
FLAGS.CACHE_HSR_HITS = true
FLAGS.ONLINE_ASSETS = false
FLAGS.USE_WORKERS = true
exposeAPI()
exposeMesh()
//FLAGS.SHOW_CAGE = true
//FLAGS.LOAD_TEST_PLACE = "../assets/UniversalApp.rbxm"
//FLAGS.SEARCH_FOR_STRING = "shape"
RBXRenderer.fullSetup(true, true, true).then(() => {
  if (theme === "light") {
    RBXRenderer.wellLitDirectionalLightIntensity *= 2.25
    RBXRenderer.setBackgroundColor(0xdbdbdc)
  }

  if (CONFIG.MULTI_VIEWPORT) {
    RBXRenderer.getRendererElement().style.position = "fixed"
    RBXRenderer.getRendererElement().style.left = "0px"
    RBXRenderer.getRendererElement().style.top = "0px"
  }

  if (CONFIG.MULTI_VIEWPORT) {
    const extraScene = RBXRenderer.addScene()
    extraScene.viewport = [400, 400, 200, 200]
    extraScene.scissor = extraScene.viewport

    RBXRenderer.setupScene("WellLit", RBXRenderer.backgroundColorHex, extraScene)
    RBXRenderer.setupControls(extraScene)

    //get avatar data for the user with id 1
    API.Avatar.GetAvatarDetails(126448532).then((outfit) => {
      console.log(outfit)
      if (!(outfit instanceof Outfit)) throw new Error("Failed to get outfit")

    //create renderer for outfit
        //used by api
        const auth = new Authentication()
        //manages outfit rendering for you
        const outfitRenderer = new OutfitRenderer(auth, outfit, extraScene)
        outfitRenderer.startAnimating()
        outfitRenderer.setMainAnimation("idle")

        setTimeout(() => {
          console.log("updating 1")
          outfitRenderer.setMainAnimation("idle")
          const outfitWithJacket = outfit.clone()
          outfitWithJacket.removeAssetType("JacketAccessory")
          outfitWithJacket.addAsset(76294859738495, "JacketAccessory", "The Stalker Thriller Jacket | Violence district")
          outfitRenderer.setMainAnimation("idle")
          outfitRenderer.setOutfit(outfitWithJacket)
          setTimeout(() => {
            console.log("updating 2")
            const outfitWithEmote = outfit.clone()
            outfitWithEmote.addAsset(97887354709121, "EmoteAnimation", "Light-Yagami-Kira-Laugh-anime-Evil-Laugh")
            outfitRenderer.setMainAnimation("emote.97887354709121")
            outfitRenderer.setOutfit(outfitWithEmote)
          },1000)
        },2000)
    })
  }

  RBXRenderer.getRendererElement().style.zIndex = "-1"

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})