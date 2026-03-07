import AccessoryDescriptionWrapper from "./instance/AccessoryDescription";
import AnimatorWrapper from "./instance/Animator";
import BodyPartDescriptionWrapper from "./instance/BodyPartDescription";
import FaceControlsWrapper from "./instance/FaceControls";
import HumanoidDescriptionWrapper from "./instance/HumanoidDescription";
import MakeupDescriptionWrapper from "./instance/MakeupDescription";
import ModelWrapper from "./instance/Model";
import ScriptWrapper from "./instance/Script";
import SoundWrapper from "./instance/Sound";
import ToolWrapper from "./instance/Tool";

//register wrappers
export default function RegisterWrappers() {
    ModelWrapper.register()
    ScriptWrapper.register()
    SoundWrapper.register()
    ToolWrapper.register()

    AnimatorWrapper.register()
    FaceControlsWrapper.register()
    
    HumanoidDescriptionWrapper.register()
    BodyPartDescriptionWrapper.register()
    AccessoryDescriptionWrapper.register()
    MakeupDescriptionWrapper.register()
}