import { useRef } from "react"

export default function SearchFilter({tempSearchKeyword, setSearchKeyword, setTempSearchKeyword}: {tempSearchKeyword: string, setSearchKeyword: (a: string | undefined) => void, setTempSearchKeyword: (a: string) => void}): React.JSX.Element {
    const searchRef = useRef<HTMLInputElement>(null)
    
    function updateSearch() {
        const newValue = searchRef.current?.value

        setSearchKeyword(newValue && newValue.length > 0 ? newValue : undefined)
    }

    function clearSearch() {
        if (searchRef.current) {
            searchRef.current.value = ""
        }

        setTempSearchKeyword("")
        setSearchKeyword(undefined)
    }

    const currentSearch = searchRef.current?.value
    const hasSearch = currentSearch && currentSearch.length > 0

    return <div className="searchfilter">
        <div className="searchfilter-search">
            <button className='searchfilter-search-button' onClick={updateSearch}><span className='material-symbols-outlined'>search</span></button>
            <div className={`searchfilter-search-input ${!hasSearch ? "empty" : ""}`}>
                <form onSubmit={(e) => {
                    e.preventDefault()
                    updateSearch()
                }}
                onChange={() => {
                    setTempSearchKeyword(searchRef.current?.value || "")
                }}
                >
                    <input ref={searchRef} placeholder="Search" type="text" value={tempSearchKeyword}></input>
                </form>
                <button style={{display: hasSearch ? "" : "none"}} className='searchfilter-search-cancel' onClick={clearSearch}>
                    <span className='material-symbols-outlined'>cancel</span>
                </button>
            </div>
        </div>
    </div>
}