// === web rendering ===

/**
 * @param {object} opts
 * @param {number} [opts.size]
 * @param {number} [opts.startFrame]
 * @param {number|null} [opts.endFrame]
 * @param {number} [opts.frameStep]
 * @param {number} [opts.maxPixValue]
 * @param {boolean} [opts.doRecord]
 * @param {object} [opts.recorderOptions]
 */
async function renderDemo({
	size,
	startFrame,
	endFrame,
	frameStep,
	maxPixValue,
	doRecord,
	recorderOptions,
} = {}) {
	size ??= 128
	startFrame ??= 0
	endFrame ??= null
	frameStep ??= 1
	maxPixValue ??= ((256 * 256) / 8) * 1 - 512
	recorderOptions ??= { videoBitsPerSecond: 100 * 1000 * 1000, mimeType: 'video/webm;codecs=vp9' }

	const { stream, mediaRecorder } = (() => {
		if (!doRecord) return { stream: null, mediaRecorder: null }

		const stream = canvas.captureStream(0)
		const recordedBlobs = []
		const mediaRecorder = new MediaRecorder(stream, recorderOptions)

		mediaRecorder.onstart = handleStart
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
		function handleStart() {
			console.log('recording started')
		}
		function handleStop() {
			console.log('recording stopped')
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
				a.download = 'video.webm'
				a.click()
				//document.body.removeChild(a);
				//URL.revokeObjectURL(a.href);
			}
		}
		return { stream, mediaRecorder }
	})()

	function nextRedraw() {
		return new Promise(res => {
			requestAnimationFrame(res)
		})
	}

	resize(size)
	generator.abort()
	generator.clear()
	generator.setMaxPixValue(maxPixValue)
	const destDrameDelta = 50
	let prevFrameTime = Date.now()

	const iter = renderDemoFrames(generator, mustBeNotNull(iData).data, startFrame, endFrame, frameStep)
	for await (const frameNum of iter) {
		await nextRedraw() //pix data will be copied to canvas here
		rc.fillStyle = 'white'
		rc.fillText(frameNum.toFixed(2), 8, 16)

		if (mediaRecorder && mediaRecorder.state === 'inactive') mediaRecorder.start() //TODO: аргумент timeslice со значением в миллисекундах. Если он определен, то медиа будет записываться в отдельные блоки заданной продолжительности
		// @ts-ignore
		if (stream) stream.getVideoTracks()[0].requestFrame()

		await sleep(Math.max(1, destDrameDelta + prevFrameTime - Date.now()))
		prevFrameTime = Date.now()
	}

	if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
}

// === node.js rendering ===

