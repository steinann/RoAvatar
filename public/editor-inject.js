let hasInjected = false

var observer = new MutationObserver(function (mutations) {
    let avatarEditorHeader = document.body.querySelector(".avatar-editor-header")
    if (avatarEditorHeader && !hasInjected) {
        let catalogHeader = avatarEditorHeader.querySelector(".catalog-header")

        if (catalogHeader && !hasInjected) {
            hasInjected = true

            const aElement = document.createElement("a")
            aElement.innerText = "Visit RoAvatar"
            aElement.style.textDecoration = "underline"
            aElement.href = "https://www.roblox.com/my/avatar-plus"

            avatarEditorHeader.insertBefore(aElement, catalogHeader)
        }
    }
})

observer.observe(document, {
    childList: true,
    subtree: true
});