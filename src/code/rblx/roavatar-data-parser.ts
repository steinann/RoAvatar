import { API } from "../api"
import type { Instance } from "./rbx"

export type RoAvatarErrorType = "Error" | "Warning" | "Bug"
export type RoAvatarBrowser = "Dev" | "Chrome" | "Firefox" | "Edge"
const AllBrowsers: RoAvatarBrowser[] = ["Dev", "Chrome", "Firefox", "Edge"]

export function versionToNumber(version: string) {
    const nums = version.split(".")
    nums.reverse()

    let total = 0
    for (let i = 0; i < nums.length; i++) {
        total += Number(nums[i]) * Math.pow(1000,(i+1))
    }
    return total
}

export class RoAvatarDataError {
    name: string
    text?: string
    timestamp: number = 0
    minVersion?: string
    maxVersion?: string
    browser: RoAvatarBrowser[] = AllBrowsers
    type: RoAvatarErrorType = "Error"
    color?: string

    constructor(name: string) {
        this.name = name
    }

    shouldShow() {
        const timestamp = Date.now()

        const version = versionToNumber(API.Generic.GetManifestVersion())
        const minVersion = this.minVersion !== undefined && this.minVersion !== "" ? versionToNumber(this.minVersion) : -Infinity
        const maxVersion = this.maxVersion !== undefined && this.maxVersion !== "" ? versionToNumber(this.maxVersion) : Infinity

        const browser = API.Generic.GetBrowser()

        return this.timestamp <= timestamp &&
                minVersion <= version &&
                maxVersion >= version &&
                this.browser.includes(browser)
    }
}

export class RoAvatarVersions {
    Dev?: string
    Chrome?: string
    Firefox?: string
    Edge?: string

    getForBrowser(browser: RoAvatarBrowser) {
        return this[browser]
    }

    fromInstance(instance: Instance) {
        for (const child of instance.GetChildren()) {
            const browser = child.Prop("Name") as RoAvatarBrowser
            const version = child.Prop("Value") as string

            this[browser] = version
        }
    }
}

export class RoAvatarData {
    errors: RoAvatarDataError[] = []
    versions?: RoAvatarVersions
    criticalOutdated?: RoAvatarVersions

    fromInstance(instance: Instance) {
        //parse errors
        const errorsFolder = instance.FindFirstChild("Errors")
        if (errorsFolder) {
            for (const errorInst of errorsFolder.GetChildren()) {
                const error = new RoAvatarDataError(errorInst.Prop("Name") as string)

                //appearance
                const textInst = errorInst.FindFirstChild("Text")
                if (textInst) {
                    error.text = textInst.Prop("Value") as string
                }

                const colorInst = errorInst.FindFirstChild("Color")
                if (colorInst) {
                    error.color = colorInst.Prop("Value") as string
                }

                //criteria
                const maxVersionInst = errorInst.FindFirstChild("MaxVersion")
                if (maxVersionInst) {
                    error.maxVersion = maxVersionInst.Prop("Value") as string
                }

                const minVersionInst = errorInst.FindFirstChild("MinVersion")
                if (minVersionInst) {
                    error.minVersion = minVersionInst.Prop("Value") as string
                }

                const timestampInst = errorInst.FindFirstChild("Timestamp")
                if (timestampInst) {
                    error.timestamp = timestampInst.Prop("Value") as number
                }

                const browserInst = errorInst.FindFirstChild("Browser")
                if (browserInst) {
                    const value = (browserInst.Prop("Value") as string)
                    if (value !== "") {
                        error.browser = value.split(",") as RoAvatarBrowser[]
                    }
                }

                //type
                const typeInst = errorInst.FindFirstChild("Type")
                if (typeInst) {
                    error.type = (typeInst.Prop("Value") as string) as RoAvatarErrorType
                }

                this.errors.push(error)
            }
        }

        //parse versions
        const versionsFolder = instance.FindFirstChild("CurrentVersions")
        if (versionsFolder) {
            this.versions = new RoAvatarVersions()
            this.versions.fromInstance(versionsFolder)
        }

        //parse criticalOutdated
        const outdatedVersionsFolder = instance.FindFirstChild("OutdatedVersions")
        if (outdatedVersionsFolder) {
            this.criticalOutdated = new RoAvatarVersions()
            this.criticalOutdated.fromInstance(outdatedVersionsFolder)
        }
    }
}