import { useCallback, useEffect, useRef, useState } from "react"
import { mapNum } from "../code/misc/misc"

export default function SliderInput({value, setValue}: {value: number, setValue: (value: number, mouseUp: boolean) => void}): React.JSX.Element {
    const [isDragging, setIsDragging] = useState(false)

    const sliderInput = useRef<HTMLDivElement>(null)

    const updateSlider = useCallback((e: MouseEvent, isMouseUp: boolean, forceMouseDown: boolean = false) => {
        if (e.buttons !== 1 && isDragging && !isMouseUp && !forceMouseDown) {
            setIsDragging(false)
        }

        if ((isDragging || forceMouseDown) && sliderInput.current && (e.buttons === 1 || isMouseUp || forceMouseDown)) {
            const mouseX = e.clientX
            const rect = sliderInput.current.getBoundingClientRect()
            const sliderLeft = rect.left
            const sliderRight = rect.left + rect.width

            //console.log(mouseX, sliderLeft, sliderRight)

            const value = Math.max(Math.min(mapNum(mouseX, sliderLeft, sliderRight, 0, 1),1),0)

            //console.log(value)
            setValue(value, isMouseUp)
        }
    }, [isDragging, setValue])

    useEffect(() => {
        const mouseMoveListener = (e: MouseEvent) => {
            e.preventDefault()
            updateSlider(e, false)
        }

        const mouseUpListener = (e: MouseEvent) => {
            setIsDragging(false)
            updateSlider(e as unknown as MouseEvent, true)
        }

        document.addEventListener("mousemove", mouseMoveListener)
        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mousemove", mouseMoveListener)
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    return <div className="slider-input" ref={sliderInput} onMouseDown={(e) => {
            //console.log("down")
            e.preventDefault()
            setIsDragging(true)
            updateSlider(e as unknown as MouseEvent, false, true)
        }}>
        <div className="slider-input-thumb" style={{left: value * 100 + "%"}}></div>
        <div className="slider-input-fill" style={{width: value * 100 + "%"}}></div>
    </div>
}