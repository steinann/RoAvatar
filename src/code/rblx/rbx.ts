//https://dom.rojo.space/binary.html

//API DUMP
//https://s3.amazonaws.com/setup.roblox.com/versionQTStudio
//https://s3.amazonaws.com/setup.roblox.com/[VERSION_HERE]-API-Dump.json

import * as THREE from 'three';
import { Buffer } from 'buffer';
import { LZ4 } from "lz4";

const magic = "<roblox!"
const xmlMagic = "<roblox "

var LZ4 = require('lz4')

function convert_byte_array_to_int_array(array) {
     let output_array = [];
     for (byte of array) {
        output_array.push(parseInt(byte, 16));
     }
     return output_array;
}

function untransformInt32(num) {
    if (num % 2 === 0) {
        num /= 2
    } else {
        num = -(num + 1) / 2
    }

    return num
}

function untransformInt64(num) {
    if (num % 2n === 0n) {
        num /= 2n
    } else {
        num = -(num + 1n) / 2n
    }

    return num
}

function readReferents(length, chunkView) {
    let referents = chunkView.readInterleaved32(length, false)
    let lastReferent = 0
    //untransform
    for (let i = 0; i < referents.length; i++) {
        referents[i] = untransformInt32(referents[i])
    }

    //acummalative process
    for (let i = 0; i < referents.length; i++) {
        referents[i] = referents[i] + lastReferent
        lastReferent = referents[i]
    }

    return referents
}

function intToRgb(colorInt) {
  const R = (colorInt >> 16) & 0xFF; // Extract red component
  const G = (colorInt >> 8) & 0xFF;  // Extract green component
  const B = colorInt & 0xFF;         // Extract blue component

  return { R, G, B };
}

function toDegrees(radians) {
    return radians * 180 / Math.PI
}

function toRadians(degrees) {
    return degrees / 180 * Math.PI
}

window.deg = toDegrees
window.rad = toRadians

function rotationMatrixToEulerAnglesOLD(R) { //https://learnopencv.com/rotation-matrix-to-euler-angles/
    sy = Math.sqrt(R[0 + 0*3] * R[0 + 0*3] +  R[1 + 0*3] * R[1 + 0*3])
 
    singular = sy < 1e-6
 
    if (!singular) {
        y = -Math.atan2(R[2 + 1*3] , R[2 + 2*3])
        x = -Math.atan2(-R[2 + 0*3], sy)
        z = Math.atan2(R[1 + 0*3], R[0 + 0*3])
    } else {
        x = Math.atan2(-R[1 + 2*3], R[1 + 1*3])
        y = Math.atan2(-R[2 + 0*3], sy)
        z = 0
    }
 
    return [toDegrees(x), toDegrees(y), toDegrees(z), singular]
}

function specialClamp( value, min, max ) {
    return Math.max( min, Math.min( max, value ) );
}

function rotationMatrixToEulerAngles(te, order = "YXZ") { //from THREE.js
    const clamp = specialClamp;

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    const m11 = te[ 0 ], m12 = te[ 3 ], m13 = te[ 6 ];
    const m21 = te[ 1 ], m22 = te[ 4 ], m23 = te[ 7 ];
    const m31 = te[ 2 ], m32 = te[ 5 ], m33 = te[ 8 ];

    let x = 0
    let y = 0
    let z = 0

    switch ( order ) {

        case 'XYZ':

            y = Math.asin( clamp( m13, - 1, 1 ) );

            if ( Math.abs( m13 ) < 0.9999999 ) {

                x = Math.atan2( - m23, m33 );
                z = Math.atan2( - m12, m11 );

            } else {

                x = Math.atan2( m32, m22 );
                z = 0;

            }

            break;

        case 'YXZ':

            x = Math.asin( - clamp( m23, - 1, 1 ) );

            if ( Math.abs( m23 ) < 0.9999999 ) {

                y = Math.atan2( m13, m33 );
                z = Math.atan2( m21, m22 );

            } else {

                y = Math.atan2( - m31, m11 );
                z = 0;

            }

            break;

        case 'ZXY':

            x = Math.asin( clamp( m32, - 1, 1 ) );

            if ( Math.abs( m32 ) < 0.9999999 ) {

                y = Math.atan2( - m31, m33 );
                z = Math.atan2( - m12, m22 );

            } else {

                y = 0;
                z = Math.atan2( m21, m11 );

            }

            break;

        case 'ZYX':

            y = Math.asin( - clamp( m31, - 1, 1 ) );

            if ( Math.abs( m31 ) < 0.9999999 ) {

                x = Math.atan2( m32, m33 );
                z = Math.atan2( m21, m11 );

            } else {

                x = 0;
                z = Math.atan2( - m12, m22 );

            }

            break;

        case 'YZX':

            z = Math.asin( clamp( m21, - 1, 1 ) );

            if ( Math.abs( m21 ) < 0.9999999 ) {

                x = Math.atan2( - m23, m22 );
                y = Math.atan2( - m31, m11 );

            } else {

                x = 0;
                y = Math.atan2( m13, m33 );

            }

            break;

        case 'XZY':

            z = Math.asin( - clamp( m12, - 1, 1 ) );

            if ( Math.abs( m12 ) < 0.9999999 ) {

                x = Math.atan2( m32, m22 );
                y = Math.atan2( m13, m11 );

            } else {

                x = Math.atan2( - m23, m33 );
                y = 0;

            }

            break;

        default:

            console.warn( 'THREE.Euler: .setFromRotationMatrix() encountered an unknown order: ' + order );

    }

    return [toDegrees(x),toDegrees(y),toDegrees(z)];
}

const DataType = {
    "String": 0x01,
    "Bool": 0x02,
    "Int32": 0x03,
    "Float32": 0x04,
    "Float64": 0x05,
    "UDim": 0x06,
    "UDim2": 0x07,
    "Ray": 0x08,
    "Faces": 0x09, //NOT IMPLEMENTED
    "Axes": 0x0a, //NOT IMPLEMENTED
    "BrickColor": 0x0b,
    "Color3": 0x0c,
    "Vector2": 0x0d, //NOT IMPLEMENTED
    "Vector3": 0x0e,
    "CFrame": 0x10,
    "Enum": 0x12,
    "Referent": 0x13,

    "Color3uint8": 0x1a,
    "Int64": 0x1b,

    "Capabilites": 0x21, //NOT IMPLEMENTED
}

const PropertyTypeInfo = {
    "Pants": {
        "PantsTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "Shirt": {
        "ShirtTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "ShirtGraphic": {
        "Graphic": "String",
        "Name": "String",
        "archiveable": "Bool"
    }
}

//datatype structs
class UDim {
    Scale = 0 //Float32
    Offset = 0 //Int32
}

class UDim2 {
    X = new UDim()
    Y = new UDim()
}

class Ray {
    Origin = [0,0,0]
    Direction = [0,0,0]
}

class Vector3 {
    X = 0
    Y = 0
    Z = 0

    constructor(X,Y,Z) {
        this.X = X
        this.Y = Y
        this.Z = Z
    }

    multiply(vec3) {
        return new Vector3(this.X * vec3.X, this.Y * vec3.Y, this.Z * vec3.Z)
    }

    divide(vec3) {
        return new Vector3(this.X / vec3.X, this.Y / vec3.Y, this.Z / vec3.Z)
    }

    add(vec3) {
        return new Vector3(this.X + vec3.X, this.Y + vec3.Y, this.Z + vec3.Z)
    }

