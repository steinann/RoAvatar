export default function ToggleButton({value, setValue}: {value: boolean, setValue: (a: boolean) => void}): React.JSX.Element {
    return <button className={`toggle-button${value ? " active" : ""}`} onClick={() => {setValue(!value)}}>
        <div></div>
    </button>
}