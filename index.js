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

const generator = new FGenerator(onGeneratorProgress)
let iData = /** @type {ImageData|null} */ (null)

// === events ===

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

generator.genPoints(+pointsCountInput.value)
pointsCountInput.oninput = () => {
	if (pointsCountInput.value === '') return
	generator.genPoints(+pointsCountInput.value)
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

// === presets ===

getById('preset-3', HTMLAnchorElement).onclick = () => {
	clear()
	colorMonochromeSwitch.checked = true
	setValue(brightnessRange, '1.0')
	setValue(pointsCountInput, '3')
	setValue(iterOffsetInput, '0.5')
}
getById('preset-8-ext', HTMLAnchorElement).onclick = () => {
	clear()
	colorMonochromeSwitch.checked = true
	setValue(brightnessRange, '7.6')
	setValue(pointsCountInput, '8')
	setValue(iterOffsetInput, 2 / 3 + '')
	//prettier-ignore
	const coords = [[0,0], [1,0], [2,0], [2,1], [2,2], [1,2], [0,2], [0,1]]
	const points = generator.getPoints()
	points.length = 0
	points.push(...coords.map(x => ({ x: 0.05 + x[0] * 0.45, y: 0.05 + x[1] * 0.45 })))
}
getById('preset-4', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHue2Switch.checked = true
	setValue(brightnessRange, '1.2')
	setValue(pointsCountInput, '4')
	setValue(iterOffsetInput, '0.54')
}
getById('preset-4-plaid-fabric', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '1.0')
	setValue(pointsCountInput, '4')
	setValue(iterOffsetInput, '0.46')
}
getById('preset-5', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '2.5')
	setValue(pointsCountInput, '5')
	setValue(iterOffsetInput, '0.5')
}
getById('preset-6-hue', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '2.0')
	setValue(pointsCountInput, '6')
	setValue(iterOffsetInput, '0.5')
}
getById('preset-64-bublic', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '1.9')
	setValue(pointsCountInput, '64')
	setValue(iterOffsetInput, '0.8')
}
getById('preset-32-eye-apple', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHue2Switch.checked = true
	setValue(brightnessRange, '3.5')
	setValue(pointsCountInput, '32')
	setValue(iterOffsetInput, '0.7')
}
getById('preset-12-ring-of-rings', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHueSwitch.checked = true
	setValue(brightnessRange, '0.7')
	setValue(pointsCountInput, '12')
	setValue(iterOffsetInput, '0.7322')
}
getById('preset-16-ring-of-rings', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '0.5')
	setValue(pointsCountInput, '16')
	setValue(iterOffsetInput, '0.8')
}
getById('preset-15-smth-curvy', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '4.2')
	setValue(pointsCountInput, '15')
	setValue(iterOffsetInput, '0.6')
}
getById('preset-6-tesseract', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '1.5')
	setValue(pointsCountInput, '6')
	setValue(iterOffsetInput, '0.586')
	generator.getPoints().push({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })
}
getById('preset-6-tesseract-frame', HTMLAnchorElement).onclick = () => {
	clear()
	colorDirToHue3Switch.checked = true
	setValue(brightnessRange, '1.8')
	setValue(pointsCountInput, '6')
	setValue(iterOffsetInput, '0.56')
	generator.getPoints().push({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })
}

// === generator-related funcs ===

function clear() {
	generator.abort()
	generator.clear()
}

function resize(newSize) {
	const [curW, curH] = generator.getSize()
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
	if (newSize !== curW || newSize !== curH) {
		generator.resize(newSize)
		screenSizeBox.textContent = newSize + ''
		canvas.width = newSize
		canvas.height = newSize
		rc.fillStyle = 'black'
		rc.fillRect(0, 0, newSize, newSize)
		rc.globalCompositeOperation = 'lighter'
		iData = rc.getImageData(0, 0, newSize, newSize)
		clear()
	}
	runGenerator()
}

function onGeneratorProgress(percent, dotsCount, startDate) {
	mustBeInstanceOf(bufferFillingProgressBox.querySelector('.bar'), HTMLElement).style.width = percent + '%'
	elapsedTimeBox.textContent = formatDuration(startDate)
	dotsCountBox.textContent = dotsCount.toLocaleString()
	requestRedraw()
}

function runGenerator() {
	generator.abort()
	const colFunc = colorDirToHueSwitch.checked
		? generator.colorFuncs.HSL
		: colorDirToHue2Switch.checked
		? generator.colorFuncs.HSL2
		: colorDirToHue3Switch.checked
		? generator.colorFuncs.HSL3
		: generator.colorFuncs.mono
	const numIters = Math.round(Math.pow(10, parseFloat(speedRange.value)) * 1000)
	const offsetK = parseFloat(iterOffsetInput.value)
	return generator.run(colFunc, numIters, offsetK)
}

let redrawRequested = false
function requestRedraw() {
	if (redrawRequested) return
	requestAnimationFrame(redraw)
	redrawRequested = true
}
function redraw() {
	redrawRequested = false

	// console.time('copy')
	const pix = mustBeNotNull(iData).data
	generator.copyPixTo(pix, 'avg', +brightnessRange.value)
	// console.timeEnd('copy')

	// console.time('put')
	rc.putImageData(mustBeNotNull(iData), 0, 0)
	// console.timeEnd('put')
}

// === utils ===

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
