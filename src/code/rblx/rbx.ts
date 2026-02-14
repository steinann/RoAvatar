//https://dom.rojo.space/binary.html

//API DUMP
//https://s3.amazonaws.com/setup.roblox.com/versionQTStudio
//https://s3.amazonaws.com/setup.roblox.com/[VERSION_HERE]-API-Dump.json

import * as THREE from 'three';
import RBXSimpleView from './rbx-simple-view';
import { rad, rotationMatrixToEulerAngles } from '../misc/misc';
import { intToRgb, readReferents, untransformInt32, untransformInt64 } from './rbx-read-helper';
import type { Mat4x4, Vec3 } from './mesh';
import { BodyPartNameToEnum, DataType, magic, StringBufferProperties, xmlMagic } from './constant';
import * as LZ4 from './lz4'
import * as fzstd from 'fzstd';
import { GetWrapperForInstance } from './instance/InstanceWrapper';

//datatype structs
export class UDim {
    Scale: number = 0 //Float32
    Offset: number = 0 //Int32

    constructor(Scale: number = 0, Offset: number = 0) {
        this.Scale = Scale
        this.Offset = Offset
    }

    clone() {
        const copy = new UDim()
        copy.Scale = this.Scale
        copy.Offset = this.Offset
        return copy
    }
}

export class UDim2 {
    X: UDim = new UDim()
    Y: UDim = new UDim()

    clone() {
        const copy = new UDim2()
        copy.X = this.X.clone()
        copy.Y = this.Y.clone()
        return copy
    }
}

export class Ray {
    Origin: Vec3 = [0,0,0]
    Direction: Vec3 = [0,0,0]

    clone() {
        const copy = new Ray()
        copy.Origin[0] = this.Origin[0]
        copy.Origin[1] = this.Origin[1]
        copy.Origin[2] = this.Origin[2]

        copy.Direction[0] = this.Direction[0]
        copy.Direction[1] = this.Direction[1]
        copy.Direction[2] = this.Direction[2]
        return copy
    }
}

export class Vector3 {
    X: number = 0
    Y: number = 0
    Z: number = 0

    constructor(X: number = 0,Y: number = 0,Z: number = 0) {
        this.X = X
        this.Y = Y
        this.Z = Z
    }

    fromVec3(vec3: Vec3) {
        this.X = vec3[0]
        this.Y = vec3[1]
        this.Z = vec3[2]

        return this
    }

    toVec3(): Vec3 {
        return [this.X, this.Y, this.Z]
    }

    multiply(vec3: Vector3) {
        return new Vector3(this.X * vec3.X, this.Y * vec3.Y, this.Z * vec3.Z)
    }

    divide(vec3: Vector3) {
        return new Vector3(this.X / vec3.X, this.Y / vec3.Y, this.Z / vec3.Z)
    }

    add(vec3: Vector3) {
        return new Vector3(this.X + vec3.X, this.Y + vec3.Y, this.Z + vec3.Z)
    }

    minus(vec3: Vector3) {
        return new Vector3(this.X - vec3.X, this.Y - vec3.Y, this.Z - vec3.Z)
    }

    magnitude() {
        return Math.sqrt(this.X*this.X + this.Y*this.Y + this.Z*this.Z)
    }

    normalize() {
        const magnitude = this.magnitude()
        return this.divide(new Vector3(magnitude, magnitude, magnitude))
    }

    clone() {
        return new Vector3(this.X, this.Y, this.Z)
    }

    isSame(other: Vector3) {
        return isSameFloat(this.X, other.X) &&
                isSameFloat(this.Y, other.Y) &&
                isSameFloat(this.Z, other.Z)
    }

    static new(X: number,Y: number,Z: number) {
        return new Vector3(X,Y,Z)
    }
}

export class Color3 {
    R: number = 0
    G: number = 0
    B: number = 0

    constructor(R: number = 0, G: number = 0, B: number = 0) {
        this.R = R
        this.G = G
        this.B = B
    }

    clone() {
        return new Color3(this.R, this.G, this.B)
    }

    toColor3uint8() {
        return new Color3uint8(Math.round(this.R * 255), Math.round(this.G * 255), Math.round(this.B * 255))
    }
}

export class Color3uint8 {
    R: number = 0
    G: number = 0
    B: number = 0

    constructor(R: number = 0, G: number = 0, B: number = 0) {
        this.R = R
        this.G = G
        this.B = B
    }

    clone() {
        return new Color3uint8(this.R, this.G, this.B)
    }

    toColor3() {
        return new Color3(this.R / 255, this.G / 255, this.B / 255)
    }
}

export class Content {
    sourceType: number = 0 | 1 | 2 //None = 0, Uri = 1, Object = 2
    uri?: string
    object?: Instance
    externalObject?: Instance
}

export class CFrame {
    Position: Vec3 = [0,0,0]
    Orientation: Vec3 = [0,0,0]

    constructor(x = 0, y = 0, z = 0) {
        this.Position = [x,y,z]
    }

    clone() {
        const cloneCF = new CFrame(this.Position[0], this.Position[1], this.Position[2])
        cloneCF.Orientation = [this.Orientation[0], this.Orientation[1], this.Orientation[2]]

        return cloneCF
    }

    getTHREEMatrix() {
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(this.Orientation[0]), rad(this.Orientation[1]), rad(this.Orientation[2]), "YXZ"))
        const transformMatrix = new THREE.Matrix4().makeTranslation(this.Position[0], this.Position[1], this.Position[2])

        return transformMatrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quat))
    }

    getMatrix() {
        return this.getTHREEMatrix().toArray()
    }

    fromMatrix(m: Mat4x4) {
        this.Orientation = rotationMatrixToEulerAngles([
            m[0],m[1],m[2],
            m[4],m[5],m[6],
            m[8],m[9],m[10]
        ])
        this.Position = [m[12],m[13],m[14]]

        return this
    }

    fromRotationMatrix(r00: number, r01: number, r02: number, r10: number, r11: number, r12: number, r20: number, r21: number, r22: number, order: string = "YXZ") {
        /*const matrix = new Array(9)
        let i = 0
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                matrix[x + y*3] = [
                    r00,
                    r01,
                    r02,
                    r10,
                    r11,
                    r12,
                    r20,
                    r21,
                    r22,
                ][i]
                i++
            }
        }*/

        /*this.Orientation = rotationMatrixToEulerAngles([
            r00, r01, r02,
            r10, r11, r12,
            r20, r21, r22,
        ], order)*/

        this.Orientation = rotationMatrixToEulerAngles([
            r00, r10, r20,
            r01, r11, r21,
            r02, r12, r22
        ], order)
    }

    inverse() {
        const thisM = new THREE.Matrix4().fromArray(this.getMatrix())
        const inverse = thisM.clone()
        inverse.invert()

        return new CFrame().fromMatrix(inverse.elements)
    }

    multiply(cf: CFrame) {
        const thisM = new THREE.Matrix4().fromArray(this.getMatrix())
        const cfM = new THREE.Matrix4().fromArray(cf.getMatrix())

        const newM = thisM.multiply(cfM)
        
        const newCf = new CFrame().fromMatrix(newM.elements)

        return newCf
    }

    isSame(other: CFrame) {
        return isSameFloat(this.Position[0], other.Position[0]) &&
                isSameFloat(this.Position[1], other.Position[1]) &&
                isSameFloat(this.Position[2], other.Position[2]) &&
                isSameFloat(this.Orientation[0], other.Orientation[0]) &&
                isSameFloat(this.Orientation[1], other.Orientation[1]) &&
                isSameFloat(this.Orientation[2], other.Orientation[2])
    }
}

