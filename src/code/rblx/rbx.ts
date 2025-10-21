//https://dom.rojo.space/binary.html

//API DUMP
//https://s3.amazonaws.com/setup.roblox.com/versionQTStudio
//https://s3.amazonaws.com/setup.roblox.com/[VERSION_HERE]-API-Dump.json

import * as THREE from 'three';
import { Buffer } from 'buffer';
import RBXSimpleView from './rbx-simple-view';
import LZ4 from 'lz4';
import { rad, rotationMatrixToEulerAngles } from '../misc/misc';
import { untransformInt32 } from './rbx-read-helper';
import type { Mat4x4, Vec3 } from './mesh';

//datatype structs
export class UDim {
    Scale: number = 0 //Float32
    Offset: number = 0 //Int32
}

export class UDim2 {
    X: UDim = new UDim()
    Y: UDim = new UDim()
}

export class Ray {
    Origin: Vec3 = [0,0,0]
    Direction: Vec3 = [0,0,0]
}

export class Vector3 {
    X: number = 0
    Y: number = 0
    Z: number = 0

    constructor(X: number,Y: number,Z: number) {
        this.X = X
        this.Y = Y
        this.Z = Z
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

    clone() {
        return new Vector3(this.X, this.Y, this.Z)
    }

    static new(X: number,Y: number,Z: number) {
        return new Vector3(X,Y,Z)
    }
}

export class Color3 {
    R: number = 0
    G: number = 0
    B: number = 0
}

export class Color3uint8 {
    R: number = 0
    G: number = 0
    B: number = 0
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

    getMatrix() {
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(this.Orientation[0]), rad(this.Orientation[1]), rad(this.Orientation[2]), "YXZ"))
        const transformMatrix = new THREE.Matrix4().makeTranslation(this.Position[0], this.Position[1], this.Position[2])

        return transformMatrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quat)).toArray()
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

    inverse() { //TODO: check that this is ok (using invert instead of getInverse)
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
}

//hierarchy structs

class Connection {
    Connected = true
    _callback
    _event

    constructor(callback: (...args: unknown[]) => unknown, event: Event) {
        this._callback = callback
        this._event = event
    }

    Disconnect() {
        this.Connected = false
        this._event.Disconnect(this._callback)
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
        this._callbacks = []
    }
}

export class Property {
    name: string | null
    typeID: number | null
    _value?: unknown //only to be changed by setProperty() method of Instance

    constructor(name = null, typeID = null) {
        this.name = name
        this.typeID = typeID
    }

    get value() {
        return this._value
    }
}

function replaceBodyPart(rig, child) {
    let childName = child.Prop("Name")
    let oldBodyPart = rig.FindFirstChild(childName)
    if (oldBodyPart) {
        let motor6ds = rig.GetDescendants()
        for (let motor of motor6ds) {
            if (motor.className === "Motor6D" || motor.className === "Weld") {
                let part0 = motor.Prop("Part0")
                let part1 = motor.Prop("Part1")
                if (part0 && oldBodyPart === part0) {
                    motor.setProperty("Part0", child)
                }
                if (part1 && oldBodyPart === part1) {
                    motor.setProperty("Part1", child)
                }
            }
        }

        let oldMotor6ds = oldBodyPart.GetChildren()
        for (let motor of oldMotor6ds) {
            if (motor.className === "Motor6D") {
                let motorName = motor.Prop("Name")

                let selfMotor = child.FindFirstChild(motorName)
                if (selfMotor) {
                    //if (!selfMotor.Prop("Part0")) {
                    //    selfMotor.setProperty("Part0", motor.Prop("Part0"))
                    //}
                }
            }
        }
        
        oldBodyPart.Destroy()
    }
    child.setParent(rig)
}

export class Instance {
    name //USED TO MAKE VIEWING EASIER
    className
    _properties = new Map()
    _referencedBy = []
    _connectionReferences = []
    children = []
    parent = null
    destroyed = false

    classID //dont use this to identify instance class, it is only used during file loading
    objectFormat //same as above

    ChildAdded = new Event()
    Destroying = new Event()
    Changed = new Event()

