import { useCallback, useContext, useEffect } from "react"
import { API } from "../code/api"
import { AuthContext } from "./auth-context"
import { Instance, RBX } from "../code/rblx/rbx"
import HumanoidDescriptionWrapper from "../code/rblx/instance/HumanoidDescription"
import { Outfit } from "../code/avatar/outfit"
import { addRBX, mount } from "../code/render/legacy-renderer"

export default function Test(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const containerRef = useCallback(mount, [])

    useEffect(() => {
        console.log("running")
        if (auth) {
            const hrp = new Instance("HumanoidDescription")
            const hrpWrapper = new HumanoidDescriptionWrapper(hrp)
            console.log(hrpWrapper)

            API.Asset.GetRBX("../assets/HumanoidDescriptionExample.rbxm", undefined, auth).then(result => {
                if (result instanceof RBX) {
                    const humanoidDescription = result.generateTree()
                    console.log(result)
                    console.log(humanoidDescription)
                    const hrpWrapper = new HumanoidDescriptionWrapper(humanoidDescription.GetChildren()[0])
                    console.log(hrpWrapper)
                }
            })

            API.Avatar.GetAvatarDetails(auth, 126448532).then(result => {
                if (result instanceof Outfit) {
                    const humanoidDescriptionWrapper = new HumanoidDescriptionWrapper(new Instance("HumanoidDescription"))
                    console.log(humanoidDescriptionWrapper.instance.Prop("Face"))
                    humanoidDescriptionWrapper.fromOutfit(result, auth).then(result => {
                        console.log(result)
                        if (result instanceof Instance) {
                            API.Asset.GetRBX("../assets/RigR15.rbxm", undefined, auth).then(result => {
                                if (result instanceof RBX) {
                                    const rigRBX = result
                                    const dataModel = result.generateTree()
                                    const rig = dataModel.GetChildren()[0]
                                    const humanoid = rig?.FindFirstChildOfClass("Humanoid")
                                    if (humanoid) {
                                        console.log("Starting to apply description...")
                                        humanoidDescriptionWrapper.applyDescription(humanoid, auth).then(result => {
                                            console.log("Applied description!")
                                            console.log(result)
                                            console.log(rig)
                                            console.log("Adding rbx to 3d view")
                                            addRBX(rigRBX)
                                        })
                                        
                                    } else {
                                        throw rig
                                    }
                                } else {
                                    throw result
                                }
                            })

                            console.log("lets compare itself with itself!")
                            console.log(humanoidDescriptionWrapper.compare(humanoidDescriptionWrapper))

                            API.Asset.GetRBX("../assets/berryavHumanoidDescription.rbxm", undefined, auth).then(result => {
                                if (result instanceof RBX) {
                                    console.log("lets compare itself with berry av (but from file!)")
                                    const hrp2 = result.generateTree().GetChildren()[0]
                                    const hrpWrapper2 = new HumanoidDescriptionWrapper(hrp2)
                                    console.log(humanoidDescriptionWrapper.compare(hrpWrapper2))
                                }
                            })

                            API.Asset.GetRBX("../assets/RigR15.rbxm", undefined, auth).then(result => {
                                if (result instanceof RBX) {
                                    const dataModel = result.generateTree()
                                    const rig = dataModel.GetChildren()[0]
                                    const humanoid = rig?.FindFirstChildOfClass("Humanoid")
                                    if (humanoid) {
                                        API.Asset.GetRBX("../assets/berryavHumanoidDescription.rbxm", undefined, auth).then(result => {
                                            if (result instanceof RBX) {
                                                const hrp2 = result.generateTree().GetChildren()[0]
                                                const hrpWrapper2 = new HumanoidDescriptionWrapper(hrp2)
                                                console.log("Starting to apply description (berry av)...")
                                                hrpWrapper2.applyDescription(humanoid, auth).then(result => {
                                                    console.log("Applied description (berry av!")
                                                    console.log(result)
                                                    console.log(rig)
                                                })
                                            }
                                        })
                                        
                                    } else {
                                        throw rig
                                    }
                                } else {
                                    throw result
                                }
                            })
                        } else {
                            throw result
                        }
                    })
                } else {
                    throw result
                }
            })

            API.Asset.GetRBX("../assets/RigR15.rbxm", undefined, auth).then(result => {
                if (result instanceof RBX) {
                    const dataModel = result.generateTree()
                    console.log("RigR15")
                    console.log(dataModel)
                }
            })

            API.Asset.GetRBX("../assets/RigR6.rbxm", undefined, auth).then(result => {
                if (result instanceof RBX) {
                    const dataModel = result.generateTree()
                    console.log("RigR6")
                    console.log(dataModel)
                }
            })
        }
    }, [auth])

    return (<div ref={containerRef}></div>)
}