//hierarchy structs

export class Connection {
    Connected = true
    _callback
    _event: Event | undefined

    constructor(callback: (...args: unknown[]) => unknown, event: Event) {
        this._callback = callback
        this._event = event
    }

    Disconnect() {
        this.Connected = false
        if (this._event) {
            this._event.Disconnect(this._callback)
        }
        this._event = undefined
    }
}

class Event {
    _callbacks: ((...args: unknown[]) => unknown)[] = []

    Connect(callback: (...args: unknown[]) => unknown) {
        this._callbacks.push(callback)
        return new Connection(callback, this)
    }

    Fire(...args: unknown[]) {
        for (const callback of this._callbacks) {
            callback(...args)
        }
    }

    Disconnect(callback: (...args: unknown[]) => unknown) {
        const index = this._callbacks.indexOf(callback)
        if (index !== -1) {
            this._callbacks.splice(index,1)
        }
    }

    Clear() {
        for (const callback of this._callbacks) {
            this.Disconnect(callback)
        }
        this._callbacks = []
    }
}

export class Property {
    name?: string
    typeID?: number
    _value?: unknown //only to be changed by setProperty() method of Instance

    constructor(name: string | undefined = undefined, typeID: number | undefined = undefined) {
        this.name = name
        this.typeID = typeID
    }

    get value() {
        return this._value
    }
}

let lastInstanceId = 0

export class Instance {
    _id: number

    name?: string //USED TO MAKE VIEWING EASIER
    className: string
    _properties = new Map<string,Property>()
    _referencedBy: Instance[] = []
    _connectionReferences: Connection[] = []
    children: Instance[] = []
    parent?: Instance = undefined
    destroyed: boolean = false

    classID?: number //dont use this to identify instance class, it is only used during file loading
    objectFormat?: number //same as above

    ChildAdded = new Event()
    Destroying = new Event()
    Changed = new Event()
    AncestryChanged = new Event()

    constructor(className: string, notComplete: boolean = false) {
        this._id = lastInstanceId
        lastInstanceId++

        if (!className) {
            throw new Error("Instance was not provided a className")
        }

        this.className = className

        //Setup class logic (this is outdated, use InstanceWrapper instead)
        switch(this.className) {
            case "Motor6D":
            case "Weld":
                {
                    let part0ChangedConnection: Connection | undefined = undefined
                    const part1ChangedConnection: Connection | undefined = undefined

                    function update(self: Instance, affectedPart = 1) { //TODO: part1 is not always the part that should be affected, but its difficult to fix without creating an infinite loop
                        //variables/properties
                        if (!self.HasProperty("Part0") || !self.HasProperty("Part1")) return

                        let part0: Instance | undefined = undefined
                        if (self.HasProperty("Part0")) {
                            part0 = self.Property("Part0") as Instance
                            if (part0) {
                                if (part0ChangedConnection) {
                                    part0ChangedConnection.Disconnect()
                                    self.removeConnectionReference(part0ChangedConnection)
                                }
                            }
                        }

                        let part1: Instance | undefined = undefined
                        if (self.HasProperty("Part1")) {
                            part1 = self.Property("Part1") as Instance
                            if (part1) {
                                if (part1ChangedConnection) {
                                    part1ChangedConnection.Disconnect()
                                    self.removeConnectionReference(part1ChangedConnection)
                                }
                            }
                        }

                        if (!self.HasProperty("C0") || !self.HasProperty("C1")) {
                            return
                        }

                        const C0 = self.Property("C0") as CFrame
                        const C1 = self.Property("C1") as CFrame
                        if (!C0 || !C1) {
                            return
                        }

                        let transform = new CFrame()
                        if (self.HasProperty("Transform")) {
                            transform = self.Property("Transform") as CFrame
                        }

                        //actual calculation
                        if (self.HasProperty("Enabled") && self.Prop("Enabled")) {
                            if (self.parent) {
                                    if (affectedPart === 1) {
                                        if (part0 && part1 && part0.HasProperty("CFrame")) {
                                            const part0Cf = part0.Property("CFrame") as CFrame

                                            const offset1 = C1.multiply(transform).inverse()
                                            const finalCF = part0Cf.multiply(C0).multiply(offset1)

                                            //update part1 position
                                            part1.setProperty("CFrame", finalCF)
                                        } 
                                    } else {
                                        if (part1 && part0 && part1.HasProperty("CFrame")) {
                                            const part1Cf = part1.Property("CFrame") as CFrame

                                            const offset0 = C0.multiply(transform).inverse()
                                            const finalCF = part1Cf.multiply(C1).multiply(offset0)

                                            //update part0 position
                                            part0.setProperty("CFrame", finalCF)
                                        }
                                    }
                                
                            } else {
                                console.warn("Motor6D/Weld is missing parent")
                            }
                        }

                        if (part0) {
                            part0ChangedConnection = part0.Changed.Connect((propertyName) => {
                                if (propertyName === "CFrame") {
                                    update(self, 1)
                                }
                            })
                            self.addConnectionReference(part0ChangedConnection)
                        }

                        /*if (part1) {
                            part1ChangedConnection = part1.Changed.Connect((propertyName) => {
                                if (propertyName === "CFrame") {
                                    update(self, 0)
                                }
                            })
                            self.addConnectionReference(part1ChangedConnection)
                        }*/
                    }

                    function setup(this: Instance) {
                        //console.log(this)
                        if (this.className === "Motor6D") {
                            //create transform property
                            const transformProperty = new Property()
                            transformProperty.name = "Transform"
                            transformProperty.typeID = DataType.CFrame
                            
                            this.addProperty(transformProperty)
                            this.setProperty(transformProperty.name, new CFrame())
                        }

                        //add connections
                        const changedConnection = this.Changed.Connect(() => {
                            update(this)
                        })
                        const ancestryChangedConnection = this.AncestryChanged.Connect(() => {
                            update(this)
                        })
                        this.addConnectionReference(changedConnection)
                        this.addConnectionReference(ancestryChangedConnection)
                    }

                    setup.bind(this)()
                }
                break
            case "BodyColors":
                {
                    function update(self: Instance) {
                        const rig = self.parent
                        if (!rig) {
                            return
                        }

                        const humanoid = rig.FindFirstChildOfClass("Humanoid")
                        if (!humanoid) {
                            return
                        }

                        const bodyPartDictionary: {[K in string]: string[]} = {
                            "Head": ["Head"],
                            "Torso": ["Torso", "UpperTorso", "LowerTorso"],
                            "LeftArm": ["Left Arm", "LeftHand", "LeftLowerArm", "LeftUpperArm"],
                            "RightArm": ["Right Arm", "RightHand", "RightLowerArm", "RightUpperArm"],
                            "LeftLeg": ["Left Leg", "LeftFoot", "LeftLowerLeg", "LeftUpperLeg"],
                            "RightLeg": ["Right Leg", "RightFoot", "RightLowerLeg", "RightUpperLeg"]
                        }

                        const bodyParts: Instance[] = []
                        for (const child of rig.GetChildren()) {
                            if (child.className === "Part" || child.className === "MeshPart") {
                                bodyParts.push(child)
                            }
                        }

                        for (const bodyPart in bodyPartDictionary) {
                            const bodyPartNames = bodyPartDictionary[bodyPart]
                            const color = (self.Prop(bodyPart + "Color3") as Color3).toColor3uint8()
                            for (const child of bodyParts) {
                                if (bodyPartNames.includes(child.Prop("Name") as string)) {
                                    child.setProperty("Color", color)
                                }
                            }
                        }
                    }

                    function setup(this: Instance) {
                        const changedConnection = this.Changed.Connect(() => {
                            update(this)
                        })

                        this.addConnectionReference(changedConnection)
                    }

                    setup.bind(this)()
                }
                break
        }

        if (!notComplete) {
            this.createWrapper()
        }
    }

