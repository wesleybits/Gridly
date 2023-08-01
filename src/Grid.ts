import {Vector2Like, Vector2, left, right, up, down} from "./Vector2.ts"
import {GridIO, StandardIO} from "./Io.ts"
import {Stack} from "./Stack.ts"
import {Backtrace, NullBacktrace} from "./Backtrace.ts"
import { BoundryHooks, defaultHooks } from "./BoundryHooks.ts"

type AbsoluteDir = '<'|'^'|'>'|'v'
type ConditionalDir = '←'|'↑'|'→'|'↓'
type Dir = AbsoluteDir | ConditionalDir
type MathOp = '+'|'-'|'*'|'/'|'%'

export class Grid {
    #grid: string[][]
    #height: number
    #width: number
    #position: Vector2
    #velocity: Vector2
    #stack: Stack
    #running: boolean
    #mode: 'NORMAL' | 'TEXT'
    #io: GridIO
    #bt: Backtrace
    #boundryHooks: BoundryHooks

    constructor(grid: string[][]) {
        this.#grid = grid
        this.#height = grid.length
        this.#width = this.#height === 0 ? 0 : grid[0].length
        this.#position = new Vector2(0, 0)
        this.#velocity = right
        this.#stack = Stack.fresh()
        this.#running = true
        this.#mode = 'NORMAL'
        this.#io = new StandardIO()
        this.#bt = new NullBacktrace
        this.#boundryHooks = {...defaultHooks}
    }

    static async load(filename: string): Promise<Grid> {
        const text = await Deno.readTextFile(filename)
        const lines = text.split(/\r?\n/)
        const width = lines.map((row) => row.length).reduce((a, b) => Math.max(a, b), 0)
        const grid = lines.map((row) => row.padEnd(width, ' ').split(''))
        return new Grid(grid)
    }

    static fromString(program: string): Grid {
        const lines = program.split(/\r?\n/)
        const width = lines.map((row) => row.length).reduce((a,b) => Math.max(a,b), 0)
        const grid = lines.map((row) => row.padEnd(width, ' ').split(''))
        return new Grid(grid)
    }

