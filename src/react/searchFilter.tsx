import { useEffect, useRef, useState } from "react"
import Icon from "./generic/icon"
import RadialButton from "./generic/radialButton"
import ToggleButton from "./generic/toggleButton"
import { DefaultSearchData } from "../code/avatar/sorts"

function Filter({name, children}: React.PropsWithChildren & {name: string}) {
    return <div className="filter">
        <div className="filter-entry">
            <span className="filter-name roboto-400">{name}</span>
            {children}
        </div>
    </div>
}

/*function ContentFilter({name, children}: React.PropsWithChildren & {name: string}) {
    return <div className="contentfilter">
        <button className="filter-entry filter-button">
            <span className="filter-name roboto-400">{name}</span><Icon>keyboard_arrow_down</Icon>
        </button>
        <div className="filter-content">
            {children}
        </div>
    </div>
}*/

export default function SearchFilter({categorySource, limitedOnly, setLimitedOnly, tempSearchKeyword, searchKeyword, setSearchKeyword, setTempSearchKeyword, includeOffsale, setIncludeOffsale}:
    {
        categorySource: string,
        tempSearchKeyword: string,
        searchKeyword: string | undefined,
        setSearchKeyword: (a: string | undefined) => void,
        setTempSearchKeyword: (a: string) => void,
        includeOffsale: boolean,
        setIncludeOffsale: (a: boolean) => void,
        limitedOnly: boolean,
        setLimitedOnly: (a: boolean) => void
    }): React.JSX.Element {
    
    const [filterOpen, setFilterOpen] = useState<boolean>(false)
    
    const filterMenuRef = useRef<HTMLDivElement>(null)
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

    function filterIsDefault() {
        return includeOffsale === DefaultSearchData[categorySource]["includeOffsale"] &&
                limitedOnly === DefaultSearchData[categorySource]["limitedOnly"]
    }

    function resetFilters() {
        setIncludeOffsale(DefaultSearchData[categorySource]["includeOffsale"] as boolean)
        setLimitedOnly(DefaultSearchData[categorySource]["limitedOnly"] as boolean)
    }

    //exit when click outside
    useEffect(() => {
        const mouseUpListener = (e: MouseEvent) => {
            if (!filterMenuRef.current?.contains(e.target as HTMLElement)) {
                setFilterOpen(false)
            }
        }

        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    const currentSearch = searchRef.current?.value
    const hasSearch = currentSearch && currentSearch.length > 0

    const disabledIcon = searchKeyword == tempSearchKeyword || searchKeyword == undefined && tempSearchKeyword.length === 0

    return <div className="searchfilter">
        {/*Filter*/}
        <div className="searchfilter-filter">
            {/*Filter button*/}
            <RadialButton style={{backgroundColor: filterIsDefault() ? "" : "var(--blue)"}} className="searchfilter-filter-button" onClick={()=>{setFilterOpen(!filterOpen)}}>
                <Icon>filter_list</Icon>
            </RadialButton>

            {/*Filter menu*/}
            <div ref={filterMenuRef} className={`searchfilter-filter-menu ${filterOpen ? "open" : ""}`}>
                {/*Topbar*/}
                <div className="dialog-top">
                    <span className="dialog-title roboto-700" style={{margin: "0.5em 0 0.2em 0.5em"}}>Filter</span>
                    <div className="dialog-top">
                        <RadialButton title="Reset" style={{height: "3em"}} className="exit-button icon-button" onClick={resetFilters}>
                            <Icon>delete</Icon>
                        </RadialButton>
                        <RadialButton title="Close" style={{height: "3em", margin: "0 0.5em 0 0"}} className="exit-button icon-button" onClick={() => {setFilterOpen(false)}}>
                            <Icon>close</Icon>
                        </RadialButton>
                    </div>
                </div>
                {/*Actual filters*/}
                <div className="dialog-line" style={{margin: "5px 0", backgroundColor: "var(--blue)"}}></div>
                <Filter name={"Include Offsale"}>
                    <ToggleButton value={includeOffsale} setValue={setIncludeOffsale}/>
                </Filter>
                <Filter name={"Limited Only"}>
                    <ToggleButton value={limitedOnly} setValue={setLimitedOnly}/>
                </Filter>
            </div>
        </div>

        {/*Search*/}
        <div className="searchfilter-search">
            <button className='searchfilter-search-button' onClick={updateSearch}><span style={disabledIcon ? {opacity: "50%"} : {}} className='material-symbols-outlined'>search</span></button>
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