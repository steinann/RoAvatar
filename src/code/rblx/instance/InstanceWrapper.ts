import type { Instance } from "../rbx";

export default class InstanceWrapper {
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
}