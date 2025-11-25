import React, { useRef } from "react";

export default function RadialButton({ children, className = "", circleClassName = "", onClick, effectDisabled = false }: React.PropsWithChildren & {className?: string, circleClassName?: string, onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, effectDisabled?: boolean}): React.JSX.Element {
    const circleRef = useRef(null);
    const buttonRef = useRef(null);

    function selfHandleOnClick(e: React.MouseEvent<HTMLButtonElement>): void {
        if (!effectDisabled) {
            const button = buttonRef.current as unknown as HTMLButtonElement;
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

        if (onClick) {
            onClick(e);
        }
    }

    return (
        <>
            <button ref={buttonRef} className={`radialButton ${className}`} onClick={selfHandleOnClick}>
                <div ref={circleRef} className={`radialButton-circle ${circleClassName}`}></div>
                {children}
            </button>
        </>
    )
}