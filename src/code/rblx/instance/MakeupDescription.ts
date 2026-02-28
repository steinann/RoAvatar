import { DataType, MakeupType } from "../constant";
import { Property } from "../rbx";
import { InstanceWrapper } from "./InstanceWrapper";

export default class MakeupDescriptionWrapper extends InstanceWrapper {
    static className: string = "MakeupDescription"
    static requiredProperties: string[] = [
        "Name",
        "AssetId",
        "MakeupType",
        "Order",
        "Instance"
    ]

    setup() {
        //generic
        if (!this.instance.HasProperty("Name")) this.instance.addProperty(new Property("Name", DataType.String), "MakeupDescription")

        //specific
        if (!this.instance.HasProperty("AssetId")) this.instance.addProperty(new Property("AssetId", DataType.Int64), 0n)
        if (!this.instance.HasProperty("MakeupType")) this.instance.addProperty(new Property("MakeupType", DataType.Enum), MakeupType.Face)

        if (!this.instance.HasProperty("Order")) this.instance.addProperty(new Property("Order", DataType.Int32), 1)

        if (!this.instance.HasProperty("Instance")) this.instance.addProperty(new Property("Instance", DataType.Referent), undefined)
    }
}