    minus(vec3) {
        return new Vector3(this.X - vec3.X, this.Y - vec3.Y, this.Z - vec3.Z)
    }

    magnitude(vec3) {
        return Math.sqrt(this.X*this.X + this.Y*this.Y + this.Z*this.Z)
    }

    clone() {
        return new Vector3(this.X, this.Y, this.Z)
    }

    static new(X,Y,Z) {
        return new Vector3(X,Y,Z)
    }
}

class Color3 {
    R = 0
    G = 0
    B = 0
}

class Color3uint8 {
    R = 0
    G = 0
    B = 0
}

class CFrame {
    Position = [0,0,0]
    Orientation = [0,0,0]

    constructor(x = 0, y = 0, z = 0) {
        this.Position = [x,y,z]
    }

    clone() {
        let cloneCF = new CFrame(this.Position[0], this.Position[1], this.Position[2])
        cloneCF.Orientation = [this.Orientation[0], this.Orientation[1], this.Orientation[2]]

        return cloneCF
    }

    getMatrix() {
        let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(this.Orientation[0]), rad(this.Orientation[1]), rad(this.Orientation[2]), "YXZ"))
        let transformMatrix = new THREE.Matrix4().makeTranslation(this.Position[0], this.Position[1], this.Position[2])

        return transformMatrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quat)).toArray()
    }

    fromMatrix(m) {
        this.Orientation = rotationMatrixToEulerAngles([
            m[0],m[1],m[2],
            m[4],m[5],m[6],
            m[8],m[9],m[10]
        ])
        this.Position = [m[12],m[13],m[14]]

        return this
    }

    inverse() {
        let thisM = new THREE.Matrix4().fromArray(this.getMatrix())
        let inverse = new THREE.Matrix4()
        inverse.getInverse(thisM)

        return new CFrame().fromMatrix(inverse.elements)
    }

    multiply(cf) {
        let thisM = new THREE.Matrix4().fromArray(this.getMatrix())
        let cfM = new THREE.Matrix4().fromArray(cf.getMatrix())

        let newM = thisM.multiply(cfM)
        
        let newCf = new CFrame().fromMatrix(newM.elements)

        return newCf
    }
}

//hierarchy structs

class Connection {
    Connected = true
    _callback
    _event

    constructor(callback, event) {
        this._callback = callback
        this._event = event
    }

    Disconnect() {
        this.Connected = false
        this._event.Disconnect(this._callback)
    }
}

class Event {
    _callbacks = []

    Connect(callback) {
        this._callbacks.push(callback)
        return new Connection(callback, this)
    }

    Fire(...args) {
        for (let callback of this._callbacks) {
            callback(...args)
        }
    }

    Disconnect(callback) {
        let index = this._callbacks.indexOf(callback)
        if (index !== -1) {
            this._callbacks.splice(index,1)
        }
    }

    Clear() {
        this._callbacks = []
    }
}

class Property {
    name
    typeID
    _value //only to be changed by setProperty() method of Instance

    constructor(name = null, typeID = null) {
        this.name = name
        this.typeID = typeID
    }

    get value() {
        return this._value
    }
}

//scaling notes
/*
R15 --> Slim = R15_Wide * R15_Proportions

*/
//scaling data
let originalPositionName = "OriginalPosition"
let originalSizeName = "OriginalSize"
let rigAttachmentName = "RigAttachment"

let stepHeightNarrow = 2.4
let stepHeightWide = 2.7

//Default positions of the attachments related to the Head part
let headAttachmentMap = {
	FaceCenterAttachment: Vector3.new(0, 0, 0),
	FaceFrontAttachment: Vector3.new(0, 0, -0.6),
	HairAttachment: Vector3.new(0, 0.6, 0),
	HatAttachment: Vector3.new(0, 0.6, 0),
	NeckRigAttachment: Vector3.new(0, -0.5, 0)
}

//Default scaling values for character with classic proportions (used in lerp calcuations with desired scaling factor)
let scalingWideValues = {
	LeftLowerArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	LeftFoot: Vector3.new(1.0789999961853, 1.2669999599457, 1.1289999485016),
	Head: Vector3.new(0.94199997186661, 0.94199997186661, 0.94199997186661),
	UpperTorso: Vector3.new(1.0329999923706, 1.3090000152588, 1.1399999856949),
	RightHand: Vector3.new(1.0659999847412, 1.1740000247955, 1.2309999465942),
	LowerTorso: Vector3.new(1.0329999923706, 1.3090000152588, 1.1399999856949),
	LeftUpperLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	LeftUpperArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	RightLowerArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	LeftHand: Vector3.new(1.0659999847412, 1.1740000247955, 1.2309999465942),
	RightUpperArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	RightUpperLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	RightLowerLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	RightFoot: Vector3.new(1.0789999961853, 1.2669999599457, 1.1289999485016),
	LeftLowerLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073)
}

//Default scaling values for character with classic proportions (used in lerp calcuations with desired scaling factor)
let scalingNarrowValues = {
	LeftLowerArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	LowerTorso: Vector3.new(0.9856870174408, 1.0046048164368, 1.0133333206177),
	Head: Vector3.new(0.89628922939301, 0.94199997186661, 0.89628922939301),
	UpperTorso: Vector3.new(0.90534615516663, 1.2042318582535, 1.0133333206177),
	RightHand: Vector3.new(0.94755554199219, 1.1740000247955, 1.0942221879959),
	RightFoot: Vector3.new(1.029580116272, 1.133273601532, 1.0035555362701),
	LeftFoot: Vector3.new(1.029580116272, 1.133273601532, 1.0035555362701),
	LeftUpperArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	RightLowerArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	LeftHand: Vector3.new(0.94755554199219, 1.1740000247955, 1.0942221879959),
	RightUpperLeg: Vector3.new(0.97614508867264, 1.4009301662445, 0.90933334827423),
	RightUpperArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	RightLowerLeg: Vector3.new(0.97614508867264, 1.300518155098, 0.90933334827423),
	LeftUpperLeg: Vector3.new(0.97614508867264, 1.4009301662445, 0.90933334827423),
	LeftLowerLeg: Vector3.new(0.97614508867264, 1.300518155098, 0.90933334827423)
}

//Default scaling values for character with slender or normal proportions
//(used in lerp calcuations with desired scaling factor)
let scalingNativeR15ToWide = {
	LeftLowerArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	LowerTorso: Vector3.new(0.98619323968887, 1.228501200676, 1.0822510719299),
	Head: Vector3.new(0.625, 0.625, 0.625),
	UpperTorso: Vector3.new(0.98619323968887, 1.228501200676, 1.0822510719299),
	RightHand: Vector3.new(0.71942448616028, 1.034126162529, 0.83263945579529),
	RightFoot: Vector3.new(0.71225070953369, 1.0493179559708, 1.0741138458252),
	LeftFoot: Vector3.new(0.71225070953369, 1.0493179559708, 1.0741138458252),
	LeftUpperArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	RightLowerArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	LeftHand: Vector3.new(0.71942448616028, 1.034126162529, 0.83263945579529),
	RightUpperLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	RightUpperArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	RightLowerLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	LeftUpperLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	LeftLowerLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869)
}

