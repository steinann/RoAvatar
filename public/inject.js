let errorElement = document.body.querySelector(".request-error-page-content")
errorElement.remove()

let contentElement = document.getElementById("content")

let iframe = document.createElement("iframe")
iframe.src = chrome.runtime.getURL("/index.html")
iframe.style.width = "100%"
iframe.style.aspectRatio = "16/9"
iframe.style.borderStyle = "hidden"
contentElement.appendChild(iframe)
document.getElementsByTagName("body")[0].style.overflow = "hidden"