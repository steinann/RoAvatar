export default function BarCategory({ children, className = "" }: { children?: React.ReactNode, className?: string } ): React.JSX.Element {
    return <div className={`bar-category ${className}`}>
        {children}
    </div>
}