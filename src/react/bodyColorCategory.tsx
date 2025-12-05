import { useContext, useState } from "react";
import { hexToRgb } from "../code/misc/misc";
import { OutfitContext } from "./context/outfit-context";
import type { BodyColor3s, BodyColors, Outfit } from "../code/avatar/outfit";
import { FullBodyColors, RegularBodyColors } from "../code/avatar/constant";
import SelectInput from "./generic/selectInput";
import RadialButton from "./generic/radialButton";

function partNameToHexName(partName: string) {
    let hexName: "headColor" | "torsoColor" | "rightArmColor" | "leftArmColor" | "rightLegColor" | "leftLegColor" = "headColor"
    switch (partName) {
        case "Head":
            hexName = "headColor"
            break
        case "Torso":
            hexName = "torsoColor"
            break
        case "RightArm":
            hexName = "rightArmColor"
            break
        case "LeftArm":
            hexName = "leftArmColor"
            break
        case "RightLeg":
            hexName = "rightLegColor"
            break
        case "LeftLeg":
            hexName = "leftLegColor"
            break
    }

    return hexName
}

function BodyPartSelect({className, partName, currentPartNames, setCurrentPartNames, outfit}: {className: string, partName: string, currentPartNames: string[], setCurrentPartNames: (a: string[]) => void, outfit: Outfit}): React.JSX.Element {
    const hexName = partNameToHexName(partName)
    
    const colorAsRgb = hexToRgb(outfit.bodyColors.toHexJson()[hexName]) || {r:0,g:0,b:0}
    const averageBrightness = (colorAsRgb.r + colorAsRgb.g + colorAsRgb.b) / 3

    const outlineColor = averageBrightness > 0.8 ? "#7c7c7c" : "#fff"

    return <button className={`${className}${currentPartNames.includes(partName) ? " bodycolor bodycolor-active": " bodycolor"}`} onClick={() => {
        /*const newCurrentPartNames = [...currentPartNames]
        if (newCurrentPartNames.includes(partName)) {
            newCurrentPartNames.splice(newCurrentPartNames.indexOf(partName),1)
        } else {
            newCurrentPartNames.push(partName)
        }*/
        //console.log(setCurrentPartNames)
        //setCurrentPartNames(newCurrentPartNames)
        setCurrentPartNames([partName])
    }} style={{backgroundColor: "#" + outfit.bodyColors.toHexJson()[hexName], "--box-shadow-color": outlineColor} as React.CSSProperties}></button>
}

const AllPartNames = ["Head", "Torso", "RightArm", "LeftArm", "RightLeg", "LeftLeg"]