if (typeof require !== 'undefined') {
	const cluster = require('cluster')
	const util = require('util')
	const stdoutWrite = util.promisify(process.stdout.write.bind(process.stdout))
	const log = console.error

	const args = process.argv.slice(2)
	const isHelp = args.some(x => x === '-h' || x === '--help')
	if (args.length !== 1 || isHelp) {
		console.error(
			'usage: node demo.js <size> ' +
				'| ffmpeg -vcodec rawvideo -f rawvideo -pix_fmt rgba -s <size>x<size> -r 60 -i - ...',
		)
		process.exit(isHelp ? 2 : 1)
	}
	const frameStep = 0.25
	const size = parseInt(args[0])

	if (process.stdout.isTTY) {
		console.error(
			'this script writes RGB data to stdout, ' +
				"it's stdout should be piped somewhere (for example, to ffmpeg)",
		)
		process.exit(1)
	}

	if (cluster.isMaster) {
		log('master: running')

		const startStamp = Date.now()
		const numCPUs = require('os').cpus().length
		const workers = /** @type {{
			worker:typeof cluster.worker,
			status:'waiting'|'rendering'|'rendered'|'flushing',
			promise:Promise<any>
		}[]} */ ([])

		for (let i = 0; i < numCPUs; i++) {
			const worker = cluster.fork()
			workers.push({ worker, status: 'waiting', promise: Promise.resolve() })
		}
		cluster.on('exit', (worker, code, signal) => {
			log(`master: worker ${worker.id} died`)
			const index = workers.findIndex(x => x.worker === worker)
			if (index === -1) throw new Error(`worker #${worker.id} not found`)
			workers.splice(index, 1)
		})
		/**
		 * @param {typeof workers[number]} worker
		 * @param {typeof workers[number]['status']} curStatus
		 * @param {string} doneEventType
		 * @param {typeof workers[number]['status']} doneStatus
		 */
		function workAndWait(worker, curStatus, doneEventType, doneStatus) {
			worker.status = curStatus
			worker.promise = new Promise(res => {
				worker.worker.once('message', msg => {
					if (msg.type !== doneEventType)
						throw new Error(`wrong type, expected ${doneEventType}, got ${msg.type}`)
					worker.status = doneStatus
					res(msg)
				})
			})
		}
		//
		;(async function () {
			let curFrame = 0
			while (true) {
				const waitingWorkerI = workers.findIndex(x => x.status === 'waiting')
				if (waitingWorkerI !== -1) {
					const worker = workers.splice(waitingWorkerI, 1)[0]
					workers.push(worker)
					// log(`found waiting worker #${worker.worker.id}`)
					worker.worker.send({ type: 'frame', nextFrame: curFrame })
					workAndWait(worker, 'rendering', 'rendered', 'rendered')
					log(`fps: ${((curFrame / frameStep / (Date.now() - startStamp)) * 1000).toFixed(3)}`)
					curFrame += frameStep
					continue
				}

				if (workers[0].status === 'flushing') {
					await Promise.race(workers.filter(x => x.status !== 'rendered').map(x => x.promise))
					continue
				}
				if (workers[0].status === 'rendering') {
					await Promise.race(workers.filter(x => x.status !== 'rendered').map(x => x.promise))
					continue
				}

				if (workers[0].status === 'rendered') {
					const renderedWorker = workers[0]
					// log(`found rendered worker #${renderedWorker.worker.id}`)
					renderedWorker.worker.send({ type: 'flush' })
					workAndWait(renderedWorker, 'flushing', 'flushed', 'waiting')
					continue
				}

				await new Promise(res => {
					setTimeout(res, 1000)
				})
			}
		})().catch(log)
	} else {
		log(`worker #${cluster.worker.id}: running`)

		// @ts-ignore
		const { FGenerator: FGen } = require('./generator.js')
		const generator = /** @type {FGenerator} */ (new FGen(() => {}))

		generator.resize(size)
		generator.abort()
		generator.clear()
		generator.setMaxPixValue(((256 * 256) / 1) * 2 - 512)
		const pixBuf = new Uint8ClampedArray(generator.getPixCount() * 4)

		let iter = /** @type {ReturnType<renderDemoFrames>|null} */ (null)
		let writePromise = Promise.resolve()
		process.on('message', async ({ type, nextFrame }) => {
			if (type === 'frame') {
				log(`worker #${cluster.worker.id}: request for frame ${nextFrame}`)

				let res = await (() => {
					if (iter === null) {
						iter = renderDemoFrames(generator, pixBuf, nextFrame, null, 0.25 * 4)
						return iter.next(null)
					} else {
						return iter.next({ nextFrame, nextCopyPause: writePromise })
					}
				})()
				if (res.done) {
					log(`worker #${cluster.worker.id}: done (before frame ${nextFrame})`)
					process.exit(0)
				}

				const frameNum = res.value
				// @ts-ignore
				process.send({ type: 'rendered', frame: frameNum })

				await new Promise(res => {
					process.once('message', ({ type }) => {
						if (type !== 'flush') throw new Error(`expected 'flush' message, got ${type}`)
						log(`worker #${cluster.worker.id}: frame write:`, frameNum)
						// writePromise = new Promise(res => setTimeout(res, 2 + Math.random() * 10)) //
						writePromise = stdoutWrite(new Uint8Array(pixBuf.buffer)) //
							.then(() => {
								log(`worker #${cluster.worker.id}: frame write:`, frameNum, 'end')
								// @ts-ignore
								process.send({ type: 'flushed', frame: frameNum })
							})
					})
				})
			}
		})
	}

	// === single-threaded version ===

	// const util = require('util')
	// const stdoutWrite = util.promisify(process.stdout.write.bind(process.stdout))

	// const args = process.argv.slice(2)
	// if (args.length !== 4) {
	// 	console.error(
	// 		'usage: node demo.js <start_frame> <end_frame> <frame_step> <size> | ffmpeg -vcodec rawvideo -f rawvideo -pix_fmt rgba -s <size>x<size> -r 60 -i - ...',
	// 	)
	// 	process.exit(1)
	// }
	// const startFrame = parseFloat(args[0])
	// const endFrame = parseFloat(args[1])
	// const frameStep = parseFloat(args[2])
	// const size = parseInt(args[3])

	// if (process.stdout.isTTY) {
	// 	console.error(
	// 		'this script writes RGB data to stdout, ' +
	// 			"it's output should be piped somewhere (for example, to ffmpeg)",
	// 	)
	// 	console.error('aborting')
	// 	process.exit(1)
	// }

	// // @ts-ignore
	// const { FGenerator: FGen } = require('./generator.js')
	// const generator = /** @type {FGenerator} */ (new FGen(() => {}))

	// generator.resize(size)
	// generator.abort()
	// generator.clear()
	// generator.setMaxPixValue(((256 * 256) / 8) * 1 - 512)
	// const pixBuf = new Uint8ClampedArray(generator.getPixCount() * 4)
	// renderDemoFrames(generator, pixBuf, startFrame, endFrame, frameStep, framenNum => {
	// 	console.error(`frame: ${framenNum.toFixed(2)}`)
	// 	return { nextCopyPause: stdoutWrite(new Uint8Array(pixBuf.buffer)) }
	// }).catch(console.error)
}

