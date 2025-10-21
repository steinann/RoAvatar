import type { Vec3 } from "../rblx/mesh";

function download(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

const saveByteArray = (function () {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.setAttribute("style","display: none;")
    return function (data: BlobPart[] | undefined, name: string) {
        const blob = new Blob(data, {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

function generateUUIDv4(): string {
    // Generate a random UUID (version 4)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function rad(degrees: number) {
    return degrees / 180 * Math.PI
}

function deg(radians: number) {
    return radians * 180 / Math.PI
}

function lerp(a: number,b: number,t: number) {
	return a + (b - a) * t
}

function specialClamp(value: number, min: number, max: number ) {
    return Math.max( min, Math.min( max, value ) );
}

function rotationMatrixToEulerAngles(te: number[], order = "YXZ"): Vec3 { //from THREE.js
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

    return [deg(x),deg(y),deg(z)];
}

export { download, saveByteArray, generateUUIDv4, rad, deg, lerp, specialClamp, rotationMatrixToEulerAngles }