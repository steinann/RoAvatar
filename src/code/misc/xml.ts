function getXMLProperty(doc: Document | Element, propertyName: string) {
    const propertyNode = doc.querySelector('[name="' + propertyName + '"]')
    if (!propertyNode) {
        console.warn("Property with name " + propertyName + " does not exist")
    }
    return propertyNode
}

function setXMLProperty(doc: Document | Element, propertyName: string, value: string | number) {
    const propertyNode = getXMLProperty(doc, propertyName)
    if (propertyNode) {
        propertyNode.innerHTML = value.toString()
    }
}

function changeXMLProperty(doc: Document | Element, propertyName: string, value: string | number) {
    const propertyNode = getXMLProperty(doc, propertyName)
    if (propertyNode) {
        if (propertyNode.innerHTML != "") {
            propertyNode.innerHTML = propertyNode.innerHTML + "," + value
        } else {
            propertyNode.innerHTML = value.toString()
        }
    }
}

export { getXMLProperty, setXMLProperty, changeXMLProperty }