    constructor(className) {
        if (!className) {
            throw new Error("Instance was not provided a className")
        }

        this.className = className

        //Setup class logic
        switch(this.className) {
            case "Motor6D":
            case "Weld":
                {
                    let part0ChangedConnection = null
                    let part1ChangedConnection = null

                    function update(self, affectedPart = 1) { //TODO: part1 is not always the part that should be affected, but its difficult to fix without creating an infinite loop
                        //variables/properties
                        if (!self.HasProperty("Part0") || !self.HasProperty("Part1")) return

                        let part0 = null
                        if (self.HasProperty("Part0")) {
                            part0 = self.Property("Part0")
                            if (part0) {
                                if (part0ChangedConnection) {
                                    part0ChangedConnection.Disconnect()
                                    self.removeConnectionReference(part0ChangedConnection)
                                }
                            }
                        }

                        let part1 = null
                        if (self.HasProperty("Part1")) {
                            part1 = self.Property("Part1")
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

                        let C0 = self.Property("C0")
                        let C1 = self.Property("C1")
                        if (!C0 || !C1) {
                            return
                        }

                        let transform = new CFrame()
                        if (self.HasProperty("Transform")) {
                            transform = self.Property("Transform")
                        }

                        //actual calculation
                        if (self.HasProperty("Enabled") && self.Prop("Enabled")) {
                            if (self.parent) {
                                    if (affectedPart === 1) {
                                        if (part0 && part0.HasProperty("CFrame")) {
                                            let part0Cf = part0.Property("CFrame")

                                            let offset1 = C1.multiply(transform).inverse()
                                            let finalCF = part0Cf.multiply(C0).multiply(offset1)

                                            //update part1 position
                                            part1.setProperty("CFrame", finalCF)
                                        } 
                                    } else {
                                        if (part1 && part1.HasProperty("CFrame")) {
                                            let part1Cf = part1.Property("CFrame")

                                            let offset0 = C0.multiply(transform).inverse()
                                            let finalCF = part1Cf.multiply(C1).multiply(offset0)

                                            //update part0 position
                                            part0.setProperty("CFrame", finalCF)
                                        }
                                    }
                                
                            } else {
                                console.warn("Potential memory leak with Motor6D/Weld")
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

                    function setup() {
                        //console.log(this)
                        if (this.className === "Motor6D") {
                            //create transform property
                            let transformProperty = new Property()
                            transformProperty.name = "Transform"
                            transformProperty.typeID = DataType.CFrame
                            
                            this.addProperty(transformProperty)
                            this.setProperty(transformProperty.name, new CFrame())
                        }

                        //add connections
                        let self = this

                        let changedConnection = this.Changed.Connect(() => {
                            update(self)
                        })
                        this.addConnectionReference(changedConnection)
                    }

                    setup.bind(this)()

                    break
                }
        }
    }

    addConnectionReference(connection) {
        if (!this._connectionReferences.includes(connection)) {
            this._connectionReferences.push(connection)
        }
    }

    removeConnectionReference(connection) {
        let index = this._connectionReferences.indexOf(connection)
        if (index !== -1) {
            this._connectionReferences.splice(index,1)
        }
    }

    addReferencedBy(instance) {
        if (!this._referencedBy.includes(instance)) {
            this._referencedBy.push(instance)
        }
    }

    removeReferencedBy(instance) {
        let index = this._referencedBy.indexOf(instance)
        if (index !== -1) {
            let isReferenced = false
            let properties = instance.getPropertyNames()
            for (let prop of properties) {
                if (instance.Prop(prop) === this) {
                    isReferenced = true
                }
            }
            if (!isReferenced) {
                this._referencedBy.splice(index,1)
            }
        }
    }

    addProperty(property, value) {
        if (!this._properties.get(property.name)) {
            this._properties.set(property.name, property)
        }

        if (value) {
            this.setProperty(property.name, value)
        }
    }

    fixPropertyName(name) {
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

    setProperty(name, value) {
        name = this.fixPropertyName(name)

        let property = this._properties.get(name)
        if (property) {
            //special stuff
            if (property.typeID === DataType.Referent && property.value) {
                property.value.removeReferencedBy(this)
            } else if (property.typeID === DataType.CFrame && property.value && value) {
                if (isNaN(value.Position[0]) || isNaN(value.Position[1]) || isNaN(value.Position[2])) {
                    console.log(value)
                    throw new Error("CFrame position can't contain NaN value")
                }
                if (isNaN(value.Orientation[0]) || isNaN(value.Orientation[1]) || isNaN(value.Orientation[2])) {
                    console.log(value)
                    throw new Error("CFrame orientation can't contain NaN value")
                }
            }
            if (property.name === "Name") {
                this.name = value
            }

            property._value = value

            //special stuff
            if (property.typeID === DataType.Referent && property.value) {
                property.value.addReferencedBy(this)
            }
            this.Changed.Fire(name)
        } else {
            console.warn(`Property with name ${name} was not found in ${this.GetFullName()}`)
        }
    }

    HasProperty(name) {
        name = this.fixPropertyName(name)

        return !!(this._properties.get(name))
    }

    Property(name) {
        name = this.fixPropertyName(name)

        if (name == "Position") {
            let cf = this.Prop("CFrame")
            let pos = cf.Position
            return new Vector3(pos[0], pos[1], pos[2])
        }

        if (!this._properties.get(name)) {
            console.log(this)
            throw new Error(`Property: ${name} does not exist`)
        }

        return this._properties.get(name)?.value
    }

    Prop(name) {
        return this.Property(name)
    }

    getPropertyNames() {
        return Array.from(this._properties.keys())
    }

    setParent(instance) {
        if (this.parent) {
            let index = this.parent.children.indexOf(this)
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
        }
    }

    Destroy() {
        //disconnect all connections created by instance
        for (let connection of this._connectionReferences) {
            connection.Disconnect()
        }
        this._connectionReferences = []

        //destroy all children
        for (let child of this.GetChildren()) {
            child.Destroy()
        }

        this.Destroying.Fire(this)

        this.ChildAdded.Clear()
        this.Destroying.Clear()
        this.Changed.Clear()

        this.setParent(null)

        //set all properties to null
        for (let property of this.getPropertyNames()) {
            this.setProperty(property, null)
        }

        //remove all references to instance
        for (let instance of this._referencedBy) {
            for (let propertyName of instance.getPropertyNames()) {
                if (instance.Property(propertyName) === this) {
                    instance.setProperty(propertyName, null)
                }
            }
        }
        this._referencedBy = []

        this.destroyed = true
    }

    GetFullName() {
        if (this.parent && this.parent.className !== "DataModel") {
            return this.parent.GetFullName() + "." + this.name
        } else {
            return this.name
        }
    }

    GetChildren() { //It is done like this so setting parents doesnt mess up the list
        let childrenList = []

        for (let child of this.children) {
            childrenList.push(child)
        }

        return childrenList
    }

    GetDescendants() {
        let descendants = this.children

        for (let child of this.children) {
            descendants = descendants.concat(child.GetDescendants())
        }

        return descendants
    }

    FindFirstChild(name) {
        for (let child of this.GetChildren()) {
            if (child.Property("Name") == name) {
                return child
            }
        }
    }

    FindFirstDescendant(name) {
        for (let child of this.GetDescendants()) {
            if (child.Property("Name") == name) {
                return child
            }
        }
    }

    Child(name) {
        return this.FindFirstChild(name)
    }

    FindFirstChildOfClass(className) {
        for (let child of this.children) {
            if (child.className == className) {
                return child
            }
        }
    }

    AccessoryBuildWeld() {
        if (this.className === "Accessory") { //create accessory weld TODO: making the part0/C0 and part1/C1 accurate (0 = hat, 1 = body) would be good, probably
            let humanoid = this.parent.FindFirstChildOfClass("Humanoid")

            if (humanoid) {
                let handle = this.FindFirstChild("Handle")
                if (handle) {
                    let accessoryAttachment = handle.FindFirstChildOfClass("Attachment")
                    let bodyAttachment = null
                    let bodyDescendants = this.parent.GetDescendants()
                    for (let child of bodyDescendants) {
                        if (child.className === "Attachment" && child.Property("Name") === accessoryAttachment.Property("Name") && child.parent && child.parent.parent === this.parent) {
                            bodyAttachment = child
                        }
                    }

                    if (!bodyAttachment) {
                        return
                    }

                    if (handle.FindFirstChild("AccessoryWeld")) {
                        handle.Child("AccessoryWeld").Destroy()
                    }

                    let weld = new Instance("Weld")

                    weld.addProperty(new Property("Name", DataType.String), "AccessoryWeld")
                    weld.addProperty(new Property("Archivable", DataType.Bool), true)
                    weld.addProperty(new Property("C1", DataType.CFrame), accessoryAttachment.Property("CFrame").clone())
                    weld.addProperty(new Property("C0", DataType.CFrame), bodyAttachment.Property("CFrame").clone())
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
    classID //u32
    className //string
    objectFormat //u8
    instanceCount //u32
    referents //i32[]
}

class PROP {
    classID //u32
    propertyName //string
    typeID //u8
    values = []
}

class PRNT {
    instanceCount = 0
    childReferents = []
    parentReferents = []
}

export class RBX {

    classCount = 0 //i32
    instanceCount = 0 //i32

    meta = new Map() //Map<string,string>
    sstr = new Map() //Map<MD5,string>
    instArray = [] //INST[]
    propArray = [] //PROP[]
    prnt = new PRNT() //PRNT

    //not based on file format
    classIDtoINST = new Map()
    dataModel = new Instance("DataModel")
    treeGenerated = false

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

        this.classCount = new Map()

        this.classIDtoINST = new Map()

        this.dataModel = new Instance("DataModel")
        this.dataModel.name = "root"
        this.dataModel.classID = -1 //TODO: is this true? a bit hard to test
        this.dataModel.objectFormat = 0
    }

    async fromOutfit(outfit) {
        let outfitStartTime = performance.now()

        let buffer = await GetAsset(`/assets/Rig${outfit.playerAvatarType}.rbxm`)

        this.fromBuffer(buffer)
        this.generateTree()
        console.log(this)

        let rig = this.dataModel.FindFirstChildOfClass("Model")
        rig.setProperty("Name", outfit.name)

        //assets
        let assetPromises = []

        for (let asset of outfit.assets) {
            let assetTypeName = asset.assetType.name
            assetPromises.push(new Promise(async (resolve, reject) => {
                switch (assetTypeName) {
                    case "TShirt":
                    case "Shirt":
                    case "Pants":
                    case "Face":

                    case "Hat":
                    case "HairAccessory":
                    case "FaceAccessory":
                    case "NeckAccessory":
                    case "ShoulderAccessory":
                    case "FrontAccessory":
                    case "BackAccessory":
                    case "WaistAccessory":
                    case "TShirtAccessory":
                    case "ShirtAccessory":
                    case "PantsAccessory":
                    case "JacketAccessory":
                    case "SweaterAccessory":
                    case "ShortsAccessory":
                    case "LeftShoeAccessory":
                    case "RightShoeAccessory":
                    case "DressSkirtAccessory":
                    case "EyebrowAccessory":
                    case "EyelashAccessory":
                        {
                            let headers = null

                            if (outfit.playerAvatarType === AvatarType.R15 && !["TShirt","Shirt","Pants","Face"].includes(assetTypeName)) {
                                headers = {"Roblox-AssetFormat":"avatar_meshpart_accessory"}
                            }

                            let buffer = await GetAsset("https://assetdelivery.roblox.com/v1/asset?id=" + asset.id, headers)

                            let clothingRBX = new RBX()
                            try {
                                clothingRBX.fromBuffer(buffer)
                                clothingRBX.generateTree()

                                let assetInstance = clothingRBX.dataModel.GetChildren()[0]
                                if (assetInstance.className === "Decal") {
                                    let rigHead = rig.FindFirstChild("Head")
                                    if (rigHead) {
                                        let rigFace = rigHead.FindFirstChildOfClass("Decal")
                                        if (rigFace) {
                                            rigFace.Destroy()
                                        }

                                        assetInstance.setParent(rigHead)
                                    }
                                } else {
                                    let isLayered = false
                                    let handle = assetInstance.FindFirstChild("Handle")
                                    if (handle) {
                                        isLayered = !!handle.FindFirstChildOfClass("WrapLayer")
                                    }

                                    if (!isLayered || outfit.playerAvatarType === AvatarType.R15) {
                                        assetInstance.setParent(rig)
                                    }
                                }
                            } catch (error) {
                                console.warn(error)
                            }
                            

                            break
                        }
                    case "Torso":
                    case "LeftLeg":
                    case "RightLeg":
                    case "LeftArm":
                    case "RightArm":
                        {
                            let buffer = await GetAsset("https://assetdelivery.roblox.com/v1/asset?id=" + asset.id)

                            let bodyPartRBX = new RBX()
                            bodyPartRBX.fromBuffer(buffer)
                            bodyPartRBX.generateTree()

                            if (outfit.playerAvatarType === AvatarType.R6) {
                                let R6Folder = bodyPartRBX.dataModel.FindFirstChild("R6")
                                if (R6Folder) {
                                    let characterMesh = R6Folder.FindFirstChildOfClass("CharacterMesh")
                                    if (characterMesh) {
                                        characterMesh.setParent(rig)
                                    }
                                }
                            } else {
                                //TODO: R15 body parts
                                let R15Folder = bodyPartRBX.dataModel.FindFirstChild("R15ArtistIntent")
                                if (!R15Folder || R15Folder.GetChildren().length === 0) {
                                    R15Folder = bodyPartRBX.dataModel.FindFirstChild("R15Fixed")
                                }

                                if (R15Folder) { //TODO: make this more reliable (is this still a TODO? pretty sure i fixed it...)
                                    let children = R15Folder.GetChildren()
                                    for (let child of children) {
                                        replaceBodyPart(rig, child)
                                    }
                                }
                            }

                            break
                        }
                    case "Head":
                    case "DynamicHead":
                        {
                            if (outfit.playerAvatarType === AvatarType.R6) {
                                let buffer = await GetAsset("https://assetdelivery.roblox.com/v1/asset?id=" + asset.id)

                                let headRBX = new RBX()
                                headRBX.fromBuffer(buffer)
                                headRBX.generateTree()

                                let headMesh = headRBX.dataModel.FindFirstChildOfClass("SpecialMesh")
                                if (headMesh) {
                                    let bodyHeadMesh = rig.FindFirstChild("Head").FindFirstChildOfClass("SpecialMesh")
                                    if (bodyHeadMesh) {
                                        bodyHeadMesh.Destroy()
                                    }

                                    headMesh.setParent(rig.FindFirstChild("Head"))
                                }
                            } else {
                                let buffer = await GetAsset("https://assetdelivery.roblox.com/v1/asset?id=" + asset.id, {"Roblox-AssetFormat":"avatar_meshpart_head"})

                                let ogHead = rig.FindFirstChild("Head")
                                let ogFace = null

                                if (ogHead) {
                                    ogFace = ogHead.FindFirstChildOfClass("Decal")
                                    ogFace.setParent(null)
                                }

                                let headRBX = new RBX()
                                headRBX.fromBuffer(buffer)
                                headRBX.generateTree()

                                let head = headRBX.dataModel.FindFirstChildOfClass("MeshPart")

                                if (head) {
                                    replaceBodyPart(rig, head)
                                }

                                let currentHead = rig.FindFirstChild("Head")
                                if (currentHead && ogFace) {
                                    let currentHeadFace = currentHead.FindFirstChildOfClass("Decal")
                                    if (currentHeadFace) {
                                        currentHeadFace.Destroy()
                                    }

                                    ogFace.setParent(currentHead)
                                }

                                /*//TODO: make sizing accurate
                                let head = rig.FindFirstChild("Head")
                                head.setProperty("MeshId", headMesh.Prop("MeshId"))
                                head.setProperty("TextureID", headMesh.Prop("TextureId"))

                                console.log(head.Prop("MeshId"))
                                let fetchStr = parseAssetString(head.Prop("MeshId"))

                                let buffer = await GetAsset(fetchStr)
                                let mesh = new FileMesh()
                                mesh.fromBuffer(buffer)

                                let meshSize = new Vector3(mesh.size[0], mesh.size[1], mesh.size[2])
                                let originalSize = head.FindFirstChild("OriginalSize")
                                if (originalSize) {
                                    originalSize.setProperty("Value", meshSize)
                                }
                                head.setProperty("Size", meshSize)

                                let scaleType = headMesh.FindFirstChild("AvatarPartScaleType")
                                if (scaleType) {
                                    let oldScaleType = head.FindFirstChild("AvatarPartScaleType")
                                    if (oldScaleType) {
                                        oldScaleType.Destroy()
                                    }
                                    scaleType.setParent(head)
                                }

                                for (let child of headMesh.GetChildren()) {
                                    if (child.Prop("Name").endsWith("Attachment")) {
                                        console.log(child)
                                        let realChild = rig.Child("Head").FindFirstChild(child.Prop("Name"))
                                        let ogCF = realChild.Prop("CFrame").clone()
                                        let pos = child.Prop("Value")
                                        ogCF.Position = [pos.X, pos.Y, pos.Z]
                                        realChild.setProperty("CFrame", ogCF)

                                        let originalPosition = realChild.FindFirstChild("OriginalPosition")
                                        if (originalPosition) {
                                            originalPosition.setProperty("Value", new Vector3(pos.X, pos.Y, pos.Z))
                                        }
                                    }
                                }*/
                            }

                            break
                        }
                    default:
                        {
                            console.warn("Unsupported assetType: " + assetTypeName)
                            break
                        }
                }

                resolve()
            }))
        }

        await Promise.all(assetPromises)

        //body colors
        let bodyColors = outfit.bodyColors
        if (bodyColors.colorType === "BrickColor") {
            bodyColors = bodyColors.toColor3()
        }

        //TODO: also change humanoid description and bodycolors instance
        let limbs = [["headColor3","Head"],["torsoColor3","Torso"],["rightArmColor3","Right Arm"],["leftArmColor3", "Left Arm"],["rightLegColor3", "Right Leg"],["leftLegColor3", "Left Leg"]]
        if (outfit.playerAvatarType === AvatarType.R15) {
            limbs = [
                ["headColor3","Head"],
                ["torsoColor3","UpperTorso"],["torsoColor3","LowerTorso"],
                ["rightArmColor3","RightUpperArm"],["rightArmColor3","RightLowerArm"],["rightArmColor3","RightHand"],
                ["leftArmColor3","LeftUpperArm"],["leftArmColor3","LeftLowerArm"],["leftArmColor3","LeftHand"],
                ["rightLegColor3", "RightUpperLeg"],["rightLegColor3", "RightLowerLeg"],["rightLegColor3", "RightFoot"],
                ["leftLegColor3", "LeftUpperLeg"],["leftLegColor3", "LeftLowerLeg"],["leftLegColor3", "LeftFoot"],
            ]
        }
        for (let limbData of limbs) {
            let colorName = limbData[0]
            let limbName = limbData[1]

            let colorRGB = hexToRgb(bodyColors[colorName])
            let color3uint8 = new Color3uint8()
            color3uint8.R = colorRGB.r * 255
            color3uint8.G = colorRGB.g * 255
            color3uint8.B = colorRGB.b * 255

            let limb = rig.FindFirstChild(limbName)
            if (limb) {
                limb.setProperty("Color", color3uint8)
            }
        }

        //default clothing
        if (!rig.FindFirstChildOfClass("Pants")) {
            let minimumDeltaEBodyColorDifference = 11.4

            let torsoColor = hexToRgb(bodyColors.torsoColor3)
            let leftLegColor = hexToRgb(bodyColors.leftLegColor3)
            let rightLegColor = hexToRgb(bodyColors.rightLegColor3)

            let minDeltaE = Math.min(delta_CIEDE2000(torsoColor, leftLegColor), delta_CIEDE2000(torsoColor, rightLegColor))

            console.log(minDeltaE)

            if (minDeltaE <= minimumDeltaEBodyColorDifference) { //apply default clothing
                let defaultShirtAssetIds = [
                    855776101,
                    855759986,
                    855766170,
                    855777285,
                    855768337,
                    855779322,
                    855773572,
                    855778082
                ]
                let defaultPantAssetIds = [
                    867813066,
                    867818313,
                    867822311,
                    867826313,
                    867830078,
                    867833254,
                    867838635,
                    867842477
                ]

                let defaultClothesIndex = Number(outfit.creatorId || 1) % defaultShirtAssetIds.length

                //create default pants
                let pants = new Instance("Pants")
                pants.addProperty(new Property("Name", DataType.String), "Pants")
                pants.addProperty(new Property("PantsTemplate", DataType.String), "rbxassetid://" + defaultPantAssetIds[defaultClothesIndex])
                pants.setParent(rig)

                //create default shirt
                if (!rig.FindFirstChildOfClass("Shirt")) {
                    let shirt = new Instance("Shirt")
                    shirt.addProperty(new Property("Name", DataType.String), "Shirt")
                    shirt.addProperty(new Property("ShirtTemplate", DataType.String), "rbxassetid://" + defaultShirtAssetIds[defaultClothesIndex])
                    shirt.setParent(rig)
                }
            }
        }

        //apply scale
        let scaleInfo = null

        if (outfit.playerAvatarType === AvatarType.R15) {
            scaleInfo = ScaleCharacter(rig, outfit)
        } else {
            let children = rig.GetChildren()
            for (let child of children) {
                if (child.className === "Accessory") {
                    //BUG: Roblox scales accessories even in R6, it's also inconsistent and sometimes some accessories may not be scaled
                    ScaleAccessory(child, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig)
                }
            }
        }

        //align feet with ground
        if (scaleInfo) {
            let hrp = rig.FindFirstChild("HumanoidRootPart")
            let cf = hrp.Prop("CFrame").clone()
            cf.Position[1] = scaleInfo.stepHeight + hrp.Prop("Size").Y / 2
            hrp.setProperty("CFrame", cf)
        }

        //recalculate motor6ds
        for (let child of rig.GetDescendants()) {
            if (child.className === "Motor6D" || child.className === "Weld") {
                child.setProperty("C0", child.Prop("C0"))
            }
        }

        //scale accessories
        /*
        let children = rig.GetChildren()
        console.log(children)
        
        for (let child of children) {
            if (child.className === "Accessory") {
                if (outfit.playerAvatarType === AvatarType.R6) {
                    //BUG: Roblox scales accessories even in R6, it's also inconsistent and sometimes some accessories may not be scaled
                    ScaleAccessory(child, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig)
                } else {
                    let bodyScale = new Vector3(outfit.scale.width, outfit.scale.height, outfit.scale.depth)
                    let headScale = new Vector3(outfit.scale.head, outfit.scale.head, outfit.scale.head)

                    //ScaleAccessory(child, bodyScale, headScale, outfit.scale.bodyType, outfit.scale.proportion, rig)
                }
            }
        }
        */

        /*let currentAnimationIndex = 0

        let animationIds = [
            507765644, //climb
            507772104, //dance
            913376220, //run
            913384386, //swim
            913402848, //walk
            //507766388, //idle
            //10214311282, //https://www.roblox.com/catalog/10214406616/Frosty-Flair-Tommy-Hilfiger
            //10714340543, //https://www.roblox.com/catalog/5917570207/Floss-Dance
            //10714369624, //https://www.roblox.com/catalog/3696757129/Hype-Dance
            //17684199561, //big bad wolf
        ]

        if (outfit.playerAvatarType === AvatarType.R6) {
            animationIds = [
                180436334, //climb
                182436935, //dance3[0]
                182436842, //dance2[0]
                182435998, //dance1[0] (gangnam style)
                180426354, //run
            ]
        }

        let animationTracks = []

        let animationPromises = []

        for (let id of animationIds) {
            animationPromises.push(new Promise((resolve, reject) => {
                fetch("https://assetdelivery.roblox.com/v1/asset?id=" + id).then((response) => {
                    return response.arrayBuffer()
                }).then(buffer => {

                    let rbx = new RBX()
                    rbx.fromBuffer(buffer)
                    console.log(rbx.generateTree())

                    let animationTrack = new AnimationTrack()
                    animationTrack.loadAnimation(rig, rbx.dataModel.GetChildren()[0])
                    animationTrack.looped = true
                    animationTracks.push(animationTrack)
                    
                    console.log(animationTrack)

                    resolve()
                })
            }))
        }

        let animationTotalTime = 5
        let animationTransitionTime = 0.5

        Promise.all(animationPromises).then(() => {
            function updateTrack(startTime, lastAnimationSwitch) {
                let nextAnimationIndex = (currentAnimationIndex + 1) % animationIds.length

                let animationTrack = animationTracks[currentAnimationIndex]
                let nextAnimationTrack = animationTracks[nextAnimationIndex]

                let newTime = performance.now() / 1000

                let playedTime = newTime - lastAnimationSwitch
                let firstHalfTime = animationTotalTime - animationTransitionTime

                nextAnimationTrack.weight = Math.max(0, playedTime - firstHalfTime) / animationTransitionTime
                animationTrack.weight = 1 - nextAnimationTrack.weight
                nextAnimationTrack.weight *= 1
                animationTrack.weight *= 1
                
                //console.log("----")
                //console.log(animationTrack.weight)
                animationTrack.resetMotorTransforms()
                animationTrack.setTime((newTime - startTime))
                nextAnimationTrack.setTime((newTime - startTime))

                //recalculate motor6ds
                for (let child of rig.GetDescendants()) {
                    if (child.className === "Motor6D") {
                        child.setProperty("Transform", child.Prop("Transform"))
                    } else if (child.className === "Weld") {
                        child.setProperty("C0", child.Prop("C0"))
                    }
                }

                if (newTime - lastAnimationSwitch > animationTotalTime) {
                    currentAnimationIndex++
                    currentAnimationIndex = currentAnimationIndex % animationIds.length
                    lastAnimationSwitch = performance.now() / 1000
                }

                setTimeout(() => {
                    updateTrack(startTime, lastAnimationSwitch)
                }, 1000 / 60 - 1)
            }

            let lastAnimationSwitch = performance.now() / 1000
            updateTrack(performance.now() / 1000, lastAnimationSwitch)
        })*/

        console.log(`Loaded outfit after ${performance.now() - outfitStartTime}`)
        console.log(this)
        return this
    }

    readMETA(chunkView) {
        let entriesCount = chunkView.readUint32()
        for (let i = 0; i < entriesCount; i++) {
            let metaKey = chunkView.readUtf8String()
            let metaValue = chunkView.readUtf8String()

            this.meta.set(metaKey, metaValue)
        }
    }

    readSSTR(chunkView) {
        let version = chunkView.readUint32() //always 0
        if (version !== 0) {
            throw new Error("Unexpected SSTR version")
        }

        let sharedStringCount = chunkView.readUint32()
        for (let i = 0; i < sharedStringCount; i++) {
            let md5 = [chunkView.readUint32(), chunkView.readUint32(), chunkView.readUint32(), chunkView.readUint32()]
            let str = chunkView.readUtf8String()

            this.sstr.set(md5, str)
        }
    }

    readINST(chunkView) {
        let inst = new INST()

        inst.classID = chunkView.readUint32()
        inst.className = chunkView.readUtf8String()
        inst.objectFormat = chunkView.readUint8()
        inst.instanceCount = chunkView.readUint32()
        let referents = readReferents(inst.instanceCount, chunkView)
        inst.referents = referents
        //servicemarkes could be read here but is useless and a waste of time

        this.instArray.push(inst)
        this.classIDtoINST.set(inst.classID, inst)
    }

    readPROP(chunkView) {
        let prop = new PROP()
        prop.classID = chunkView.readUint32()
        prop.propertyName = chunkView.readUtf8String()
        prop.typeID = chunkView.readUint8()

        //read values
        let valuesLength = this.classIDtoINST.get(prop.classID).instanceCount

        switch (prop.typeID) {
            case DataType.String:
                {
                    let totalRead = 0
                    while (totalRead < valuesLength) {
                        prop.values.push(chunkView.readUtf8String())
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
                    let nums = chunkView.readInterleaved32(valuesLength, false)
                    //untransform
                    for (let i = 0; i < nums.length; i++) {
                        nums[i] = untransformInt32(nums[i])
                        prop.values.push(nums[i])
                    }
                    
                    break
                }
            case DataType.Float32:
                {
                    let nums = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    
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
                    let scales = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let offsets = chunkView.readInterleaved32(valuesLength, false)

                    for (let i = 0; i < valuesLength; i++) {
                        let udim = new UDim()
                        udim.Scale = scales[i]
                        udim.Offset = untransformInt32(offsets[i])
                        prop.values.push(udim)
                    }

                    break
                }
            case DataType.UDim2:
                {
                    let scalesX = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let scalesY = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let offsetsX = chunkView.readInterleaved32(valuesLength, false)
                    let offsetsY = chunkView.readInterleaved32(valuesLength, false)

                    for (let i = 0; i < valuesLength; i++) {
                        let udim = new UDim2()
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
                        let ray = new Ray()
                        ray.Origin = [chunkView.readNormalFloat32(), chunkView.readNormalFloat32(), chunkView.readNormalFloat32()]
                        ray.Direction = [chunkView.readNormalFloat32(), chunkView.readNormalFloat32(), chunkView.readNormalFloat32()]
                        prop.values.push(ray)
                    }
                    break
                }
            case DataType.BrickColor:
                {
                    let values = chunkView.readInterleaved32(valuesLength, false, "readUint32")
                    for (let value of values) {
                        prop.values.push(value)
                    }
                    break
                }
            case DataType.Color3: //TODO: NOT TESTED
                {
                    let xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")

                    for (let i = 0; i < valuesLength; i++) {
                        let vector3 = new Color3()
                        vector3.R = xValues[i]
                        vector3.G = yValues[i]
                        vector3.B = zValues[i]
                        prop.values.push(vector3)
                    }
                    break
                }
            case DataType.Vector3:
                {
                    let xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")

                    for (let i = 0; i < valuesLength; i++) {
                        let vector3 = new Vector3()
                        vector3.X = xValues[i]
                        vector3.Y = yValues[i]
                        vector3.Z = zValues[i]
                        prop.values.push(vector3)
                    }
                    break
                }
            case DataType.CFrame:
                {
                    let cframes = []

                    for (let i = 0; i < valuesLength; i++) { //rotation array
                        let cframe = new CFrame()

                        let id = chunkView.readUint8()
                        if (id === 0) {
                            let matrix = new Array(9)
                            for (let x = 0; x < 3; x++) {
                                for (let y = 0; y < 3; y++) {
                                    matrix[x + y*3] = chunkView.readNormalFloat32()
                                }
                            }

                            cframe.Orientation = rotationMatrixToEulerAngles(matrix)
                            //cframe.Orientation[3] = matrix
                        } else {
                            cframe.Orientation = { //TODO: double check this
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
                            }[id]
                        }

                        cframes.push(cframe)
                    }

                    let xValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let yValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")
                    let zValues = chunkView.readInterleaved32(valuesLength, false, "readFloat32")

                    for (let i = 0; i < valuesLength; i++) {
                        cframes[i].Position = [xValues[i], yValues[i], zValues[i]]
                        prop.values.push(cframes[i])
                    }
                    break
                }
            case DataType.Enum: //TODO: NOT TESTED
                {
                    let values = chunkView.readInterleaved32(valuesLength, false, "readUint32")

                    for (let val of values) {
                        prop.values.push(val)
                    }
                    break
                }
            case DataType.Referent: //Note: Referents become native references when tree is generated
                {
                    let referents = readReferents(valuesLength, chunkView)

                    for (let referent of referents) {
                        prop.values.push(referent)
                    }
                    break
                }
            case DataType.Color3uint8: //TODO: NOT TESTED
                {
                    let rs = []
                    let gs = []

                    for (let i = 0; i < valuesLength; i++) {
                        rs.push(chunkView.readUint8())
                    }
                    for (let i = 0; i < valuesLength; i++) {
                        gs.push(chunkView.readUint8())
                    }
                    for (let i = 0; i < valuesLength; i++) {
                        let color = new Color3uint8()
                        color.R = rs[i]
                        color.G = gs[i]
                        color.B = chunkView.readUint8()

                        prop.values.push(color)
                    }
                    break
                }
            case DataType.Int64:
                {
                    let nums = chunkView.readInterleaved32(valuesLength, false, "readInt64", 8)
                    //untransform
                    for (let i = 0; i < nums.length; i++) {
                        nums[i] = untransformInt64(nums[i])
                        prop.values.push(nums[i])
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

    readPRNT(chunkView) {
        let version = chunkView.readUint8()
        if (version !== 0) {
            throw new Error("Unexpected PRNT version")
        }

        let prnt = new PRNT()

        prnt.instanceCount = chunkView.readUint32()
        prnt.childReferents = readReferents(prnt.instanceCount, chunkView)
        prnt.parentReferents = readReferents(prnt.instanceCount, chunkView)
        this.prnt = prnt
    }

    getChunkBuffer(view, compressedLength, uncompressedLength) {
        //compressed
        if (compressedLength !== 0) {
            let isZSTD = view.readUint32() == 4247762216
            view.viewOffset -= 4
            let isLZ4 = !isZSTD

            if (isZSTD) { //ZSTD
                throw new Error("Compressed data is ZSTD") //TODO: implement
            } else if (isLZ4) { //LZ4
                let uncompressed = Buffer.alloc(uncompressedLength)

                let compressedByteArray = view.buffer.slice(view.viewOffset, view.viewOffset + compressedLength)
                let compressedIntArray = new Uint8Array(compressedByteArray)

                let uncompressedSize = LZ4.decodeBlock(compressedIntArray, uncompressed)
                
                return uncompressed.buffer
            }
        }

        //uncompressed
        return view.buffer.slice(view.viewOffset, view.viewOffset + uncompressedLength)
    }

    addItem(item, itemParent) {
        let instance = new Instance(item.getAttribute("class"))

        let properties = item.querySelectorAll(":scope > Properties > *")
        for (let propertyNode of properties) {
            switch (propertyNode.nodeName) {
                case "Content":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.String

                        instance.addProperty(property)

                        let childElement = propertyNode.querySelector(":scope > *")

                        if (childElement.nodeName === "null") {
                            instance.setProperty(property.name, "")
                        } else {
                            instance.setProperty(property.name, childElement.textContent)
                        }
                        break
                    }
                case "string":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.String

                        instance.addProperty(property)
                        instance.setProperty(property.name, propertyNode.textContent)
                        break
                    }
                case "bool":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.String

                        instance.addProperty(property)
                        instance.setProperty(property.name, propertyNode.textContent.toLowerCase() === "true")
                        break
                    }
                case "CoordinateFrame":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.CFrame

                        instance.addProperty(property)

                        let cframeDesc = {}

                        let childElements = propertyNode.querySelectorAll(":scope > *")

                        let cframe = new CFrame()
                        for (let element of childElements) {
                            cframeDesc[element.nodeName] = Number(element.textContent)
                        }

                        let matrix = new Array(9)
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
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.Vector3

                        instance.addProperty(property)

                        let childElements = propertyNode.querySelectorAll(":scope > *")

                        let position = new Vector3()
                        for (let element of childElements) {
                            position[element.nodeName] = Number(element.textContent)
                        }

                        instance.setProperty(property.name, position)

                        break
                    }
                case "token":
                    {
                        let property = new Property()
                        property.name = propertyNode.getAttribute("name")
                        property.typeID = DataType.Enum

                        instance.addProperty(property)
                        instance.setProperty(property.name, Number(propertyNode.textContent))

                        break
                    }
                case "Color3uint8":
                    {
                        let color3uint8 = new Color3uint8()

                        let intColor = Number(propertyNode.textContent)
                        let colorRGB = intToRgb(intColor)
                        color3uint8.R = colorRGB.R
                        color3uint8.G = colorRGB.G
                        color3uint8.B = colorRGB.B

                        instance.addProperty(new Property(propertyNode.getAttribute("name"), DataType.Color3uint8), color3uint8)
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

    fromXML(xml) { //TODO: figure out how to do this accurately https://dom.rojo.space/xml.html
        console.warn("Parsing RBX xml file, the result may not be accurate")
        //console.log(xml)

        let currentItems = xml.querySelectorAll(":scope > Item")
        while (currentItems.length > 0) {
            let newCurrentItems = []

            for (let item of currentItems) {
                let instance = this.addItem(item, item.itemParent)
                let itemChildren = item.querySelectorAll(":scope > Item")
                for (let itemChild of itemChildren) {
                    itemChild.itemParent = instance
                    newCurrentItems.push(itemChild)
                }
            }

            currentItems = newCurrentItems
        }

        this.treeGenerated = true
    }

    fromBuffer(buffer) {
        this.reset()

        let view = new RBXSimpleView(buffer)

        // FILE HEADER

        //verify magic
        let readMagic = view.readUtf8String(magic.length)
        if (readMagic !== magic) {
            if (readMagic === xmlMagic) {
                let xmlString = new TextDecoder("utf-8").decode(buffer)
                let xml = new DOMParser().parseFromString(xmlString, "text/xml")
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
            let chunkName = view.readUtf8String(4)
            let compressedLength = view.readUint32()
            let uncompressedLength = view.readUint32()

            view.viewOffset += 4 //skip unused

            let chunkBuffer = this.getChunkBuffer(view, compressedLength, uncompressedLength)

            view.lock()

            let chunkView = new RBXSimpleView(chunkBuffer)

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

    async fromAssetId(id) { //Return: dataModel | null
        let buffer = await GetAsset("https://assetdelivery.roblox.com/v1/asset?id=" + id)

        this.fromBuffer(buffer)
        this.generateTree()

        return this.dataModel
        
        return null
    }

    generateTree() {
        if (this.treeGenerated) {
            console.warn("Tree already generated")
            return
        }

        let referentToInstance = new Map() //<referent,instance>

        //instances
        for (let inst of this.instArray) {
            for (let i = 0; i < inst.instanceCount; i++) {
                let instance = new Instance(inst.className)
                instance.classID = inst.classID
                instance.objectFormat = inst.objectFormat

                if (referentToInstance.get(inst.referents[i])) {
                    throw new Error(`Duplicate referent ${inst.referents[i]}`)
                }
                referentToInstance.set(inst.referents[i], instance)
            }
        }

        //properties
        for (let prop of this.propArray) {
            let inst = this.classIDtoINST.get(prop.classID)
            for (let i = 0; i < inst.referents.length; i++) {
                let referent = inst.referents[i]
                let instance = referentToInstance.get(referent)

                let property = new Property()
                property.name = prop.propertyName
                property.typeID = prop.typeID
                
                instance.addProperty(property)
                switch (property.typeID) {
                    case DataType.Referent:
                        {
                            let referenced = referentToInstance.get(prop.values[i])
                            instance.setProperty(property.name, referenced)
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
            let childReferent = this.prnt.childReferents[i]
            let parentReferent = this.prnt.parentReferents[i]

            let child = referentToInstance.get(childReferent)
            let parent = referentToInstance.get(parentReferent)

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
        return this.dataModel
    }
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

export { ScaleCharacter, ScaleAccessory }