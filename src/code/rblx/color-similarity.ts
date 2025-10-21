function pivot_rgb(n) {
	if (n > 0.04045) {
		n = Math.pow((n + 0.055) / 1.055, 2.4)
    } else {
		n = n / 12.92
    }
	return n * 100
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
	let deg360InRad = rad(360.0)
	let deg180InRad = rad(180.0)
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
	let T = 1.0 - (0.17 * Math.cos(barhPrime - rad(30.0))) +
		(0.24 * Math.cos(2.0 * barhPrime)) +
		(0.32 * Math.cos((3.0 * barhPrime) + rad(6.0))) -
		(0.20 * Math.cos((4.0 * barhPrime) - rad(63.0)))
	// /* Equation 16 */
	let deltaTheta = rad(30.0) *
		Math.exp(-Math.pow((barhPrime - rad(275.0)) / rad(25.0), 2.0))
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