if (!window.chrome) {
    window.chrome = window.browser
}

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
            avatarEditorHeader.style.position = "relative"

            chrome.storage.local.get(["hasSeenTip"]).then((result) => {
                const hasSeen = result["hasSeenTip"]
                
                if (!hasSeen) {
                    const tipDiv = document.createElement("div")
                    tipDiv.setAttribute("style",`
                        position: absolute;
                        z-index: 100;
                        background-color: white;
                        color: black;
                        padding: 20px;
                        width: 277px;
                        border-radius: 20px 0 20px 20px;
                        display: flex;
                        flex-direction: column;
                        transform: translateY(-10px);
                        border-style: solid;
                        border-color: gray;
                        border-width: 2px;
                    `)
                    
                    const arrow = document.createElement("div")
                    arrow.setAttribute("style", `
                        width: 20px;
                        height: 20px;
                        position: absolute;
                        background-color: white;
                        top: -11px;
                        right: 2px;
                        transform: rotate(45deg);
                        border-color: gray;
                        border-width: 2px;
                        border-style: solid none none solid;
                    `)

                    const text = document.createElement("span")
                    text.innerText = "Click here to try out RoAvatar's editor"

                    const button = document.createElement("button")
                    button.setAttribute("style", `
                        background-color: #466eff;
                        color: white;
                        border: none;
                        border-radius: 20px;
                        font-size: medium;
                        margin-top: 3px;
                        padding: 2px;
                    `)
                    button.innerText = "Okay"

                    button.addEventListener("click", () => {
                        tipDiv.remove()
                        chrome.storage.local.set({"hasSeenTip": true})
                    })

                    tipDiv.appendChild(arrow)
                    tipDiv.appendChild(text)
                    tipDiv.appendChild(button)

                    avatarEditorHeader.insertBefore(tipDiv, catalogHeader)
                }
            })
        }
    }
})

observer.observe(document, {
    childList: true,
    subtree: true
});

chrome.storage.local.get(["s-default"]).then((result => {
    if (result["s-default"]) {
        const aElement = document.createElement("a")
        aElement.href = "https://www.roblox.com/my/avatar-plus"
        aElement.click()
    }
}))