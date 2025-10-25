import { AccessoryType, DataType } from "../constant";
import { Property, Vector3 } from "../rbx";
import InstanceWrapper from "./InstanceWrapper";

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
        this.instance.addProperty(new Property("Name", DataType.String), "AccessoryDescription")

        //specific
        this.instance.addProperty(new Property("AssetId", DataType.Int64), 0n)
        this.instance.addProperty(new Property("AccessoryType", DataType.Enum), AccessoryType.Unknown)
        this.instance.addProperty(new Property("IsLayered", DataType.Bool), false) //Check if asset has WrapLayer to determine
        
        this.instance.addProperty(new Property("Puffiness", DataType.Float32), 1.0)
        this.instance.addProperty(new Property("Order", DataType.Int32), 1)

        this.instance.addProperty(new Property("Position", DataType.Vector3), new Vector3(0,0,0))
        this.instance.addProperty(new Property("Rotation", DataType.Vector3), new Vector3(0,0,0))
        this.instance.addProperty(new Property("Scale", DataType.Vector3), new Vector3(1,1,1))

        this.instance.addProperty(new Property("Instance", DataType.Referent), undefined)
    }
}