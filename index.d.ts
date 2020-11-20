interface HTMLCanvasElement {
	captureStream(frameRate?: number): MediaStream
}

declare interface MediaRecorderErrorEvent extends Event {
	name: string
}

declare interface MediaRecorderDataAvailableEvent extends Event {
	data: any
}

declare class MediaRecorder extends EventTarget {
	readonly mimeType: string
	readonly state: 'inactive' | 'recording' | 'paused'
	readonly stream: MediaStream
	ignoreMutedMedia: boolean
	videoBitsPerSecond: number
	audioBitsPerSecond: number

	ondataavailable: (event: MediaRecorderDataAvailableEvent) => void
	onerror: (event: MediaRecorderErrorEvent) => void
	onpause: () => void
	onresume: () => void
	onstart: () => void
	onstop: () => void

	constructor(stream: MediaStream, options?: any)

	start()

	stop()

	resume()

	pause()

	isTypeSupported(type: string): boolean

	requestData()

	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void

	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	): void
}
