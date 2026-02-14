export default function Tip({active, text, setActive, className}: {active: boolean, text: string, setActive: (a: boolean) => void, className?: string}): React.JSX.Element {
    if (active) {
        return <div className={`tip ${className}`}>
            <div></div>
            <span className="roboto-600">{text}</span>
            <button className="roboto-600" onClick={()=>{setActive(false)}}>Okay</button>
        </div>
    } else {
        return <></>
    }
}