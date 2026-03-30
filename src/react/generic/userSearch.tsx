import { useContext, useEffect, useRef, useState } from "react"
import { API, type UserOmniSearch_Result } from "roavatar-renderer"
import { AuthContext } from "../context/auth-context"

let lastLoadingId = 0
let lastLoadedId = 0

type UserResult = UserOmniSearch_Result["searchResults"][0]["contents"][0]

export default function UserSearch({userId, setUserId}: {userId: number | undefined, setUserId: (a: number) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)

    const [input, setInput] = useState<string | undefined>(undefined)
    const [focused, setFocused] = useState<boolean>(false)
    const [suggestions, setSuggestions] = useState<UserResult[]>([])
    const [pfps, setPfps] = useState<string[]>([])

    const userSearchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    function updateName(userId: number) {
        API.Users.GetInfoForId(userId).then((result) => {
            if (!(result instanceof Response)) {
                console.log(result.name)
                setInput(result.name)
            }
        })
    }

    function updateSuggestions(query: string) {
        if (query.length < 3) return

        lastLoadingId += 1
        const loadId = lastLoadingId

        API.Users.UserOmniSearch(query, "").then((result) => {
            if (!(result instanceof Response)) {
                if (loadId < lastLoadedId) return
                lastLoadedId = loadId

                if (!result.searchResults[0]) return
                if (!result.searchResults[0].contents[0]) return

                const newSuggestions = []
                
                for (const searchResult of result.searchResults[0].contents) {
                    if (newSuggestions.length < 3) {
                        newSuggestions.push(searchResult)
                    }
                }

                setSuggestions(newSuggestions)

                setPfps([])

                const thumbPromises: Promise<string | undefined>[] = []
                for (const suggestion of newSuggestions) {
                    if (auth) {
                        thumbPromises.push(API.Thumbnails.GetThumbnail(auth, "AvatarHeadshot", suggestion.contentId, "150x150"))
                    }
                }

                Promise.all(thumbPromises).then((results) => {
                    if (lastLoadedId !== loadId) {
                        console.log(lastLoadedId, loadId)
                        return
                    }

                    const newPfps = []
                    for (const result of results) {
                        if (result) {
                            newPfps.push(result)
                        } else {
                            newPfps.push("../assets/error.svg")
                        }
                    }

                    setPfps(newPfps)
                })
            }
        })
    }

    //update name if no input but userid
    useEffect(() => {
        if (input === undefined && userId) {
            updateName(userId)
        }
    }, [userId, input])

    //update focused
    useEffect(() => {
        const userSearchElement = userSearchRef.current

        if (userSearchElement) {
            function onFocus() {
                setFocused(true)
            }

            function onUnfocus() {
                setTimeout(() => {
                    if (!userSearchElement) return
                    if (!userSearchElement.contains(document.activeElement)) {
                        setFocused(false)
                    }
                }, 0)
            }

            userSearchElement.addEventListener("focusin", onFocus)
            userSearchElement.addEventListener("focusout", onUnfocus)

            return () => {
                userSearchElement.removeEventListener("focusin", onFocus)
                userSearchElement.removeEventListener("focusout", onUnfocus)
            }
        }
    })

    return <div ref={userSearchRef} className="user-search">
        <form onChange={() => {
            setInput(inputRef.current?.value || "")
            updateSuggestions(inputRef.current?.value || "")
        }} onSubmit={(e) => {
            e.preventDefault()

            setSuggestions([])

            const inputString = inputRef.current?.value
            if (inputString !== undefined) {
                if (isNaN(Number(inputString))) { //username input
                    API.Users.GetIdsFromUsernames([inputString]).then((result) => {
                        if (!(result instanceof Response)) {
                            console.log(result)
                            const data = result.data
                            if (data) {
                                const user = data[0]
                                if (user) {
                                    setUserId(user.id)
                                    updateName(user.id)
                                }
                            }
                        }
                    })
                } else { //user id input
                    setUserId(Number(inputString))
                    updateName(Number(inputString))
                }
            }
        }}>
            <input ref={inputRef} placeholder="Username" value={input}/>
        </form>
        {focused ? <div className="user-search-list">
            {suggestions.map((userResult, i) => (
                <button className="user-search-entry" onClick={() => {
                    setUserId(userResult.contentId)
                    updateName(userResult.contentId)
                    setSuggestions([])
                    setPfps([])
                    lastLoadedId = lastLoadingId + 1
                }}>
                    {pfps[i] ? <img src={pfps[i]}/> : <div></div>}
                    <span className="roboto-500">{userResult.displayName}</span>
                </button>
            ))}
        </div> : null}
    </div>
}