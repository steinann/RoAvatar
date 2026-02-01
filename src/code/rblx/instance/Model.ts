import { DataType } from "../constant";
import { CFrame, Instance, Property, Vector3 } from "../rbx";
import { traverseRigCFrame } from "../scale";
import InstanceWrapper from "./InstanceWrapper";

function getCorners(cframe: CFrame, size: Vector3): CFrame[] {
    const halfX = size.X / 2
	const halfY = size.Y / 2
	const halfZ = size.Z / 2
	
	//Return a list of all the corners
	return [
		cframe.multiply(new CFrame(halfX, halfY, halfZ)),
		cframe.multiply(new CFrame(halfX, halfY, -halfZ)),
		cframe.multiply(new CFrame(-halfX, halfY, halfZ)),
		cframe.multiply(new CFrame(-halfX, halfY, -halfZ)),
		cframe.multiply(new CFrame(halfX, -halfY, halfZ)),
		cframe.multiply(new CFrame(halfX, -halfY, -halfZ)),
		cframe.multiply(new CFrame(-halfX, -halfY, halfZ)),
		cframe.multiply(new CFrame(-halfX, -halfY, -halfZ))
    ]
}

function getLower(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
        a.X < b.X ? a.X : b.X,
        a.Y < b.Y ? a.Y : b.Y,
        a.Z < b.Z ? a.Z : b.Z
    )
}

function getHigher(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
        a.X > b.X ? a.X : b.X,
        a.Y > b.Y ? a.Y : b.Y,
        a.Z > b.Z ? a.Z : b.Z
    )
}

export default class ModelWrapper extends InstanceWrapper {
    static className: string = "Model"
    static requiredProperties: string[] = ["Name", "PrimaryPart"]

    setup() {
        //generic
        this.instance.addProperty(new Property("Name", DataType.String), "Model")

        //specific
        this.instance.addProperty(new Property("PrimaryPart", DataType.Referent), undefined)
    }

    GetModelCFrame(): CFrame {
        const primaryPart = this.instance.Prop("PrimaryPart") as Instance | undefined

        if (primaryPart) {
            return primaryPart.Prop("CFrame") as CFrame
        }
        
        throw new Error("Model has no PrimaryPart")
    }

    GetExtentsSize(): Vector3 {
        let lowerExtents = new Vector3(0, 0, 0)
        let higherExtents = new Vector3(0, 0, 0)

        for (const child of this.instance.GetDescendants()) {
            if (child.className === "Part" || child.className === "MeshPart") {
                const cframe = traverseRigCFrame(child)
                const size = child.Prop("Size") as Vector3

                const corners = getCorners(cframe, size)
                for (const corner of corners) {
                    lowerExtents = getLower(lowerExtents, new Vector3().fromVec3(corner.Position))
                    higherExtents = getHigher(higherExtents, new Vector3().fromVec3(corner.Position))
                }
            }
        }

        return higherExtents.minus(lowerExtents)
    }
}