//Default scaling values for character with slender or normal proportions
//(used in lerp calcuations with desired scaling factor)
let scalingNativeR15ToNarrow = {
	LeftLowerArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	LowerTorso: Vector3.new(0.94102412462234, 0.94282519817352, 0.96200096607208),
	Head: Vector3.new(0.59467172622681, 0.625, 0.59467172622681),
	UpperTorso: Vector3.new(0.86432361602783, 1.130175948143, 0.96200096607208),
	RightHand: Vector3.new(0.63948839902878, 1.034126162529, 0.74012398719788),
	RightFoot: Vector3.new(0.67962855100632, 0.93856704235077, 0.95476788282394),
	LeftFoot: Vector3.new(0.67962855100632, 0.93856704235077, 0.95476788282394),
	LeftUpperArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	RightLowerArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	LeftHand: Vector3.new(0.63948839902878, 1.034126162529, 0.74012398719788),
	RightUpperLeg: Vector3.new(0.97566312551498, 1.1427917480469, 0.84175086021423),
	RightUpperArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	RightLowerLeg: Vector3.new(0.97566312551498, 1.0608818531036, 0.84175086021423),
	LeftUpperLeg: Vector3.new(0.97566312551498, 1.1427917480469, 0.84175086021423),
	LeftLowerLeg: Vector3.new(0.97566312551498, 1.0608818531036, 0.84175086021423)
}

const SCALE_R15_Wide = {
    Head: Vector3.new(0.9420000314712524,0.9419999718666077,0.9419999718666077),
    LeftHand: Vector3.new(1.065999984741211,1.1740000247955322,1.2309999465942383),
    RightHand: Vector3.new(1.065999984741211,1.1740000247955322,1.2309999465942383),
    LeftLowerArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    RightLowerArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    LeftUpperArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    RightUpperArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    LeftFoot: Vector3.new(1.0789999961853027,1.2669999599456787,1.128999948501587),
    LeftLowerLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
    UpperTorso: Vector3.new(1.0329999923706055,1.3089998960494995,1.1399999856948853),
    LeftUpperLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
    RightFoot: Vector3.new(1.0789999961853027,1.2669999599456787,1.128999948501587),
    RightLowerLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
    LowerTorso: Vector3.new(1.0329999923706055,1.309000015258789,1.1399999856948853),
    RightUpperLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
}

const SCALE_R15_Proportions = {
    Head: Vector3.new(0.9514747858047485,1,0.9514748454093933),
    LeftHand: Vector3.new(0.8888888955116272,1,0.8888888955116272),
    RightHand: Vector3.new(0.8888888955116272,1,0.8888888955116272),
    LeftLowerArm: Vector3.new(0.8888888955116272,0.9000900387763977,0.888888955116272),
    RightLowerArm: Vector3.new(0.8888888955116272,0.9000900387763977,0.888888955116272),
    LeftUpperArm: Vector3.new(0.8888888955116272,0.9000900983810425,0.888888955116272),
    RightUpperArm: Vector3.new(0.8888888955116272,0.9000900983810425,0.888888955116272),
    LeftFoot: Vector3.new(0.95419842004776,0.8944543600082397,0.8888888955116272),
    LeftLowerLeg: Vector3.new(0.9541985392570496,0.8635578155517578,0.8888888955116272),
    UpperTorso: Vector3.new(0.8764241933822632,0.9199632406234741,0.8888888955116272),
    LeftUpperLeg: Vector3.new(0.9541985392570496,0.9302324652671814,0.888888955116272),
    RightFoot: Vector3.new(0.95419842004776,0.8944543600082397,0.8888888955116272),
    RightLowerLeg: Vector3.new(0.9541985392570496,0.8635578155517578,0.8888888955116272),
    LowerTorso: Vector3.new(0.9541984796524048,0.7674597501754761,0.8888888955116272),
    RightUpperLeg: Vector3.new(0.9541985392570496,0.9302324652671814,0.888888955116272)
}

const SCALE_Wide_R15 = {
    LeftLowerArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    RightLowerArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    LeftUpperArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    RightUpperArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    Head: Vector3.new(1.600000023841858,1.600000023841858,1.600000023841858),
    LeftLowerLeg: Vector3.new(0.9779999852180481,0.8140000700950623,1.055999994277954),
    LeftUpperLeg: Vector3.new(0.9779999256134033,0.8140000104904175,1.055999994277954),
    LeftHand: Vector3.new(1.3899999856948853,0.9670000076293945,1.2009999752044678),
    RightLowerLeg: Vector3.new(0.9779999852180481,0.8140000700950623,1.055999994277954),
    RightUpperLeg: Vector3.new(0.9779999256134033,0.8140000104904175,1.055999994277954),
    UpperTorso: Vector3.new(1.0140000581741333,0.8140000104904175,0.9240000247955322),
    LeftFoot: Vector3.new(1.4040000438690186,0.953000009059906,0.9309999942779541),
    LowerTorso: Vector3.new(1.0140000581741333,0.8140000104904175,0.9240000247955322),
    RightHand: Vector3.new(1.3899999856948853,0.9670000076293945,1.2009999752044678),
    RightFoot: Vector3.new(1.4040000438690186,0.953000009059906,0.9309999942779541)
}

//Linear interpolation function
function lerp(a,b,t) {
	return a + (b - a) * t
}

function lerpVec3(a,b,t) {
	return a.add((b.minus(a)).multiply(new Vector3(t,t,t)))
}

//Returns an array of the character parts
function GetCharacterParts(rig) {
	let characterParts = []
	for (let item of rig.GetChildren()) {
		if (item.className === "MeshPart" || item.className === "Part") {
		    characterParts.push(item)	
        }
    }
	return characterParts
}

//Returns the matching attachment found on the character
function FindFirstMatchingAttachment(attachmentName, rig) {
	let characterParts = GetCharacterParts(rig)
	for (let part of characterParts) {
		for (let child of part.GetChildren()) {
			if (child.Prop("Name") == attachmentName) {
				return child
            }
        }
    }
	return null
}

//Returns the character part the accessory is attached to
function GetAttachedPart(accessory, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let accessoryWeld = handle.FindFirstChild("AccessoryWeld")
	if (accessoryWeld) {
		let attachedPart
		if (accessoryWeld.Prop("Part0") !== handle) {
			attachedPart = accessoryWeld.Prop("Part0")
        } else {
			attachedPart = accessoryWeld.Prop("Part1")
        }
		return attachedPart
    }

	let accessoryAttachment = handle.FindFirstChildOfClass("Attachment")
	if (accessoryAttachment) {
		let matchingAttachment = FindFirstMatchingAttachment(accessoryAttachment.Prop("Name"), rig)
		if (matchingAttachment && matchingAttachment.parent) {
			return matchingAttachment.parent
        }
    }

	return rig.Child("Head")
}

//Returns the scale of a part with consideration for proportion type
function getPartScale(part, wideToNarrow, anthroPercent, partType, baseType) {
	let scale = new Vector3(1.0,1.0,1.0)
	if (!part) {
		return scale
    }

	let partName = part.Prop("Name")

	let wideScale = scalingWideValues[partName]
	let narrowScale = scalingNarrowValues[partName]

	if (partType === "ProportionsNormal" || partType == "ProportionsSlender") {
		wideScale = scalingNativeR15ToWide[partName]
		narrowScale = scalingNativeR15ToNarrow[partName]
    }

	if (!wideScale) { wideScale = Vector3.new(1.0,1.0,1.0) }
	if (!narrowScale) { narrowScale = Vector3.new(1.0,1.0,1.0) }

	let anthroScale = lerpVec3(wideScale, narrowScale, wideToNarrow)
	scale = lerpVec3(scale, anthroScale, anthroPercent)

	let base = Vector3.new(1.0,1.0,1.0)
	if (baseType == "ProportionsNormal") {
		base = wideScale
    } else if (baseType == "ProportionsSlender") {
		base = narrowScale
    }

	scale = scale.divide(base)
	return scale
}

