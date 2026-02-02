import { DataType, FaceControlNames } from "../constant";
import { Property } from "../rbx";
import { InstanceWrapper } from "./InstanceWrapper";

export default class FaceControlsWrapper extends InstanceWrapper {
    static className: string = "FaceControls"
    static requiredProperties: string[] = ["Name", ...FaceControlNames]

    setup() {
        //generic
        if (!this.instance.HasProperty("Name")) this.instance.addProperty(new Property("Name", DataType.String), "FaceControls")

        //specific
        for (const propertyName of FaceControlsWrapper.requiredProperties) {
            if (!this.instance.HasProperty(propertyName)) {
                if (!this.instance.HasProperty(propertyName)) this.instance.addProperty(new Property(propertyName, DataType.NonSerializable), 0)
            }
        }
    }
}