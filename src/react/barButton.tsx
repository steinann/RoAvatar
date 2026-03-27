import Icon from "./generic/icon"

export default function BarButton({currentCategory, category, setCategory}:{currentCategory?: string, category: string, setCategory: (a: string) => void}): React.JSX.Element {
    const className = `bar-button roboto-600${category===currentCategory ? " bar-button-selected" : ""}`
    const onClick = () => {setCategory(category)}
    let icon = undefined
    switch (category) {
        case "Marketplace":
            icon = <Icon>shopping_basket</Icon>
            break
        case "Inventory":
            icon = <Icon>backpack</Icon>
            break
    }

    return <button className={className} title={icon ? category : undefined} onClick={onClick}>{icon}<span className={`${icon ? " hide-max-width-1150" : ""}`}>{category}</span></button>
}