//Returns the original size of the part or will create one if it cannot find one
function getOriginalSize(part) {
	let originalSize = part.Prop("Size")
	let originalSizeValue = part.FindFirstChild(originalSizeName)
	if (originalSizeValue) {
		originalSize = originalSizeValue.Prop("Value")
    } else {
		let partSizeValue = new Instance("Vector3Value")
        partSizeValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partSizeValue.addProperty(new Property("Value", DataType.Vector3), part.Prop("Size"))
		partSizeValue.setParent(part)
    }
	return originalSize
}

const MeshType = {
    "Brick": 6,
    "Cylinder": 4,
    "FileMesh": 5,
    "Head": 0,
    "Sphere": 3,
    "Torso": 1,
    "Wedge": 2,
}

//Scales the attachment or special mesh child found on a part
function scaleChildrenOfPart(part, scaleVector) {
	for (let child of part.GetChildren()) {
		if (child.className === "Attachment") {
			let originalPosition = child.Prop("CFrame").Position
            originalPosition = new Vector3(originalPosition[0], originalPosition[1], originalPosition[2])
            originalPosition = originalPosition.multiply(scaleVector)

            let newCF = child.Prop("CFrame").clone()
            newCF.Position = [originalPosition.X, originalPosition.Y, originalPosition.Z]
			child.setProperty("CFrame", newCF)
        } else if (child.className === "SpecialMesh") {
			if (child.Prop("MeshType") !== MeshType.Head) {
				let orignalScale = child.Prop("Scale")
				child.setProperty("Scale", orignalScale.multiply(scaleVector))
            }
        }
    }
}

function getAvatarPartScaleType(bodyPart) {
    let avatarPartScaleTypeVal = bodyPart.FindFirstDescendant("AvatarPartScaleType")
    if (avatarPartScaleTypeVal) {
        return avatarPartScaleTypeVal.Prop("Value")
    }

    return "Classic"
}

//SOURCE: https://devforum.roblox.com/t/rthro-scaling-specification/199611
function sampleScaleTables(bodyPart, scaleType) {
	// Determine the scale type for this body part.
	if (!scaleType) {
		scaleType = getAvatarPartScaleType(bodyPart)
    }
	
	// Sample the scaling tables
	let limbName = bodyPart.Prop("Name")
	let sampleNoChange = Vector3.new(1, 1, 1)
	
	let sampleR15ToNormal = scalingWideValues[limbName]
	let sampleNormalToR15 = scalingNativeR15ToWide[limbName]

	let sampleR15ToSlender = scalingNarrowValues[limbName]
	let sampleSlenderToR15 = scalingNativeR15ToNarrow[limbName]

	let sampleNormalToSlender = (sampleR15ToNormal.divide(sampleR15ToSlender))
	let sampleSlenderToNormal = (sampleR15ToSlender.divide(sampleR15ToNormal))
	
	// Select the scales that will be interpolated
	let scaleR15, scaleNormal, scaleSlender
	
	if (scaleType == "ProportionsNormal") {
        scaleR15 = sampleNormalToR15
        scaleNormal = sampleNoChange
        scaleSlender = sampleNormalToSlender
    } else if (scaleType == "ProportionsSlender") {
        scaleR15 = sampleSlenderToR15
        scaleNormal = sampleSlenderToNormal
        scaleSlender = sampleNoChange
    } else {
        scaleR15 = sampleNoChange
        scaleNormal = sampleR15ToNormal
        scaleSlender = sampleR15ToSlender
    }
	
	return [scaleR15, scaleNormal, scaleSlender]
}

function computeLimbScale(bodyPart, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale) {
	// Determine the scale type for this body part.
	let scaleType = getAvatarPartScaleType(bodyPart)
	
	// Select the scales we will interpolate
	let [scaleR15, scaleNormal, scaleSlender] = sampleScaleTables(bodyPart)
	
	// Compute the Rthro scaling based on the current proportions and body-type.
	let bodyType = bodyTypeScale
	let proportions = bodyProportionScale
	
	let scaleProportions = lerpVec3(scaleNormal, scaleSlender, proportions)
	let scaleBodyType = lerpVec3(scaleR15, scaleProportions, bodyType)
	
	// Handle the rest of the scale values.
	if (bodyPart.Prop("Name") == "Head") {
		return scaleBodyType.multiply(headScaleVector)
    } else {
		let baseScale = bodyScaleVector
		return scaleBodyType.multiply(baseScale)
    }
}

function OLDALTScaleAccessory(accessory, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale, rig) {
    let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }
    let limb = GetAttachedPart(accessory, rig)
    if (!limb) {
        return
    }

    let limbScaleType = getAvatarPartScaleType(limb)
	let handleScaleType = getAvatarPartScaleType(handle)

    let limbScale = computeLimbScale(limb, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale)
	if (limbScaleType === handleScaleType) {
		return limbScale
    }
	
	let [limbR15, limbNormal, limbSlender] = sampleScaleTables(limb, limbScaleType)
	let [handleR15, handleNormal, handleSlender] = sampleScaleTables(limb, handleScaleType)
	
	let originScale
	
	if (handleScaleType == "ProportionsNormal") {
		originScale = handleNormal.divide(limbNormal)
    } else if (handleScaleType == "ProportionsSlender") {
		originScale = handleSlender.divide(limbSlender)
    } else {
		originScale = handleR15.divide(limbR15)
    }

	let newScaleVector = originScale.multiply(limbScale)

    let originalSize = getOriginalSize(handle)
	let currentScaleVector = handle.Prop("Size").divide(originalSize)
    let relativeScaleVector = newScaleVector.divide(currentScaleVector);

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, relativeScaleVector)
	handle.setProperty("Size", originalSize.multiply(newScaleVector))
	accessory.AccessoryBuildWeld()
}

