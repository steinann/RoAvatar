import { WorkerTypeToFunction } from "./worker-functions"

let idCounter = 0

type ResolveInfo = [number, (a: unknown) => void]

export class WorkerPool {
    static instance: WorkerPool

    workers: Worker[] = []
    workersActiveTasks: number[] = []
    workersResolves: ResolveInfo[][] = []

    constructor() {
        //create workers if possible
        if (window.Worker) {
            const workerCount = navigator.hardwareConcurrency || 4

            for (let i = 0; i < workerCount; i++) {
                const worker = new Worker(new URL("./generic-worker.ts", import.meta.url), {type: 'module'})
                this.workers.push(worker)
                this.workersActiveTasks.push(0)
                this.workersResolves.push([])

                worker.onmessage = (e: MessageEvent) => {
                    const [id, data]: [number, unknown] = e.data

                    this._onMessage(i, id, data)
                }
            }
        }
    }

    _onMessage(i: number, id: number, data: unknown) {
        const promiseInfos = this.workersResolves[i]
        for (const info of promiseInfos) {
            if (info[0] == id) {
                info[1](data)
                this.workersResolves[i].splice(this.workersResolves[i].indexOf(info),1)
                break
            }
        }
    }

    _getAvailableWorker() {
        let lowestWork = 0

        for (let i = 0; i < this.workers.length; i++) {
            if (this.workersActiveTasks[lowestWork] > this.workersActiveTasks[i]) {
                lowestWork = i
            }
        }

        return lowestWork
    }

    _emulateWorker(type: string, data: unknown) {
        const func = WorkerTypeToFunction[type]
        return func(data)
    }

    async work(type: string, data: unknown): Promise<unknown> {
        const taskId = idCounter
        idCounter += 1

        //use actual worker
        if (this.workers.length > 0) {
            const workerIndex = this._getAvailableWorker()
            this.workersActiveTasks[workerIndex] += 1
            const promise = new Promise((resolve) => {
                this.workersResolves[workerIndex].push([taskId, resolve])
            })
            this.workers[workerIndex].postMessage([taskId, type, data])
            return promise
        } else { //emulate worker
            return this._emulateWorker(type, data)
        }
    }
}

WorkerPool.instance = new WorkerPool()