    get id(): string {
        return "0x" + this._id.toString(16).toUpperCase()
    }

    createWrapper() {
        //instance wrappers (notice how its way shorter than the legacy part)
        const wrapper = GetWrapperForInstance(this)
        if (wrapper) {
            wrapper.created()
        }
    }

    addConnectionReference(connection: Connection) {
        if (!this._connectionReferences.includes(connection)) {
            this._connectionReferences.push(connection)
        }
    }

    removeConnectionReference(connection: Connection) {
        const index = this._connectionReferences.indexOf(connection)
        if (index !== -1) {
            this._connectionReferences.splice(index,1)
        }
    }

    addReferencedBy(instance: Instance) {
        if (!this._referencedBy.includes(instance)) {
            this._referencedBy.push(instance)
        }
    }

    removeReferencedBy(instance: Instance) {
        const index = this._referencedBy.indexOf(instance)
        if (index !== -1) {
            let isReferenced = false
            const properties = instance.getPropertyNames()
            for (const prop of properties) {
                if (instance.Prop(prop) === this) {
                    isReferenced = true
                }
            }
            if (!isReferenced) {
                this._referencedBy.splice(index,1)
            }
        }
    }

    addProperty(property: Property, value?: unknown) {
        if (!property.name) {
            console.log(property)
            throw new Error("Property is missing a name")
        }

        if (!this._properties.get(property.name)) {
            this._properties.set(property.name, property)
        }

        if (value !== undefined) {
            this.setProperty(property.name, value)
        }
    }

    fixPropertyName(name: string) {
        if (this._properties.get(name)) {
            return name
        }

        switch (name) {
            case "Size": {
                name = "size"
                break
            }
            case "Shape": {
                name = "shape"
                break
            }
            case "Health": {
                name = "Health_XML"
                break
            }
            case "Color": {
                name = "Color3uint8"
                break
            }
        }

        return name
    }

    setProperty(name: string, value: unknown) {
        name = this.fixPropertyName(name)

        const property = this._properties.get(name)
        if (property) {
            //special stuff
            if (property.typeID === DataType.Referent && property.value) {
                const valueOld = property.value as Instance
                valueOld.removeReferencedBy(this)
            } else if (property.typeID === DataType.CFrame && property.value && value) {
                const valueCF = value as CFrame
                if (isNaN(valueCF.Position[0]) || isNaN(valueCF.Position[1]) || isNaN(valueCF.Position[2])) {
                    console.log(value)
                    throw new Error("CFrame position can't contain NaN value")
                }
                if (isNaN(valueCF.Orientation[0]) || isNaN(valueCF.Orientation[1]) || isNaN(valueCF.Orientation[2])) {
                    console.log(value)
                    throw new Error("CFrame orientation can't contain NaN value")
                }
            }

            if (property.name === "Name") {
                const valueSTR = value as string
                this.name = valueSTR
            }
            /*if (this.className === "AnimationRigData" && StringBufferProperties.includes(property.name || "")) {
                saveByteArray([value as ArrayBuffer], property.name || "null")
            }*/

            property._value = value

            //special stuff
            if (property.typeID === DataType.Referent && property.value) {
                const valueInstance = property.value as Instance
                valueInstance.addReferencedBy(this)
            }
            this.Changed.Fire(name)
        } else {
            console.warn(`Property with name ${name} was not found in ${this.GetFullName()}`)
        }
    }

    HasProperty(name: string) {
        name = this.fixPropertyName(name)

        return !!(this._properties.get(name))
    }

    Property(name: string): unknown {
        name = this.fixPropertyName(name)

        if (!this.HasProperty(name)) {
            switch (name) {
                case "Position":
                    {
                        const cf = this.Prop("CFrame") as CFrame
                        const pos = cf.Position
                        return new Vector3(pos[0], pos[1], pos[2])
                        break
                    }
                default:
                    {
                        if (this.className === "Decal" && name === "Texture") {
                            if (this.HasProperty("TextureContent")) {
                                return (this.Prop("TextureContent") as Content).uri
                            } else if (this.HasProperty("ColorMapContent")) {
                                return (this.Prop("ColorMapContent") as Content).uri
                            }
                        } else if (name.includes("Id") || name.includes("ID")) {
                            const contentVersion = name.replace("Id", "Content").replace("ID","Content")
                            if (this.HasProperty(contentVersion)) {
                                const content = this.Prop(contentVersion) as Content
                                return content.uri
                            }
                            break
                        }
                    }
            }
        }

        if (!this._properties.get(name)) {
            console.log(this)
            throw new Error(`Property: ${name} does not exist`)
        }

        return this._properties.get(name)?.value
    }

    Prop(name: string): unknown {
        return this.Property(name)
    }

    PropertyType(name: string): number | undefined {
        return this._properties.get(name)?.typeID
    }

    getPropertyNames() {
        return Array.from(this._properties.keys())
    }

    setParent(instance: Instance | undefined | null) {
        if (!instance) {
            instance = undefined
        }

        if (this.parent) {
            const index = this.parent.children.indexOf(this)
            if (index !== -1) {
                this.parent.children.splice(index, 1)
            }
        }

        this.parent = instance

        //special logic
        if (this.parent) {
            this.AccessoryBuildWeld()
        }

        //finalize
        if (instance) {
            instance.children.push(this)
            instance.ChildAdded.Fire(this)
            instance.AncestryChanged.Fire(this, instance)
        }

        //events
        this.AncestryChanged.Fire(this, instance)
    }

    Destroy() {
        //disconnect all connections created by instance
        for (const connection of this._connectionReferences) {
            connection.Disconnect()
        }
        this._connectionReferences = []

        //destroy all children
        for (const child of this.GetChildren()) {
            child.Destroy()
        }

        this.Destroying.Fire(this)

        this.ChildAdded.Clear()
        this.Destroying.Clear()
        this.Changed.Clear()

        this.setParent(null)

        //set all properties to null
        for (const property of this.getPropertyNames()) {
            this.setProperty(property, null)
        }

        //remove all references to instance
        for (const instance of this._referencedBy) {
            for (const propertyName of instance.getPropertyNames()) {
                if (instance.Property(propertyName) === this) {
                    instance.setProperty(propertyName, null)
                }
            }
        }
        this._referencedBy = []

        this.destroyed = true
    }

    GetFullName(): string {
        if (this.parent && this.parent.className !== "DataModel") {
            return this.parent.GetFullName() + "." + this.name
        } else {
            return this.name || "null"
        }
    }

    GetChildren(): Instance[] { //It is done like this so setting parents doesnt mess up the list
        const childrenList = []

        for (const child of this.children) {
            childrenList.push(child)
        }

        return childrenList
    }

    GetDescendants() {
        let descendants = this.children

        for (const child of this.children) {
            descendants = descendants.concat(child.GetDescendants())
        }

        return descendants
    }

    FindFirstChild(name: string) {
        for (const child of this.GetChildren()) {
            if (child.Property("Name") == name) {
                return child
            }
        }
    }

    FindFirstDescendant(name: string) {
        for (const child of this.GetDescendants()) {
            if (child.Property("Name") == name) {
                return child
            }
        }
    }

    Child(name: string) {
        return this.FindFirstChild(name)
    }

    FindFirstChildOfClass(className: string) {
        for (const child of this.children) {
            if (child.className == className) {
                return child
            }
        }
    }