//This is the only working accessory scaling function, all the other ones are incorrect
function ScaleAccessory(accessory, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let attachedPart = GetAttachedPart(accessory, rig)

    let resultScale = Vector3.new(1,1,1)

    //head vs width,depth,height
	let regularScaleVector = bodyScaleVector
	if (attachedPart.Prop("Name") === "Head") {
		regularScaleVector = headScaleVector
    }
    resultScale = resultScale.multiply(regularScaleVector)

	//find appropriate relative scaling with attached part
	if (attachedPart) {
        let bodyPartName = attachedPart.Prop("Name")
        if (SCALE_Wide_R15[bodyPartName] === undefined) {
            return
        }

	    let accessoryScaleType = "Classic"
        let accessoryScaleTypeValue = accessory.FindFirstDescendant("AvatarPartScaleType")
		if (accessoryScaleTypeValue) {
			accessoryScaleType = accessoryScaleTypeValue.Prop("Value")
        }

	    let attachedPartScaleType = "Classic"
        let attachedPartScaleTypeValue = attachedPart.FindFirstDescendant("AvatarPartScaleType")
		if (attachedPartScaleTypeValue) {
			attachedPartScaleType = attachedPartScaleTypeValue.Prop("Value")
        }

        let relativeScaleVector = Vector3.new(1,1,1)
        if (accessoryScaleType !== attachedPartScaleType) {
            if (accessoryScaleType === "Classic" && (attachedPartScaleType === "ProportionsNormal" || attachedPartScaleType === "ProportionsSlender")) {
                //match part
                relativeScaleVector = relativeScaleVector.divide(SCALE_Wide_R15[bodyPartName])
            } else if (accessoryScaleType === "ProportionsNormal" && attachedPartScaleType === "Classic") {
                //match part
                relativeScaleVector = relativeScaleVector.multiply(SCALE_Wide_R15[bodyPartName])
            } else if (accessoryScaleType === "ProportionsNormal" && attachedPartScaleType === "ProportionsSlender") {
                //match part
                relativeScaleVector = relativeScaleVector.multiply(SCALE_R15_Proportions[bodyPartName])
            } else if (accessoryScaleType === "ProportionsSlender" && attachedPartScaleType === "Classic") {
                //match part
                relativeScaleVector = relativeScaleVector.multiply(SCALE_Wide_R15[bodyPartName]).divide(SCALE_R15_Proportions[bodyPartName])
            } else if (accessoryScaleType === "ProportionsSlender" && attachedPartScaleType === "ProportionsNormal") {
                //match part
                relativeScaleVector = relativeScaleVector.divide(SCALE_R15_Proportions[bodyPartName])
            }
        }

        if (bodyTypeScale !== null && bodyProportionScale !== null) { //IF R15, very hacky of me
            switch (attachedPartScaleType) {
                case "Classic":
                    {
                        //apply scale as Classic
                        let bodyTypeScaleVector = SCALE_R15_Wide[bodyPartName]
                        let bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1), SCALE_R15_Proportions[bodyPartName], bodyProportionScale)
                        let finalVector = lerpVec3(Vector3.new(1,1,1), bodyTypeScaleVector.multiply(bodyProportionScaleVector), bodyTypeScale).multiply(relativeScaleVector)
                        resultScale = resultScale.multiply(finalVector)
                        break
                    }
                case "ProportionsNormal":
                    {
                        //apply scale as ProportionsNormal
                        let bodyTypeScaleVector = SCALE_Wide_R15[bodyPartName]
                        let bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1), SCALE_R15_Proportions[bodyPartName], bodyProportionScale)
                        let finalVector = lerpVec3(bodyTypeScaleVector, bodyProportionScaleVector, bodyTypeScale).multiply(relativeScaleVector)
                        resultScale = resultScale.multiply(finalVector)
                        break
                    }
                case "ProportionsSlender":
                    {
                        //apply scale as ProportionsSlender
                        let bodyTypeScaleVector = SCALE_Wide_R15[bodyPartName]
                        let bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1).divide(SCALE_R15_Proportions[bodyPartName]), Vector3.new(1,1,1), bodyProportionScale)
                        let finalVector = lerpVec3(bodyTypeScaleVector, bodyProportionScaleVector, bodyTypeScale).multiply(relativeScaleVector)
                        resultScale = resultScale.multiply(finalVector)
                        break
                    }
            }
        } else { //If R6, BUG: Applies scale to R6 sometimes avatar... I'm doing this because it's more frequent for it to mess up and scale accessories rather than not
            resultScale = resultScale.multiply(relativeScaleVector)
        }
    } else {
        console.warn("Failed to find attached part for accessory:", accessory)
    }

	let originalSize = getOriginalSize(handle)
    //used to double check
    console.log(accessory.Prop("Name"))
    console.log("SCALE HERE \n HERE\nHERE\nHERE\nHERE")
    console.log(resultScale.multiply(originalSize))
    //throw "check the scale"
	let currentScaleVector = handle.Prop("Size").divide(originalSize)
    let relativeScaleVector = resultScale.divide(currentScaleVector);

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, relativeScaleVector)
	handle.setProperty("Size", originalSize.multiply(resultScale))
	accessory.AccessoryBuildWeld()
}

function OLDScaleAccessory(accessory, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let attachedPart = GetAttachedPart(accessory, rig)

	let newScaleVector = bodyScaleVector
	if (attachedPart.Prop("Name") === "Head") {
		newScaleVector = headScaleVector
    }

	//find appropriate relative scaling with attached part
	if (attachedPart) {
		let scale = new Vector3(1,1,1)

	    let accessoryProportion = "Classic"
		if (accessory.FindFirstChild("AvatarPartScaleType")) {
			accessoryProportion = accessory.Child("AvatarPartScaleType").Prop("Value")
        }

	    if (accessoryProportion !== "Classic") {
	        scale = getPartScale(attachedPart, 0.0, 0.0, accessoryProportion, accessoryProportion);
        }
        console.log(accessoryProportion)

	    let attachedPartProportion = "Classic"
        let attachedPartScaleType = attachedPart.FindFirstChild("AvatarPartScaleType")
		if (attachedPartScaleType) {
			attachedPartProportion = attachedPartScaleType.Prop("Value")
        }

        //TODO: why is this needed?
        if (accessoryProportion === "Classic") {
            attachedPartProportion = "Classic"
        }

        //Support for how roblox scales R6
        if (!bodyTypeScale) {
            if (attachedPartProportion.startsWith("Proportions")) {
                bodyTypeScale = 1
            } else {
                bodyTypeScale = 0
            }
        }
        if (!bodyProportionScale) {
            if (attachedPartProportion === "ProportionsSlender") {
                bodyProportionScale = 1
            } else {
                bodyProportionScale = 0
            }
        }

		scale = scale.multiply(getPartScale(attachedPart, bodyProportionScale, bodyTypeScale, attachedPartProportion, "Classic"));
		newScaleVector = newScaleVector.multiply(scale)
    } else {
        console.warn("Failed to find attached part for accessory:", accessory)
    }

	let originalSize = getOriginalSize(handle)
	let currentScaleVector = handle.Prop("Size").divide(originalSize)
    let relativeScaleVector = newScaleVector.divide(currentScaleVector);

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, relativeScaleVector)
	handle.setProperty("Size", originalSize.multiply(newScaleVector))
	accessory.AccessoryBuildWeld()
}

//Returns the original mesh scale of the part or will create one if it cannot find one
function getOriginalMeshScale(mesh) {
	let originalScale = mesh.Prop("Scale")
	let originalScaleValue = mesh.FindFirstChild(originalSizeName)
	if (originalScaleValue) {
		originalScale = originalScaleValue.Prop("Value")
    } else {
		let partScaleValue = new Instance("Vector3Value")
        partScaleValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partScaleValue.addProperty(new Property("Value", DataType.Vector3), mesh.Scale)
		partScaleValue.setParent(mesh)
    }
	return originalScale
}

//Returns the original attachment position or will create one if it cannot find one
function getOriginalAttachmentPosition(attachment) {
	let originalPosition = attachment.FindFirstChild(originalPositionName)
	if (originalPosition) {
		return originalPosition.Prop("Value")
    }

	let position = attachment.Prop("Position")

	let attachmentLocationValue = new Instance("Vector3Value")
    attachmentLocationValue.addProperty(new Property("Name", DataType.String), originalPositionName)
	attachmentLocationValue.addProperty(new Property("Value", DataType.Vector3), position)
	attachmentLocationValue.setParent(attachment)

	return position
}

