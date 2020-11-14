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

let w = 1
let h = 1

let iData = /** @type {ImageData|null} */ (null)
let pixBuf = new Uint16Array(1)
const maxPixValue = 256 * 256 - 512

const points = /** @type {{x:number, y:number}[]} */ ([])
const curPoint = /** @type {{x:number, y:number}} */ ({ x: 0.1111, y: 0 })

let startDate = new Date()
let dotsCount = 0

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
		pixBuf = new Uint16Array(w * h * 4)
		clear()
	}
	runGenerator()
}

function genPoints(n) {
	points.length = 0
	for (let i = 0; i < n; i++)
		points.push({
			x: 0.5 + Math.cos(((i / n) * 2 - 0.5) * Math.PI) * 0.45,
			y: 0.5 + Math.sin(((i / n) * 2 - 0.5) * Math.PI) * 0.45,
		})
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
		const p = points[(Math.random() * points.length) | 0]

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
	let max = 0
	for (let i = 0; i < pixBuf.length; i += 4) {
		if (pixBuf[i + 0] > max) max = pixBuf[i + 0]
		if (pixBuf[i + 1] > max) max = pixBuf[i + 1]
		if (pixBuf[i + 2] > max) max = pixBuf[i + 2]
	}
	const k = (255 / max) * brightnessK
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
