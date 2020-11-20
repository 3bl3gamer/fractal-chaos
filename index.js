const size4kSwitch = getById('size-4k-switch', HTMLInputElement)
const size1kSwitch = getById('size-1k-switch', HTMLInputElement)
const sizeDefaultSwitch = getById('size-default-switch', HTMLInputElement)
const screenSizeBox = getById('screen-size-box', HTMLSpanElement)

const colorDirToHueSwitch = getById('color-dir-to-hue-switch', HTMLInputElement)
const colorDirToHue2Switch = getById('color-dir-to-hue-2-switch', HTMLInputElement)
const colorDirToHue3Switch = getById('color-dir-to-hue-3-switch', HTMLInputElement)
const colorMonochromeSwitch = getById('color-monochrome-switch', HTMLInputElement)
const brightnessRange = getById('brightness-range', HTMLInputElement)
const brightnessValueBox = getById('brightness-value-box', HTMLSpanElement)

const pointsCountInput = getById('points-count-input', HTMLInputElement)
const iterOffsetRange = getById('iter-offset-range', HTMLInputElement)
const iterOffsetInput = getById('iter-offset-input', HTMLInputElement)

const speedRange = getById('speed-range', HTMLInputElement)

const bufferFillingProgressBox = getById('buffer-filling-progress-box', HTMLDivElement)
const elapsedTimeBox = getById('elapsed-time-box', HTMLSpanElement)
const dotsCountBox = getById('dots-count-box', HTMLSpanElement)

const canvas = getById('canvas', HTMLCanvasElement)
const rc = mustBeNotNull(canvas.getContext('2d'))

/** @typedef {{x:number, y:number, prob?:number}} Point */

let w = 1
let h = 1

let iData = /** @type {ImageData|null} */ (null)
let pixBuf = /** @type {Uint16Array|Uint32Array} */ (new Uint16Array(1))
let maxPixValue = 256 * 256 - 512

const POINT_GEN_R = 0.45
const points = /** @type {Point[]} */ ([])
const curPoint = /** @type {Point} */ ({ x: 0, y: 0 })

let startDate = new Date()
let dotsCount = 0

let brightnessMode = /** @type {'max'|'avg'} */ ('max')

document.addEventListener('DOMContentLoaded', () => resize())
window.onresize = () => resize()

size4kSwitch.onchange = size1kSwitch.onchange = sizeDefaultSwitch.onchange = () => {
	resize()
}

colorDirToHueSwitch.onchange = colorDirToHue2Switch.onchange = colorDirToHue3Switch.onchange = colorMonochromeSwitch.onchange = () => {
	clear()
	runGenerator()
}

brightnessValueBox.textContent = (+brightnessRange.value).toFixed(1)
brightnessRange.oninput = () => {
	brightnessValueBox.textContent = (+brightnessRange.value).toFixed(1)
	requestRedraw()
}

genPoints(+pointsCountInput.value)
pointsCountInput.oninput = () => {
	if (pointsCountInput.value === '') return
	genPoints(+pointsCountInput.value)
	clear()
	runGenerator()
}

iterOffsetRange.oninput = () => {
	iterOffsetInput.value = iterOffsetRange.value
	clear()
	runGenerator()
}
iterOffsetInput.oninput = () => {
	iterOffsetRange.value = iterOffsetInput.value
	clear()
	runGenerator()
}