//Scale character part and any attachments using values found in the configurations folder
function ScaleCharacterPart(part, bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow) {
	let partName = part.Prop("Name")
	let originalSize = getOriginalSize(part)

	let newScaleVector = bodyScaleVector
	if (partName == "Head") {
		newScaleVector = headScaleVector
    }

	//check for native part information on special mesh in the Head Part
	if (part && partName == "Head") {
		let mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			let nameNative = "AvatarPartScaleType"
			let meshScaleTypeValue = mesh.FindFirstChild(nameNative)
			if (meshScaleTypeValue) {
				let headScaleTypeValue = part.FindFirstChild(nameNative)
				if (!headScaleTypeValue) {
					headScaleTypeValue = new Instance("StringValue")
					if (headScaleTypeValue) {
                        headScaleTypeValue.addProperty(new Property("Value", DataType.String), "")
						headScaleTypeValue.addProperty(new Property("Name", DataType.String), nameNative)
						headScaleTypeValue.setParent(part)
                    }
                }
				if (headScaleTypeValue) {
					headScaleTypeValue.setProperty("Value", meshScaleTypeValue.Prop("Value"))
                }
            } else if (!part.className === "MeshPart") {
				let headScaleTypeValue = part.FindFirstChild(nameNative)
				if (headScaleTypeValue) {
					headScaleTypeValue.Destroy()
                }
            }
        } else if (!part.className === "MeshPart") {
			let nameNative = "AvatarPartScaleType";
			let headScaleTypeValue = part.FindFirstChild(nameNative)
			if (headScaleTypeValue) {
				headScaleTypeValue.Destroy();
            }
        }
    }

	//find the appropriate scale for the part
	let humanoidPropType = "Classic"
	if (part.FindFirstChild("AvatarPartScaleType")) {
		humanoidPropType = part.Child("AvatarPartScaleType").Prop("Value")
    }
	let scale = getPartScale(part, wideToNarrow, anthroPercent, humanoidPropType, humanoidPropType)

	//scale head mesh and attachments
	if (part && partName == "Head") {
		let mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			let headScale = newScaleVector
			if (mesh.Prop("MeshType") == MeshType.Head) {
				headScale = Vector3.new(1.0,1.0,1.0)
            }
			let originalScale = getOriginalMeshScale(mesh)

			if (mesh.Prop("MeshType") !== MeshType.Head) {
				mesh.setProperty("Scale", originalScale.multiply(scale).multiply(headScale))
            }

			let attachmentNames = ["FaceCenterAttachment", "FaceFrontAttachment", "HairAttachment",
				"HatAttachment", "NeckRigAttachment"]

            for (aname of attachmentNames) {
				let originalPosValue = mesh.FindFirstChild(aname)
				let headAttachment = part.FindFirstChild(aname)
				let originalPosition = headAttachment.FindFirstChild(originalPositionName)
				if (headAttachment && originalPosition) {
					if (originalPosValue) {
						originalPosition.setProperty("Value", originalPosValue)
                    } else {
						originalPosition.setProperty("Value", headAttachmentMap[aname])
                    }
                }
            }
        }
    }

	//scale the part
	part.setProperty("Size", originalSize.multiply(scale).multiply(newScaleVector))

	//scale attachments
    for (let child of part.GetChildren()) {
		if (child.className === "Attachment") {
			let originalAttachment = getOriginalAttachmentPosition(child)
            let ogCF = child.Prop("CFrame").clone()
            let newPos = originalAttachment.multiply(scale).multiply(newScaleVector)
            ogCF.Position = [newPos.X, newPos.Y, newPos.Z]
			child.setProperty("CFrame", ogCF)
        }
    }
}

//Updates the step height
function SetStepHeight(self, value) {
	if (!value) {
		return
    }

	let stepHeight = self.stepHeight

	value = specialClamp(value, -100.0, 100.0)

	if (value !== stepHeight) {
		self.stepHeight = value
    }
}

//Scale accessories using values found in the configurations folder
function ScaleAccessories(bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow, rig) {
    for (let item of rig.GetChildren()) {
		if (item.className === "Accessory") {
			ScaleAccessory(item,bodyScaleVector,headScaleVector,anthroPercent,wideToNarrow, rig)
        }
    }
}

//Adjusts any rig attachments as needed
function AdjustRootRigAttachmentPosition(self, rootPart, matchingPart, rootAttachment, matchingAttachment) {
	let rightHipAttachment = matchingPart.FindFirstChild("RightHipAttachment")
	let leftHipAttachment = matchingPart.FindFirstChild("LeftHipAttachment")

	if (leftHipAttachment || rightHipAttachment) {
		let rightHipDistance = 9999999999
		let leftHipDistance = 9999999999
		if (rightHipAttachment) {
			rightHipDistance = rightHipAttachment.Prop("Position").Y
        }
		if (leftHipAttachment) {
			leftHipDistance = leftHipAttachment.Prop("Position").Y
        }

		let hipDistance = Math.min(leftHipDistance, rightHipDistance)

		let rootAttachmentToHipDistance = matchingAttachment.Prop("Position").Y - hipDistance
		let halfRootPartHeight = rootPart.Prop("Size").Y / 2.0

		let currentPivot = rootAttachment.Prop("Position")
		let newYPivot = rootAttachmentToHipDistance - halfRootPartHeight

        let ogCF = rootAttachment.Prop("CFrame").clone()
        ogCF.Position = [currentPivot.X, newYPivot, currentPivot.Z]
		rootAttachment.setProperty("CFrame", ogCF)
    }
}

//Creates a joint between two attachments
function createJoint(jointName,att0,att1) {
	let part0 = att0.parent
    let part1 = att1.parent
	let newMotor = part1.FindFirstChild(jointName)

	if (!(newMotor && newMotor.className === "Motor6D")) {
		newMotor = new Instance("Motor6D")
    }

    newMotor.addProperty(new Property("Name", DataType.String), jointName)
    newMotor.addProperty(new Property("Archivable", DataType.Bool), true)
    newMotor.addProperty(new Property("C1", DataType.CFrame), att1.Prop("CFrame"))
    newMotor.addProperty(new Property("C0", DataType.CFrame), att0.Prop("CFrame"))
    newMotor.addProperty(new Property("Part1", DataType.Referent), part1)
    newMotor.addProperty(new Property("Part0", DataType.Referent), part0)
    newMotor.addProperty(new Property("Active", DataType.Bool), true)
    newMotor.addProperty(new Property("Enabled", DataType.Bool), true)

	newMotor.setParent(part1)
}

//Updates the cumulative step heights with any new scaling
function UpdateCumulativeStepHeight(self, part) {
	if (!part) {
		return
    }

	let partName = part.Prop("Name")

	if (partName == "HumanoidRootPart") {
		let rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y;
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - (part.Prop("Size").Y / 2.0)
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - (part.Prop("Size").Y / 2.0)

    } else if (partName == "LowerTorso") {
		let rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
        }

    } else if (partName == "LeftUpperLeg") {
		let rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - rigAttach.Prop("Position").Y
        }
    } else if (partName == "LeftLowerLeg") {
		let rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - rigAttach.Prop("Position").Y
        }

    } else if (partName == "LeftFoot") {
		let rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + (part.Prop("Size").Y / 2.0)
		self.cumulativeLegLeft = self.cumulativeLegLeft + (part.Prop("Size").Y / 2.0)

    } else if (partName == "RightUpperLeg") {
		let rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight - rigAttach.Prop("Position").Y
        }

    } else if (partName == "RightLowerLeg") {
		let rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight - rigAttach.Prop("Position").Y
        }
    } else if (partName == "RightFoot") {
		let rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + (part.Prop("Size").Y / 2.0);
		self.cumulativeLegRight = self.cumulativeLegRight + (part.Prop("Size").Y / 2.0);
    }
}

