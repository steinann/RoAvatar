import RadialButton from "./radialButton"

export default function Tip({active, text, setActive, className}: {active: boolean, text: string, setActive: (a: boolean) => void, className?: string}): React.JSX.Element {
    if (active) {
        return <div className={`tip ${className}`}>
            <div className="tip-arrow"></div>
            <span className="roboto-600">{text}</span>
            <RadialButton className="roboto-600" onClick={()=>{setActive(false)}}>Okay</RadialButton>
        </div>
    } else {
        return <></>
    }
}