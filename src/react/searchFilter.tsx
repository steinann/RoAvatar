import { useEffect, useRef, useState } from "react"
import Icon from "./generic/icon"
import RadialButton from "./generic/radialButton"
import ToggleButton from "./generic/toggleButton"
import { DefaultSearchData } from "../code/avatar/sorts"
import SelectInput from "./generic/selectInput"

function Filter({name, gap, children}: React.PropsWithChildren & {name: string, gap?: number | string}) {
    return <div className="filter">
        <div className="filter-entry" style={gap !== undefined ? {gap: gap} : {}}>
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

const sortTypeNames: {[K in number]: string} = {
    0: "Relevance",
    1: "Most Favorited",
    2: "Most Popular",
    3: "Recently Published",
    4: "Price (Low to High)",
    5: "Price (High to Low)",
}

export default function SearchFilter({categorySource, minPrice, setMinPrice, maxPrice, setMaxPrice, creator, setCreator, sortType, setSortType, limitedOnly, setLimitedOnly, tempSearchKeyword, searchKeyword, setSearchKeyword, setTempSearchKeyword, includeOffsale, setIncludeOffsale}:
    {
        categorySource: string,
        tempSearchKeyword: string,
        searchKeyword: string | undefined,
        setSearchKeyword: (a: string | undefined) => void,
        setTempSearchKeyword: (a: string) => void,
        includeOffsale: boolean,
        setIncludeOffsale: (a: boolean) => void,
        limitedOnly: boolean,
        setLimitedOnly: (a: boolean) => void,
        sortType: number,
        setSortType: (a: number) => void,
        creator: string,
        setCreator: (a: string) => void,
        minPrice: number,
        setMinPrice: (a: number) => void,
        maxPrice: number,
        setMaxPrice: (a: number) => void,
    }): React.JSX.Element {
    
    const [filterOpen, setFilterOpen] = useState<boolean>(false)
    
    const filterButtonRef = useRef<HTMLButtonElement>(null)
    const filterMenuRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const creatorRef = useRef<HTMLInputElement>(null)
    const minPriceRef = useRef<HTMLInputElement>(null)
    const maxPriceRef = useRef<HTMLInputElement>(null)
    
    const [tempCreator, setTempCreator] = useState<string>("")
    const [tempMinPrice, setTempMinPrice] = useState<string>("")
    const [tempMaxPrice, setTempMaxPrice] = useState<string>("")

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

    function updateCreator() {
        const newValue = creatorRef.current?.value

        setCreator(newValue || "")
    }

    function clearCreator() {
        if (creatorRef.current) {
            creatorRef.current.value = ""
        }

        setTempCreator("")
        setCreator("")
    }

    function clearPrice() {
        setTempMinPrice("")
        setTempMaxPrice("")
        setMinPrice(-1)
        setMaxPrice(-1)
    }

    function filterIsDefault() {
        return includeOffsale === DefaultSearchData[categorySource]["includeOffsale"] &&
                limitedOnly === DefaultSearchData[categorySource]["limitedOnly"] &&
                sortType === 0 &&
                creator === "" &&
                minPrice === -1 &&
                maxPrice === -1
    }

    function resetFilters() {
        setIncludeOffsale(DefaultSearchData[categorySource]["includeOffsale"] as boolean)
        setLimitedOnly(DefaultSearchData[categorySource]["limitedOnly"] as boolean)
        setSortType(0)
        setTempCreator("")
        setCreator("")
        setMinPrice(-1)
        setMaxPrice(-1)
    }

    //exit when click outside
    useEffect(() => {
        const mouseUpListener = (e: MouseEvent) => {
            if (!filterMenuRef.current?.contains(e.target as HTMLElement) && !filterButtonRef.current?.contains(e.target as HTMLElement)) {
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
            <RadialButton ref={filterButtonRef} style={{backgroundColor: filterIsDefault() ? "" : "var(--blue)"}} className="searchfilter-filter-button" onClick={()=>{
                setTempCreator(creator)
                setTempMinPrice(minPrice > -1 ? minPrice.toString() : "")
                setTempMaxPrice(maxPrice > -1 ? maxPrice.toString() : "")
                setFilterOpen(!filterOpen)
                }}>
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
                <Filter name={"Creator"}>
                    <div className="dialog-text-input filter-text-div">
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            updateCreator()
                        }}
                        onChange={() => {
                            setTempCreator(creatorRef.current?.value || "")
                        }}
                        >
                            <input className="filter-text-input roboto-400" ref={creatorRef} placeholder="All" type="text" value={tempCreator}></input>
                        </form>
                        <button style={{display: tempCreator.length > 0 ? "flex" : "none"}} className='searchfilter-search-cancel filter-text-cancel' onClick={clearCreator}>
                            <span className='material-symbols-outlined'>cancel</span>
                        </button>
                    </div>
                </Filter>
                <Filter name={"Price"} gap={0}>
                    <div className="dialog-text-input filter-text-div" style={{marginLeft: "2em", width: "4.5em", minWidth: 0}}>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const newMin = minPriceRef.current?.value && minPriceRef.current?.value.length > 0 ? Number(minPriceRef.current.value) : -1
                            if (newMin > -1 && newMin > maxPrice) {
                                setTempMaxPrice(newMin.toString())
                                setMaxPrice(newMin)
                            }
                            setMinPrice(minPriceRef.current?.value && minPriceRef.current?.value.length > 0 ? Number(minPriceRef.current.value) : -1)
                        }}
                        onChange={() => {
                            setTempMinPrice(minPriceRef.current?.value ? minPriceRef.current.value.replaceAll(/\D/g, "") : "")
                        }}
                        >
                            <input className="filter-text-input roboto-400" ref={minPriceRef} placeholder="Min" type="text" inputMode="numeric" value={tempMinPrice}></input>
                        </form>
                    </div>
                    <div className="dialog-text-input filter-text-div" style={{width: "4.5em", minWidth: 0}}>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const newMax = maxPriceRef.current?.value && maxPriceRef.current?.value.length > 0 ? Number(maxPriceRef.current.value) : -1
                            if (newMax > -1 && minPrice > newMax) {
                                setTempMinPrice(newMax.toString())
                                setMinPrice(newMax)
                            }
                            setMaxPrice(newMax)
                        }}
                        onChange={() => {
                            setTempMaxPrice(maxPriceRef.current?.value ? maxPriceRef.current.value.replaceAll(/\D/g, "") : "")
                        }}
                        >
                            <input className="filter-text-input roboto-400" ref={maxPriceRef} placeholder="Max" type="text" inputMode="numeric" value={tempMaxPrice}></input>
                        </form>
                    </div>
                    <button style={{display: tempMinPrice.length > 0 || tempMaxPrice.length > 0 ? "flex" : "none"}} className='searchfilter-search-cancel filter-text-cancel' onClick={clearPrice}>
                        <span className='material-symbols-outlined'>cancel</span>
                    </button>
                </Filter>
                {categorySource === "Marketplace" ? 
                <Filter name={"Sort by"}>
                    <SelectInput value={sortTypeNames[sortType]} alternatives={Object.values(sortTypeNames)} setValue={(value: string) => {
                        const keys = Object.keys(sortTypeNames)
                        const values = Object.values(sortTypeNames)
                        
                        const keyIndex = values.indexOf(value)
                        const key = Number(keys[keyIndex])

                        setSortType(key)
                    }}/>
                </Filter> : null}
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