getById('preset-3', HTMLAnchorElement).onclick = () => {
	colorMonochromeSwitch.checked = true
	setValue(brightnessRange, '1.5')
	setValue(pointsCountInput, '3')
	setValue(iterOffsetInput, '0.5')
	clear()
}
getById('preset-8-ext', HTMLAnchorElement).onclick = () => {
	colorMonochromeSwitch.checked = true
	setValue(brightnessRange, '1.5')
	setValue(pointsCountInput, '8')
	setValue(iterOffsetInput, 2 / 3 + '')
	//prettier-ignore
	const coords = [[0,0], [1,0], [2,0], [2,1], [2,2], [1,2], [0,2], [0,1]]
	points.length = 0
	points.push(...coords.map(x => ({ x: 0.05 + x[0] * 0.45, y: 0.05 + x[1] * 0.45 })))
	clear()
}
getById('preset-4', HTMLAnchorElement).onclick = () => {
	colorDirToHue2Switch.checked = true
	setValue(brightnessRange, '1.4')
	setValue(pointsCountInput, '4')
	setValue(iterOffsetInput, '0.54')
	clear()
}
getById('preset-4-plaid-fabric', HTMLAnchorElement).onclick = () => {
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '1.8')
	setValue(pointsCountInput, '4')
	setValue(iterOffsetInput, '0.46')
	clear()
}
getById('preset-5', HTMLAnchorElement).onclick = () => {
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '2.0')
	setValue(pointsCountInput, '5')
	setValue(iterOffsetInput, '0.5')
	clear()
}
getById('preset-6-hue', HTMLAnchorElement).onclick = () => {
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '5.0')
	setValue(pointsCountInput, '6')
	setValue(iterOffsetInput, '0.5')
	clear()
}
getById('preset-64-bublic', HTMLAnchorElement).onclick = () => {
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '1.5')
	setValue(pointsCountInput, '64')
	setValue(iterOffsetInput, '0.8')
	clear()
}
getById('preset-32-eye-apple', HTMLAnchorElement).onclick = () => {
	colorDirToHue2Switch.checked = true
	setValue(brightnessRange, '1.4')
	setValue(pointsCountInput, '32')
	setValue(iterOffsetInput, '0.7')
	clear()
}
getById('preset-12-ring-of-rings', HTMLAnchorElement).onclick = () => {
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '5.0')
	setValue(pointsCountInput, '12')
	setValue(iterOffsetInput, '0.7322')
	clear()
}
getById('preset-16-ring-of-rings', HTMLAnchorElement).onclick = () => {
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '3.5')
	setValue(pointsCountInput, '16')
	setValue(iterOffsetInput, '0.8')
	clear()
}
getById('preset-15-smth-curvy', HTMLAnchorElement).onclick = () => {
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '1.5')
	setValue(pointsCountInput, '15')
	setValue(iterOffsetInput, '0.6')
	clear()
}
getById('preset-6-tesseract', HTMLAnchorElement).onclick = () => {
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '4.0')
	setValue(pointsCountInput, '6')
	setValue(iterOffsetInput, '0.586')
	points.push({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })
	clear()
}
getById('preset-6-tesseract-frame', HTMLAnchorElement).onclick = () => {
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '3.0')
	setValue(pointsCountInput, '6')
	setValue(iterOffsetInput, '0.56')
	points.push({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })
	clear()
}

function clear() {
	pixBuf.fill(0)
	curPoint.x = points[0].x
	curPoint.y = points[0].y
	startDate = new Date()
	dotsCount = 0
}

function resize(newSize) {
	if (!newSize) {
		if (size4kSwitch.checked) {
			newSize = 4096
		} else if (size1kSwitch.checked) {
			newSize = 1024
		} else {
			const rect = canvas.getBoundingClientRect()
			newSize = Math.round(Math.min(rect.width, rect.height) * devicePixelRatio)
		}
	}
	if (newSize !== w || newSize !== h) {
		w = h = newSize
		screenSizeBox.textContent = w + ''
		canvas.width = w
		canvas.height = h
		rc.fillStyle = 'black'
		rc.fillRect(0, 0, w, h)
		rc.globalCompositeOperation = 'lighter'
		iData = rc.getImageData(0, 0, w, h)
		// @ts-ignore
		pixBuf = new pixBuf.constructor(w * h * 4)
		clear()
	}
	runGenerator()
}

