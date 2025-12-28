//UNUSED
export default function SubCategory({currentCategory, currentSubCategory, setSubCategory}: {currentCategory: string, currentSubCategory: string, setSubCategory: (a: string) => void}): React.JSX.Element {
    return <button>{currentCategory}-{currentSubCategory}-{setSubCategory.name}</button>
}