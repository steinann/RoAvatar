export default function Icon({children, style}: React.PropsWithChildren & {style?: React.CSSProperties}): React.JSX.Element {
    return <span style={style} className='material-symbols-outlined'>{children}</span>
}