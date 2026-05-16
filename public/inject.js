let hasInjected = false

var observer = new MutationObserver(function (mutations) {
    let errorElement = document.body.querySelector(".request-error-page-content")
    if (errorElement) {
        errorElement.remove()
    }

    let contentElement = document.getElementById("content")
    if (contentElement && !hasInjected) {
        hasInjected = true
        
        const theme = document.body.classList.contains("dark-theme") ? "dark" : "light"

        let iframe = document.createElement("iframe")
        iframe.src = chrome.runtime.getURL(`/index.html?theme=${theme}` + window.location.search.replace("?","&"))
        iframe.style.width = "100%"
        iframe.style.aspectRatio = "16/9"
        iframe.style.borderStyle = "hidden"
        iframe.style.height = "90vh"
        iframe.style.userSelect = "none"
        iframe.style.marginTop = "20px"

        const marginLeftMediaQuery = window.matchMedia("(max-width: 1700px) and (min-width: 1140px)")
        
        function onMarginLeftMediaChange() {
            if (marginLeftMediaQuery.matches) {
                iframe.style.marginLeft = "20px"
            } else {
                iframe.style.marginLeft = "0"
            }
        }

        marginLeftMediaQuery.addEventListener("change", onMarginLeftMediaChange)

        onMarginLeftMediaChange()
        
        contentElement.appendChild(iframe)
        contentElement.style.paddingTop = "0"
        contentElement.style.marginTop = "0"
        document.getElementsByTagName("body")[0].style.overflow = "hidden"
        document.getElementsByTagName("title")[0].innerText = "RoAvatar - Roblox"
    }
})

observer.observe(document, {
    childList: true,
    subtree: true
});