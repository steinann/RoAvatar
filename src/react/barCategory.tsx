import type { CategoryDictionary } from "../code/avatar/sorts"
import BarButton from "./barButton"

export default function BarCategory({ source, currentCategory, setCurrentCategory, className = "" }: { source?: typeof CategoryDictionary | typeof CategoryDictionary.Inventory | typeof CategoryDictionary.Inventory.Recent, currentCategory?: string, setCurrentCategory?: (a: string) => void, className?: string } ): React.JSX.Element {
    const children = []
    
    if (source && currentCategory && setCurrentCategory) {
        for (const key of Object.keys(source)) {
            children.push(
                <BarButton category={key} currentCategory={currentCategory} setCategory={setCurrentCategory}/>
            )
        }
    }

    return <div className={`bar-category ${className}`}>
        {children}
    </div>
}