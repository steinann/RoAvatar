import type { CategoryDictionary } from "../code/avatar/sorts"
import BarButton from "./barButton"

export default function BarCategory({children, source, currentCategory, setCurrentCategory, className = "" }: React.PropsWithChildren & { source?: typeof CategoryDictionary | typeof CategoryDictionary.Inventory | typeof CategoryDictionary.Inventory.Recent, currentCategory?: string, setCurrentCategory?: (a: string) => void, className?: string } ): React.JSX.Element {
    const realChildren = []

    if (source && setCurrentCategory) {
        for (const key of Object.keys(source)) {
            if (!key.startsWith("_")) {
                realChildren.push(
                    <BarButton category={key} currentCategory={currentCategory} setCategory={setCurrentCategory}/>
                )
            }
        }
    }

    return <div className={`dark-scrollbar bar-category ${className}`}>
        {realChildren}
        {children}
    </div>
}