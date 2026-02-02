import { AccessoryType, DataType } from "../constant";
import { Property, Vector3 } from "../rbx";
import { InstanceWrapper } from "./InstanceWrapper";

export default class AccessoryDescriptionWrapper extends InstanceWrapper {
    static className: string = "AccessoryDescription"
    static requiredProperties: string[] = [
        "Name",
        "AssetId",
        "AccessoryType",
        "IsLayered",
        "Puffiness",
        "Order",
        "Position",
        "Rotation",
        "Scale",
        "Instance"
    ]

    setup() {
        //generic
        if (!this.instance.HasProperty("Name")) this.instance.addProperty(new Property("Name", DataType.String), "AccessoryDescription")

        //specific
        if (!this.instance.HasProperty("AssetId")) this.instance.addProperty(new Property("AssetId", DataType.Int64), 0n)
        if (!this.instance.HasProperty("AccessoryType")) this.instance.addProperty(new Property("AccessoryType", DataType.Enum), AccessoryType.Unknown)
        if (!this.instance.HasProperty("IsLayered")) this.instance.addProperty(new Property("IsLayered", DataType.Bool), false) //Check if asset has WrapLayer to determine

        if (!this.instance.HasProperty("Puffiness")) this.instance.addProperty(new Property("Puffiness", DataType.Float32), 1.0)
        if (!this.instance.HasProperty("Order")) this.instance.addProperty(new Property("Order", DataType.Int32), 1)

        if (!this.instance.HasProperty("Position")) this.instance.addProperty(new Property("Position", DataType.Vector3), new Vector3(0,0,0))
        if (!this.instance.HasProperty("Rotation")) this.instance.addProperty(new Property("Rotation", DataType.Vector3), new Vector3(0,0,0))
        if (!this.instance.HasProperty("Scale")) this.instance.addProperty(new Property("Scale", DataType.Vector3), new Vector3(1,1,1))

        if (!this.instance.HasProperty("Instance")) this.instance.addProperty(new Property("Instance", DataType.Referent), undefined)
    }
}