function genPoints(n, nCenter = 0, clear = true) {
	if (clear) points.length = 0
	for (let i = 0; i < n; i++)
		points.push({
			x: 0.5 + Math.cos(((i / n) * 2 - 0.5) * Math.PI) * POINT_GEN_R,
			y: 0.5 + Math.sin(((i / n) * 2 - 0.5) * Math.PI) * POINT_GEN_R,
		})
	for (let i = 0; i < nCenter; i++) points.push({ x: 0.5, y: 0.5 })
}

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
function addColorHSL2(pixBuf, point, cur, prevX, prevY) {
	const angle = Math.atan2(prevY - point.y, prevX - point.x)
	let da = (prevAngle - angle + 2 * Math.PI) % (2 * Math.PI)
	prevAngle = angle
	const dak = Math.abs(da) / Math.PI
	const [r, g, b] = hslToRgb(dak, 1, 0.5)
	const pos = (((cur.x * w) | 0) + ((cur.y * h) | 0) * w) * 4
	return addRGB(pixBuf, pos, r, g, b)
}
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
function addColorMono(pixBuf, point, cur, prevX, prevY) {
	const pos = (((cur.x * w) | 0) + ((cur.y * h) | 0) * w) * 4
	return addRGB(pixBuf, pos, 255, 255, 255)
}

let generatorIsRunning = false
async function runGenerator() {
	if (generatorIsRunning) return
	generatorIsRunning = true

	requestRedraw()

	while (true) {
		// console.time('iter')
		const colFunc = colorDirToHueSwitch.checked
			? addColorHSL
			: colorDirToHue2Switch.checked
			? addColorHSL2
			: colorDirToHue3Switch.checked
			? addColorHSL3
			: addColorMono
		const numIters = Math.round(Math.pow(10, parseFloat(speedRange.value)) * 1000)
		const offsetK = parseFloat(iterOffsetInput.value)
		const maxVal = runDot(curPoint, colFunc, offsetK, numIters)
		// console.timeEnd('iter')

		requestRedraw()

		mustBeInstanceOf(bufferFillingProgressBox.querySelector('.bar'), HTMLElement).style.width =
			(maxVal / maxPixValue) * 100 + '%'
		elapsedTimeBox.textContent = formatDuration(startDate)
		dotsCountBox.textContent = dotsCount.toLocaleString()

		if (maxVal >= maxPixValue) break
		await sleep(1)
	}

	generatorIsRunning = false
}

let redrawRequested = false
function requestRedraw() {
	requestAnimationFrame(redraw)
	redrawRequested = true
}
function redraw() {
	redrawRequested = false

	// console.time('copy')
	// const brightnessK = 1 / Math.pow(2, +brightnessRange.max - +brightnessRange.value)
	const pix = mustBeNotNull(iData).data
	copyPix(pix, +brightnessRange.value)
	// console.timeEnd('copy')

	// console.time('put')
	rc.putImageData(mustBeNotNull(iData), 0, 0)
	// console.timeEnd('put')
}

function runDot(cur, colFunc, offsetK, n) {
	let maxVal = 0
	let i = n
	while (--i > 0) {
		let p = points[(Math.random() * points.length) | 0]
		while (p.prob !== undefined && Math.random() > p.prob) {
			p = points[(Math.random() * points.length) | 0]
		}

		// const angle = Math.atan2(cur.y - p.y, cur.x - p.x)
		// let da = (prevAngle - angle + 2 * Math.PI) % (2 * Math.PI)
		// if (da > Math.PI) da = 2 * Math.PI - da
		// prevAngle = angle
		// const dx = cur.x - p.x
		// const dy = cur.y - p.y
		// const dak = Math.abs(da) / Math.PI
		const prevX = cur.x
		const prevY = cur.y
		cur.x = lerp(cur.x, p.x, offsetK)
		cur.y = lerp(cur.y, p.y, offsetK)
		// const r = Math.min(255, Math.abs(cur.x - p.x))
		// const g = Math.min(255, Math.abs(cur.y - p.y))
		// const g = Math.sqrt(dx * dx + dy * dy) / Math.max(w, h)

		// const [r, g, b] = hslToRgb(dak, 1, 0.5)
		// const pos = (((cur.x * w) | 0) + ((cur.y * h) | 0) * w) * 4
		// pixBuf[pos + 0] += r
		// pixBuf[pos + 1] += g
		// pixBuf[pos + 2] += b
		// colFunc(pixBuf, p, cur, prevX, prevY)
		const curMaxVal = colFunc(pixBuf, p, cur, prevX, prevY)
		if (curMaxVal > maxVal) maxVal = curMaxVal
		if (curMaxVal > maxPixValue) break
		// dotsCount++
	}
	dotsCount += n - i
	return maxVal
}

