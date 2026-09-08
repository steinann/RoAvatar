import JSZip from 'jszip'
import './index.css'
import { API, Authentication, awaitTimeout, exposeAPI, exposeFLAGS, exposeMesh, exposeThumbnailGenerator, FLAGS, OutfitModel, OutfitRenderer, RBXRenderer } from 'roavatar-renderer'

//declare const browser: typeof chrome;

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
FLAGS.ONLINE_ASSETS = true
FLAGS.USE_WORKERS = true
FLAGS.VERBOSE_LOGGING = false
FLAGS.USE_ASSEMBLY = true
FLAGS.LAYERED_CLOTHING_COOLDOWN = 0.25
FLAGS.USE_POST_PROCESSING = false
//FLAGS.API_REQUEST_RETRY = false
//FLAGS.LOAD_TEST_PLACE = "rbxassetid://118593852151835"
//FLAGS.SEARCH_FOR_STRING = "profilebackground"
exposeAPI()
exposeMesh()
exposeFLAGS()
exposeThumbnailGenerator()
//FLAGS.SHOW_CAGE = true
//FLAGS.LOAD_TEST_PLACE = "../assets/UniversalApp.rbxm"
//FLAGS.SEARCH_FOR_STRING = "shape"

function fastHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

type QueuedBufferDownload = {
  name: string,
  data: ArrayBuffer,
}

const queuedBufferDownloads: QueuedBufferDownload[] = [

]

let totalCount = 0
//setup flags that are compatible with you environment
    FLAGS.FETCH_FUNC = (input: URL | RequestInfo, init?: RequestInit) => {
      return new Promise((resolve) => {
        fetch(input, init).then(result => {
          result.arrayBuffer().then((buffer) => {
            totalCount += 1
            const base64Str = fastHash(input.toString())
            console.log("Saving asset", input.toString(), "as",base64Str, totalCount)
            queuedBufferDownloads.push({
              name: base64Str + ".buffer",
              data: buffer
            })
            //setTimeout(() => {saveByteArray([buffer], base64Str + ".buffer")}, totalCount * 500)
            resolve(new Response(buffer, {status: result.status, headers: result.headers, statusText: result.statusText}))
          })
        })
      })
    }
    FLAGS.IMAGE_FUNC = (url: string) => {
      return new Promise((resolve) => {
        fetch(url).then(result => {
          result.arrayBuffer().then((buffer) => {
            totalCount += 1
            const base64Str = fastHash(url.toString())
            console.log("Saving asset", url.toString(), "as",base64Str, totalCount)
            queuedBufferDownloads.push({
              name: base64Str + ".buffer",
              data: buffer
            })
            //setTimeout(() => {saveByteArray([buffer], base64Str + ".buffer")}, totalCount * 500)
            resolve(url)
          })
        })
      })
    }
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

const baseItemLinks = [
  "https://www.roblox.com/catalog/658832408/Ninja-Idle",
]

const addedItemLinks = [
  "https://www.roblox.com/bundles/311/Robloxian-2-0",
  "https://www.roblox.com/catalog/5509426582/Shirt-5509426582 is Shirt",
  "https://www.roblox.com/catalog/233615637/Beautiful-Blonde-Hair-for-Beautiful-People",
  "https://www.roblox.com/catalog/151314918/Raeglyns-Winged-Blindfold-of-Justice",
  "https://www.roblox.com/catalog/104077820810525/white",
  "https://www.roblox.com/catalog/192557913/Sparkling-Angel-Wings"
]

const auth = new Authentication()

function idFromLink(link: string) {
  const id = Number(link.split("/")[4])
  return id
}

async function addItemLink(outfitModel: OutfitModel, link: string): Promise<boolean> {
  const id = idFromLink(link)

  if (link.includes("catalog/")) {
    if (link.includes(" is ")) {
      const assetType = link.split(" is ")[1]
      outfitModel.outfit.addAsset(id, assetType, "")
      return true
    }
    return outfitModel.outfit.addAssetId(id, auth)
  } else {
    return outfitModel.outfit.addBundleId(id, auth)
  }
}

const loadedThumbnails = new Map<string,string>()

async function addThumbnailFromLink(itemLink: string) {
  const result = await awaitTimeout(API.Thumbnails.GetThumbnail(auth, itemLink.includes("catalog/") ? "Asset" : "BundleThumbnail", idFromLink(itemLink), "420x420"))
  if (result && !(result instanceof Response)) {
    loadedThumbnails.set(itemLink, result)

    const response = await fetch(result)
    const data = await response.arrayBuffer()

    console.log("Got thumbnail for", itemLink)

    queuedBufferDownloads.push({
      "name": (itemLink.includes("catalog/") ? "Asset" : "Bundle") + idFromLink(itemLink) + ".webp",
      data,
    })
  } else {
    console.error("Failed to get thumbnail for", itemLink, result)
  }
}

//get avatar data for the user with id 1
const outfitModel = new OutfitModel()

//create renderer for outfit
    //used by api
    

    const outfitRenderer = new OutfitRenderer(auth, outfitModel)
    outfitRenderer.startAnimating()
    outfitRenderer.setMainAnimation("idle")

    setTimeout(() => {
      const newOutfitModel = outfitModel.clone()
      const promises = []

      for (const itemlink of baseItemLinks) {
        promises.push(addItemLink(newOutfitModel, itemlink))
      }
      for (const itemLink of addedItemLinks) {
        promises.push(addItemLink(newOutfitModel, itemLink))
        promises.push(addThumbnailFromLink(itemLink))
      }
      /*
      promises.push(newOutfitModel.outfit.addBundleId(311))
      promises.push(newOutfitModel.outfit.addAssetId(192557913, auth))
      promises.push(newOutfitModel.outfit.addAssetId(9399980877, auth))
      promises.push(newOutfitModel.outfit.addAssetId(13262352966, auth))
      promises.push(newOutfitModel.outfit.addBundleId(949))
      promises.push(newOutfitModel.outfit.addAssetId(131592085, auth))
      promises.push(outfitRenderer.setOutfitModel(newOutfitModel))
      */

      Promise.all(promises).then(() => {
        const itemList = []

        for (const itemLink of addedItemLinks) {
          const id = idFromLink(itemLink)

          if (itemLink.includes("catalog/")) {
            for (const asset of newOutfitModel.outfit.assets) {
              if (asset.id === id) {
                itemList.push({
                  id,
                  type: "Asset",
                  assetType: asset.assetType.name,
                })
              }
            }
          } else {
            itemList.push({
              id,
              type: "Bundle"
            })
          }
        }

        console.log(itemList)
        console.log(JSON.stringify(itemList))

        outfitRenderer.setOutfitModel(newOutfitModel)
        outfitRenderer.setMainAnimation("emote.3576686446")
      })
    }, 3000);
  
function saveBlob(blob: Blob, name: string) {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.setAttribute("style","display: none;")

    const url = globalThis.URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    globalThis.URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).downloadAll = () => {
  const zip = new JSZip()

  for (const bufferDownload of queuedBufferDownloads) {
    zip.file(bufferDownload.name, bufferDownload.data)
  }

  zip.generateAsync({type: "blob"}).then((content) => {
    saveBlob(content, "allAssets.zip")
  })
}