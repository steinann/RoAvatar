import React, { useRef } from "react";

//fancy button that has a circle come from the mouse on click
export default function RadialButton({ children, ref, title, className = "", circleClassName = "", onClick, effectDisabled = false, style = {}, onMouseEnter, onMouseLeave }: React.PropsWithChildren & {ref?: React.RefObject<HTMLButtonElement | null>, title?: string, className?: string, circleClassName?: string, onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, effectDisabled?: boolean, style?: React.CSSProperties, onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void, onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void}): React.JSX.Element {
    const circleRef = useRef(null);
    const buttonRef = useRef(null);

    function selfHandleOnClick(e: React.MouseEvent<HTMLButtonElement>): void {
        if (!effectDisabled) {
            const button = (ref || buttonRef).current as unknown as HTMLButtonElement;
            const newTop = e.clientY - button.getBoundingClientRect().top;
            const newLeft = e.clientX - button.getBoundingClientRect().left;
            
            const circle = circleRef.current as unknown as HTMLDivElement;
            circle.style.left = newLeft.toString() + "px";
            circle.style.top = newTop.toString() + "px";
            
            circle.animate([
                {
                    width: "0%",
                    opacity: 1,
                },
                {
                    width: "220%",
                    opacity: 0,
                }
            ], {
                duration: 500,
                easing: "ease-out",
            })
        }
    }

    return (
        <>
            <button ref={ref || buttonRef} title={title} style={style} className={`radialButton ${className}`} onMouseDown={selfHandleOnClick} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                <div ref={circleRef} className={`radialButton-circle ${circleClassName}`}></div>
                {children}
            </button>
        </>
    )
}