function copyPix(pix, brightnessK) {
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
	for (let i = 0; i < pixBuf.length; i += 4) {
		pix[i + 0] = pixBuf[i + 0] * k
		pix[i + 1] = pixBuf[i + 1] * k
		pix[i + 2] = pixBuf[i + 2] * k
		// if (pixBuf[i + 0] > max) max = pixBuf[i + 0]
		// if (pixBuf[i + 1] > max) max = pixBuf[i + 1]
		// if (pixBuf[i + 2] > max) max = pixBuf[i + 2]
	}
	// return max
}

// function getMaxPixVal() {
// 	let maxVal = 0
// 	for (let i = 0; i < pixBuf.length; i += 4) {
// 		if (pixBuf[i + 0] > maxVal) maxVal = pixBuf[i + 0]
// 		if (pixBuf[i + 1] > maxVal) maxVal = pixBuf[i + 1]
// 		if (pixBuf[i + 2] > maxVal) maxVal = pixBuf[i + 2]
// 	}
// 	return maxVal
// }

function sleep(mills) {
	return new Promise(res => {
		setTimeout(res, mills)
	})
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
 * @param {Date} date
 * @returns {string}
 */
function formatDuration(date) {
	const delta = Math.floor((Date.now() - date.getTime()) / 1000)
	const seconds = delta % 60
	const minutes = Math.round(delta / 60)
	return (minutes === 0 ? '' : minutes + 'м ') + seconds + 'с'
}

/**
 * @template T
 * @param {T|null} val
 * @returns {T}
 */
function mustBeNotNull(val) {
	if (val === null) throw new Error('value must not be null')
	return val
}

/**
 * @template {{ new (...args: any): any }} T
 * @param {string} id
 * @param {T} class_
 * @returns {InstanceType<T>}
 */
function getById(id, class_) {
	const el = document.getElementById(id)
	if (el === null) throw new Error('no element with id ' + id)
	return mustBeInstanceOf(el, class_)
}

/**
 * @param {HTMLInputElement} elem
 * @param {string} value
 */
function setValue(elem, value) {
	elem.value = value
	elem.dispatchEvent(new Event('input', {}))
}

/**
 * @template {{ new (...args: any): any }[]} T
 * @param {unknown} obj
 * @param  {T} classes
 * @returns {InstanceType<T[number]>}
 */
function mustBeInstanceOf(obj, ...classes) {
	for (const class_ of classes) {
		if (obj instanceof class_) return obj
	}
	throw new Error(`object must be ${classes.map(x => x.name).join('|')}, got ${obj}`)
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

// ===

async function renderDemo() {
	const stream = canvas.captureStream(0)
	const recordedBlobs = []
	const options = { videoBitsPerSecond: 100 * 1000 * 1000, mimeType: 'video/webm;codecs=vp9' } //video/webm,codecs=vp9
	const mediaRecorder = new MediaRecorder(stream, options)

	mediaRecorder.onstart = () => console.log('recording started')
	mediaRecorder.onstop = handleStop
	mediaRecorder.ondataavailable = handleDataAvailable
	// @ts-ignore
	window.mediaRecorder = mediaRecorder

	function handleDataAvailable(event) {
		console.log('chunk', event.data.size)
		if (event.data && event.data.size > 0) {
			recordedBlobs.push(event.data)
		}
	}

	function handleStop() {
		const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' })
		if (true) {
			let video = document.createElement('video')
			video.src = URL.createObjectURL(superBuffer)
			video.controls = true
			video.style.position = 'absolute'
			video.style.zIndex = '100'
			document.body.appendChild(video)
			console.log('done, check video element somewhere at page bottom')
		}
		if (true) {
			let a = document.createElement('a')
			document.body.appendChild(a)
			a.style.display = 'none'
			a.href = URL.createObjectURL(superBuffer)
			a.download = 'dweet.webm'
			a.click()
			//document.body.removeChild(a);
			//URL.revokeObjectURL(a.href);
		}
	}

	// function stop() {
	// 	mediaRecorder.stop()
	// }

	function nextRedraw() {
		return new Promise(res => {
			requestAnimationFrame(res)
		})
	}
	function hev(val) {
		return val >= 0 ? 1 : 0
	}
	function hevRange(a, b, val) {
		return val >= a && val < b ? 1 : 0
	}
	function rangeSelect(a, b, v, v0, v1, v2) {
		return v < a ? v0 : v >= a && v < b ? v1 : v2
	}
	function ease(pos) {
		return (1 - Math.cos(pos * PI)) / 2
	}
	function easeIn(pos) {
		return 1 - Math.cos(pos * PIHalf)
	}
	function easeOut(pos) {
		return Math.sin(pos * PIHalf)
	}
	function squeezeBefore(pos, offset) {
		return pos < offset ? pos / offset : 1
	}
	function squeezeAfter(pos, offset) {
		return pos < offset ? 0 : (pos - offset) / (1 - offset)
	}
	function lerpOffset(a, b, k) {
		iterOffsetInput.value = lerp(a, b, k) + ''
	}
	function addPolar(point, r, a) {
		point.x += r * Math.cos(a)
		point.y += r * Math.sin(a)
	}
	function setPolar(point, xo, yo, xr, yr, a) {
		point.x = xo + xr * Math.cos(a)
		point.y = yo + yr * Math.sin(a)
	}
	function lerpPolar(point, xo, yo, xr, yr, a, pos) {
		point.x = lerp(point.x, xo + xr * Math.cos(a), pos)
		point.y = lerp(point.y, yo + yr * Math.sin(a), pos)
	}
	function addRotation(point, xo, yo, a) {
		const curA = Math.atan2(xo - point.y, yo - point.x)
		const r = Math.sqrt((xo - point.x) ** 2 + (yo - point.y) ** 2)
		setPolar(point, xo, yo, r, r, curA + a)
	}
	function addScale(point, xo, yo, s) {
		const a = Math.atan2(xo - point.y, yo - point.x) + Math.PI
		const r = Math.sqrt((xo - point.x) ** 2 + (yo - point.y) ** 2)
		setPolar(point, xo, yo, r * s, r * s, a)
	}
	const PI = Math.PI
	const PI2 = PI * 2
	const PIHalf = PI / 2
	const abs = Math.abs
	const cos = Math.cos
	const sin = Math.sin
	const pow = Math.pow

	/** @type {((pos:number, i:number, iAbs:number) => void)[]} */
	const phases_ = [
		// flash to bright point
		function f35(pos, i, iAbs) {
			lerpOffset(0, 0.2, Math.pow(10, (-1 + pos) * 6))
			brightnessRange.value = '3'
		},
		// point to rainbow hexagon
		function f10(pos, i, iAbs) {
			lerpOffset(0.2, 0.5, easeOut(pos))
		},
		// pausing a bit
		function f5(pos, i, iAbs) {
			lerpOffset(0.5, 0.5, 1)
		},
		// splitting hexagon to cubes
		function f10(pos, i, iAbs) {
			lerpOffset(0.5, 0.65, ease(pos))
			brightnessRange.value = lerp(3, 1.5, pos) + ''
		},
		// rotatig cubes
		function f30(pos, i, iAbs) {
			lerpOffset(0.65, 0.63, Math.sin(pos * PI))
			genPoints(6)
			for (let pi = 0; pi < points.length; pi++) {
				const a = pos * PI2 * 4 + pi * PI * 5
				const r = Math.pow(Math.sin(pos * PI), 2) / 20
				addPolar(points[pi], r, a)
			}
		},
		// still cubes
		function f10(pos, i, iAbs) {
			genPoints(6)
			lerpOffset(0.65, 0.67, Math.sin(pos * PIHalf))
		},
		// collapsing cubes
		function f5(pos, i, iAbs) {
			lerpOffset(0.67, 0.3, 1 - Math.pow(Math.cos(pos * PIHalf), 2))
			brightnessRange.value = lerp(5, 0.5, pos) + ''
		},
		// emerging purple hexagon
		function f5(pos, i, iAbs) {
			genPoints(6)
			lerpOffset(0.4, 0.5, pos)
			brightnessRange.value = lerp(0.5, 3, pos) + ''
			colorDirToHue3Switch.checked = true
		},
		// still purple hexagon
		function f10(pos, i, iAbs) {
			brightnessRange.value = lerp(3, 4, pos) + ''
			lerpOffset(0.5, 0.5, pos)
		},
		// two points rotating to center
		function f45(pos, i, iAbs) {
			genPoints(6, 2)
			points[6].prob = pos
			points[7].prob = pos
			const a = PI2 * 4 * pos
			const r = Math.pow(1 - pos, 2) / 2
			addPolar(points[6], r, a)
			addPolar(points[7], r, a + PI)
			const off = 0.8
			const k =
				pos < off
					? Math.sin((pos / off) * PIHalf) //
					: Math.cos(((pos - off) / (1 - off)) * PIHalf) * 2 - 1
			lerpOffset(0.5, 0.65, k) //-> 0.35
			brightnessRange.value = lerp(4, 3, (Math.sin(pos * PI) + pos) / 2) + ''
		},
		// from blurry to sharp hexagon
		function f10(pos) {
			genPoints(6, 2)
			lerpOffset(0.35, 0.56, pos)
		},
		// showing hipercubic structures
		function f20(pos) {
			lerpOffset(0.56, 0.62, easeOut(pos))
		},
		// pausing a bit
		function f3(pos) {
			lerpOffset(0.62, 0.62, 1)
		},
		// ...still showing
		function f3(pos) {
			lerpOffset(0.62, 0.56, 1 - Math.cos((0.5 + pos * 0.5) * PIHalf))
		},
		// pausing a bit
		function f5(pos) {
			iterOffsetInput.value = '0.56'
			brightnessRange.value = lerp(5, 3, Math.pow(pos, 4)) + ''
		},
		// rotating cube
		function f100(pos) {
			brightnessRange.value = '3'
			genPoints(6, 2)
			for (let i = 0; i < 4; i++) {
				const xr = POINT_GEN_R * Math.cos(PI / 6)
				const yr = (POINT_GEN_R / 2) * Math.cos(pos * PI)
				let a = PI2 * ease(pos) + (PI2 * i) / 4
				setPolar(points[i], 0.5, 0.5 + POINT_GEN_R / 2, xr, yr, a)
				setPolar(points[i + 4], 0.5, 0.5 - POINT_GEN_R / 2, xr, yr, a)
				const off = 0.8
				if (pos > off) {
					const a = -easeIn(squeezeAfter(pos, off)) * PI2 * 0.0025
					addRotation(points[i], 0.5, 0.5, a)
					addRotation(points[i + 4], 0.5, 0.5, a)
				}
			}
			lerpOffset(0.56, 0.6, 1 - Math.cos(pos * PI)) //-> 0.64
		},
		// pausing a bit
		function f8(pos) {
			genPoints(6, 2)
			iterOffsetInput.value = '0.64'
			brightnessRange.value = lerp(3, 2, pow(sin(pos * PI), 2)) + '' //-> 2.5
			for (let i = 0; i < 6; i++) {
				addRotation(points[i], 0.5, 0.5, -PI2 * 0.0025)
			}
		},
		// morphing cube to carpet
		function f20(pos) {
			genPoints(6, 2)
			for (let i = 0; i < 6; i++) {
				// if (i === 1 || i === 4) continue
				const xr = 1
				const yr = lerp(1, 1 / Math.sqrt(3), ease(pos))
				const a = (PI2 * i) / 6 + PI / 6
				const da = -(1 - easeOut(pos)) * PI2 * 0.0025 - easeOut(pos) * (PI / 6)
				setPolar(points[i], 0.5, 0.5, xr * POINT_GEN_R, yr * POINT_GEN_R, a + da)
			}
			points[6].x = points[7].x = 0.5
			points[6].y = 0.5 + POINT_GEN_R * ease(pos)
			points[7].y = 0.5 - POINT_GEN_R * ease(pos)
			// points[4].prob = points[5].prob = points[7].prob = points[6].prob = 0
			lerpOffset(0.64, 2 / 3, easeOut(pos))
			brightnessRange.value = lerp(3, 2.5, pos) + ''
		},
		// pausing a bit
		function f8(pos) {
			for (let i = 0; i < 4; i++) {
				const r = POINT_GEN_R
				const r1 = (POINT_GEN_R * Math.sqrt(2)) / 2
				setPolar(points[i], 0.5, 0.5, r, r, (PI2 * i) / 4)
				setPolar(points[i + 4], 0.5, 0.5, r1, r1, (PI2 * i) / 4 + PI / 4)
			}
			lerpOffset(2 / 3, 2 / 3, pos)
			brightnessRange.value = lerp(2.5, 3.5, pow(sin(pos * PI), 2)) + '' //-> 2.5
		},
		function f20(pos) {
			genPoints(8)
			for (let i = 0; i < 8; i++) {
				const r = i % 2 === 0 ? POINT_GEN_R : POINT_GEN_R * lerp(Math.sqrt(2) / 2, 1, ease(pos))
				setPolar(points[i], 0.5, 0.5, r, r, (PI2 * i) / 8)
			}
			lerpOffset(2 / 3, 0.586, pos)
			brightnessRange.value = '2.5'
		},
		function f75(pos) {
			genPoints(8)
			genPoints(8, 0, false)
			for (let i = 8; i < points.length; i++) {
				points[i].x = points[i - 8].x
				points[i].y = points[i - 8].y
				const a = (PI2 * i) / 8 + PI / 8 + PI / 2
				lerpPolar(points[i], 0.5, 0.5, POINT_GEN_R, POINT_GEN_R, a, ease(pos))
			}
			lerpOffset(0.586, 0.8, ease(squeezeAfter(pos, 0.5)))
			const off = 0.15
			brightnessRange.value = lerp(2.5, 1.8, 1 - Math.min(1, abs(off - pos) / 0.075)) + ''
			if (pos > off) colorDirToHueSwitch.checked = true
		},
		function f50(pos) {
			brightnessRange.value = '3'
			genPoints(64)
			for (let i = 0; i < points.length; i++) {
				const k = ease(Math.min(1, pos))
				if (i % 4 !== 0) {
					const l2 = points.length / 2
					points[i].prob = (i < l2 ? k * 2 - i / l2 : k * 2 - (i - l2) / l2) * 2
				}
				addRotation(points[i], 0.5, 0.5, (PI2 / 32) * easeIn(pos))
			}
			lerpOffset(0.8, 0.75, ease(pos))
		},
		function f25(pos) {
			genPoints(64)
			for (let i = 0; i < points.length; i++) {
				if (i % 2 === 1) points[i].prob = 1 - pos
				addRotation(points[i], 0.5, 0.5, (PI2 / 64) * pos)
			}
			lerpOffset(0.75, 0.7, ease(pos))
			const off = 0.35
			brightnessRange.value = lerp(3, 2, 1 - Math.min(1, abs(off - pos) / 0.1)) + ''
			if (pos > off) colorDirToHue2Switch.checked = true
		},
		// just rotating a bit more
		function f10(pos) {
			genPoints(32)
			for (let i = 0; i < points.length; i++) {
				addRotation(points[i], 0.5, 0.5, (PI2 / 32 / 5) * pos + PI2 / 64)
			}
		},
		function f25(pos) {
			const off = 0.5
			lerpOffset(0.7, 0.8, ease(squeezeBefore(pos, off)) - 7 * easeIn(squeezeAfter(pos, off)))
			genPoints(32)
			for (let i = 0; i < points.length; i++) {
				addRotation(points[i], 0.5, 0.5, (PI2 / 64) * easeOut(pos) + PI2 / 64 + PI2 / 32 / 5)
			}
		},
		function f5(pos) {
			genPoints(3)
			lerpOffset(0.2, 0.5, pos)
			for (let i = 0; i < points.length; i++) {
				addRotation(points[i], 0.5, 0.5, PI2 * 0.01 * pos + PI / 4)
				// points[i].y += 0.075 * pos
			}
			colorMonochromeSwitch.checked = true
		},
		function f15(pos) {
			genPoints(3)
			lerpOffset(0.5, 0.5, pos)
			for (let i = 0; i < points.length; i++) {
				const k = squeezeBefore(pos, 0.5)
				const s = lerp(1, 1.05, ((1 - cos(k * PI2 * 2)) / 2) * (1 - k))
				const a = PI2 * 0.01 * pos + PI2 * 0.01 + PI / 4
				// setPolar(points[i], 0.5, 0.5, r, r, a)
				addRotation(points[i], 0.5, 0.5, a)
				addScale(points[i], 0.5, 0.5, s)
				// points[i].y += 0.075
			}
			brightnessRange.value = lerp(2, 1, pos) + ''
		},
		function f45(pos) {
			genPoints(3)
			for (let i = 0; i < points.length; i++) {
				const a = PI2 * 0.03 * pos + PI2 * 0.02 + PI / 4
				addRotation(points[i], 0.5, 0.5, a)
				// points[i].y += 0.075
			}
		},
		function f10(pos) {
			genPoints(3)
			lerpOffset(0.5, 0.1, squeezeAfter(pos, 0.4))
			brightnessRange.value = lerp(1, 0.1, squeezeAfter(pos, 0.4)) + ''
			for (let i = 0; i < points.length; i++) {
				const a = PI2 * 0.05 * pos + PI2 * 0.05 + PI / 4
				const s = lerp(1, 1.1, ease(squeezeBefore(pos, 0.4))) * easeIn(1 - squeezeAfter(pos, 0.5))
				addRotation(points[i], 0.5, 0.5, a)
				addScale(points[i], 0.5, 0.5, s)
				// points[i].y += 0.075 //* (1 - pos)
			}
		},
		function f30(pos) {
			genPoints(0, 1)
		},
	]
	const phases = phases_.map(f => ({ num: +(f.name.match(/\d+/) || [])[0], func: f }))

	const fastForwardTo = 0
	for (let i = 0, n = 0; i < phases.length; i++) {
		const p = phases[i]
		n += p.num
		if (n < fastForwardTo) p.func((p.num - 1) / p.num, p.num - 1, n - 1)
	}
	for (let i = fastForwardTo; ; i += 0.25 * 1) {
		const stt = Date.now()

		let n = i
		const phase = phases.find(x => (n < x.num ? true : ((n -= x.num), false)))
		if (!phase) break
		phase.func(n / phase.num, n, i)

		clear()
		await runGenerator()
		await nextRedraw()
		rc.fillStyle = 'white'
		rc.fillText(i.toFixed(2), 8, 16)

		if (mediaRecorder.state === 'inactive') mediaRecorder.start() //TODO: аргумент timeslice со значением в миллисекундах. Если он определен, то медиа будет записываться в отдельные блоки заданной продолжительности
		// @ts-ignore
		stream.getVideoTracks()[0].requestFrame()
		// await sleep(100 + 1000 * (i % 2))
		await sleep(Math.max(1, 50 + stt - Date.now()))
		// if (i > 30) break
	}
	await sleep(100) //иначе последнего кадра нет
	if (mediaRecorder.state !== 'inactive') mediaRecorder.stop()
}
generatorIsRunning = true
setTimeout(() => {
	pixBuf = new Uint32Array(1)
	maxPixValue = ((256 * 256) / 1) * 2 - 512
	resize(1080)
	generatorIsRunning = false
	brightnessRange.max = '100'
	brightnessRange.min = '0'
	brightnessMode = 'avg'
	renderDemo()
}, 100)
