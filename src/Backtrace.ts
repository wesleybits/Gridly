import { Vector2 } from "./Vector2.ts"

type Tag<T> = { tag: T }
export type Math = Tag<'math'> & {a: bigint, b: bigint}
export type Acceleration = Tag<'accelerate'> & {velocity: Vector2}
export type Move = Tag<'move'> & {position: Vector2}
export type Not = Tag<'not'> & {pop: bigint}
export type GreaterThan = Tag<'greaterThan'> & {pop: bigint}
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
    pushNot(pop: bigint): void
    pushGreaterThan(pop: bigint): void
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
    pop(): Delta | undefined
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
    pushNot(_pop: bigint): void {
        return
    }
    pushGreaterThan(_pop: bigint): void {
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
    pop(): Delta | undefined {
        return undefined
    }
}

export class RecordingBacktrace implements Backtrace {
    #stack: Delta[]
    #stackLimit: number | undefined

    constructor(stackLimit: number | undefined = undefined) {
        this.#stack = []
        this.#stackLimit = stackLimit
    }

    #push(d: Delta) {
        this.#stack.push(d)
        if (this.#stackLimit && this.#stackLimit < this.#stack.length) {
            while (this.#stackLimit < this.#stack.length) {
                this.#stack.shift()
            }
        }
    }

    pushModeChange() {
        this.#push({tag: 'modeChange'})
    }

    pushMath(a: bigint, b: bigint) {
        this.#push({a, b, tag: 'math'})
    }

    pushMove(position: Vector2) {
        this.#push({position, tag: 'move'})
    }

    pushNot(pop: bigint) {
        this.#push({pop, tag: 'not'})
    }

    pushGreaterThan(pop: bigint) {
        this.#push({pop, tag: 'greaterThan'})
    }

    pushPrintInt(int: bigint) {
        this.#push({int, tag: 'printInt'})
    }

    pushPrintChar(char: bigint) {
        this.#push({char, tag: 'printChar'})
    }

    pushReadInt() {
        this.#push({tag: 'readInt'})
    }

    pushReadChar() {
        this.#push({tag: 'readChar'})
    }

    pushDuplicate() {
        this.#push({tag: 'duplicate'})
    }

    pushSwap() {
        this.#push({tag: 'swap'})
    }

    pushDiscard(discarded: bigint) {
        this.#push({discarded, tag: 'discard'})
    }

    pushPlace(x: bigint, y: bigint, oldV: string) {
        this.#push({x, y, oldV, tag: 'place'})
    }

    pushGrab(x: bigint, y: bigint) {
        this.#push({x, y, tag: 'grab'})
    }

    pushPushInt() {
        this.#push({tag: 'pushInt'})
    }

    pop(): Delta | undefined {
        return this.#stack.pop()
    }
}