    AccessoryBuildWeld() {
        if (this.parent && this.className === "Accessory") { //create accessory weld TODO: making the part0/C0 and part1/C1 accurate (0 = hat, 1 = body) would be good, probably
            const humanoid = this.parent.FindFirstChildOfClass("Humanoid")

            if (humanoid) {
                const handle = this.FindFirstChild("Handle")
                if (handle) {
                    const accessoryAttachment = handle.FindFirstChildOfClass("Attachment")
                    let bodyAttachment = null
                    const bodyDescendants = this.parent.GetDescendants()
                    for (const child of bodyDescendants) {
                        if (child.className === "Attachment" && accessoryAttachment && child.Property("Name") === accessoryAttachment.Property("Name") && child.parent && child.parent.parent === this.parent) {
                            bodyAttachment = child
                        }
                    }

                    if (!bodyAttachment) {
                        return
                    }
                    if (!accessoryAttachment) {
                        return
                    }

                    const oldAccessoryWeld = handle.FindFirstChild("AccessoryWeld")
                    if (oldAccessoryWeld) {
                        oldAccessoryWeld.Destroy()
                    }

                    const weld = new Instance("Weld")

                    weld.addProperty(new Property("Name", DataType.String), "AccessoryWeld")
                    weld.addProperty(new Property("Archivable", DataType.Bool), true)
                    weld.addProperty(new Property("C1", DataType.CFrame), (accessoryAttachment.Property("CFrame") as CFrame).clone())
                    weld.addProperty(new Property("C0", DataType.CFrame), (bodyAttachment.Property("CFrame") as CFrame).clone())
                    weld.addProperty(new Property("Part1", DataType.Referent), accessoryAttachment.parent)
                    weld.addProperty(new Property("Part0", DataType.Referent), bodyAttachment.parent)
                    weld.addProperty(new Property("Active", DataType.Bool), true)
                    weld.addProperty(new Property("Enabled", DataType.Bool), false)

                    weld.setParent(handle)

                    weld.setProperty("Enabled", true)
                }
            }
        }
    }
}

class INST {
    classID!: number //u32
    className!: string //string
    objectFormat!: number //u8
    instanceCount!: number //u32
    referents!: number[] //i32[]

    clone() {
        const copy = new INST()
        copy.classID = this.classID
        copy.className = this.className
        copy.objectFormat = this.objectFormat
        copy.instanceCount = this.instanceCount
        copy.referents = []
        for (const referent of this.referents) {
            copy.referents.push(referent)
        }
        return copy
    }
}

class PROP {
    classID!: number //u32
    propertyName!: string //string
    typeID!: number //u8
    values: unknown[] = []

    clone() {
        const copy = new PROP()
        copy.classID = this.classID
        copy.propertyName = this.propertyName
        copy.typeID = this.typeID
        copy.values = []
        for (const value of this.values) {
            switch (this.typeID) {
                case DataType.UDim:
                case DataType.UDim2:
                case DataType.Ray:
                case DataType.Vector3:
                case DataType.Color3:
                case DataType.Color3uint8:
                case DataType.CFrame:
                    copy.values.push((value as {clone: () => unknown}).clone())
                    break
                default:
                    copy.values.push(value)
                    break
            }
        }
        return copy
    }
}

class PRNT {
    instanceCount = 0
    childReferents: number[] = []
    parentReferents: number[] = []

    clone() {
        const copy = new PRNT()
        copy.instanceCount = this.instanceCount
        for (const childReferent of this.childReferents) {
            copy.childReferents.push(childReferent)
        }
        for (const parentReferent of this.parentReferents) {
            copy.parentReferents.push(parentReferent)
        }
        return copy
    }
}

export class RBX {

    classCount = 0 //i32
    instanceCount = 0 //i32

    meta = new Map<string,string>() //Map<string,string>
    sstr = new Map<number[],string>() //Map<MD5,string>
    sstrArr: string[] = []
    instArray: INST[] = [] //INST[]
    propArray: PROP[] = [] //PROP[]
    prnt = new PRNT() //PRNT

    //not based on file format
    classIDtoINST = new Map()
    dataModel = new Instance("DataModel")
    treeGenerated = false
    xmlString?: string

    get instances() {
        return this.dataModel.children
    }

    constructor() {
        this.reset()
    }

    reset() {
        this.classCount = 0
        this.instanceCount = 0

        this.meta = new Map()
        this.sstr = new Map()
        this.instArray = []
        this.propArray = []
        this.prnt = new PRNT()

        this.classIDtoINST = new Map()

        this.dataModel = new Instance("DataModel")
        this.dataModel.name = "root"
        this.dataModel.classID = -1 //TODO: is this true? a bit hard to test
        this.dataModel.objectFormat = 0
    }

    clone() { //DOES NOT COPY (DATAMODEL or treeGenerated), instead regenerate tree
        const copy = new RBX()
        copy.classCount = this.classCount
        copy.instanceCount = this.instanceCount
        
        for (const key of this.meta.keys()) {
            const value = this.meta.get(key)
            if (value) {
                copy.meta.set(key, value)
            }
        }

        for (const key of this.sstr.keys()) {
            const value = this.sstr.get(key)
            if (value) {
                copy.sstr.set(key, value)
            }
        }

        for (const inst of this.instArray) {
            copy.instArray.push(inst.clone())
            copy.classIDtoINST.set(inst.classID, inst)
        }

        for (const prop of this.propArray) {
            copy.propArray.push(prop.clone())
        }

        copy.prnt = this.prnt.clone()

        copy.xmlString = this.xmlString

        return copy
    }

    readMETA(chunkView: RBXSimpleView) {
        const entriesCount = chunkView.readUint32()
        for (let i = 0; i < entriesCount; i++) {
            const metaKey = chunkView.readUtf8String()
            const metaValue = chunkView.readUtf8String()

            this.meta.set(metaKey, metaValue)
        }
    }

    readSSTR(chunkView: RBXSimpleView) {
        const version = chunkView.readUint32() //always 0
        if (version !== 0) {
            throw new Error("Unexpected SSTR version")
        }

        const sharedStringCount = chunkView.readUint32()
        for (let i = 0; i < sharedStringCount; i++) {
            const md5 = [chunkView.readUint32(), chunkView.readUint32(), chunkView.readUint32(), chunkView.readUint32()]
            const str = chunkView.readUtf8String()

            this.sstrArr.push(str)
            this.sstr.set(md5, str)
        }
    }

    readINST(chunkView: RBXSimpleView) {
        const inst = new INST()

        inst.classID = chunkView.readUint32()
        inst.className = chunkView.readUtf8String()
        inst.objectFormat = chunkView.readUint8()
        inst.instanceCount = chunkView.readUint32()
        const referents = readReferents(inst.instanceCount, chunkView)
        inst.referents = referents
        //servicemarkes could be read here but is useless and a waste of time

        this.instArray.push(inst)
        this.classIDtoINST.set(inst.classID, inst)
    }