// === demo core ===

/**
 * @param {FGenerator} generator
 * @param {Uint8ClampedArray} outPixBuf
 * @param {number} startFrame
 * @param {number|null} endFrame
 * @param {number} frameStep
 * @returns {AsyncGenerator<number, void, {nextCopyPause?:Promise<void>, nextFrame?:number}|null|undefined>}
 */
async function* renderDemoFrames(generator, outPixBuf, startFrame, endFrame, frameStep) {
	let offset = 0.5
	let brightness = 3
	let colorFunc = generator.colorFuncs.HSL

	const points = generator.getPoints()
	const genPoints = generator.genPoints.bind(generator)
	// @ts-ignore
	const POINT_GEN_R = generator.constructor.POINT_GEN_R

	function lerp(a, b, k) {
		return a + (b - a) * k
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
		function f15(pos, i, iAbs) {
			// 0.000001 - 0.001
			offset = lerp(0, 0.2, Math.pow(10, -2 - (1 - pos) * 3.5))
			brightness = 3
			genPoints(6)
		},
		function f25(pos, i, iAbs) {
			offset = lerp(0, 0.2, Math.pow(10, -(1 - pos) * 2))
			brightness = 3
			genPoints(6)
		},
		// point to rainbow hexagon
		function f10(pos, i, iAbs) {
			offset = lerp(0.2, 0.5, easeOut(pos))
		},
		// pausing a bit
		function f5(pos, i, iAbs) {
			offset = lerp(0.5, 0.5, 1)
		},
		// splitting hexagon to cubes
		function f10(pos, i, iAbs) {
			offset = lerp(0.5, 0.65, ease(pos))
			brightness = lerp(3, 1.5, pos)
		},
		// rotatig cubes
		function f30(pos, i, iAbs) {
			offset = lerp(0.65, 0.63, Math.sin(pos * PI))
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
			offset = lerp(0.65, 0.67, Math.sin(pos * PIHalf))
		},
		// collapsing cubes
		function f5(pos, i, iAbs) {
			offset = lerp(0.67, 0.3, 1 - Math.pow(Math.cos(pos * PIHalf), 2))
			brightness = lerp(5, 0.5, pos)
		},
		// emerging purple hexagon
		function f5(pos, i, iAbs) {
			offset = lerp(0.4, 0.5, pos)
			brightness = lerp(0.5, 3, pos)
			colorFunc = generator.colorFuncs.HSL3
			genPoints(6)
		},
		// still purple hexagon
		function f10(pos, i, iAbs) {
			brightness = lerp(3, 4, pos)
			offset = lerp(0.5, 0.5, pos)
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
			offset = lerp(0.5, 0.65, k) //-> 0.35
			brightness = lerp(4, 3, (Math.sin(pos * PI) + pos) / 2)
		},
		// from blurry to sharp hexagon
		function f10(pos) {
			genPoints(6, 2)
			offset = lerp(0.35, 0.56, pos)
		},
		// showing hipercubic structures
		function f20(pos) {
			offset = lerp(0.56, 0.62, easeOut(pos))
		},
		// pausing a bit
		function f3(pos) {
			offset = lerp(0.62, 0.62, 1)
		},
		// ...still showing
		function f3(pos) {
			offset = lerp(0.62, 0.56, 1 - Math.cos((0.5 + pos * 0.5) * PIHalf))
		},
		// pausing a bit
		function f5(pos) {
			offset = 0.56
			brightness = lerp(5, 3, Math.pow(pos, 4))
		},
		// rotating cube
		function f100(pos) {
			brightness = 3
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
			offset = lerp(0.56, 0.6, 1 - Math.cos(pos * PI)) //-> 0.64
		},
		// pausing a bit
		function f8(pos) {
			offset = 0.64
			brightness = lerp(3, 2, pow(sin(pos * PI), 2)) //-> 2.5
			genPoints(6, 2)
			for (let i = 0; i < 6; i++) {
				addRotation(points[i], 0.5, 0.5, -PI2 * 0.0025)
			}
		},
		// morphing cube to carpet
		function f20(pos) {
			offset = lerp(0.64, 2 / 3, easeOut(pos))
			brightness = lerp(3, 2.5, pos)
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
		},
		// pausing a bit
		function f8(pos) {
			offset = lerp(2 / 3, 2 / 3, pos)
			brightness = lerp(2.5, 3.5, pow(sin(pos * PI), 2)) //-> 2.5
			for (let i = 0; i < 4; i++) {
				const r = POINT_GEN_R
				const r1 = (POINT_GEN_R * Math.sqrt(2)) / 2
				setPolar(points[i], 0.5, 0.5, r, r, (PI2 * i) / 4)
				setPolar(points[i + 4], 0.5, 0.5, r1, r1, (PI2 * i) / 4 + PI / 4)
			}
		},
		function f20(pos) {
			offset = lerp(2 / 3, 0.586, pos)
			brightness = 2.5
			genPoints(8)
			for (let i = 0; i < 8; i++) {
				const r = i % 2 === 0 ? POINT_GEN_R : POINT_GEN_R * lerp(Math.sqrt(2) / 2, 1, ease(pos))
				setPolar(points[i], 0.5, 0.5, r, r, (PI2 * i) / 8)
			}
		},
		function f75(pos) {
			offset = lerp(0.586, 0.8, ease(squeezeAfter(pos, 0.5)))
			const off = 0.15
			brightness = lerp(2.5, 1.8, 1 - Math.min(1, abs(off - pos) / 0.075))
			if (pos > off) colorFunc = generator.colorFuncs.HSL
			genPoints(8)
			genPoints(8, 0, false)
			for (let i = 8; i < points.length; i++) {
				points[i].x = points[i - 8].x
				points[i].y = points[i - 8].y
				const a = (PI2 * i) / 8 + PI / 8 + PI / 2
				lerpPolar(points[i], 0.5, 0.5, POINT_GEN_R, POINT_GEN_R, a, ease(pos))
			}
		},
		function f50(pos) {
			offset = lerp(0.8, 0.75, ease(pos))
			brightness = 3
			genPoints(64)
			for (let i = 0; i < points.length; i++) {
				const k = ease(Math.min(1, pos))
				if (i % 4 !== 0) {
					const l2 = points.length / 2
					points[i].prob = (i < l2 ? k * 2 - i / l2 : k * 2 - (i - l2) / l2) * 2
				}
				addRotation(points[i], 0.5, 0.5, (PI2 / 32) * easeIn(pos))
			}
		},
		function f25(pos) {
			offset = lerp(0.75, 0.7, ease(pos))
			const off = 0.35
			brightness = lerp(3, 2, 1 - Math.min(1, abs(off - pos) / 0.1))
			if (pos > off) colorFunc = generator.colorFuncs.HSL2
			genPoints(64)
			for (let i = 0; i < points.length; i++) {
				if (i % 2 === 1) points[i].prob = 1 - pos
				addRotation(points[i], 0.5, 0.5, (PI2 / 64) * pos)
			}
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
			offset = lerp(0.7, 0.8, ease(squeezeBefore(pos, off)) - 7 * easeIn(squeezeAfter(pos, off)))
			genPoints(32)
			for (let i = 0; i < points.length; i++) {
				addRotation(points[i], 0.5, 0.5, (PI2 / 64) * easeOut(pos) + PI2 / 64 + PI2 / 32 / 5)
			}
		},
		function f5(pos) {
			offset = lerp(0.2, 0.5, pos)
			colorFunc = generator.colorFuncs.mono
			genPoints(3)
			for (let i = 0; i < points.length; i++) {
				addRotation(points[i], 0.5, 0.5, PI2 * 0.01 * pos + PI / 4)
				// points[i].y += 0.075 * pos
			}
		},
		function f15(pos) {
			offset = lerp(0.5, 0.5, pos)
			brightness = lerp(2, 1, pos)
			genPoints(3)
			for (let i = 0; i < points.length; i++) {
				const k = squeezeBefore(pos, 0.5)
				const s = lerp(1, 1.05, ((1 - cos(k * PI2 * 2)) / 2) * (1 - k))
				const a = PI2 * 0.01 * pos + PI2 * 0.01 + PI / 4
				// setPolar(points[i], 0.5, 0.5, r, r, a)
				addRotation(points[i], 0.5, 0.5, a)
				addScale(points[i], 0.5, 0.5, s)
				// points[i].y += 0.075
			}
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
			offset = lerp(0.5, 0.1, squeezeAfter(pos, 0.4))
			brightness = lerp(1, 0.1, squeezeAfter(pos, 0.4))
			genPoints(3)
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

	// fast-forward
	for (let i = 0, n = 0; i < phases.length; i++) {
		const p = phases[i]
		n += p.num
		if (n < startFrame) p.func((p.num - 1) / p.num, p.num - 1, n - 1)
	}
	let copyPause = /** @type {Promise<void>|null} */ (null)
	let forceNextFrame = /** @type {number|null} */ (null)
	for (let i = startFrame; ; i += frameStep) {
		const stt = Date.now()

		let n = i
		const phase = phases.find(x => (n < x.num ? true : ((n -= x.num), false)))
		if (!phase) break
		phase.func(n / phase.num, n, i)

		if (forceNextFrame !== null) {
			if (Math.abs(i - forceNextFrame) < 0.0001) {
				i = forceNextFrame
				forceNextFrame = null
			} else if (i + frameStep >= forceNextFrame) {
				i = forceNextFrame - frameStep
				continue
			} else {
				continue
			}
		}

		generator.clear()
		await generator.run(colorFunc, 10 ** 7, offset)

		if (copyPause !== null) {
			await copyPause
			copyPause = null
		}
		generator.copyPixTo(outPixBuf, 'avg', brightness)

		const res = yield i
		if (res && res.nextCopyPause) copyPause = res.nextCopyPause
		if (res && res.nextFrame !== undefined) forceNextFrame = res.nextFrame

		if (endFrame !== null && i >= endFrame) break
	}
}
