import { useEffect, useRef, useState } from "react"

export default function SelectInput({value, setValue, alternatives}: {value: string, setValue: (a: string) => void, alternatives: string[]}): React.JSX.Element {
    const [open, setOpen] = useState(false)
    
    const selectRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        const mouseUpListener = (e: MouseEvent) => {
            if (!selectRef.current?.contains(e.target as HTMLElement)) {
                setOpen(false)
            }
        }

        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    return <button ref={selectRef} className="select roboto-600" onClick={() => {
        setOpen(!open)
    }}>
        <span>{value}</span>
        {open ? <span className="material-symbols-outlined">keyboard_arrow_up</span> : <span className="material-symbols-outlined">keyboard_arrow_down</span>}
        <ul className={open ? "" : "icons-collapsed"}>
            {alternatives.map((val) => {
                return <button className="roboto-600" onClick={() => {
                    setValue(val)
                }
                }>
                    {val}
                </button>
            })}
        </ul>
    </button>
}