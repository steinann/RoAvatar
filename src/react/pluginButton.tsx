import RadialButton from "./generic/radialButton"
import { Tooltip } from "react-tooltip"

export default function PluginButton(): React.JSX.Element {
    return <>
        {/*Plugin button*/}
        <a href="https://create.roblox.com/store/asset/72427127701303" target="_blank">
            <RadialButton className="left-top-button icon-button" data-tooltip-content="Studio Plugin" data-tooltip-id="bottom-plugin-button">
                <svg style={{
                    fill: "var(--font-color)",
                    height: "28px"
                }} focusable="false" aria-hidden="true" viewBox="0 0 33 33"><path d="M6.78817 0.975342L3.21606 14.3004L12.3069 16.7337L13.4424 12.4994L29.5881 16.8264L32.0247 7.73884L6.78817 0.975342Z"></path><path d="M18.6069 21.448L2.46124 17.1211L0.0246582 26.2119L25.2611 32.9754L28.8332 19.6504L19.7424 17.2138L18.6069 21.448Z"></path></svg>
            </RadialButton>
        </a>
        <Tooltip id="bottom-plugin-button"/>
    </>
}