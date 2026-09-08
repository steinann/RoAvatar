export function getIdFromUrl(url: string) {
    let beforeId = undefined
    if (url.includes("/catalog/")) {
        beforeId = "catalog"
    } else if (url.includes("/users/")) {
        beforeId = "users"
    }

    //https://www.roblox.com/catalog/13241836994/Verdant-Crown
    //https://www.roblox.com/fr/catalog/13241836994/Verdant-Crown
    if (beforeId) {
        const parts = url.split("/")
        const catalogIndex = parts.indexOf(beforeId)
        const idIndex = catalogIndex + 1
        if (idIndex > 0) {
            return Number(parts[idIndex])
        }
    }
}