    readPROP(chunkView: RBXSimpleView) {
        const prop = new PROP()
        prop.classID = chunkView.readUint32()
        prop.propertyName = chunkView.readUtf8String()
        prop.typeID = chunkView.readUint8()

        //read values
        const valuesLength = this.classIDtoINST.get(prop.classID).instanceCount

        switch (prop.typeID) {
            case DataType.Bytecode:
            case DataType.String:
                {
                    let totalRead = 0
                    while (totalRead < valuesLength) {
                        if (StringBufferProperties.includes(prop.propertyName)) {
                            const length = chunkView.readUint32()
                            prop.values.push(chunkView.buffer.slice(chunkView.viewOffset, chunkView.viewOffset + length - 1))
                            chunkView.viewOffset += length
                            //prop.values.push(chunkView.buffer)
                        } else {
                            prop.values.push(chunkView.readUtf8String())
                        }
                        totalRead++
                    }
                    break
                }
            case DataType.Bool:
                {
                    for (let i = 0; i < valuesLength; i++) {
                        prop.values.push(chunkView.readUint8() > 0)
                    }
                    break
                }
            case DataType.Int32:
                {
                    const nums = chunkView.readInterleaved32(valuesLength, false) as number[]
                    //untransform
                    for (let i = 0; i < nums.length; i++) {
                        nums[i] = untransformInt32(nums[i])
                        prop.values.push(nums[i])
                    }
                    
                    break
                }
            case DataType.Float32:
                {
                    const nums = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    
                    for (let i = 0; i < nums.length; i++) {
                        prop.values.push(nums[i])
                    }

                    break
                }
            case DataType.Float64:
                {
                    for (let i = 0; i < valuesLength; i++) {
                        prop.values.push(chunkView.readFloat64())
                    }
                    break
                }
            case DataType.UDim:
                {
                    const scales = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const offsets = chunkView.readInterleaved32(valuesLength, false) as number[]

                    for (let i = 0; i < valuesLength; i++) {
                        const udim = new UDim()
                        udim.Scale = scales[i]
                        udim.Offset = untransformInt32(offsets[i])
                        prop.values.push(udim)
                    }

                    break
                }
            case DataType.UDim2:
                {
                    const scalesX = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const scalesY = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const offsetsX = chunkView.readInterleaved32(valuesLength, false) as number[]
                    const offsetsY = chunkView.readInterleaved32(valuesLength, false) as number[]

                    for (let i = 0; i < valuesLength; i++) {
                        const udim = new UDim2()
                        udim.X.Scale = scalesX[i]
                        udim.Y.Scale = scalesY[i]
                        udim.X.Offset = untransformInt32(offsetsX[i])
                        udim.Y.Offset = untransformInt32(offsetsY[i])
                        prop.values.push(udim)
                    }

                    break
                }
            case DataType.Ray: //TODO: NOT TESTED
                {
                    for (let i = 0; i < valuesLength; i++) {
                        const ray = new Ray()
                        ray.Origin = [chunkView.readNormalFloat32(), chunkView.readNormalFloat32(), chunkView.readNormalFloat32()]
                        ray.Direction = [chunkView.readNormalFloat32(), chunkView.readNormalFloat32(), chunkView.readNormalFloat32()]
                        prop.values.push(ray)
                    }
                    break
                }
            case DataType.BrickColor:
                {
                    const values = chunkView.readInterleaved32(valuesLength, false, "readUint32")
                    for (const value of values) {
                        prop.values.push(value)
                    }
                    break
                }
            case DataType.Color3: //TODO: NOT TESTED
                {
                    const xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]

                    for (let i = 0; i < valuesLength; i++) {
                        const vector3 = new Color3()
                        vector3.R = xValues[i]
                        vector3.G = yValues[i]
                        vector3.B = zValues[i]
                        prop.values.push(vector3)
                    }
                    break
                }
            case DataType.Vector3:
                {
                    const xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]

                    for (let i = 0; i < valuesLength; i++) {
                        const vector3 = new Vector3()
                        vector3.X = xValues[i]
                        vector3.Y = yValues[i]
                        vector3.Z = zValues[i]
                        prop.values.push(vector3)
                    }
                    break
                }
            case DataType.CFrame:
                {
                    const cframes = []

                    for (let i = 0; i < valuesLength; i++) { //rotation array
                        const cframe = new CFrame()

                        const id = chunkView.readUint8()
                        if (id === 0) {
                            const matrix = new Array(9)
                            for (let x = 0; x < 3; x++) {
                                for (let y = 0; y < 3; y++) {
                                    matrix[x + y*3] = chunkView.readNormalFloat32()
                                }
                            }

                            cframe.Orientation = rotationMatrixToEulerAngles(matrix)
                            //cframe.Orientation[3] = matrix
                        } else {
                            const orientationTable: {[K in number]: Vec3} = { //TODO: double check this
                                0x02: [0, 0, 0],
                                0x14: [0, 180, 0],
                                0x03: [90, 0, 0],
                                0x15: [-90, -180, 0],
                                0x05: [0, 180, 180],
                                0x17: [0, 0, 180],
                                0x06: [-90, 0, 0],
                                0x18: [90, 180, 0],
                                0x07: [0, 180, 90],
                                0x19: [0, 0, -90],
                                0x09: [0, 90, 90],
                                0x1b: [0, -90, -90],
                                0x0a: [0, 0, 90],
                                0x1c: [0, -180, -9],
                                0x0c: [0, -90, 90],
                                0x1e: [0, 90, -90],
                                0x0d: [-90, -90, 0],
                                0x1f: [90, 90, 0],
                                0x0e: [0, -90, 0],
                                0x20: [0, 90, 0],
                                0x10: [90, -90, 0],
                                0x22: [-90, 90, 0],
                                0x11: [0, 90, 180],
                                0x23: [0, -90, 180],
                            }

                            cframe.Orientation = orientationTable[id]
                        }

                        cframes.push(cframe)
                    }

                    const xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]
                    const zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32") as number[]

