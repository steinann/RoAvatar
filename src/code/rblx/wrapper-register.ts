import AccessoryDescriptionWrapper from "./instance/AccessoryDescription";
import AnimatorWrapper from "./instance/Animator";
import BodyPartDescriptionWrapper from "./instance/BodyPartDescription";
import FaceControlsWrapper from "./instance/FaceControls";
import HumanoidDescriptionWrapper from "./instance/HumanoidDescription";
import ModelWrapper from "./instance/Model";
import ScriptWrapper from "./instance/Script";
import SoundWrapper from "./instance/Sound";

//register wrappers
export default function RegisterWrappers() {
    ModelWrapper.register()
    ScriptWrapper.register()
    SoundWrapper.register()

    AnimatorWrapper.register()
    FaceControlsWrapper.register()
    
    HumanoidDescriptionWrapper.register()
    BodyPartDescriptionWrapper.register()
    AccessoryDescriptionWrapper.register()
}