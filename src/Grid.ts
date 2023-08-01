import {Vector2, left, right, up, down} from "./Vector2.ts"
import {GridIO, StandardIO} from "./Io.ts"
import {Stack} from "./Stack.ts"
import { Backtrace, NullBacktrace } from "./Backtrace.ts"

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

    constructor(grid: string[][]) {
        this.#grid = grid;
        this.#height = grid.length
        this.#width = this.#height === 0 ? 0 : grid[0].length
        this.#position = new Vector2(0, 0)
        this.#velocity = right
        this.#stack = Stack.fresh()
        this.#running = true
        this.#mode = 'NORMAL'
        this.#io = new StandardIO()
        this.#bt = new NullBacktrace
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
                this.#velocity = this.#stack.pop() === 0n ? right : left
                break
            case '↑':
                this.#velocity = this.#stack.pop() === 0n ? down : up
                break
            case '→':
                this.#velocity = this.#stack.pop() === 0n ? left : right
                break
            case '↓':
                this.#velocity = this.#stack.pop() === 0n ? up : down
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
        this.#bt.pushPlace(x, y, oldV)
        const c = String.fromCharCode(Number(v))
        this.#write(Number(x), Number(y), c)
        return this
    }

    #grab(): Grid {
        const y = this.#stack.pop()
        const x = this.#stack.pop()
        this.#bt.pushGrab(x, y)
        const c = this.#read(Number(x), Number(y))
        const v = BigInt(c.charCodeAt(0))
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
            console.log('Invalid operation: attempting to write above the top edge of the grid')
            Deno.exit(1)
        }

        if (x < 0) {
            console.log('Invalid operation: attempting to write past the left edge of the grid')
            Deno.exit(1)
        }

        if (x >= this.#width) {
            const newWidth = x + 1
            this.#grid.forEach((row) => {
                while (row.length < newWidth)
                    row.push(' ')
            })
            this.#width = newWidth
        }

        if (y >= this.#height) {
            const newHeight = y + 1
            const emptyRow = Array(this.#width).map((_) => ' ')
            while (this.#grid.length < newHeight)
                this.#grid.push(emptyRow)
            this.#height = newHeight
        }

        this.#grid[y][x] = v
        return this
    }

    #read(x: number, y: number): string {
        if (x >= this.#width || y >= this.#height)
            return ' '

        if (y < 0) {
            console.log('Invalid operation: attempting to read past the top edge of the grid')
            Deno.exit(1)
        }

        if (x < 0) {
            console.log('Invalid operation: attempting to read past the left edge of the grid')
            Deno.exit(1)
        }

        return this.#grid[y][x]
    }

    #handleTextCommand(curr: string): Grid {
        switch (curr) {
            case '"':
                return this.#changeMode().#move()
            default :
                return this.#pushChar(curr).#move()
        }
    }

   #handleNormalCommand(curr: string): Grid {

       switch (curr) {
// mode changes
           case '"':
               return this.#changeMode().#move()
// movement control
           case '<':
           case '^':
           case '>':
           case 'v':
           case '←':
           case '↑':
           case '→':
           case '↓':
               return this.#accelerate(curr).#move()
           case '?':
               return this.#randomAccelerate().#move()
           case '#':
               return this.#move().#move()
// maths and logic
           case '+':
           case '-':
           case '*':
           case '/':
           case '%':
               return this.#math(curr).#move()
           case '!':
               return this.#not().#move()
           case '`':
               return this.#greaterThan().#move()
// i/o
           case '.':
               return this.#printInt().#move()
           case ',':
               return this.#printChar().#move()
           case '&':
               return this.#readInt().#move()
           case '~':
               return this.#readChar().#move()
// stack manipulation
           case ':':
               return this.#duplicate().#move()
           case '\\':
               return this.#swap().#move()
           case '$':
               return this.#discard().#move()
// memory management
           case 'p':
               return this.#place().#move()
           case 'g':
               return this.#grab().#move()
// exit control
           case '@':
               return this.#stop()
// 1-digit int pushing or no op
           default :
               return this.#pushInt(curr).#move()
       }
    }

    get running(): boolean {
        return this.#running
    }

    get grid(): string[][] {
        return this.#grid.map((row) => [...row])
    }

    get position(): Vector2 {
        return this.#position
    }

    get velocity(): Vector2 {
        return this.#velocity
    }

    get mode(): 'NORMAL' | 'TEXT' {
        return this.#mode
    }

    get operator(): string {
        return this.#read(this.#position.x, this.#position.y)
    }

    get stack(): bigint[] {
        return this.#stack.array
    }

    set io(newIO: GridIO) {
        this.#io = newIO
    }

    set backtraceRecorder(bt: Backtrace) {
        this.#bt = bt
    }

    step(): Grid {
        const curr = this.#read(this.#position.x, this.#position.y)
        switch (this.#mode) {
            case 'TEXT':
                return this.#handleTextCommand(curr)
            case 'NORMAL':
                return this.#handleNormalCommand(curr)
            default :
                return this
        }
    }

    unstep(): Grid {
        let delta = this.#bt.pop()
        while (delta && this.#bt.peek()?.tag !== 'move') {
            switch (delta.tag) {
                case 'move':
                    this.#position = delta.position
                    break
                case 'accelerate':
                    this.#velocity = delta.velocity
                    break
                case 'math':
                    this.#stack.pop()
                    this.#stack.push(delta.a)
                    this.#stack.push(delta.b)
                    break
                case 'not':
                    this.#stack.pop()
                    this.#stack.push(delta.pop)
                    break
                case 'greaterThan':
                    this.#stack.pop()
                    this.#stack.push(delta.a)
                    this.#stack.push(delta.b)
                    break
                case 'modeChange':
                    this.#changeMode()
                    break
                case 'discard':
                    this.#stack.push(delta.discarded)
                    break
                case 'duplicate':
                    this.#stack.pop()
                    break
                case 'swap':
                    this.#swap()
                    break
                case 'grab':
                    this.#stack.pop()
                    this.#stack.push(delta.x)
                    this.#stack.push(delta.y)
                    break
                case 'place':
                    this.#stack.push(delta.x)
                    this.#stack.push(delta.y)
                    this.#stack.push(BigInt(this.#read(Number(delta.x), Number(delta.y)).charCodeAt(0)))
                    this.#write(Number(delta.x), Number(delta.y), delta.oldV)
                    break
                case 'printChar':
                    this.#stack.push(delta.char)
                    break
                case 'printInt':
                    this.#stack.push(delta.int)
                    break
                case 'readInt':
                case 'readChar':
                case 'pushInt':
                    this.#stack.pop()
            }
            delta = this.#bt.pop()
        }
        return this
    }
}
