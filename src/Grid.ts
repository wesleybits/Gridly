import {Vector2, left, right, up, down} from "./Vector2.ts"
import {GridIO, StandardIO} from "./Io.ts"
import {Stack} from "./Stack.ts"

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
        this.#position = this.#position.add(this.#velocity)
        return this
    }

    #accellerate(v: Vector2): Grid {
        this.#velocity = v
        return this
    }

    #accellerateIf(ifTrue: Vector2, ifFalse: Vector2): Grid {
        const cond = this.#stack.pop()
        if (cond === 0n)
            return this.#accellerate(ifFalse)
        return this.#accellerate(ifTrue)
    }

    #math(op: (a: bigint, b: bigint) => bigint): Grid {
        const a = this.#stack.pop()
        const b = this.#stack.pop()
        this.#stack.push(op(a, b))
        return this
    }

    #write(x: number, y: number, v: string): Grid {
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
        if (x < 0 || y < 0)
            return ' '
        return this.#grid[y][x]
    }

    #handleTextCommand(curr: string): Grid {
        switch (curr) {
            case '"':
                this.#mode = 'NORMAL'
                break
            default :
                this.#stack.push(BigInt(curr.charCodeAt(0)))
        }
        this.#move()
        return this
    }

   #handleNormalCommand(curr: string): Grid {
        let a, b, x, y, v
        const isDigit = (c: string) => '0' <= c && c <= '9'
        const dirs = [left, up, right, down]

        switch (curr) {
            case '"':
                this.#mode = 'TEXT'
                break
            case '<':
                this.#accellerate(left)
                break
            case '^':
                this.#accellerate(up)
                break
            case '>':
                this.#accellerate(right)
                break
            case 'v':
                this.#accellerate(down)
                break
            case '#':
                this.#move()
                break
            case '?':
                this.#accellerate(dirs[Math.floor(Math.random() * dirs.length)])
                break
            case '!':
                b = this.#stack.pop()
                if (b === 0n)
                    this.#stack.push(1n)
                else
                    this.#stack.push(0n)
                break
            case '`':
                a = this.#stack.pop()
                b = this.#stack.pop()
                if (b > a)
                    this.#stack.push(1n)
                else
                    this.#stack.push(0n)
                break
            case '←':
                this.#accellerateIf(left, right)
                break
            case '↑':
                this.#accellerateIf(up, down)
                break
            case '→':
                this.#accellerateIf(right, left)
                break
            case '↓':
                this.#accellerateIf(down, up)
                break
            case '.':
                a = this.#stack.pop()
                this.#io.putString(` ${a} `)
                break
            case ',':
                a = this.#stack.pop()
                this.#io.putString(String.fromCharCode(Number(a)))
                break
            case '&':
                a = this.#io.getDigit()
                this.#stack.push(a)
                break
            case '~':
                a = this.#io.getChar()
                this.#stack.push(BigInt(a.charCodeAt(0)))
                break
            case '+':
                this.#math((a, b) => b + a)
                break
            case '-':
                this.#math((a, b) => b - a)
                break
            case '*':
                this.#math((a, b) => b * a)
                break
            case '/':
                this.#math((a, b) => b / a)
                break
            case '%':
                this.#math((a, b) => b % a)
                break
            case ':':
                a = this.#stack.pop()
                this.#stack.push(a)
                this.#stack.push(a)
                break
            case '\\':
                a = this.#stack.pop()
                b = this.#stack.pop()
                this.#stack.push(a)
                this.#stack.push(b)
                break
            case '$':
                this.#stack.pop()
                break
            case 'p':
                y = Number(this.#stack.pop())
                x = Number(this.#stack.pop())
                v = Number(this.#stack.pop())
                this.#write(x, y, String.fromCharCode(v))
                break
            case 'g':
                y = Number(this.#stack.pop())
                x = Number(this.#stack.pop())
                v = this.#read(x, y)
                this.#stack.push(BigInt(v.charCodeAt(0)))
                break
            case '@':
                this.#running = false
                this.#velocity = new Vector2(0, 0)
                break
            default :
                if (isDigit(curr))
                    this.#stack.push(BigInt(curr.charCodeAt(0) - '0'.charCodeAt(0)))
        }
        this.#move()
        return this
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
}
