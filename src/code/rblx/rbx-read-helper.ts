import type RBXSimpleView from "./rbx-simple-view";

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
    const buffer = new ArrayBuffer(4);
    // Create a Uint8Array view on the buffer to manipulate each byte
    const uint8View = new Uint8Array(buffer);
    
    // Convert the 32-bit string into bytes and store them in the buffer
    for (let i = 32, byteIndex = 0; i > 0; i -= 8) {
        uint8View[byteIndex++] = parseInt(bitString.substring(i - 8, i), 2);
    }
    
    // Convert the buffer back into a float32
    return new Float32Array(buffer)[0];
}

/*function convert_byte_array_to_int_array(array) {
     const output_array = [];
     for (const byte of array) {
        output_array.push(parseInt(byte, 16));
     }
     return output_array;
}*/

function untransformInt32(num: number) {
    if (num % 2 === 0) {
        num /= 2
    } else {
        num = -(num + 1) / 2
    }

    return num
}

function untransformInt64(num: bigint) {
    if (num % 2n === 0n) {
        num /= 2n
    } else {
        num = -(num + 1n) / 2n
    }

    return num
}

function readReferents(length: number, chunkView: RBXSimpleView) {
    const referents = chunkView.readInterleaved32(length, false) as number[]
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

function intToRgb(colorInt: number) {
  const R = (colorInt >> 16) & 0xFF; // Extract red component
  const G = (colorInt >> 8) & 0xFF;  // Extract green component
  const B = colorInt & 0xFF;         // Extract blue component

  return { R, G, B };
}

/*function rotationMatrixToEulerAnglesOLD(R) { //https://learnopencv.com/rotation-matrix-to-euler-angles/
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
 
    return [deg(x), deg(y), deg(z), singular]
}*/

export { bitsToFloat32, untransformInt32, untransformInt64, readReferents, intToRgb }