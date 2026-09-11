/**
 * This file was used for generating the asset files used by https://roavatar.net so that a website can display an avatar
 * 
 * It works by loading an avatar and storing all the requests to roblox as files so they can be replayed later without actually
 * making any requests to roblox.
 * 
 * Below you can configure the items you want loaded (and to have requests stored)
 * 
 * After the avatar is fully loaded go into the console and write "downloadAll()" to download a zip file of the request data and item images 
 * 
 * Here's an example of fetch and image intercept functions you can add to your website after getting the zip file (assuming you moved the
 * files into a folder name api:
    async function fetchFunction(input: URL | RequestInfo, _init?: RequestInit): Promise<Response> {
        return fetch(`/api/${fastHash(input.toString())}.buffer`)
    }

    async function imageFunction(input: string): Promise<string> {
        return `/api/${fastHash(input.toString())}.buffer`
    }
      
    FLAGS.FETCH_FUNC = fetchFunction 
    FLAGS.IMAGE_FUNC = imageFunction
    FLAGS.ONLINE_ASSETS = true
 */

//only reason its organized into always items and later items is because the website lets you unequip/equip items

//items the outfit ALWAYS has
const baseItemLinks = [
  "https://www.roblox.com/catalog/658832408/Ninja-Idle",
]

//items that can be added to the outfit later
const addedItemLinks = [
  "https://www.roblox.com/bundles/311/Robloxian-2-0",
  "https://www.roblox.com/catalog/5509426582/Shirt-5509426582 is Shirt",
  "https://www.roblox.com/catalog/233615637/Beautiful-Blonde-Hair-for-Beautiful-People",
  "https://www.roblox.com/catalog/151314918/Raeglyns-Winged-Blindfold-of-Justice",
  "https://www.roblox.com/catalog/104077820810525/white",
  "https://www.roblox.com/catalog/192557913/Sparkling-Angel-Wings"
]

//base outfitModel, set skincolor, scale and other stuff here if you want but do note those things do NOT require requests and are unneccessary
const outfitModel = new OutfitModel()

import JSZip from 'jszip'
import './index.css'
import { API, Authentication, awaitTimeout, exposeAPI, exposeFLAGS, exposeMesh, exposeThumbnailGenerator, FLAGS, OutfitModel, OutfitRenderer, RBXRenderer } from 'roavatar-renderer'

//declare const browser: typeof chrome;

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
FLAGS.ENABLE_API_MESH_CACHE = true
FLAGS.ENABLE_API_RBX_CACHE = true
FLAGS.ONLINE_ASSETS = true
FLAGS.USE_WORKERS = true
FLAGS.VERBOSE_LOGGING = false
FLAGS.USE_POST_PROCESSING = false
exposeAPI()
exposeMesh()
exposeFLAGS()
exposeThumbnailGenerator()

//used to hash assetdelivery and cdn strings since they contain illegal characters
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

//intercept fetch requests (assetdelivery and rbxcdn)
FLAGS.FETCH_FUNC = (input: URL | RequestInfo, init?: RequestInit) => {
  return new Promise((resolve) => {
    fetch(input, init).then(result => {
      result.arrayBuffer().then((buffer) => {
        totalCount += 1

        //queue asset download
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
//intercept loaded images
FLAGS.IMAGE_FUNC = (url: string) => {
  return new Promise((resolve) => {
    fetch(url).then(result => {
      result.arrayBuffer().then((buffer) => {
        totalCount += 1

        //quere image download
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

async function main() {
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
  //add renderer to document
  document.body.appendChild(RBXRenderer.getRendererElement())

  const auth = new Authentication()

  //functions to help with adding items to the outfit
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

  //saves item thumbnails
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

  //create renderer for outfit
  const outfitRenderer = new OutfitRenderer(auth, outfitModel)
  outfitRenderer.startAnimating()
  outfitRenderer.setMainAnimation("idle")

  setTimeout(() => {
    const newOutfitModel = outfitModel.clone()
    const promises = []

    //adds all items to outfit
    for (const itemlink of baseItemLinks) {
      promises.push(addItemLink(newOutfitModel, itemlink))
    }
    for (const itemLink of addedItemLinks) {
      promises.push(addItemLink(newOutfitModel, itemLink))
      promises.push(addThumbnailFromLink(itemLink))
    }

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

      //print out list of items
      console.log(itemList)
      console.log(JSON.stringify(itemList))

      outfitRenderer.setOutfitModel(newOutfitModel)

      //emote we want to load
      outfitRenderer.setMainAnimation("emote.3576686446")
    })
  }, 3000);
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.setAttribute("style", "display: none;")

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

  zip.generateAsync({ type: "blob" }).then((content) => {
    saveBlob(content, "allAssets.zip")
  })
}

main()