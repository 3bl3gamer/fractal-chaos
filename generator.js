/** @typedef {{x:number, y:number, prob?:number}} Point */
/** @typedef {Uint16Array|Uint32Array} PixBuffer */
/** @typedef {(pixBuf:PixBuffer, point:Point, cur:{x:number, y:number}, prevX:number, prevY:number) => number} ColorFunc */

/**
 * @param {(percents:number, pointsCount:number, startDate:Date) => void} onProgress
 */
function FGenerator(onProgress) {
	let w = 1
	let h = 1
	let pixBuf = /** @type {PixBuffer} */ (new Uint16Array(1))
	let maxPixValue = 256 * 256 - 512
	let dotsCount = 0
	const points = /** @type {Point[]} */ ([])

	/**
	 * @param {number} n
	 * @param {number} nCenter
	 * @param {boolean} clear
	 */
	function genPoints(n, nCenter = 0, clear = true) {
		if (clear) points.length = 0
		for (let i = 0; i < n; i++)
			points.push({
				x: 0.5 + Math.cos(((i / n) * 2 - 0.5) * Math.PI) * FGenerator.POINT_GEN_R,
				y: 0.5 + Math.sin(((i / n) * 2 - 0.5) * Math.PI) * FGenerator.POINT_GEN_R,
			})
		for (let i = 0; i < nCenter; i++) points.push({ x: 0.5, y: 0.5 })
	}

	/**
	 * @param {PixBuffer} pixBuf
	 * @param {number} pos
	 * @param {number} r
	 * @param {number} g
	 * @param {number} b
	 * @returns {number}
	 */
	function addRGB(pixBuf, pos, r, g, b) {
		return Math.max(
			(pixBuf[pos + 0] += r), //
			(pixBuf[pos + 1] += g),
			(pixBuf[pos + 2] += b),
		)
		// pixBuf[pos + 0] = Math.min(pixBuf[pos + 0] + r, maxPixValue)
		// pixBuf[pos + 1] = Math.min(pixBuf[pos + 1] + g, maxPixValue)
		// pixBuf[pos + 2] = Math.min(pixBuf[pos + 2] + b, maxPixValue)
	}

	let prevAngle = 0
	/** @type {ColorFunc} */
	function addColorHSL(pixBuf, point, cur, prevX, prevY) {
		const angle = Math.atan2(prevY - point.y, prevX - point.x)
		let da = (prevAngle - angle + 2 * Math.PI) % (2 * Math.PI)
		if (da > Math.PI) da = 2 * Math.PI - da
		prevAngle = angle
		const dak = Math.abs(da) / Math.PI
		const [r, g, b] = hslToRgb(dak, 1, 0.5)
		const pos = (((cur.x * w) | 0) + ((cur.y * h) | 0) * w) * 4
		return addRGB(pixBuf, pos, r, g, b)
	}
	/** @type {ColorFunc} */
	function addColorHSL2(pixBuf, point, cur, prevX, prevY) {
		const angle = Math.atan2(prevY - point.y, prevX - point.x)
		let da = (prevAngle - angle + 2 * Math.PI) % (2 * Math.PI)
		prevAngle = angle
		const dak = Math.abs(da) / Math.PI
		const [r, g, b] = hslToRgb(dak, 1, 0.5)
		const pos = (((cur.x * w) | 0) + ((cur.y * h) | 0) * w) * 4
		return addRGB(pixBuf, pos, r, g, b)
	}
	/** @type {ColorFunc} */
	function addColorHSL3(pixBuf, point, cur, prevX, prevY) {
		const angle = Math.atan2(prevY - point.y, prevX - point.x)
		let da = (prevAngle - angle + 2 * Math.PI) % (2 * Math.PI)
		if (da > Math.PI) da = 2 * Math.PI - da
		prevAngle = angle
		const dak = Math.abs(da) / Math.PI
		const [r, g, b] = hslToRgb(dak, 1, 0.5)
		const pos = (((prevX * w) | 0) + ((prevY * h) | 0) * w) * 4
		return addRGB(pixBuf, pos, r, g, b)
	}
	/** @type {ColorFunc} */
	function addColorMono(pixBuf, point, cur, prevX, prevY) {
		const pos = (((cur.x * w) | 0) + ((cur.y * h) | 0) * w) * 4
		return addRGB(pixBuf, pos, 255, 255, 255)
	}

	/**
	 * @param {{x:number, y:number}} cur
	 * @param {ColorFunc} colFunc
	 * @param {number} offsetK
	 * @param {number} n
	 */
	function runDot(cur, colFunc, offsetK, n) {
		let maxVal = 0
		let i = n
		while (--i > 0) {
			let p = points[(Math.random() * points.length) | 0]
			while (p.prob !== undefined && Math.random() > p.prob) {
				p = points[(Math.random() * points.length) | 0]
			}

			const prevX = cur.x
			const prevY = cur.y
			cur.x = lerp(cur.x, p.x, offsetK)
			cur.y = lerp(cur.y, p.y, offsetK)

			const curMaxVal = colFunc(pixBuf, p, cur, prevX, prevY)
			if (curMaxVal > maxVal) maxVal = curMaxVal
			if (curMaxVal > maxPixValue) break
		}
		dotsCount += n - i
		return maxVal
	}

	let abortController = /** @type {AbortController|null} */ (null)
	/**
	 * @param {ColorFunc} colFunc
	 * @param {number} numIters
	 * @param {number} offsetK
	 */
	async function run(colFunc, numIters, offsetK) {
		if (abortController !== null && !abortController.signal.aborted) throw new Error('already running')
		const curAC = (abortController = new AbortController())

		const curPoint = { x: points[0].x, y: points[0].y }
		const startDate = new Date()

		while (true) {
			await sleep(1)
			if (curAC.signal.aborted) break

			const maxVal = runDot(curPoint, colFunc, offsetK, numIters)
			const percent = Math.min(99.999, (maxVal / maxPixValue) * 100)
			onProgress(percent, dotsCount, startDate)
			if (maxVal >= maxPixValue) break
		}
		onProgress(100, dotsCount, startDate)

		if (curAC === abortController) abortController = null
	}
	function abort() {
		if (abortController !== null) abortController.abort()
	}

	/**
	 * @param {Uint8ClampedArray} pix
	 * @param {'max'|'avg'} brightnessMode
	 * @param {number} brightnessK
	 */
	function copyPixTo(pix, brightnessMode, brightnessK) {
		let k
		if (brightnessMode === 'max') {
			let max = 0
			for (let i = 0; i < pixBuf.length; i += 4) {
				if (pixBuf[i + 0] > max) max = pixBuf[i + 0]
				if (pixBuf[i + 1] > max) max = pixBuf[i + 1]
				if (pixBuf[i + 2] > max) max = pixBuf[i + 2]
			}
			k = (255 / max) * brightnessK
		} else {
			let sum = 0
			for (let i = 0; i < pixBuf.length; i += 4) {
				const r = pixBuf[i + 0]
				const g = pixBuf[i + 1]
				const b = pixBuf[i + 2]
				sum += ((r << 11) + (g << 12) + ((b + g) << 10)) >> 13
			}
			const avg = sum / (pixBuf.length / 4)
			k = (255 / avg / 18) * brightnessK
		}

		if (false) {
			for (let i = 0; i < pixBuf.length; i += 4) {
				pix[i + 0] = ((pixBuf[i + 0] * k) / 255) ** 0.75 * 255
				pix[i + 1] = ((pixBuf[i + 1] * k) / 255) ** 0.75 * 255
				pix[i + 2] = ((pixBuf[i + 2] * k) / 255) ** 0.75 * 255
			}
		} else {
			for (let i = 0; i < pixBuf.length; i += 4) {
				pix[i + 0] = pixBuf[i + 0] * k
				pix[i + 1] = pixBuf[i + 1] * k
				pix[i + 2] = pixBuf[i + 2] * k
			}
		}
	}

	/** @param {number} value */
	function setMaxPixValue(value) {
		maxPixValue = value
		const destBufType = maxPixValue <= 256 * 256 - 512 ? Uint16Array : Uint32Array
		if (pixBuf.constructor !== destBufType) pixBuf = new destBufType(pixBuf.length)
	}
	/** @param {number} newSize */
	function resize(newSize) {
		w = h = newSize
		// @ts-ignore
		pixBuf = new pixBuf.constructor(w * h * 4)
	}
	function clear() {
		pixBuf.fill(0)
		dotsCount = 0
	}

	this.run = run
	this.abort = abort
	this.genPoints = genPoints
	this.copyPixTo = copyPixTo
	this.setMaxPixValue = setMaxPixValue
	this.resize = resize
	this.clear = clear
	this.getSize = () => /** @type {[Number, number]} */ ([w, h])
	this.getPixCount = () => w * h
	this.getPoints = () => points
	this.colorFuncs = {
		HSL: addColorHSL,
		HSL2: addColorHSL2,
		HSL3: addColorHSL3,
		mono: addColorMono,
	}
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} k
 * @returns {number}
 */
function lerp(a, b, k) {
	return a + (b - a) * k
}

/**
 * @param {number} mills
 * @returns {Promise<void>}
 */
function sleep(mills) {
	return new Promise(res => {
		setTimeout(res, mills)
	})
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l) {
	var r, g, b

	if (s == 0) {
		r = g = b = l // achromatic
	} else {
		var hue2rgb = function hue2rgb(p, q, t) {
			if (t < 0) t += 1
			if (t > 1) t -= 1
			if (t < 1 / 6) return p + (q - p) * 6 * t
			if (t < 1 / 2) return q
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
			return p
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s
		var p = 2 * l - q
		r = hue2rgb(p, q, h + 1 / 3)
		g = hue2rgb(p, q, h)
		b = hue2rgb(p, q, h - 1 / 3)
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}
FGenerator.POINT_GEN_R = 0.45

if (typeof exports !== 'undefined') {
	// if VSCode sees 'exports' variable, it assumes file is CommonJS and makes local definitions
	// unaccessible in index.js (without manual import/require, which I don't want now)
	eval('exports.FGenerator = FGenerator')
}