    #move(): Grid {
        this.#bt.pushMove(this.#position)
        this.#position = this.#position.add(this.#velocity)
        return this
    }

    #changeMode(): Grid {
        this.#bt.pushModeChange()
        switch (this.#mode) {
            case 'NORMAL':
                this.#mode = 'TEXT'
                break
            default:
                this.#mode = 'NORMAL'

        }
        return this
    }

    #not(): Grid {
        const a = this.#stack.pop()
        this.#bt.pushNot(a)
        if (a === 0n)
            this.#stack.push(1n)
        else
            this.#stack.push(0n)
        return this
    }

    #greaterThan(): Grid {
        const a = this.#stack.pop()
        const b = this.#stack.pop()
        this.#bt.pushGreaterThan(a, b)
        if (b > a)
            this.#stack.push(1n)
        else
            this.#stack.push(0n)
        return this
    }

    #accelerate(opcode: Dir): Grid {
        let cond: bigint
        this.#bt.pushAcceleration(this.#velocity)
        switch (opcode) {
            case '<':
                this.#velocity = left
                break
            case '^':
                this.#velocity = up
                break
            case '>':
                this.#velocity = right
                break
            case 'v':
                this.#velocity = down
                break
            case '←':
                cond = this.#stack.pop()
                this.#bt.pushDiscard(cond)
                this.#velocity = cond === 0n ? right : left
                break
            case '↑':
                cond = this.#stack.pop()
                this.#bt.pushDiscard(cond)
                this.#velocity = cond === 0n ? down : up
                break
            case '→':
                cond = this.#stack.pop()
                this.#bt.pushDiscard(cond)
                this.#velocity = cond === 0n ? left : right
                break
            case '↓':
                cond = this.#stack.pop()
                this.#bt.pushDiscard(cond)
                this.#velocity = cond === 0n ? up : down
        }
        return this
    }

    #randomAccelerate(): Grid {
        const dirs: AbsoluteDir[] = ['<', '^', '>', 'v']
        const numDirs = 4
        const randomIdx = Math.floor(Math.random() * numDirs)
        return this.#accelerate(dirs[randomIdx])
    }

    #math(opcode: MathOp): Grid {
        const a = this.#stack.pop()
        const b = this.#stack.pop()
        this.#bt.pushMath(a, b)
        let result = 0n
        switch (opcode) {
            case '+':
                result = b + a
                break
            case '-':
                result = b - a
                break
            case '*':
                result = b * a
                break
            case '/':
                result = b / a
                break
            case '%':
                result = b % a
        }
        this.#stack.push(result)
        return this
    }

    #printInt(): Grid {
        const a = this.#stack.pop()
        this.#bt.pushPrintInt(a)
        this.#io.putString(` ${a} `)
        return this
    }

    #printChar(): Grid {
        const a = this.#stack.pop()
        this.#bt.pushPrintChar(a)
        const c = String.fromCharCode(Number(a))
        this.#io.putString(c)
        return this
    }

    #readInt(): Grid {
        this.#bt.pushReadInt()
        const a = this.#io.getDigit()
        this.#stack.push(a)
        return this
    }

    #readChar(): Grid {
        this.#bt.pushReadChar()
        const a = this.#io.getChar()
        const code = BigInt(a.charCodeAt(0))
        this.#stack.push(code)
        return this
    }

    #duplicate(): Grid {
        this.#bt.pushDuplicate()
        const a = this.#stack.pop()
        this.#stack.push(a)
        this.#stack.push(a)
        return this
    }

    #swap(): Grid {
        this.#bt.pushSwap()
        const a = this.#stack.pop()
        const b = this.#stack.pop()
        this.#stack.push(a)
        this.#stack.push(b)
        return this
    }

    #discard(): Grid {
        const discarded = this.#stack.pop()
        this.#bt.pushDiscard(discarded)
        return this
    }

    #place(): Grid {
        const y = this.#stack.pop()
        const x = this.#stack.pop()
        const v = this.#stack.pop()
        const oldV = this.#read(Number(x), Number(y))
        if (oldV)
            this.#bt.pushPlace(x, y, oldV)
        else
            this.#bt.pushPlace(x, y, ' ')
        const c = String.fromCharCode(Number(v))
        this.#write(Number(x), Number(y), c)
        return this
    }

    #grab(): Grid {
        const y = this.#stack.pop()
        const x = this.#stack.pop()
        const c = this.#read(Number(x), Number(y))
        if (!c)
            return this
        const v = BigInt(c.charCodeAt(0))
        this.#bt.pushGrab(x, y)
        this.#stack.push(v)
        return this
    }

    #stop(): Grid {
        this.#running = false
        return this
    }

    #pushInt(i: string): Grid {
        if ('0' > i || i > '9')
            return this
        this.#bt.pushPushInt()
        this.#stack.push(BigInt(i))
        return this
    }

    #pushChar(c: string): Grid {
        const v = BigInt(c.charCodeAt(0))
        this.#bt.pushPushInt()
        this.#stack.push(v)
        return this
    }

    #write(x: number, y: number, v: string): Grid {
        if (y < 0) {
            this.#boundryHooks.top.write()
            return this
        }

        if (x < 0) {
            this.#boundryHooks.left.write()
            return this
        }

        if (x >= this.#width) {
            this.#boundryHooks.right.write()
            const newWidth = x + 1
            this.#grid.forEach((row) => {
                while (row.length < newWidth)
                    row.push(' ')
            })
            this.#width = newWidth
        }

        if (y >= this.#height) {
            this.#boundryHooks.bottom.write()
            const newHeight = y + 1
            const emptyRow = Array(this.#width).map((_) => ' ')
            while (this.#grid.length < newHeight)
                this.#grid.push(emptyRow)
            this.#height = newHeight
        }

        this.#grid[y][x] = v
        return this
    }

    #read(x: number, y: number): string | undefined {
        if (x >= this.#width) {
            this.#boundryHooks.right.read()
            return undefined
        }

        if (y >= this.#height) {
            this.#boundryHooks.bottom.read()
            return undefined
        }

        if (y < 0) {
            this.#boundryHooks.top.read()
            return ' '
        }

        if (x < 0) {
            this.#boundryHooks.left.read()
            return ' '
        }

        return this.#grid[y][x]
    }

    #handleTextCommand(curr: string): Grid {
        switch (curr) {
            case '"':
                this.#changeMode().#move()
                break
            default :
                this.#pushChar(curr).#move()
        }
        return this
    }

   #handleNormalCommand(curr: string): Grid {
       switch (curr) {
// mode changes
           case '"':
               this.#changeMode().#move()
               break
// movement control
           case '<':
           case '^':
           case '>':
           case 'v':
           case '←':
           case '↑':
           case '→':
           case '↓':
               this.#accelerate(curr).#move()
               break
           case '?':
               this.#randomAccelerate().#move()
               break
           case '#':
               this.#move().#move()
               break
// maths and logic
           case '+':
           case '-':
           case '*':
           case '/':
           case '%':
               this.#math(curr).#move()
               break
           case '!':
               this.#not().#move()
               break
           case '`':
               this.#greaterThan().#move()
               break
// i/o
           case '.':
               this.#printInt().#move()
               break
           case ',':
               this.#printChar().#move()
               break
           case '&':
               this.#readInt().#move()
               break
           case '~':
               this.#readChar().#move()
               break
// stack manipulation
           case ':':
               this.#duplicate().#move()
               break
           case '\\':
               this.#swap().#move()
               break
           case '$':
               this.#discard().#move()
               break
// memory management
           case 'p':
               this.#place().#move()
               break
           case 'g':
               this.#grab().#move()
               break
// exit control
           case '@':
               this.#stop()
               break
// 1-digit int pushing or no op
           default :
               this.#pushInt(curr).#move()
               break
       }
       return this
    }

    get running(): boolean {
        return this.#running
    }

    stop() {
        this.#running = false
    }

    start() {
        this.#running = true
    }

    get grid(): string[][] {
        return this.#grid.map((row) => [...row])
    }

    get position(): Vector2 {
        return this.#position
    }

    set position({x, y}: Vector2Like) {
        this.#position = new Vector2(x, y)
    }

    get velocity(): Vector2 {
        return this.#velocity
    }

    set velocity(velocity: AbsoluteDir) {
        switch (velocity) {
            case '<':
                this.#velocity = left
                break
            case '^':
                this.#velocity = up
                break
            case '>':
                this.#velocity = right
                break
            case 'v':
                this.#velocity = down
        }
    }

    get mode(): 'NORMAL' | 'TEXT' {
        return this.#mode
    }

    set mode(newMode: 'NORMAL' | 'TEXT') {
        this.#mode = newMode
    }

    get operator(): string | undefined {
        return this.#read(this.#position.x, this.#position.y)
    }

    set operator(op: string) {
        this.#write(this.#position.x, this.#position.y, op)
    }

    get stack(): bigint[] {
        return this.#stack.array
    }

    set stack(newStack: bigint[]) {
        this.#stack = new Stack(newStack)
    }

    get boundryHooks(): BoundryHooks {
        return this.#boundryHooks
    }

    set io(newIO: GridIO) {
        this.#io = newIO
    }

    set backtraceRecorder(bt: Backtrace) {
        this.#bt = bt
    }

    step(): Grid {
        const curr = this.#read(this.#position.x, this.#position.y)
        if (!curr)
            return this
        if (!this.#running)
            return this
        switch (this.#mode) {
            case 'TEXT':
                this.#handleTextCommand(curr)
                break
            case 'NORMAL':
                this.#handleNormalCommand(curr)
        }
        this.#bt.commitOps()
        return this
    }

    unstep(): Grid {
        const delta = this.#bt.pop()
        if (!delta)
            return this
        delta.forEach(delta => {
            switch (delta.tag) {
                case 'move':
                    this.#position = delta.position
                    break
                case 'accelerate':
                    this.#velocity = delta.velocity
                    break
                case 'math':
                    this.#stack.pop()
                    this.#stack.push(delta.b)
                    this.#stack.push(delta.a)
                    break
                case 'not':
                    this.#stack.pop()
                    this.#stack.push(delta.pop)
                    break
                case 'greaterThan':
                    this.#stack.pop()
                    this.#stack.push(delta.b)
                    this.#stack.push(delta.a)
                    break
                case 'modeChange':
                    switch (this.#mode) {
                        case 'NORMAL':
                            this.#mode = 'TEXT'
                            break
                        case 'TEXT':
                            this.#mode = 'NORMAL'
                    }
                    break
                case 'discard':
                    this.#stack.push(delta.discarded)
                    break
                case 'duplicate':
                    this.#stack.pop()
                    break
                case 'swap':
                    (() => {
                        const x = this.#stack.pop()
                        const y = this.#stack.pop()
                        this.#stack.push(x)
                        this.#stack.push(y)
                    })()
                    break
                case 'grab':
                    this.#stack.pop()
                    this.#stack.push(delta.x)
                    this.#stack.push(delta.y)
                    break
                case 'place':
                    this.#stack.push(delta.x)
                    this.#stack.push(delta.y)
                    this.#stack.push(BigInt(this.#read(Number(delta.x), Number(delta.y))?.charCodeAt(0) || 32))
                    this.#write(Number(delta.x), Number(delta.y), delta.oldV)
                    break
                case 'printChar':
                    this.#io.unputString(String.fromCharCode(Number(delta.char)))
                    this.#stack.push(delta.char)
                    break
                case 'printInt':
                    this.#io.unputString(` ${delta.int} `)
                    this.#stack.push(delta.int)
                    break
                case 'readInt':
                    (() => {
                        const int = this.#stack.pop()
                        this.#io.ungetDigit(int)
                    })()
                    break
                case 'readChar':
                    (() => {
                        const c = String.fromCharCode(Number(this.#stack.pop()))
                        this.#io.ungetChar(c)
                    })
                    break
                case 'pushInt':
                    this.#stack.pop()
            }
        })
        return this
    }
}
