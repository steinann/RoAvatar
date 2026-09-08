const elementCallbacks: {
    query: string,
    callback: (a: Element) => void | boolean
}[] = []

function callCallbacks(element: Element) {
    for (const elementCallback of elementCallbacks) {
        if (element.matches(elementCallback.query)) {
            const shouldDestroy = elementCallback.callback(element as Element)
            if (shouldDestroy) {
                elementCallback.callback = () => {}
            }
        }
    }
}

export function initObserver() {
    const observer = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                //for each added node
                for (const element of mutation.addedNodes) {
                    if (element.nodeType === Node.ELEMENT_NODE) {
                        callCallbacks(element as Element)

                        //descendant nodes
                        const children = (element as Element).querySelectorAll("*")
                        for (const child of children) {
                            if (child instanceof Element) callCallbacks(child)
                        }
                    }
                }
            }
        }
    })
    observer.observe(document, {
        childList: true,
        subtree: true,
    })
}

export function observeElement(query: string, callback: (a: Element) => void | boolean) {
    elementCallbacks.push({
        query,
        callback
    })
}