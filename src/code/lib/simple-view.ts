export class SimpleView {
    view
    viewOffset
    buffer

    constructor (buffer: ArrayBuffer) {
        this.view = new DataView(buffer)
        this.buffer = buffer
        this.viewOffset = 0
    }

    writeUtf8String(value: string) {
        const stringBuffer = new TextEncoder().encode(value).buffer
        const stringSimpleView = new SimpleView(stringBuffer)

        this.writeUint32(stringBuffer.byteLength)

        for (let i = 0; i < stringBuffer.byteLength; i++) {
            this.writeUint8(stringSimpleView.readUint8())
        }
    }

    readUtf8String(stringLength?: number) {
        if (!stringLength) {
            stringLength = this.readUint32()
        }
        const string = new TextDecoder().decode(new Uint8Array(this.view.buffer).subarray(this.viewOffset, this.viewOffset + stringLength))
        
        this.viewOffset += stringLength

        return string
    }

    writeFloat32(value: number, littleEndian = true) {
        value = Math.max(value, -340282346638528859811704183484516925440.0)
        value = Math.min(value, 340282346638528859811704183484516925440.0)

        this.view.setFloat32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readFloat32(littleEndian = true) {
        const value = this.view.getFloat32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeInt32(value: number, littleEndian = true) {
        value = Math.max(value, -2147483648)
        value = Math.min(value, 2147483647)

        this.view.setInt32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readInt32(littleEndian = true) {
        const value = this.view.getInt32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeUint32(value: number, littleEndian = true) {
        value = Math.max(value, 0)
        value = Math.min(value, 4294967295)

        this.view.setUint32(this.viewOffset, value, littleEndian)
        this.viewOffset += 4
    }

    readUint32(littleEndian = true) {
        const value = this.view.getUint32(this.viewOffset, littleEndian)
        this.viewOffset += 4
        
        return value
    }

    writeInt16(value: number, littleEndian = true) {
        value = Math.max(value, -32768)
        value = Math.min(value, 32767)

        this.view.setInt16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readInt16(littleEndian = true) {
        const value = this.view.getInt16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeUint16(value: number, littleEndian = true) {
        value = Math.max(value, 0)
        value = Math.min(value, 65535)

        this.view.setUint16(this.viewOffset, value, littleEndian)
        this.viewOffset += 2
    }

    readUint16(littleEndian = true) {
        const value = this.view.getUint16(this.viewOffset, littleEndian)
        this.viewOffset += 2
        
        return value
    }

    writeInt8(value: number) {
        value = Math.max(value, -128)
        value = Math.min(value, 127)

        this.view.setInt8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readInt8() {
        const value = this.view.getInt8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }

    writeUint8(value: number) {
        value = Math.max(value, 0)
        value = Math.min(value, 255)

        this.view.setUint8(this.viewOffset, value)
        this.viewOffset += 1
    }

    readUint8() {
        const value = this.view.getUint8(this.viewOffset)
        this.viewOffset += 1
        
        return value
    }
}