export default function BodyColorCategory({setOutfit, _setOutfit}: {setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    const outfit = useContext(OutfitContext)

    const [partNames, _setPartNames] = useState<string[]>(AllPartNames)
    const [selectPart, _setSelectPart] = useState<string>("All")

    function setSelectPart(val: string) {
        switch (val) {
            case "All":
                _setPartNames(AllPartNames)
                break
            case "Head":
                _setPartNames(["Head"])
                break
            case "Torso":
                _setPartNames(["Torso"])
                break
            case "Right Arm":
                _setPartNames(["RightArm"])
                break
            case "Left Arm":
                _setPartNames(["LeftArm"])
                break
            case "Right Leg":
                _setPartNames(["RightLeg"])
                break
            case "Left Leg":
                _setPartNames(["LeftLeg"])
                break
        }
        _setSelectPart(val)
    }

    function setPartNames(val: string[]) {
        if (val.length > 1) {
            return
        }

        switch (val[0]) {
            case "Head":
                _setSelectPart("Head")
                break
            case "Torso":
                _setSelectPart("Torso")
                break
            case "RightArm":
                _setSelectPart("Right Arm")
                break
            case "LeftArm":
                _setSelectPart("Left Arm")
                break
            case "RightLeg":
                _setSelectPart("Right Leg")
                break
            case "LeftLeg":
                _setSelectPart("Left Leg")
                break
        }

        _setPartNames(val)
    }

    function paint(color: string) {
        console.log(_setOutfit)

        const newOutfit = outfit.clone()

        let newBodyColors = undefined
        if (newOutfit.bodyColors.colorType === "BrickColor") {
            newBodyColors = (newOutfit.bodyColors as BodyColors).toColor3()
        } else {
            newBodyColors = outfit.bodyColors.clone() as BodyColor3s
        }
        newOutfit.bodyColors = newBodyColors

        for (const partName of partNames) {
            switch (partName) {
                case "Head":
                    newBodyColors.headColor3 = color
                    setOutfit(newOutfit)
                    break
                case "RightArm":
                    newBodyColors.rightArmColor3 = color
                    setOutfit(newOutfit)
                    break
                case "LeftArm":
                    newBodyColors.leftArmColor3 = color
                    setOutfit(newOutfit)
                    break
                case "Torso":
                    newBodyColors.torsoColor3 = color
                    setOutfit(newOutfit)
                    break
                case "RightLeg":
                    newBodyColors.rightLegColor3 = color
                    setOutfit(newOutfit)
                    break
                case "LeftLeg":
                    newBodyColors.leftLegColor3 = color
                    setOutfit(newOutfit)
                    break
            }
        }
    }

    //get currentcolor
    const currentColors: string[] = []
    let allColorsSame = true

    //get all current colors
    for (const partName of partNames) {
        const hexName = partNameToHexName(partName)
        const colorValue = outfit.bodyColors.toHexJson()[hexName]

        currentColors.push(colorValue)
    }

    //check if all current colors are the same
    let lastColor = null
    for (const color of currentColors) {
        if (!lastColor) {
            lastColor = color
        } else {
            if (lastColor !== color) {
                allColorsSame = false
            }
        }
    }

    //create palette
    const bodyColors = [...RegularBodyColors]
    for (const color of FullBodyColors) {
        if (!bodyColors.includes(color)) {
            bodyColors.push(color)
        }
    }

    return <div className="bodycolor-category">
        <div className="bodypart-select">
            <SelectInput value={selectPart} setValue={setSelectPart} alternatives={["All", "Head", "Torso", "Right Arm", "Left Arm", "Right Leg", "Left Leg"]}/>
            <div className="bodycolor-section bodycolor-section-top">
                <BodyPartSelect className="bodycolor-head" partName="Head" currentPartNames={partNames} setCurrentPartNames={setPartNames} outfit={outfit}/>
            </div>
            <div className="bodycolor-section bodycolor-section-middle">
                <BodyPartSelect className="bodycolor-limb" partName="RightArm" currentPartNames={partNames} setCurrentPartNames={setPartNames} outfit={outfit}/>
                <BodyPartSelect className="bodycolor-torso" partName="Torso" currentPartNames={partNames} setCurrentPartNames={setPartNames} outfit={outfit}/>
                <BodyPartSelect className="bodycolor-limb" partName="LeftArm" currentPartNames={partNames} setCurrentPartNames={setPartNames} outfit={outfit}/>
            </div>
            <div className="bodycolor-section bodycolor-section-bottom">
                <BodyPartSelect className="bodycolor-limb" partName="RightLeg" currentPartNames={partNames} setCurrentPartNames={setPartNames} outfit={outfit}/>
                <BodyPartSelect className="bodycolor-limb" partName="LeftLeg" currentPartNames={partNames} setCurrentPartNames={setPartNames} outfit={outfit}/>
            </div>
        </div>
        <div className="bodycolor-select dark-scrollbar">
            {bodyColors.map((color) => {
                const isSelected = allColorsSame && color.toUpperCase() === currentColors[0].toUpperCase()
                return <RadialButton className={`bodycolor-color`} style={{backgroundColor: "#" + color}} onClick={() => {
                    paint(color)
                }}>
                    {isSelected ? <div className="bodycolor-selected">
                        <span className="material-symbols-outlined">check_box</span>
                    </div> : null}
                </RadialButton>
            })}
        </div>
    </div>
}