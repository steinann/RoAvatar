import { useContext, useState } from "react";
import { BodyColor3s, BodyColors, type Outfit } from "../code/avatar/outfit";
import { OutfitContext } from "./context/outfit-context";
import SelectInput from "./selectInput";

/*
console.log(e, setOutfit)
        const newOutfit = outfit.clone()

        let newBodyColors = undefined
        if (newOutfit.bodyColors.colorType === "BrickColor") {
            newBodyColors = (newOutfit.bodyColors as BodyColors).toColor3()
        } else {
            newBodyColors = outfit.bodyColors.clone() as BodyColor3s
        }

        switch (partName) {
            case "Head":
                newBodyColors.headColor3 = "FFFFFF"
                _setOutfit(newOutfit)
                break
            case "RightArm":
                newBodyColors.rightArmColor3 = "FFFFFF"
                _setOutfit(newOutfit)
                break
            case "LeftArm":
                newBodyColors.leftArmColor3 = "FFFFFF"
                _setOutfit(newOutfit)
                break
            case "Torso":
                newBodyColors.torsoColor3 = "FFFFFF"
                _setOutfit(newOutfit)
                break
            case "RightLeg":
                newBodyColors.rightLegColor3 = "FFFFFF"
                _setOutfit(newOutfit)
                break
            case "LeftLeg":
                newBodyColors.leftLegColor3 = "FFFFFF"
                _setOutfit(newOutfit)
                break
        }
*/

function BodyPartSelect({className, partName, currentPartNames, setCurrentPartNames, outfit}: {className: string, partName: string, currentPartNames: string[], setCurrentPartNames: (a: string[]) => void, outfit: Outfit}): React.JSX.Element {
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
    
    return <button className={`${className}${currentPartNames.includes(partName) ? " bodycolor bodycolor-active": " bodycolor"}`} onClick={() => {
        const newCurrentPartNames = [...currentPartNames]
        if (newCurrentPartNames.includes(partName)) {
            newCurrentPartNames.splice(newCurrentPartNames.indexOf(partName),1)
        } else {
            newCurrentPartNames.push(partName)
        }
        console.log(setCurrentPartNames)
        //setCurrentPartNames(newCurrentPartNames)
    }} style={{backgroundColor: "#" + outfit.bodyColors.toHexJson()[hexName]}}></button>
}

const AllPartNames = ["Head", "Torso", "RightArm", "LeftArm", "RightLeg", "LeftLeg"]

export default function BodyColorCategory({setOutfit, _setOutfit}: {setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    const outfit = useContext(OutfitContext)

    const [partNames, setPartNames] = useState<string[]>(AllPartNames)
    const [selectPart, setSelectPart] = useState<string>("All")

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
        <div className="bodycolor-select">
            <button onClick={() => {
                console.log(setOutfit)

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
                            newBodyColors.headColor3 = "FFFFFF"
                            _setOutfit(newOutfit)
                            break
                        case "RightArm":
                            newBodyColors.rightArmColor3 = "FFFFFF"
                            _setOutfit(newOutfit)
                            break
                        case "LeftArm":
                            newBodyColors.leftArmColor3 = "FFFFFF"
                            _setOutfit(newOutfit)
                            break
                        case "Torso":
                            newBodyColors.torsoColor3 = "FFFFFF"
                            _setOutfit(newOutfit)
                            break
                        case "RightLeg":
                            newBodyColors.rightLegColor3 = "FFFFFF"
                            _setOutfit(newOutfit)
                            break
                        case "LeftLeg":
                            newBodyColors.leftLegColor3 = "FFFFFF"
                            _setOutfit(newOutfit)
                            break
                    }
                }
            }
            }></button>
        </div>
    </div>
}