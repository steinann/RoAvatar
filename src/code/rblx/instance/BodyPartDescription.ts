import { BodyPart, DataType } from "../constant";
import { Color3, Property } from "../rbx";
import { InstanceWrapper } from "./InstanceWrapper";

export default class BodyPartDescriptionWrapper extends InstanceWrapper {
    static className: string = "BodyPartDescription"
    static requiredProperties: string[] = ["Name", "AssetId", "BodyPart", "Color", "Instance"]

    setup() {
        //generic
        if (!this.instance.HasProperty("Name")) this.instance.addProperty(new Property("Name", DataType.String), "BodyPartDescription")

        //specific
        if (!this.instance.HasProperty("AssetId")) this.instance.addProperty(new Property("AssetId", DataType.Int64), 0n)
        if (!this.instance.HasProperty("BodyPart")) this.instance.addProperty(new Property("BodyPart", DataType.Enum), BodyPart.Head)
        if (!this.instance.HasProperty("Color")) this.instance.addProperty(new Property("Color", DataType.Color3), new Color3(0,0,0))

        if (!this.instance.HasProperty("Instance")) this.instance.addProperty(new Property("Instance", DataType.Referent), undefined)
    }
}