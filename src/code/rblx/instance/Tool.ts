import { DataType, HumanoidRigType } from "../constant";
import { CFrame, Instance, Property } from "../rbx";
import { InstanceWrapper } from "./InstanceWrapper";

export default class ToolWrapper extends InstanceWrapper {
    static className: string = "Tool"
    static requiredProperties: string[] = [
        "Name",
        "Grip",
    ]

    setup() {
        //generic
        if (!this.instance.HasProperty("Name")) this.instance.addProperty(new Property("Name", DataType.String), "Tool")

        //specific
        if (!this.instance.HasProperty("Grip")) this.instance.addProperty(new Property("Grip", DataType.CFrame), new CFrame())
    }

    created(): void {
        this.instance.AncestryChanged.Connect(() => {
            this.createWeld()
        })
    }

    //doing this is actually inaccurate because tools dont create welds, but its easier
    createWeld() {
        const handle = this.instance.FindFirstChild("Handle")
        const rig = this.instance.parent

        const grip = (this.instance.PropOrDefault("Grip", new CFrame()) as CFrame).clone()

        if (handle) {
            const oldToolWeld = handle.FindFirstChild("ToolWeld_GripRoAvatar")
            if (oldToolWeld) {
                oldToolWeld.Destroy()
            }
        }

        const humanoid = rig?.FindFirstChildOfClass("Humanoid")

        if (handle && rig && rig.className === "Model" && humanoid) {
            for (const child of rig.GetDescendants()) {
                if (child.Prop("Name") === "RightGripAttachment") {
                    const rightGripAttCF = (child.PropOrDefault("CFrame", new CFrame()) as CFrame).clone()

                    if (humanoid.Prop("RigType") === HumanoidRigType.R6) {
                        rightGripAttCF.Orientation[0] -= 90
                    }

                    const weld = new Instance("Weld")
                    weld.addProperty(new Property("Name", DataType.String), "ToolWeld_GripRoAvatar")
                    weld.addProperty(new Property("Archivable", DataType.Bool), true)
                    weld.addProperty(new Property("C1", DataType.CFrame), grip)
                    weld.addProperty(new Property("C0", DataType.CFrame), rightGripAttCF)
                    weld.addProperty(new Property("Part1", DataType.Referent), handle)
                    weld.addProperty(new Property("Part0", DataType.Referent), child.parent)
                    weld.addProperty(new Property("Active", DataType.Bool), true)
                    weld.addProperty(new Property("Enabled", DataType.Bool), false)

                    weld.setParent(handle)

                    weld.setProperty("Enabled", true)
                }
            }
        }
    }
}