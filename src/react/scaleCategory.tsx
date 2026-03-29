import { useContext, useEffect, useRef, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import SliderInput from "./generic/sliderInput"
import { Outfit, type ScaleName, mapNum, AvatarType } from "roavatar-renderer"

//Slider-like input but specifically for scale
function ScaleInput({outfit, setOutfit, _setOutfit, scale, scaleName, min, max}: {outfit: Outfit, setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void, scale: ScaleName, scaleName: string, min: number, max: number}): React.JSX.Element {
    const [proposedValue, setProposedValue] = useState<string | undefined>(undefined)
    
    const valueToShow = proposedValue !== undefined ? proposedValue : Math.round(outfit.scale[scale] * 100)

    const inputRef = useRef<HTMLInputElement>(null)

    //remove proposed value on unfocus
    useEffect(() => {
        const input = inputRef.current
        if (!input) return

        function focusoutEvent() {
            setProposedValue(undefined)
        }

        input.addEventListener("focusout", focusoutEvent)

        return () => {
            input.removeEventListener("focusout", focusoutEvent)
        }
    })

    return <>
        <div className="scale-info">
            <span className="scale-name roboto-600">{scaleName}</span>
            <div className="scale-value">
                <input ref={inputRef} className="roboto-600"
                    value={valueToShow}
                    onChange={(e) => {
                        const input = inputRef.current
                        if (input) {
                            //get value as only numbers
                            let strNum = e.target.value.match(/\d+/g)?.toString()
                            if (!strNum) strNum = ""
                            
                            if (strNum.length <= 3) {
                                const proposedValue = strNum

                                const proposedValueNum = proposedValue.length > 0 ? Number(proposedValue) : -1000
                                if (proposedValueNum >= Math.round(min * 100) && proposedValueNum <= Math.round(max * 100)) { //if valid
                                    //update outfit
                                    const newOutfit = outfit.clone()
                                    newOutfit.scale[scale] = proposedValueNum / 100
                                    newOutfit.scale.depth = 1 - (1 - outfit.scale.width) / 2
                                    
                                    setOutfit(newOutfit)
                                    setProposedValue(undefined)
                                } else { //not valid
                                    //update proposal
                                    setProposedValue(proposedValue)
                                }
                            }
                        }
                    }}
                />
                <span className="roboto-600">%</span>
            </div>
        </div>
        <SliderInput value={mapNum(outfit.scale[scale],min,max,0,1)} setValue={(value: number, mouseUp: boolean) => {
            const newOutfit = outfit.clone()
            newOutfit.scale[scale] = Math.round(mapNum(value,0,1,min,max) * 100) / 100
            newOutfit.scale.depth = 1 - (1 - outfit.scale.width) / 2
            if (mouseUp) {
                setOutfit(newOutfit)
            } else {
                _setOutfit(newOutfit)
            }
        }}/>
    </>
}

export default function ScaleCategory({setOutfit, _setOutfit}: {setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    //const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    return <div className="scale-category">
        {/*R6 or R15*/}
        <div className="scale-info">
            <span className="scale-name roboto-600">Rig</span>
        </div>

        <div className="rig-select">
            <button className={`rig-button rig-button-left roboto-600${outfit.playerAvatarType === AvatarType.R6 ? " rig-button-active" : ""}`} onClick={() => {
                if (outfit.playerAvatarType !== AvatarType.R6) {
                    const newOutfit = outfit.clone()
                    newOutfit.playerAvatarType = AvatarType.R6
                    setOutfit(newOutfit)
                }
            }}>R6</button>
            <button className={`rig-button rig-button-right roboto-600${outfit.playerAvatarType === AvatarType.R15 ? " rig-button-active" : ""}`} onClick={() => {
                if (outfit.playerAvatarType !== AvatarType.R15) {
                    const newOutfit = outfit.clone()
                    newOutfit.playerAvatarType = AvatarType.R15
                    setOutfit(newOutfit)
                }
            }}>R15</button>
        </div>

        {/*Scale*/}
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="height" scaleName="Height" min={0.9} max={1.05}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="width" scaleName="Width" min={0.7} max={1}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="head" scaleName="Head" min={0.95} max={1}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="bodyType" scaleName="Body Type" min={0} max={1}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="proportion" scaleName="Proportions" min={0} max={1}/>
    </div>
}