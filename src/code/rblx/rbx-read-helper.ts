import { SimpleView } from "../lib/simple-view";

function bitsToFloat32(bitString: string) {
    // Ensure the bit string is exactly 32 bits long
    bitString = bitString.padStart(32, "0").slice(-32);
    
    // Validate that the string contains only '0' or '1'
    for (let i = 0; i < 32; ++i) {
        if (bitString[i] !== '0' && bitString[i] !== '1') {
            throw new Error("A 32-bit string is expected.");
        }
    }
    
    // Create a 4-byte ArrayBuffer
    var buffer = new ArrayBuffer(4);
    // Create a Uint8Array view on the buffer to manipulate each byte
    var uint8View = new Uint8Array(buffer);
    
    // Convert the 32-bit string into bytes and store them in the buffer
    for (let i = 32, byteIndex = 0; i > 0; i -= 8) {
        uint8View[byteIndex++] = parseInt(bitString.substring(i - 8, i), 2);
    }
    
    // Convert the buffer back into a float32
    return new Float32Array(buffer)[0];
}

class RBXSimpleView {
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

        let stringBuffer = new TextEncoder().encode(value).buffer
        let stringSimpleView = new SimpleView(stringBuffer)

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
        let string = new TextDecoder().decode(new Uint8Array(this.view.buffer).subarray(this.viewOffset, this.viewOffset + stringLength))
        
        this.viewOffset += stringLength

        return string
    }

    /*writeFloat32(value: number, littleEndian: boolean = true) {
        this.lockCheck()

        throw new Error("NOT IMPLEMENTED")
    }*/

    readFloat32(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getUint32(this.viewOffset, littleEndian)

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
        let bitsValue = value.toString(2).padStart(32, '0')
        let signBit = bitsValue.at(31)
        let newBitsValue = signBit + bitsValue.substring(0,31)

        let valueFloat = bitsToFloat32(newBitsValue)

        this.viewOffset += 4
        
        return valueFloat
    }

    readNormalFloat32(littleEndian = true) {
        let value = this.view.getFloat32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    readFloat64(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getFloat64(this.viewOffset, littleEndian)

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

        let value = this.view.getInt32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    readInt64(littleEndian = true) {
        this.lockCheck()

        let value = this.view.getBigInt64(this.viewOffset, littleEndian)
        this.viewOffset += 8
        
        return value
    }
    
    readInterleaved32(length: number, littleEndian = true, readFunc = "readInt32", byteOffset = 4) {
        this.lockCheck()

        length *= byteOffset

        let newBuffer = new ArrayBuffer(length)
        let newView = new RBXSimpleView(newBuffer)
        
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

        let outputArray = []

        for (let i = 0; i < length / byteOffset; i++) {
            outputArray.push((newView as any)[readFunc](littleEndian))
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

        let value = this.view.getUint32(this.viewOffset, littleEndian)
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

        let value = this.view.getInt16(this.viewOffset, littleEndian)
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

        let value = this.view.getUint16(this.viewOffset, littleEndian)
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

        let value = this.view.getInt8(this.viewOffset)
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

        let value = this.view.getUint8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }
}

export { bitsToFloat32, RBXSimpleView }