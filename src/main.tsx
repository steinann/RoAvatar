import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { API, Authentication, exposeAPI, exposeFLAGS, exposeManagedTextures, exposeMesh, exposeTests, exposeThumbnailGenerator, FLAGS, OutfitModel, OutfitRenderer, RBXRenderer, Wait } from 'roavatar-renderer'
import { CONFIG } from './react/generic/config.ts'
import ReviewReminder from './react/reviewReminder.tsx'
import { initWebsite } from './website/init.ts'
import { getSetting } from './react/generic/settings.ts'

//declare const browser: typeof chrome;
if (window.location.protocol.includes("extension") || window.location.pathname.endsWith("roavatar-embed-beta")) {
  const initEditor = async () => {
    if (window.location.pathname.endsWith("roavatar-embed-beta")) {
      while (!document.getElementById("content")) {
        await Wait(0.5)
      }

      console.log("content is here time to be init!")
      const content = document.getElementById("content")
      if (content) content.innerHTML = ""
      if (content) content.style = "font-size: 12px; overflow: hidden;"
      initWebsite(false)

      const response = await fetch(chrome.runtime.getURL("/react/style.css"))
      const body = await response.text()

      const iconStuff = document.createElement("div")
      iconStuff.innerHTML = `<!--Fonts-->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&family=Stack+Sans+Text:wght@200..700&display=swap" rel="stylesheet">
    <!--Icons-->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=account_circle,apparel,arrow_downward,arrow_upward,autorenew,backpack,block,cancel,center_focus_weak,check_box,clock_loader_10,clock_loader_20,clock_loader_40,clock_loader_60,clock_loader_80,clock_loader_90,close,delete,download,drag_pan,error,expand_content,eyeglasses_2,filter_list,info_i,keyboard_arrow_down,keyboard_arrow_up,menu,nest_clock_farsight_analog,photo_camera,redo,refresh,search,settings,share,shopping_basket,shopping_cart,stack,undo,warning" />`
      document.body.appendChild(iconStuff)

      const style = document.createElement("style")
      style.innerText = `
      :root {
      --container: #191a1f;
      --item-background: #2b2d33;
      --body-background: #121215;
      --button-background: #2a2a2d;
      --button-hover: #252529;
      --scrollbar-thumb: #0c0c0f;
      --select-element-hover: #47474b;
      --bar-divider: #404044;
      --icon-button-hover: #ffffff36;

      --font-color: #f5f5f5;

      --emote-box-color: #3c3f48;
      --loading-gradient-2: #626672;
      --history-button-hover: #0d0d0f;
      --history-button-active: #16161a;
      --history-button-inactive: #f5f5f571;
      --body-outline: #fff;

      --thumb-dragging: #ffffff36;

      --blue: #335fff;
      --blue-dark: #1f3da7;
      --blue-light: #466eff;

      --robux-color: #bdbebe;

      --icon-filter: invert(0);
      --economy-svg: url(/public/assets/economy.svg);
    }\n\n` + body
      document.body.appendChild(style)
    }

    const darkTheme = document.getElementById("style-dark-theme")
    const lightTheme = document.getElementById("style-light-theme")

    const urlParams = new URLSearchParams(window.location.search)
    const theme = urlParams.get("theme")
    const bodyBackgroundBase64 = urlParams.get("body")

    if (bodyBackgroundBase64) {
      const bodyBackground = atob(bodyBackgroundBase64)
      document.body.style.backgroundColor = bodyBackground
    }

    if (theme === "light") {
      darkTheme?.remove()
    } else if (theme === "dark") {
      lightTheme?.remove()
    }

    /*FLAGS.FETCH_FUNC = (input: URL | RequestInfo, init?: RequestInit) => {
      console.log("sending fetch to background")
      const result = (chrome || browser).runtime.sendMessage({
        type: "fetch",
        args: [input, init],
      })
      console.log(result)
      return result
    }*/

    //most of these lines are just setting the flags to the default, theyre just theyre so i remember the flags exist
    FLAGS.UPDATE_SKELETON = true
    FLAGS.ANIMATE_SKELETON = true
    FLAGS.SHOW_SKELETON_HELPER = false
    FLAGS.SKELETON_HELPER_INSTANCE_NAME = "Handle"
    FLAGS.USE_LOCAL_SKELETONDESC = false
    FLAGS.ENABLE_API_MESH_CACHE = true
    FLAGS.ENABLE_API_RBX_CACHE = false
    FLAGS.HIDE_LAYERED_CLOTHING = false
    FLAGS.HSR_SHOW_RAY = false
    FLAGS.ENABLE_HSR = true
    FLAGS.CACHE_HSR_HITS = true
    FLAGS.ONLINE_ASSETS = false
    FLAGS.USE_WORKERS = true
    FLAGS.VERBOSE_LOGGING = false
    FLAGS.USE_ASSEMBLY = true
    FLAGS.LAYERED_CLOTHING_COOLDOWN = 0.25

    const postprocessingEnabled = await getSetting("s-postprocessing", false) as boolean
    FLAGS.USE_POST_PROCESSING = postprocessingEnabled
    FLAGS.POST_PROCESSING_IS_DOUBLE_SIZE = postprocessingEnabled

    //FLAGS.API_REQUEST_RETRY = false
    //FLAGS.LOAD_TEST_PLACE = "rbxassetid://118593852151835"
    //FLAGS.SEARCH_FOR_STRING = "profilebackground"
    exposeAPI()
    exposeMesh()
    exposeFLAGS()
    exposeThumbnailGenerator()
    exposeTests()
    exposeManagedTextures()
    //FLAGS.SHOW_CAGE = true
    //FLAGS.LOAD_TEST_PLACE = "../assets/UniversalApp.rbxm"
    //FLAGS.SEARCH_FOR_STRING = "generationid"


    RBXRenderer.fullSetup(true, true, true).then(() => {
      RBXRenderer.wellLitDirectionalLightIntensity *= 2.25
      if (!postprocessingEnabled) {
        if (RBXRenderer.directionalLight2) RBXRenderer.directionalLight2.visible = false
        RBXRenderer.firstScene.msaa = 0
      }
      if (theme === "light") {
        RBXRenderer.setBackgroundColor(0xdbdbdc)
      }

      if (CONFIG.MULTI_VIEWPORT) {
        RBXRenderer.getRendererElement().style.position = "fixed"
        RBXRenderer.getRendererElement().style.left = "0px"
        RBXRenderer.getRendererElement().style.top = "0px"
      }

      if (CONFIG.MULTI_VIEWPORT) {
        const extraScene = RBXRenderer.addScene()
        RBXRenderer._createEffectComposer(extraScene)
        extraScene.viewport = [400, 400, 200, 200]
        extraScene.scissor = extraScene.viewport

        RBXRenderer.setupScene("WellLit", RBXRenderer.backgroundColorHex, extraScene)
        RBXRenderer.setupControls(extraScene)

        //get avatar data for the user with id 1
        API.Avatar.GetUserAvatarModel(126448532).then((outfit) => {
          console.log(outfit)
          if (!(outfit instanceof OutfitModel)) throw new Error("Failed to get outfit")

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
              outfitWithJacket.outfit.removeAssetType("JacketAccessory")
              outfitWithJacket.outfit.addAsset(76294859738495, "JacketAccessory", "The Stalker Thriller Jacket | Violence district")
              outfitRenderer.setMainAnimation("idle")
              outfitRenderer.setOutfitModel(outfitWithJacket)
              setTimeout(() => {
                console.log("updating 2")
                const outfitWithEmote = outfit.clone()
                outfitWithEmote.outfit.addAsset(97887354709121, "EmoteAnimation", "Light-Yagami-Kira-Laugh-anime-Evil-Laugh")
                outfitRenderer.setMainAnimation("emote.97887354709121")
                outfitRenderer.setOutfitModel(outfitWithEmote)
              },1000)
            },2000)
        })
      }

      RBXRenderer.getRendererElement().style.zIndex = "-1"

      createRoot(document.getElementById('root') || document.getElementById("content") || document.body).render(
        <StrictMode>
          <App />
          <ReviewReminder/>
        </StrictMode>,
      )
    })

    /*
    //setup flags that are compatible with you environment
        FLAGS.FETCH_FUNC = undefined //undefined is the default fetch() function, this flag can be used to intercept requests
        FLAGS.ONLINE_ASSETS = true //set true to false if you want assets to be loaded locally

        //if we arent using online assets we have to provide the renderer with the paths
        if (!FLAGS.ONLINE_ASSETS) {
            //path to asset files from RoAvatar
            FLAGS.ASSETS_PATH = chrome.runtime.getURL("assets/rbxasset/")
            FLAGS.RIG_PATH = chrome.runtime.getURL("assets/")
        }
        //if layered assets dont work set this to false (workers improve performance)
        FLAGS.USE_WORKERS = true

    //setup RBXRenderer
        //actually creating renderer
        const includeScene = true
        const includeControls = true
        const success = await RBXRenderer.fullSetup(includeScene, includeControls)
        if (!success) {
            //roavatar-renderer automatically displays an error, but your own behavior can be included here (like a fallback)
        }
        //renderer customization
        RBXRenderer.setBackgroundColor( 0xbbbbbb )
        RBXRenderer.setRendererSize(1000,500)
        RBXRenderer.setBackgroundTransparent(false)
        //add renderer to document
        document.body.appendChild(RBXRenderer.getRendererElement())

    //get avatar data for the user with id 1
    const outfit = await API.Avatar.GetAvatarDetails(126448532)
    if (!(outfit instanceof Outfit)) throw new Error("Failed to get outfit")

    //create renderer for outfit
        //used by api
        const auth = new Authentication()

        const renderScene = RBXRenderer.addScene()
        setupThumbnailScene(renderScene)

        const outfitRenderer = new OutfitRenderer(auth, outfit, renderScene)
        await outfitRenderer.prepareForThumbnail()

        //finalize
        if (outfitRenderer.currentRig) {
          //update camera positioning
          const cameraCFrame = getThumbnailCameraCFrame(outfitRenderer.currentRig, renderScene.camera.fov)
          if (cameraCFrame) {
              RBXRenderer.setCameraCFrame(cameraCFrame, renderScene)
          }

          //click
          imageThumbnailClick(renderScene, 420, 420, "png").then((result) => {
            console.log(result)
          })
        }

        //cleanup
        outfitRenderer.destroy()
        renderScene.destroy()
      */
  }
  initEditor()
} else if (!window.location.href.includes("/roavatar")) {
  initWebsite()
}