export default function BarButton({children, onClick }:{children?: React.ReactNode, onClick?: () => void}): React.JSX.Element {
    return <button className="bar-button" onClick={onClick}>{children}</button>
}