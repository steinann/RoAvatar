import { OutfitOrigin } from "./avatar/constant"
import { Outfit } from "./avatar/outfit"
import { browserCookiesGet } from "./browser"
import { BODYCOLOR3 } from "./misc/flags"
import { generateUUIDv4 } from "./misc/misc"
import { FileMesh } from "./rblx/mesh"
import { RBX } from "./rblx/rbx"

class Authentication {
    ROBLOSECURITY?: string
    TOKEN?: string
    SessionUUID?: string

    lastRefreshed = new Date().getTime()

    async fill() {
        this.ROBLOSECURITY = await API.Auth.GetCookie()
        /*
        if (this.ROBLOSECURITY) {
            this.TOKEN = await API.Auth.GetToken(this.ROBLOSECURITY)
        }
        */
    }

    async getToken() {
        throw new Error("Deprecated member function auth.getToken() was called!")
    }

    getCachedToken() {
        return this.TOKEN
    }

    getROBLOSECURITY() {
        return this.ROBLOSECURITY
    }

    getSessionUUID() {
        if (!this.SessionUUID) {
            this.SessionUUID = generateUUIDv4()
        }

        return this.SessionUUID
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function RBLXPost(url: string, auth: Authentication, body: any, attempt = 0, method = "POST"): Promise<Response> {
    if ((typeof body) !== "string") {
        body = JSON.stringify(body)
    }

    let robloxSecurityCookie = ""
    let xCsrfToken = ""

    if (auth) {
        robloxSecurityCookie = ".ROBLOSECURITY=" + auth.getROBLOSECURITY()
        xCsrfToken = auth.getCachedToken() || ""

        if (!robloxSecurityCookie) {
            throw new Error("User is not authenticated")
        }

        if (!xCsrfToken) {
            xCsrfToken = ""
        }
    }

    return new Promise((resolve) => {
        const fetchHeaders = new Headers({
            "Content-Type": "application/json",
            "Cookie": robloxSecurityCookie,
            "X-CSRF-TOKEN": xCsrfToken,
        })

        try {
            fetch(url, {
                method: method,
                credentials: "include",
                headers: fetchHeaders,
                body: body
            }).then(response => {
                if (response.status !== 200) {
                    if (response.status === 403 && attempt < 1) { //refresh token
                        const responseToken = response.headers.get("x-csrf-token")
                        if (responseToken) {
                            auth.TOKEN = responseToken
                        }
                        RBLXPost(url, auth, body, attempt + 1, method)
                    } else {
                        resolve(response)
                    }
                } else {
                    resolve(response)
                }
            })
        } catch (error) {
            console.warn(error)
            resolve(new Response(JSON.stringify({"error": error}), {status: 500}))
        }
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function RBLXGet(url: string, auth?: Authentication, headers?: any): Promise<Response> {
    let robloxSecurityCookie = undefined

    if (auth) {
        robloxSecurityCookie = ".ROBLOSECURITY=" + auth.getROBLOSECURITY()
    }

    if (!robloxSecurityCookie) {
        robloxSecurityCookie = ""
    }

    return new Promise((resolve) => {
        let newHeaders: HeadersInit = {
            "Content-Type": "application/json",
            "Cookie": robloxSecurityCookie,
        }

        if (headers) {
            newHeaders = {...newHeaders, ...headers}
        }

        const fetchHeaders = new Headers(newHeaders)

        try {
            fetch(url, {
                credentials: "include",
                headers: fetchHeaders,
            }).then(response => {
                resolve(response)
            })
        } catch (error) {
            console.warn(error)
            resolve(new Response(JSON.stringify({"error": error}), {status: 500}))
        }
    })
}

/*async function RBLXPatch(url: string, auth: Authentication, body: any, attempt = 0): Promise<Response> {
    return RBLXPost(url, auth, body, attempt, "PATCH")
}*/

function idFromStr(str: string) {
    const numStrs = str.match(/\d+(\.\d+)?/g) || []
    return numStrs.length > 0 ? Number(numStrs[numStrs.length - 1]) : NaN
}

export function parseAssetString(str: string) {
    if (!isNaN(Number(str))) {
        return `https://assetdelivery.roblox.com/v1/asset?id=${str}`
    } else if (str.startsWith("rbxassetid://")) {
        return `https://assetdelivery.roblox.com/v1/asset?id=${str.slice(13)}`
    } else if (str.startsWith("rbxasset://")) {
        str = str.replaceAll("\\","/")
        return "../assets/rbxasset/" + str.slice(11)
    } else if (str.includes("roblox.com/asset")) { //i am tired of the 1 million variants of https://www.roblox.com/asset/?id=
        return `https://assetdelivery.roblox.com/v1/asset?id=${idFromStr(str)}`
    } else if (str.startsWith("https://assetdelivery.roblox.com/v1/asset/?id=")) {
        return `https://assetdelivery.roblox.com/v1/asset?id=${str.slice(46)}`
    } else if (str.includes("assetdelivery.roblox.com")) {
        return `https://assetdelivery.roblox.com/v1/asset?id=${idFromStr(str)}`
    } else if (str.startsWith(".")) { //local file
        return str
    } else {
        console.warn(`Failed to parse path of ${str}`)
    }
}

const CACHE = {
    "AssetBuffer": new Map<string,ArrayBuffer>(),
    "RBX": new Map<string,RBX>(),
    "Mesh": new Map<string,FileMesh>(),
    "Image": new Map<string,HTMLImageElement | undefined>(),
}

const API = {
    "Generic": {
        LoadImage: async function(url: string): Promise<HTMLImageElement | undefined> {
            return new Promise((resolve) => {
                const fetchStr = parseAssetString(url) || url

                const cachedImage = CACHE.Image.get(fetchStr)

                if (cachedImage) {
                    resolve(cachedImage)
                } else {
                    const image = new Image()
                    image.onload = () => {
                        CACHE.Image.set(fetchStr, image)
                        resolve(image)
                    }
                    image.onerror = () => {
                        CACHE.Image.set(fetchStr, undefined)
                        resolve(undefined)
                    }
                    image.crossOrigin = "anonymous"
                    image.src = fetchStr
                }
            })
        }
    },
    "Auth": {
        GetCookie: async function() {
            let returnedCookie = await browserCookiesGet(".ROBLOSECURITY", "https://www.roblox.com")
            if (returnedCookie) {
                returnedCookie = returnedCookie.replace("_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_", "")
            } else {
                returnedCookie = undefined
            }

            return returnedCookie;
        },
        GetToken: async function(ROBLOSECURITY: string) {
            throw new Error("Deprecated function GetToken() called")

            const response = await fetch("https://auth.roblox.com/v2/logout", {
                method:"POST",
                credentials:"include",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": ".ROBLOSECURITY=" + ROBLOSECURITY
                },
                body: JSON.stringify({})
            })
            
            const token = response.headers.get("x-csrf-token")

            if (token) {
                return token
            } else {
                return undefined
            }
        },
        GetAuth: async function() {
            const auth = new Authentication()
            await auth.fill()

            return auth
        }
    },
    "Economy": {
        GetAssetDetails: async function(auth: Authentication, assetId: number) {
            return RBLXGet("https://economy.roblox.com/v2/assets/" + assetId + "/details", auth)
        }
    },
    "Avatar": {
        WearOutfit: async function(auth: Authentication, outfit: Outfit, onlyItems: boolean): Promise<boolean> {
            return new Promise((returnResolve) => {
                const promises: Promise<Response>[] = []

                //assets
                promises.push(new Promise((resolve) => {
                    RBLXPost("https://avatar.roblox.com/v2/avatar/set-wearing-assets", auth, {"assets": outfit.getAssetsJson()}).then(response => {
                        return response.json()
                    }).then(body => {
                        if (body.success == false) {
                            const currentAssets = outfit.getAssetsJson()

                            for (let i = 0; i < body.invalidAssetIds.length; i++) {
                                for (let j = 0; j < currentAssets.length; j++) {
                                    if (currentAssets[j].id == body.invalidAssetIds[i]) {
                                        currentAssets.splice(j,1)
                                    }
                                }
                            }

                            RBLXPost("https://avatar.roblox.com/v2/avatar/set-wearing-assets", auth, {"assets": currentAssets}).then(response => {
                                resolve(response)
                            })
                        } else {
                            resolve(new Response("", {status: 400}))
                        }
                    })
                }))
                

                if (!onlyItems) {
                    //scale
                    promises.push(new Promise((resolve) => {
                        RBLXPost("https://avatar.roblox.com/v1/avatar/set-scales", auth, outfit.scale.toJson()).then(response => {
                        resolve(response)
                    })
                    }))

                    //bodyColors
                    const isBrickColor = outfit.bodyColors.colorType == "BrickColor"
                    promises.push(new Promise((resolve) => {
                        RBLXPost(`https://avatar.roblox.com/${isBrickColor ? "v1" : "v2"}/avatar/set-body-colors`, auth, outfit.bodyColors.toJson()).then(response => {
                            resolve(response)
                        })
                    }))

                    //playerAvatarType
                    promises.push(new Promise((resolve) => {
                        RBLXPost("https://avatar.roblox.com/v1/avatar/set-player-avatar-type", auth, {"playerAvatarType": outfit.playerAvatarType}).then(response => {
                            resolve(response)
                        })
                    }))
                }

                Promise.all<Response>(promises).then(values => {
                    let isSuccess = true
                    
                    for (const value of values) {
                        if (value.status !== 200) {
                            isSuccess = false
                        }
                    }

                    returnResolve(isSuccess)
                })
            })
        },
        SaveOutfitToRoblox: async function(auth: Authentication, outfit: Outfit) {
            const requestUrl = `https://avatar.roblox.com/${BODYCOLOR3 ? "v3" : "v2"}/outfits/create`

            return RBLXPost(requestUrl, auth, outfit.toCleanJson())
        },
        GetAvatarDetails: async function GetAvatarDetails(auth: Authentication, userId: number) {
            let requestUrl = "https://avatar.roblox.com/v1/users/"
            
            if (BODYCOLOR3) {
                requestUrl = "https://avatar.roblox.com/v2/avatar/users/"
            }

            const response = await RBLXGet(requestUrl + userId + "/avatar", auth)

            if (response.status == 200) {
                const responseBody = await response.json()

                const outfit = new Outfit()
                outfit.fromJson(responseBody)
                outfit.id = userId
                outfit.creatorId = userId
                outfit.origin = OutfitOrigin.WebAvatar

                return outfit
            } else {
                return response
            }
        }
    },
    "Asset": {
        GetAssetBuffer: async function(url: string, headers?: HeadersInit, auth?: Authentication) {
            const fetchStr = parseAssetString(url) || url

            let cacheStr = fetchStr
            if (headers) {
                cacheStr += JSON.stringify(headers)
            }

            const cachedBuffer = CACHE.AssetBuffer.get(cacheStr)
            if (cachedBuffer) {
                return cachedBuffer
            } else {
                const response = await RBLXGet(fetchStr, auth, headers)
                if (response.status === 200) {
                    const data = await response.arrayBuffer()
                    CACHE.AssetBuffer.set(cacheStr, data)
                    return data
                } else {
                    return response
                }
            }
        },
        GetRBX: async function(url: string, headers?: HeadersInit, auth?: Authentication) {
            const fetchStr = parseAssetString(url) || url

            if (!auth && fetchStr.startsWith("http")) {
                console.warn(`Fetching ${url} WITHOUT authentication, this is likely a mistake`)
            }

            let cacheStr = fetchStr
            if (headers) {
                cacheStr += JSON.stringify(headers)
            }

            const cachedRBX = CACHE.RBX.get(cacheStr)
            if (cachedRBX) {
                return cachedRBX.clone()
            } else {
                const response = await this.GetAssetBuffer(fetchStr, headers, auth)
                if (response instanceof ArrayBuffer) {
                    const buffer = response
                    const rbx = new RBX()
                    rbx.fromBuffer(buffer)
                    CACHE.RBX.set(cacheStr, rbx.clone())
                    return rbx
                } else {
                    return response
                }
            }
        },
        GetMesh: async function(url: string, headers?: HeadersInit, auth?: Authentication, readOnly: boolean = false) {
            const fetchStr = parseAssetString(url) || url

            let cacheStr = fetchStr
            if (headers) {
                cacheStr += JSON.stringify(headers)
            }

            const cachedMesh = CACHE.Mesh.get(cacheStr)
            if (cachedMesh) {
                if (readOnly) {
                    return cachedMesh
                } else {
                    return cachedMesh.clone()
                }
            } else {
                const response = await this.GetAssetBuffer(fetchStr, headers, auth)
                if (response instanceof ArrayBuffer) {
                    const buffer = response
                    const mesh = new FileMesh()
                    mesh.fromBuffer(buffer)
                    CACHE.Mesh.set(cacheStr, mesh.clone())
                    return mesh
                } else {
                    return response
                }
            }
        }
    },
    "Users": {
        GetUserInfo: async function(auth: Authentication) {
            const response = await RBLXGet("https://users.roblox.com/v1/users/authenticated", auth)
            
            if (response.status == 200) {
                return await response.json() as {id: number, name: string, displayName: string}
            } else {
                console.warn("Failed to get user info: GetUserInfo(auth)")
                return undefined
            }
        }
    }
}

export { API, Authentication }

// Extend the Window interface to include the API property
declare global {
    interface Window {
        API: typeof API;
        APICACHE: typeof CACHE;
    }
}

window.API = API
window.APICACHE = CACHE