                    for (let i = 0; i < valuesLength; i++) {
                        cframes[i].Position = [xValues[i], yValues[i], zValues[i]]
                        prop.values.push(cframes[i])
                    }
                    break
                }
            case DataType.Enum: //TODO: NOT TESTED
                {
                    const values = chunkView.readInterleaved32(valuesLength, false, "readUint32") as number[]

                    for (const val of values) {
                        prop.values.push(val)
                    }
                    break
                }
            case DataType.Referent: //Note: Referents become native references when tree is generated
                {
                    const referents = readReferents(valuesLength, chunkView)

                    for (const referent of referents) {
                        prop.values.push(referent)
                    }
                    break
                }
            case DataType.Color3uint8: //TODO: NOT TESTED
                {
                    const rs = []
                    const gs = []

                    for (let i = 0; i < valuesLength; i++) {
                        rs.push(chunkView.readUint8())
                    }
                    for (let i = 0; i < valuesLength; i++) {
                        gs.push(chunkView.readUint8())
                    }
                    for (let i = 0; i < valuesLength; i++) {
                        const color = new Color3uint8()
                        color.R = rs[i]
                        color.G = gs[i]
                        color.B = chunkView.readUint8()

                        prop.values.push(color)
                    }
                    break
                }
            case DataType.Int64:
                {
                    const nums = chunkView.readInterleaved32(valuesLength, false, "readInt64", 8) as bigint[]
                    //untransform
                    for (let i = 0; i < nums.length; i++) {
                        nums[i] = untransformInt64(nums[i])
                        prop.values.push(nums[i])
                    }

                    break
                }
            case DataType.SharedString:
                {
                    const nums = chunkView.readInterleaved32(valuesLength, false, "readUint32") as number[]
                    
                    for (const num of nums) {
                        prop.values.push(num)
                    }

                    break
                }
            case DataType.Content:
                {
                    const sourceTypes = chunkView.readInterleaved32(valuesLength, false, "readUint32") as number[]

                    const uriCount = chunkView.readUint32()
                    const uris = []
                    for (let i = 0; i < uriCount; i++) {
                        uris.push(chunkView.readUtf8String())
                    }

                    //const objectCount = chunkView.readUint32()
                    //const objects = readReferents(objectCount, chunkView)

                    //const externalObjectCount = chunkView.readUint32()
                    //const externalObjects = readReferents(externalObjectCount, chunkView)

                    let uriIndex = 0
                    //let objectIndex = 0
                    //let externalObjectIndex = 0

                    for (let i = 0; i < valuesLength; i++) {
                        const content = new Content()
                        content.sourceType = sourceTypes[i]

                        //i think the enums are wrong here...
                        switch (content.sourceType) {
                            case 0: //None
                                
                                break
                            case 1: //Uri
                            case 2: //Object
                                content.uri = uris[uriIndex]
                                uriIndex += 1
                                break
                        }

                        prop.values.push(content)
                    }

                    break
                }
            default:
                console.warn(`Unknown property type ${prop.typeID} in property ${prop.propertyName}`)
        }

        //if (prop.values.length > 0) {
            this.propArray.push(prop)
        //}
    }

    readPRNT(chunkView: RBXSimpleView) {
        const version = chunkView.readUint8()
        if (version !== 0) {
            throw new Error("Unexpected PRNT version")
        }

        const prnt = new PRNT()

        prnt.instanceCount = chunkView.readUint32()
        prnt.childReferents = readReferents(prnt.instanceCount, chunkView)
        prnt.parentReferents = readReferents(prnt.instanceCount, chunkView)
        this.prnt = prnt
    }

    getChunkBuffer(view: RBXSimpleView, compressedLength: number, uncompressedLength: number) {
        //compressed
        if (compressedLength !== 0) {
            const isZSTD = view.readUint32() == 4247762216
            view.viewOffset -= 4
            const isLZ4 = !isZSTD

            const compressedByteArray = view.buffer.slice(view.viewOffset, view.viewOffset + compressedLength)

            if (isZSTD) { //ZSTD
                const decompressedData = fzstd.decompress(new Uint8Array(compressedByteArray)).buffer
                return decompressedData.slice(12)
            } else if (isLZ4) { //LZ4
                //const uncompressed = Buffer.alloc(uncompressedLength)

                //const compressedByteArray = view.buffer.slice(view.viewOffset, view.viewOffset + compressedLength)
                //const compressedIntArray = new Uint8Array(compressedByteArray) as Buffer<ArrayBufferLike>

                ///*const uncompressedSize = */LZ4.decodeBlock(compressedIntArray, uncompressed)
                
                //return uncompressed.buffer
                
                return LZ4.decompress(compressedByteArray, uncompressedLength)
            }
        }

        //uncompressed
        return view.buffer.slice(view.viewOffset, view.viewOffset + uncompressedLength)
    }

    addItem(item: Element, itemParent?: Instance) {
        const instance = new Instance(item.getAttribute("class") || "null", true)

        const properties = item.querySelectorAll(":scope > Properties > *")
        for (const propertyNode of properties) {
            switch (propertyNode.nodeName) {
                case "Content":
                    {
                        const property = new Property()
                        property.name = propertyNode.getAttribute("name") || "null"
                        property.typeID = DataType.String

                        instance.addProperty(property)

                        const childElement = propertyNode.querySelector(":scope > *")

                        if (childElement) {
                            if (childElement.nodeName === "null") {
                                instance.setProperty(property.name, "")
                            } else {
                                instance.setProperty(property.name, childElement.textContent)
                            }
                        } else {
                            instance.setProperty(property.name, "")
                        }
                        break
                    }
                case "string":
                    {
                        const property = new Property()
                        property.name = propertyNode.getAttribute("name") || "null"
                        property.typeID = DataType.String

                        instance.addProperty(property)
                        instance.setProperty(property.name, propertyNode.textContent)
                        break
                    }
                case "bool":
                    {
                        const property = new Property()
                        property.name = propertyNode.getAttribute("name") || "null"
                        property.typeID = DataType.String

                        instance.addProperty(property)
                        instance.setProperty(property.name, propertyNode.textContent.toLowerCase() === "true")
                        break
                    }
                case "CoordinateFrame":
                    {
                        const property = new Property()
                        property.name = propertyNode.getAttribute("name") || "null"
                        property.typeID = DataType.CFrame

                        instance.addProperty(property)

                        const cframeDesc: {[K in string]: number} = {}

                        const childElements = propertyNode.querySelectorAll(":scope > *")

                        const cframe = new CFrame()
                        for (const element of childElements) {
                            cframeDesc[element.nodeName] = Number(element.textContent)
                        }

                        const matrix = new Array(9)
                        let i = 0
                        for (let x = 0; x < 3; x++) {
                            for (let y = 0; y < 3; y++) {
                                matrix[x + y*3] = [
                                    cframeDesc.R00,
                                    cframeDesc.R01,
                                    cframeDesc.R02,
                                    cframeDesc.R10,
                                    cframeDesc.R11,
                                    cframeDesc.R12,
                                    cframeDesc.R20,
                                    cframeDesc.R21,
                                    cframeDesc.R22,
                                ][i]
                                i++
                            }
                        }

                        cframe.Orientation = rotationMatrixToEulerAngles(matrix)
                        cframe.Position = [cframeDesc.X, cframeDesc.Y, cframeDesc.Z]

                        instance.setProperty(property.name, cframe)

                        break
                    }
                case "Vector3":
                    {
                        const property = new Property()
                        property.name = propertyNode.getAttribute("name") || "null"
                        property.typeID = DataType.Vector3

                        instance.addProperty(property)

                        const childElements = propertyNode.querySelectorAll(":scope > *")

                        const position = new Vector3()
                        for (const element of childElements) {
                            position[element.nodeName as ("X" | "Y" | "Z")] = Number(element.textContent)
                        }

                        instance.setProperty(property.name, position)

                        break
                    }
                case "token":
                    {
                        const property = new Property()
                        property.name = propertyNode.getAttribute("name") || "null"
                        property.typeID = DataType.Enum

                        instance.addProperty(property)
                        instance.setProperty(property.name, Number(propertyNode.textContent))

                        break
                    }
                case "Color3uint8":
                    {
                        const color3uint8 = new Color3uint8()

                        const intColor = Number(propertyNode.textContent)
                        const colorRGB = intToRgb(intColor)
                        color3uint8.R = colorRGB.R
                        color3uint8.G = colorRGB.G
                        color3uint8.B = colorRGB.B

                        instance.addProperty(new Property(propertyNode.getAttribute("name") || "null", DataType.Color3uint8), color3uint8)
                        break
                    }
                case "int": {
                    const property = new Property()
                    property.name = propertyNode.getAttribute("name") || "null"
                    property.typeID = DataType.Int32

                    instance.addProperty(property)
                    instance.setProperty(property.name, Number(propertyNode.textContent))
                    break
                }
            }
        }

        if (itemParent) {
            instance.setParent(itemParent)
        } else {
            instance.setParent(this.dataModel)
        }

        return instance
    }

    fromXML(xml: Document) { //TODO: figure out how to do this accurately https://dom.rojo.space/xml.html
        console.warn("Parsing RBX xml file, the result may not be accurate")
        //console.log(xml)

        const itemParentMap = new Map<Element,Instance>()

        let currentItems: Element[] | NodeListOf<Element> = xml.querySelectorAll(":scope > Item")
        while (currentItems.length > 0) {
            const newCurrentItems = []

            for (const item of currentItems) {
                const instance = this.addItem(item, itemParentMap.get(item))
                const itemChildren = item.querySelectorAll(":scope > Item")
                for (const itemChild of itemChildren) {
                    itemParentMap.set(itemChild, instance)
                    newCurrentItems.push(itemChild)
                }
            }

            currentItems = newCurrentItems
        }

        this.treeGenerated = true
    }

    fromBuffer(buffer: ArrayBuffer) {
        this.reset()

        const view = new RBXSimpleView(buffer)

        // FILE HEADER

        //verify magic
        const readMagic = view.readUtf8String(magic.length)
        if (readMagic !== magic) {
            if (readMagic === xmlMagic) {
                const xmlString = new TextDecoder("utf-8").decode(buffer)
                const xml = new DOMParser().parseFromString(xmlString, "text/xml")
                this.xmlString = xmlString
                this.fromXML(xml)
                return
            } else {
                console.log(buffer)
                throw new Error("Not a valid file, missing magic")
            }
        }

        //skip signature
        view.viewOffset += 6

        //skip version (always 0, u16)
        view.viewOffset += 2

        this.classCount = view.readInt32()
        this.instanceCount = view.readInt32()

        //skip padding
        view.viewOffset += 8

        console.log(`FILESIZE: ${buffer.byteLength}, CLASSCOUNT: ${this.classCount}, INSTCOUNT: ${this.instanceCount}`)

        //CHUNKS
        let timeout = 0
        let foundEnd = false
        while (!foundEnd) {
            const chunkName = view.readUtf8String(4)
            const compressedLength = view.readUint32()
            const uncompressedLength = view.readUint32()

            view.viewOffset += 4 //skip unused

            const chunkBuffer = this.getChunkBuffer(view, compressedLength, uncompressedLength)

            view.lock()

            const chunkView = new RBXSimpleView(chunkBuffer)

            //console.log(`CHUNK: ${chunkName}, USIZE: ${uncompressedLength}, CSIZE: ${compressedLength}`)
            //console.log(chunkBuffer)

            /*
            if (chunkName == "PRNT") {
                saveByteArray([chunkBuffer], `${chunkName}.dat`)
            }
            */

            switch (chunkName) {
                case "META":
                    {
                        this.readMETA(chunkView)
                        break
                    }
                case "SSTR":
                    {
                        this.readSSTR(chunkView)
                        break
                    }
                case "INST":
                    {
                        this.readINST(chunkView)
                        break
                    }
                case "PROP":
                    {
                        this.readPROP(chunkView)
                        break
                    }
                case "PRNT":
                    {
                        this.readPRNT(chunkView)
                        break
                    }
                case "END\0":
                    foundEnd = true    
                    break
                default:
                    console.warn("Unknown chunk found: " + chunkName)
                    break
            }

            view.unlock()

            view.viewOffset += compressedLength || uncompressedLength

            timeout++
            if (timeout > 10000 && !foundEnd) {
                throw new Error("Max retry count reached")
            }
        }
    }

    fromInstance(root: Instance) {
        let bufferLength = 0

        //header
        bufferLength += 8 + 6 + 2 + 4 + 4 + 8

        //prepare for INST chunks
        const instances = root.GetDescendants()
        instances.push(root)

        let currentReferent = 0
        const instanceToReferent = new Map<Instance,number>()

        let currentClassId = 0
        const classIdMap = new Map<string,number>()
        const instanceMap = new Map<number,Instance[]>()

        for (const child of instances) {
            //give instance a referent
            instanceToReferent.set(child, currentReferent++)

            //give classname an id
            let classId = classIdMap.get(child.className)
            if (classId === undefined) {
                classId = currentClassId++
                classIdMap.set(child.className, classId)
            }

            //add instance to map, class -> instances[]
            let instanceArray = instanceMap.get(classId)
            if (!instanceArray) {
                instanceArray = []
                instanceMap.set(classId, instanceArray)
            }
            instanceArray.push(child)
        }

        //create INST chunks
        for (const className of classIdMap.keys()) {
            bufferLength += 4 + 4 + 4 + 4

            const inst = new INST()
            inst.classID = classIdMap.get(className)!
            inst.className = className
            inst.instanceCount = instanceMap.get(inst.classID)!.length
            inst.objectFormat = 0 //TODO: do this properly
            bufferLength += 4 + 4 + inst.className.length + 1 + 4

            inst.referents = []
            for (const child of instanceMap.get(inst.classID)!) {
                inst.referents.push(instanceToReferent.get(child)!)
                bufferLength += 4
            }

            this.instArray.push(inst)
            this.classIDtoINST.set(inst.classID, inst)
        }

        //prepare PROP chunks
        const propertiesForClass = new Map<number,string[]>()
        for (const child of instances) {
            const classId = classIdMap.get(child.className)!

            let properties = propertiesForClass.get(classId)
            if (!properties) {
                properties = child.getPropertyNames()
                propertiesForClass.set(classId, properties)
            } else {
                for (const property of child.getPropertyNames()) {
                    if (!properties.includes(property)) {
                        properties.push(property)
                    }
                }
            }
        }

        //create PROP chunks
        for (const classId of classIdMap.values()) {
            const properties = propertiesForClass.get(classId)
            if (properties) {
                for (const property of properties) {
                    const prop = new PROP()
                    prop.classID = classId
                    prop.propertyName = property

                    bufferLength += 4 + 4 + 4 + 4
                    bufferLength += 4 + 4 + prop.propertyName.length + 1
                    
                    const instances = instanceMap.get(classId)
                    if (instances) {
                        for (const child of instances) {
                            if (child.HasProperty(property)) {
                                prop.typeID = child.PropertyType(property)!

                                const value = child.Prop(property)
                                prop.values.push(value)

                                switch (prop.typeID) {
                                    case DataType.String:
                                        if (value instanceof ArrayBuffer) {
                                            bufferLength += value.byteLength + 4
                                        } else {
                                            bufferLength += (value as string).length + 4
                                        }
                                        break
                                    case DataType.Bool:
                                        bufferLength += 1
                                        break
                                    case DataType.Int32:
                                        bufferLength += 4
                                        break
                                    case DataType.Float32:
                                        bufferLength += 4
                                        break
                                    case DataType.Float64:
                                        bufferLength += 4
                                        break
                                    case DataType.UDim:
                                        bufferLength += 8
                                        break
                                    case DataType.UDim2:
                                        bufferLength += 4 * 4
                                        break
                                    case DataType.Ray:
                                        bufferLength += 4 * 6
                                        break
                                    case DataType.BrickColor:
                                        bufferLength += 4
                                        break
                                    case DataType.Color3:
                                    case DataType.Vector3:
                                        bufferLength += 4 * 3
                                        break
                                    case DataType.CFrame:
                                        bufferLength += 1 + 4 * 9 + 4 * 3
                                        break
                                    case DataType.Enum:
                                        bufferLength += 4
                                        break
                                    case DataType.Referent:
                                        bufferLength += 4
                                        break
                                    case DataType.Color3uint8:
                                        bufferLength += 4
                                        break
                                    case DataType.Int64:
                                        bufferLength += 8
                                        break
                                    case DataType.Content:
                                        if (value instanceof Content) {
                                            bufferLength += 4
                                            bufferLength += (value.uri?.length || 0) + 4
                                            bufferLength += 4
                                            bufferLength += 4
                                        }
                                        break
                                }
                            }
                        }
                    }

                    this.propArray.push(prop)
                }
            }
        }

        const buffer = new ArrayBuffer(bufferLength)

        //write data
        const view = new RBXSimpleView(buffer)

        //magic, signature, version
        view.writeUtf8String("<roblox", false)
        view.writeUint32(168689545)
        view.writeUint16(2586)
        view.writeUint16(0)

        view.writeUint32(this.instArray.length)
        view.writeUint32(this.instances.length)

        view.writeUint32(0)
        view.writeUint32(0)

        //inst chunks
        for (const inst of this.instArray) {
            view.writeUtf8String("INST", false)

            view.writeUint32(inst.classID)
            view.writeUtf8String(inst.className)
            view.writeUint8(0)

            const instances = instanceMap.get(inst.classID)!
            view.writeUint32(instances.length)
            for (const child of instances) {
                const referent = instanceToReferent.get(child)!
                view.writeUint32(referent)
            }
        }

        return buffer
    }

    generateTree() {
        if (this.treeGenerated) {
            console.warn("Tree already generated")
            return this.dataModel
        }

        if (!this.xmlString) {
            const referentToInstance = new Map<number,Instance>() //<referent,instance>

            //instances
            for (const inst of this.instArray) {
                for (let i = 0; i < inst.instanceCount; i++) {
                    const instance = new Instance(inst.className, true)
                    instance.classID = inst.classID
                    instance.objectFormat = inst.objectFormat

                    if (referentToInstance.get(inst.referents[i])) {
                        throw new Error(`Duplicate referent ${inst.referents[i]}`)
                    }
                    referentToInstance.set(inst.referents[i], instance)
                }
            }

            //properties
            for (const prop of this.propArray) {
                const inst = this.classIDtoINST.get(prop.classID)
                for (let i = 0; i < inst.referents.length; i++) {
                    const referent = inst.referents[i]
                    const instance = referentToInstance.get(referent)

                    if (!instance) {
                        throw new Error(`Instance with referent ${referent} is missing`)
                    }

                    const property = new Property()
                    property.name = prop.propertyName
                    property.typeID = prop.typeID
                    
                    instance.addProperty(property)
                    switch (property.typeID) {
                        case DataType.Referent:
                            {
                                const referenced = referentToInstance.get(prop.values[i] as number)
                                instance.setProperty(property.name, referenced)
                                break
                            }
                        case DataType.SharedString:
                            {
                                const str = this.sstrArr[prop.values[i] as number]
                                instance.setProperty(property.name, str)
                                break
                            }
                        default:
                            {
                                instance.setProperty(property.name, prop.values[i])
                                break
                            }
                    }

                    //if (property.typeID == DataType.BrickColor) {
                    //    console.log(instance.GetFullName())
                    //    console.log(property.name)
                    //}
                }
            }

            //hierarchy
            for (let i = 0; i < this.prnt.instanceCount; i++) {
                const childReferent = this.prnt.childReferents[i]
                const parentReferent = this.prnt.parentReferents[i]

                const child = referentToInstance.get(childReferent)
                const parent = referentToInstance.get(parentReferent)

                if (!child) {
                    console.warn(`Child with referent ${childReferent} does not exist`)
                    continue;
                }

                if (!parent && parentReferent !== -1) {
                    console.warn(`Parent with referent ${parentReferent} does not exist`)
                    continue;
                }

                if (parentReferent !== -1) {
                    child.setParent(parent)
                } else {
                    child.setParent(this.dataModel)
                }
            }

            this.treeGenerated = true
        } else {
            const xml = new DOMParser().parseFromString(this.xmlString, "text/xml")
            this.fromXML(xml)
        }

        for (const child of this.dataModel.GetDescendants()) {
            child.createWrapper()
        }

        return this.dataModel
    }
}

