import { DataType } from "../constant";
import { Property } from "../rbx";
import InstanceWrapper from "./InstanceWrapper";

export default class FaceControlsWrapper extends InstanceWrapper {
    static className: string = "FaceControls"
    static requiredProperties: string[] = ["Name", 
        "Corrugator",
        "LeftBrowLowerer", "LeftInnerBrowRaiser", "LeftNoseWrinkler", "LeftOuterBrowRaiser",
        "RightBrowLowerer", "RightInnerBrowRaiser", "RightNoseWrinkler", "RightOuterBrowRaiser",
        "EyesLookDown", "EyesLookLeft", "EyesLookRight", "EyesLookUp",
        "LeftCheekRaiser", "LeftEyeClosed", "LeftEyeUpperLidRaiser",
        "RightCheekRaiser", "RightEyeClosed", "RightEyeUpperLidRaiser",
        "JawDrop",  "JawLeft", "JawRight",
        "ChinRaiser", "ChinRaiserUpperLip", "FlatPucker", "Funneler",
        "LeftCheekPuff", "LeftDimpler", "LeftLipCornerDown", "LeftLipCornerPuller", "LeftLipStretcher", "LeftLowerLipDepressor", "LeftUpperLipRaiser",
        "LipPresser", "LipsTogether", "LowerLipSuck", "MouthLeft", "MouthRight", "Pucker",
        "RightCheekPuff", "RightDimpler", "RightLipCornerDown", "RightLipCornerPuller", "RightLipStretcher", "RightLowerLipDepressor", "RightUpperLipRaiser",
        "UpperLipSuck",
        "TongueDown", "TongueOut", "TongueUp"
    ]

    setup() {
        //generic
        this.instance.addProperty(new Property("Name", DataType.String), "FaceControls")

        //specific
        for (const propertyName of FaceControlsWrapper.requiredProperties) {
            if (!this.instance.HasProperty(propertyName)) {
                this.instance.addProperty(new Property(propertyName, DataType.NonSerializable), 0)
            }
        }
    }
}