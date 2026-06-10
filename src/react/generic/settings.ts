import { Event } from "roavatar-renderer"

declare const browser: typeof chrome;

const settingCache = new Map<string,unknown>()
export const OnSettingChange = new Event()

export async function getSetting(storage: string, defaultValue: unknown): Promise<unknown> {
    const cached = settingCache.get(storage)
    if (cached !== undefined) {
        return cached
    } else {
        const promise = new Promise<unknown>(resolve => {
            (chrome || browser).storage.local.get([storage]).then((result) => {
                let value = defaultValue

                const storageResult = result[storage]
                if (storageResult !== undefined && storageResult !== null) {
                    value = storageResult as boolean
                }

                settingCache.set(storage, value)
                OnSettingChange.Fire(storage, value)
                resolve(value)
            })
        })

        settingCache.set(storage, promise)

        return promise
    }
}

export async function setSetting(storage: string, value: unknown) {
    settingCache.set(storage, value)
    OnSettingChange.Fire(storage, value);
    (chrome || browser).storage.local.set({[storage]: value})
}