export function isAffectedByHumanoid(child: Instance) {
    const parent = child.parent
    if (!parent) {
        return false
    }
    if (Object.hasOwn(BodyPartNameToEnum, child.Property("Name") as string)) { //check if part is one of the parts inside an R6 rig affected by humanoids
        if (parent) {
            const humanoid = parent.FindFirstChildOfClass("Humanoid")
            if (humanoid) {
                return true
            }
        }
    }

    return false
}

export function hasSameValFloat(instance0: Instance, instance1: Instance, propertyName: string) {
    return Math.round(instance0.Prop(propertyName) as number * 1000) === Math.round(instance1.Prop(propertyName) as number * 1000)
}

export function hasSameVal(instance0: Instance, instance1: Instance, propertyName: string) {
    return instance0.Prop(propertyName) === instance1.Prop(propertyName)
}

export function isSameColor(color0: Color3, color1: Color3) {
    return Math.round(color0.R * 1000) === Math.round(color1.R * 1000) && Math.round(color0.G * 1000) === Math.round(color1.G * 1000) && Math.round(color0.B * 1000) === Math.round(color1.B * 1000)
}

export function isSameVector3(vec0: Vector3, vec1: Vector3) {
    return Math.round(vec0.X * 1000) === Math.round(vec1.X * 1000) && Math.round(vec0.Y * 1000) === Math.round(vec1.Y * 1000) && Math.round(vec0.Z * 1000) === Math.round(vec1.Z * 1000)
}

