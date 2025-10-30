import { DataType } from "../constant";
import { Property } from "../rbx";
import InstanceWrapper from "./InstanceWrapper";

export default class AnimatorWrapper extends InstanceWrapper {
    static className: string = "Animator"
    static requiredProperties: string[] = ["Name"]

    setup() {
        this.instance.addProperty(new Property("Name", DataType.String), "Animator")
    }
}