//Traverses joints between parts by using the attachments on the character and updates or creates joints accordingly
function TraverseRigFromAttachmentsInternal(self, part, characterParts, buildJoints) {
	if (!part) {
        console.log("nevermind!")
		return
    }

	// first, loop thru all of the part's children to find attachments
	for (let attachment of part.GetChildren()) {
		if (attachment.className === "Attachment") {
			// only do joint build from "RigAttachments"
			let attachmentName = attachment.Prop("Name")
			let findPos = attachmentName.indexOf(rigAttachmentName)

			if (findPos) {
				// also don't make double joints (there is the same named
                // rigattachment under two parts)
				let jointName = attachmentName.substring(0,findPos)
				let joint = part.FindFirstChild(jointName)
				if (!joint || joint.className !== "Motor6D") {

					// try to find other part with same rig attachment name
					for (let characterPart of characterParts) {
						if (part !== characterPart) {
							let matchingAttachment = characterPart.FindFirstChild(attachmentName)
							if (matchingAttachment && matchingAttachment.className === "Attachment") {
								AdjustRootRigAttachmentPosition(self, part, characterPart, attachment, matchingAttachment)
								if (buildJoints) {
									createJoint(jointName,attachment,matchingAttachment)
                                }
								TraverseRigFromAttachmentsInternal(self, characterPart, characterParts, buildJoints)
								break
                            }
                        }
                    }
                }
            }
        }
    }

	UpdateCumulativeStepHeight(self, part)
}

//Builds the joints from the attachment and scales accordingly
//This function also adjusts for assymetrical legs
function BuildJointsFromAttachments(self, rootPart, characterParts) {

	// rig the character to get initial leg parts
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)

	if (self.cumulativeLegLeft > 0.1 && self.cumulativeLegRight > 0.1) {
		let legParts = []

		//Find which leg and which part require scaling
		let yScale = self.cumulativeLegRight / self.cumulativeLegLeft;

		if (self.cumulativeLegLeft > self.cumulativeLegRight) {
			yScale = self.cumulativeLegLeft / self.cumulativeLegRight
			legParts = []
			for (let part of characterParts) {
				if (part.Prop("Name") == "RightUpperLeg" || part.Prop("Name") == "RightLowerLeg" || part.Prop("Name") == "RightFoot") {
					legParts.push(part)
                }
            }
        } else {
			for (let part of characterParts) {
				if (part.Prop("Name") == "LeftUpperLeg" || part.Prop("Name") == "LeftLowerLeg" || part.Prop("Name") == "LeftFoot") {
					legParts.push(part)
                }
            }
        }

		//scale parts
		let adjustScale = Vector3.new(1.0, yScale, 1.0)
		for (let part of legParts) {
			let originalSize = getOriginalSize(part)
			let currentScale = part.Prop("Size").divide(originalSize)
			let totalScale = currentScale.multiply(adjustScale)
			part.setProperty("Size", originalSize.multiply(totalScale))

			//scale attachments
			for (let child of part.GetChildren()) {
				let attachment = child.FindFirstChildOfClass("Attachment")
				if (attachment) {
					let originalPosition = attachment.FindFirstChild(originalPositionName)
					if (originalPosition) {
						let originalP = originalPosition.Prop("Value")

                        let ogCF = attachment.Prop("CFrame").clone()
                        let newPos = originalP.multiply(totalScale)
                        ogCF.Position = [newPos.X, newPos.Y, newPos.Z]
						attachment.setProperty("CFrame", ogCF)
                    }
                }
            }
        }
    }

	self.cumulativeStepHeightLeft = 0.0
	self.cumulativeStepHeightRight = 0.0
	self.cumulativeLegLeft = 0.0
	self.cumulativeLegRight = 0.0

	//build the character joints after scaling
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)

	let stepHeight = Math.max(self.cumulativeStepHeightLeft, self.cumulativeStepHeightRight)
	if (Math.abs(self.cumulativeStepHeightLeft - self.cumulativeStepHeightRight) < stepHeight) {
		stepHeight = Math.min(self.cumulativeStepHeightLeft, self.cumulativeStepHeightRight)
    }
	if (stepHeight < 0.0) {
		stepHeight = (rootPart.Prop("Size").Y / 2)
    }
	SetStepHeight(self, stepHeight)
}

//Builds the joints on a character
function BuildJoints(self) {
	let character = self.rig
	let characterParts = GetCharacterParts(character)

	BuildJointsFromAttachments(self, character.Child("HumanoidRootPart"), characterParts)
}

//Scales the character including any accessories and attachments
//NOTE: Scaling is supported only for R15 Characters
function ScaleCharacter(rig, outfit) {
	if (outfit.playerAvatarType === AvatarType.R6) {
		return
	}

	//scale parts
	let bodyScaleVector = Vector3.new(
        outfit.scale.width,
		outfit.scale.height,
		outfit.scale.depth
    )
	let headScaleVector = Vector3.new(outfit.scale.head,outfit.scale.head,outfit.scale.head)
	let anthroPercent = outfit.scale.bodyType
	let wideToNarrow = outfit.scale.proportion
	let characterParts = GetCharacterParts(rig)

	for (let part of characterParts) {
		if (part) {
			ScaleCharacterPart(part, bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow)
        }
    }

	//scale step height
	let stepHeight = lerp(stepHeightWide, stepHeightNarrow, wideToNarrow)
	let newStepHeight = lerp(2.0, stepHeight, anthroPercent)

    let self = {
        "outfit": outfit,
        "rig": rig,
    }

    self.cumulativeStepHeightLeft = 0.0
    self.cumulativeStepHeightRight = 0.0
    self.cumulativeLegLeft = 0.0
    self.cumulativeLegRight = 0.0

	SetStepHeight(self, newStepHeight * bodyScaleVector.Y)

	//scale accessories
	ScaleAccessories(bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow, rig)

	self.bodyScale = bodyScaleVector
	self.headScale = headScaleVector.X

	//build up joints
	BuildJoints(self)

    return self
}

function pivot_rgb(n) {
	if (n > 0.04045) {
		n = Math.pow((n + 0.055) / 1.055, 2.4)
    } else {
		n = n / 12.92
    }
	return n * 100
}

function deg2Rad(deg) {
	return deg * Math.PI / 180.0;
}

function rgb_to_xyz(c) {
	let var_R = pivot_rgb(c.r)
	let var_G = pivot_rgb(c.g)
	let var_B = pivot_rgb(c.b)

	// For Observer = 2 degrees, Illuminant = D65
	let xyz = {}
	xyz.x = var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805
	xyz.y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722
	xyz.z = var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505

	return xyz
}

function pivot_xyz(n) {
	if (n > 0.008856) {
		n = Math.pow(n, 1.0/3.0)
    } else {
		n = (7.787 * n) + (16.0 / 116.0)
    }
	return n
}

