import SimpleView from "../lib/simple-view"
import { bitsToFloat32 } from "./rbx-read-helper"

export default class RBXSimpleView {
    view
    viewOffset
    buffer
    locked = false

    constructor (buffer: ArrayBuffer) {
        this.view = new DataView(buffer)
        this.buffer = buffer
        this.viewOffset = 0
    }

    lock() {
        this.locked = true
    }

    unlock() {
        this.locked = false
    }

    lockCheck() {
        if (this.locked) {
            throw new Error("This RBXSimpleView is locked")
        }
    }

    writeUtf8String(value: string) {
        this.lockCheck()

        const stringBuffer = new TextEncoder().encode(value).buffer
        const stringSimpleView = new SimpleView(stringBuffer)

        this.writeUint32(stringBuffer.byteLength)

        for (let i = 0; i < stringBuffer.byteLength; i++) {
            this.writeUint8(stringSimpleView.readUint8())
        }
    }

    readUtf8String(stringLength: number) {
        this.lockCheck()

        if (!stringLength) {
            stringLength = this.readUint32()
        }
        const string = new TextDecoder().decode(new Uint8Array(this.view.buffer).subarray(this.viewOffset, this.viewOffset + stringLength))
        
        this.viewOffset += stringLength

        return string
    }

    /*writeFloat32(value: number, littleEndian: boolean = true) {
        this.lockCheck()

        throw new Error("NOT IMPLEMENTED")
    }*/

    readFloat32(littleEndian = true) {
        this.lockCheck()

        const value = this.view.getUint32(this.viewOffset, littleEndian)

        //convert from roblox float to actual float
        /*
        //this did the exact opposite of what it was supposed to do
        let bitsValue = value.toString(2).padStart(32, '0')
        console.log(bitsValue)
        let signBit = bitsValue.at(0)
        let newBitsValue = bitsValue.substring(1) + signBit
        console.log(newBitsValue)

        let valueFloat = bitsToFloat32(newBitsValue)
        console.log(valueFloat)
        */
        const bitsValue = value.toString(2).padStart(32, '0')
        const signBit = bitsValue.at(31)
        const newBitsValue = signBit + bitsValue.substring(0,31)

        const valueFloat = bitsToFloat32(newBitsValue)

        this.viewOffset += 4
        
        return valueFloat
    }

    readNormalFloat32(littleEndian = true) {
        const value = this.view.getFloat32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    readFloat64(littleEndian = true) {
        this.lockCheck()

        const value = this.view.getFloat64(this.viewOffset, littleEndian)

        this.viewOffset += 8

        return value
    }

    writeInt32(value: number, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, -2147483648)
        value = Math.min(value, 2147483647)

        this.view.setInt32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readInt32(littleEndian = true) {
        this.lockCheck()

        const value = this.view.getInt32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    readInt64(littleEndian = true) {
        this.lockCheck()

        const value = this.view.getBigInt64(this.viewOffset, littleEndian)
        this.viewOffset += 8
        
        return value
    }
    
    readInterleaved32(length: number, littleEndian = true, readFunc = "readInt32", byteOffset = 4) {
        this.lockCheck()

        length *= byteOffset

        const newBuffer = new ArrayBuffer(length)
        const newView = new RBXSimpleView(newBuffer)
        
        /*
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < length / 4; j++) {
                newView.viewOffset = i + j * 4
                newView.writeUint8(this.readUint8())
            }
        }
        */

        for (let i = 0; i < byteOffset; i++) {
            newView.viewOffset = i
            for (let j = 0; j < length / byteOffset; j++) {
                newView.writeUint8(this.readUint8())
                newView.viewOffset += byteOffset - 1
            }
        }

        newView.viewOffset = 0

        const outputArray = []

        for (let i = 0; i < length / byteOffset; i++) {
            outputArray.push((newView as unknown as {[K in string]: (isLittleEndian: boolean) => number})[readFunc](littleEndian))
        }

        return outputArray
    }

    writeUint32(value: number, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, 0)
        value = Math.min(value, 4294967295)

        this.view.setUint32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readUint32(littleEndian = true) {
        this.lockCheck()

        const value = this.view.getUint32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeInt16(value: number, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, -32768)
        value = Math.min(value, 32767)

        this.view.setInt16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readInt16(littleEndian = true) {
        this.lockCheck()

        const value = this.view.getInt16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeUint16(value: number, littleEndian = true) {
        this.lockCheck()

        value = Math.max(value, 0)
        value = Math.min(value, 65535)

        this.view.setUint16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readUint16(littleEndian = true) {
        this.lockCheck()

        const value = this.view.getUint16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeInt8(value: number) {
        this.lockCheck()

        value = Math.max(value, -128)
        value = Math.min(value, 127)

        this.view.setInt8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readInt8() {
        this.lockCheck()

        const value = this.view.getInt8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }

    writeUint8(value: number) {
        this.lockCheck()

        value = Math.max(value, 0)
        value = Math.min(value, 255)

        this.view.setUint8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readUint8() {
        this.lockCheck()

        const value = this.view.getUint8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }
}
