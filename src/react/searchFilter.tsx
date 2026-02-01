import { useRef, useState } from "react"

export default function SearchFilter({tempSearchKeyword, setSearchKeyword, setTempSearchKeyword}: {tempSearchKeyword: string, setSearchKeyword: (a: string | undefined) => void, setTempSearchKeyword: (a: string) => void}): React.JSX.Element {
    const [searchOpen, setSearchOpen] = useState(false)

    const searchRef = useRef<HTMLInputElement>(null)
    
    return <div className="searchfilter">
        <div className="searchfilter-buttons">
            <button className='search-button' onClick={() => {setSearchOpen(!searchOpen)}}><span className='material-symbols-outlined'>search</span></button>
        </div>
        {searchOpen ?
        <div className="searchfilter-search">
            <form onSubmit={(e) => {
                e.preventDefault()

                const newValue = searchRef.current?.value

                if (newValue) {
                    setSearchKeyword(newValue && newValue.length > 0 ? newValue : undefined)
                }
            }}
            onChange={() => {
                setTempSearchKeyword(searchRef.current?.value || "")
            }}
            >
                <input ref={searchRef} type="text" value={tempSearchKeyword}></input>
            </form>
        </div> : null}
    </div>
}