export default function BarButton({currentCategory, category, setCategory }:{currentCategory?: string, category: string, setCategory: (a: string) => void}): React.JSX.Element {
    return <button className={`bar-button roboto-600${category===currentCategory ? " bar-button-selected" : ""}`} onClick={() => {setCategory(category)}}>{category}</button>
}