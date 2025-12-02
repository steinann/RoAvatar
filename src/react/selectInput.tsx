export default function SelectInput({value, setValue, alternatives}: {value: string, setValue: (a: string) => void, alternatives: string[]}): React.JSX.Element {
    return <button className="select roboto-600">
        <span>{value}</span><span className="material-symbols-outlined">keyboard_arrow_down</span>
        <ul>
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