export function isSameFloat(num0: number, num1: number) {
    return Math.round(num0 * 100) === Math.round(num1 * 100)
}

// EXAMPLE ON CALCULATING part1 CFRAME FOR MOTOR6D
/*
local part0 = workspace.Torso
local part1 = workspace.Head

local C0 = CFrame.new(0,1,0)
local C1 = CFrame.new(0,-0.5,0)

local transform = CFrame.Angles(-0.5,0,0)

local offset1 = (C1 * transform):Inverse()
part1.CFrame = part0.CFrame * C0 * offset1
*/
/*
let part0Cf = new CFrame()
part0Cf.Position = [0, 1, 1.5]
part0Cf.Orientation = [44.452, 14.625, 6.003]

let C0 = new CFrame(0,1,0)
let C1 = new CFrame(0,-0.5,0)

let transform = new CFrame()
transform.Orientation = [deg(-0.5),deg(0),deg(0)]

let offset1 = C1.multiply(transform).inverse()
console.log(part0Cf.multiply(C0).multiply(offset1))
*/

// EXAMPLE OF GETTING MESH FROM ACCESSORY ID
/*
fetch("https://assetdelivery.roblox.com/v1/asset?id=70794461472608").then((response) => {
    return response.arrayBuffer()
}).then(buffer => {
    let model = new RBX()
    model.fromBuffer(buffer)
    model.generateTree()
    console.log(model)

    let accessory = model.instances[0]
    let handle = accessory.FindFirstChild("Handle")
    let meshIDstr = null
    
    let colorMapIDstr = null
    
    if (handle.className === "MeshPart") {
        meshIDstr = handle.Property("MeshId")

        let surfaceAppearance = handle.FindFirstChild("SurfaceAppearance")
        if (surfaceAppearance) {
            colorMapIDstr = surfaceAppearance.Property("ColorMap")
        } else {
            colorMapIDstr = handle.Property("TextureID")
        }
    } else {
        let specialMesh = handle.FindFirstChild("SpecialMesh")
        meshIDstr = specialMesh.Property("MeshId")
        colorMapIDstr = specialMesh.Property("TextureId")
    }

    let meshId = Number(meshIDstr.match(/\d+(\.\d+)?/g)[0]);

    fetch(`https://assetdelivery.roblox.com/v1/asset?id=${meshId}`).then((response) => {
        return response.arrayBuffer()
    }).then(buffer => {
        let mesh = new FileMesh()
        mesh.fromBuffer(buffer)
        console.log(mesh)
    })

    if (colorMapIDstr.length > 0) {
        let colorMapId = Number(colorMapIDstr.match(/\d+(\.\d+)?/g)[0]);

        console.log(`Fetching colorMap from ${`https://assetdelivery.roblox.com/v1/asset?id=${colorMapId}`}`)
        fetch(`https://assetdelivery.roblox.com/v1/asset?id=${colorMapId}`).then((response) => {
            console.log(response)
        })
    }
})
*/