function xyz_to_Lab(xyz) {
	let ReferenceX = 95.047
	let ReferenceY = 100.0
	let ReferenceZ = 108.883

	let var_X = pivot_xyz(xyz.x / ReferenceX)
	let var_Y = pivot_xyz(xyz.y / ReferenceY)
	let var_Z = pivot_xyz(xyz.z / ReferenceZ)

	let CIELab = {}
	CIELab.L = Math.max(0, ( 116 * var_Y ) - 16)
	CIELab.a = 500 * ( var_X - var_Y )
	CIELab.b = 200 * ( var_Y - var_Z )

	return CIELab
}

function rgb_to_Lab(c) {
	let xyz = rgb_to_xyz(c)
	let Lab = xyz_to_Lab(xyz)
	return Lab
}

function delta_CIEDE2000(c1, c2) { //Source: https://github.com/Roblox/avatar/blob/main/InGameAvatarEditor/src/ServerScriptService/AvatarEditorInGameSetup/AvatarEditorInGame/Modules/AvatarExperience/AvatarEditor/Utils.lua#L184
    console.log(c1)
    let lab1 = rgb_to_Lab(c1)
	let lab2 = rgb_to_Lab(c2)
    console.log(lab1)

	let k_L = 1.0 // lightness
	let k_C = 1.0 // chroma
	let k_H = 1.0 // hue
	let deg360InRad = deg2Rad(360.0)
	let deg180InRad = deg2Rad(180.0)
	let pow25To7 = 6103515625.0 // ; /* pow(25, 7) */

	// Step 1
	// /* Equation 2 */
	let C1 = Math.sqrt((lab1.a * lab1.a) + (lab1.b * lab1.b))
	let C2 = Math.sqrt((lab2.a * lab2.a) + (lab2.b * lab2.b))
	// /* Equation 3 */
	let barC = (C1 + C2) / 2.0
	// /* Equation 4 */
	let G = 0.5 * (1 - Math.sqrt(Math.pow(barC, 7) / (Math.pow(barC, 7) + pow25To7)))
	// /* Equation 5 */
	let a1Prime = (1.0 + G) * lab1.a
	let a2Prime = (1.0 + G) * lab2.a
	// /* Equation 6 */
	let CPrime1 = Math.sqrt((a1Prime * a1Prime) + (lab1.b * lab1.b))
	let CPrime2 = Math.sqrt((a2Prime * a2Prime) + (lab2.b * lab2.b))
	// /* Equation 7 */
	let hPrime1
	if (lab1.b == 0 && a1Prime == 0) {
		hPrime1 = 0.0
    } else {
		hPrime1 = Math.atan2(lab1.b, a1Prime)
		///*
		 //* This must be converted to a hue angle in degrees between 0
		 //* and 360 by addition of 2􏰏 to negative hue angles.
		 //*/
		if (hPrime1 < 0) {
			hPrime1 = hPrime1 + deg360InRad
        }
    }

	let hPrime2
	if (lab2.b == 0 && a2Prime == 0) {
		hPrime2 = 0.0
    } else {
		hPrime2 = Math.atan2(lab2.b, a2Prime)
		///*
		 //* This must be converted to a hue angle in degrees between 0
		 //* and 360 by addition of 2􏰏 to negative hue angles.
		 //*/
		if (hPrime2 < 0) {
			hPrime2 = hPrime2 + deg360InRad
        }
    }

	 // * Step 2
	// /* Equation 8 */
	let deltaLPrime = lab2.L - lab1.L
	// /* Equation 9 */
	let deltaCPrime = CPrime2 - CPrime1
	// /* Equation 10 */
	let deltahPrime
	let CPrimeProduct = CPrime1 * CPrime2
	if (CPrimeProduct == 0) {
		deltahPrime = 0
    } else {
		///* Avoid the fabs() call */
		deltahPrime = hPrime2 - hPrime1
		if (deltahPrime < -deg180InRad) {
			deltahPrime = deltahPrime + deg360InRad
        } else if (deltahPrime > deg180InRad) {
			deltahPrime = deltahPrime - deg360InRad
        }
    }

	///* Equation 11 */
	let deltaHPrime = 2.0 * Math.sqrt(CPrimeProduct) * Math.sin(deltahPrime / 2.0)

	 // * Step 3
	// /* Equation 12 */
	let barLPrime = (lab1.L + lab2.L) / 2.0
	// /* Equation 13 */
	let barCPrime = (CPrime1 + CPrime2) / 2.0
	// /* Equation 14 */
	let barhPrime
	let hPrimeSum = hPrime1 + hPrime2
	if (CPrime1 * CPrime2 == 0) {
		barhPrime = hPrimeSum
    } else {
		if (Math.abs(hPrime1 - hPrime2) <= deg180InRad) {
			barhPrime = hPrimeSum / 2.0
        } else {
			if (hPrimeSum < deg360InRad) {
				barhPrime = (hPrimeSum + deg360InRad) / 2.0
            } else {
				barhPrime = (hPrimeSum - deg360InRad) / 2.0
            }
        }
    }

	// /* Equation 15 */
	let T = 1.0 - (0.17 * Math.cos(barhPrime - deg2Rad(30.0))) +
		(0.24 * Math.cos(2.0 * barhPrime)) +
		(0.32 * Math.cos((3.0 * barhPrime) + deg2Rad(6.0))) -
		(0.20 * Math.cos((4.0 * barhPrime) - deg2Rad(63.0)))
	// /* Equation 16 */
	let deltaTheta = deg2Rad(30.0) *
		Math.exp(-Math.pow((barhPrime - deg2Rad(275.0)) / deg2Rad(25.0), 2.0))
	// /* Equation 17 */
	let R_C = 2.0 * Math.sqrt(Math.pow(barCPrime, 7.0) /
		(Math.pow(barCPrime, 7.0) + pow25To7))
	// /* Equation 18 */
	let S_L = 1 + ((0.015 * Math.pow(barLPrime - 50.0, 2.0)) /
		Math.sqrt(20 + Math.pow(barLPrime - 50.0, 2.0)))
	// /* Equation 19 */
	let S_C = 1 + (0.045 * barCPrime)
	// /* Equation 20 */
	let S_H = 1 + (0.015 * barCPrime * T)
	// /* Equation 21 */
	let R_T = (-Math.sin(2.0 * deltaTheta)) * R_C

	// /* Equation 22 */
	let deltaE = Math.sqrt(
		Math.pow(deltaLPrime / (k_L * S_L), 2.0) +
		Math.pow(deltaCPrime / (k_C * S_C), 2.0) +
		Math.pow(deltaHPrime / (k_H * S_H), 2.0) +
		(R_T * (deltaCPrime / (k_C * S_C)) * (deltaHPrime / (k_H * S_H))))

	return deltaE
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

class Instance {
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

class RBX {

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

window.RBX = RBX
window.CFrame = CFrame
window.ScaleAccessoryForRig = (accessory, rig, outfit) => {
    let scale = outfit.scale

    if (outfit.playerAvatarType === AvatarType.R6) {
        console.log("SCALING FOR R6")
		ScaleAccessory(accessory, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig)
	} else {
        console.log("SCALING FOR R15")
        //scale parts
        let bodyScaleVector = Vector3.new(
            scale.width,
            scale.height,
            scale.depth
        )
        let headScaleVector = Vector3.new(scale.head, scale.head, scale.head)

        //scale accessories
        ScaleAccessory(accessory, bodyScaleVector, headScaleVector, scale.bodyType, scale.proportion, rig)
    }
}

export { ScaleCharacter, ScaleAccessory }