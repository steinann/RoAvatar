let errorElement = document.body.querySelector(".request-error-page-content")
errorElement.remove()

let contentElement = document.getElementById("content")

let iframe = document.createElement("iframe")
iframe.src = chrome.runtime.getURL("/index.html" + window.location.search)
iframe.style.width = "100%"
iframe.style.aspectRatio = "16/9"
iframe.style.borderStyle = "hidden"
iframe.style.maxHeight = "80vh"
contentElement.appendChild(iframe)
contentElement.style.paddingTop = "0"
contentElement.style.marginTop = "0"
document.getElementsByTagName("body")[0].style.overflow = "hidden"
document.getElementsByTagName("title")[0].innerText = "RoAvatar - Roblox"