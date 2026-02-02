import type { Instance } from "../rbx";

const ClassNameToWrapper = new Map<string, typeof InstanceWrapper>()

export function GetWrapperForInstance(instance: Instance): InstanceWrapper | undefined {
    const staticWrapper = ClassNameToWrapper.get(instance.className)
    if (staticWrapper) {
        return new staticWrapper(instance)
    }
}

export class InstanceWrapper {
    static className: string
    static requiredProperties: string[]

    instance: Instance

    constructor(instance: Instance) {
        this.instance = instance;

        if (this.instance.className !== this.static().className) {
            throw new Error(`Provided Instance is not a ${this.static().className}`)
        }

        const hasAllProperties = this.static().requiredProperties.every(value => this.instance.getPropertyNames().includes(value))
        if (!hasAllProperties) {
            this.setup()

            const hasAllProperties = this.static().requiredProperties.every(value => this.instance.getPropertyNames().includes(value))
            if (!hasAllProperties) {
                throw new Error("setup() does not add all properties listed in requiredProperties")
            }
        }
    }

    setup() {
        throw new Error("Virtual method setup() called")
    }

    static() {
        return this.constructor as typeof InstanceWrapper
    }

    static register() {
        ClassNameToWrapper.set(this.className, this)
        console.log(ClassNameToWrapper)
    }

    //virtual functions
    created() {

    }

    destroy() {

    }
}