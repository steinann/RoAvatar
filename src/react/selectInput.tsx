import { useState } from "react"

export default function SelectInput({value, setValue, alternatives}: {value: string, setValue: (a: string) => void, alternatives: string[]}): React.JSX.Element {
    const [open, setOpen] = useState(false)
    
    return <button className="select roboto-600" onClick={() => {
        setOpen(!open)
    }}>
        <span>{value}</span>
        {open ? <span className="material-symbols-outlined">keyboard_arrow_up</span> : <span className="material-symbols-outlined">keyboard_arrow_down</span>}
        { open ?
        <ul>
            {alternatives.map((val) => {
                return <button className="roboto-600" onClick={() => {
                    setValue(val)
                }
                }>
                    {val}
                </button>
            })}
        </ul> : null
        }
    </button>
}