import { WorkerTypeToFunction } from "./worker-functions"

onmessage = function(event: MessageEvent) {
    const [id, type, data]: [number, string, unknown] = event.data

    const func = WorkerTypeToFunction[type]
    this.postMessage([id, func(data)])
}