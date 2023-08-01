import { Vector2 } from "./Vector2.ts"

type Tag<T> = { tag: T }
export type Math = Tag<'math'> & {a: bigint, b: bigint}
export type Acceleration = Tag<'accelerate'> & {velocity: Vector2}
export type Move = Tag<'move'> & {position: Vector2}
export type Not = Tag<'not'> & {pop: bigint}
export type GreaterThan = Tag<'greaterThan'> & {a: bigint, b: bigint}
export type PrintInt = Tag<'printInt'> & {int: bigint}
export type PrintChar = Tag<'printChar'> & {char: bigint}
export type ReadInt = Tag<'readInt'>
export type ReadChar = Tag<'readChar'>
export type Duplicate = Tag<'duplicate'>
export type Swap = Tag<'swap'>
export type Discard = Tag<'discard'> & {discarded: bigint}
export type Place = Tag<'place'> & {x: bigint, y: bigint, oldV: string}
export type Grab = Tag<'grab'> & {x: bigint, y: bigint}
export type PushInt = Tag<'pushInt'>
export type ModeChange = Tag<'modeChange'>

export type Delta = Math
    | Acceleration
    | Move
    | Not
    | GreaterThan
    | PrintInt
    | PrintChar
    | ReadInt
    | ReadChar
    | Duplicate
    | Swap
    | Discard
    | Place
    | Grab
    | PushInt
    | ModeChange

export interface Backtrace {
    pushModeChange(): void
    pushMath(a: bigint, b: bigint): void
    pushMove(position: Vector2): void
    pushAcceleration(velocity: Vector2): void
    pushNot(pop: bigint): void
    pushGreaterThan(a: bigint, b: bigint): void
    pushPrintInt(int: bigint): void
    pushPrintChar(char: bigint): void
    pushReadInt(): void
    pushReadChar(): void
    pushDuplicate(): void
    pushSwap(): void
    pushDiscard(discarded: bigint): void
    pushPlace(x: bigint, y: bigint, oldV: string): void
    pushGrab(x: bigint, y: bigint): void
    pushPushInt(): void
    latchOps(): void
    pop(): Delta[] | undefined
    get depth(): number
}

export class NullBacktrace implements Backtrace {
    pushModeChange(): void {
        return
    }
    pushMath(_a: bigint, _b: bigint): void {
        return
    }
    pushMove(_position: Vector2): void {
        return
    }
    pushAcceleration(_velocity: Vector2): void {
        return
    }
    pushNot(_pop: bigint): void {
        return
    }
    pushGreaterThan(_a: bigint, _b: bigint): void {
        return
    }
    pushPrintInt(_int: bigint): void {
        return
    }
    pushPrintChar(_char: bigint): void {
        return
    }
    pushReadInt(): void {
        return
    }
    pushReadChar(): void {
        return
    }
    pushDuplicate(): void {
        return
    }
    pushSwap(): void {
        return
    }
    pushDiscard(_discarded: bigint): void {
        return
    }
    pushPlace(_x: bigint, _y: bigint, _oldV: string): void {
        return
    }
    pushGrab(_x: bigint, _y: bigint): void {
        return
    }
    pushPushInt(): void {
        return
    }
    latchOps(): void {
        return
    }
    pop(): Delta[] | undefined {
        return undefined
    }
    get depth(): number {
        return 0
    }
}

export class RecordingBacktrace implements Backtrace {
    #stack: Delta[][]
    #deltaBuf: Delta[]
    #stackLimit: number | undefined

    constructor(stackLimit: number | undefined = undefined) {
        this.#stack = []
        this.#deltaBuf = []
        this.#stackLimit = stackLimit
    }

    #shiftOp(d: Delta) {
        this.#deltaBuf.unshift(d)
    }

    pushModeChange() {
        this.#shiftOp({tag: 'modeChange'})
    }

    pushMath(a: bigint, b: bigint) {
        this.#shiftOp({a, b, tag: 'math'})
    }

    pushMove(position: Vector2) {
        this.#shiftOp({position, tag: 'move'})
    }
    pushAcceleration(velocity: Vector2): void {
        this.#shiftOp({velocity, tag: 'accelerate'})
    }
    pushNot(pop: bigint) {
        this.#shiftOp({pop, tag: 'not'})
    }

    pushGreaterThan(a: bigint, b: bigint) {
        this.#shiftOp({a, b, tag: 'greaterThan'})
    }

    pushPrintInt(int: bigint) {
        this.#shiftOp({int, tag: 'printInt'})
    }

    pushPrintChar(char: bigint) {
        this.#shiftOp({char, tag: 'printChar'})
    }

    pushReadInt() {
        this.#shiftOp({tag: 'readInt'})
    }

    pushReadChar() {
        this.#shiftOp({tag: 'readChar'})
    }

    pushDuplicate() {
        this.#shiftOp({tag: 'duplicate'})
    }

    pushSwap() {
        this.#shiftOp({tag: 'swap'})
    }

    pushDiscard(discarded: bigint) {
        this.#shiftOp({discarded, tag: 'discard'})
    }

    pushPlace(x: bigint, y: bigint, oldV: string) {
        this.#shiftOp({x, y, oldV, tag: 'place'})
    }

    pushGrab(x: bigint, y: bigint) {
        this.#shiftOp({x, y, tag: 'grab'})
    }

    pushPushInt() {
        this.#shiftOp({tag: 'pushInt'})
    }

    latchOps(): void {
        while (this.#stackLimit && this.#stack.length >= this.#stackLimit) {
            this.#stack.shift()
        }
        this.#stack.push(this.#deltaBuf)
        this.#deltaBuf = []
    }

    pop(): Delta[] | undefined {
        return this.#stack.pop()
    }

    get depth(): number {
        return this.#stack.length
    }
}
