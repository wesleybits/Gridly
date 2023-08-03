export interface GridIO {
    putString(str: string): void
    unputString(str: string): void
    getChar(): string
    ungetChar(char: string): void
    getDigit(): bigint
    ungetDigit(d: bigint): void
}

export class StandardIO implements GridIO {
    #input: Deno.ReaderSync
    #output: Deno.WriterSync
    #buffer: string[]

    constructor() {
        this.#input = Deno.stdin
        this.#output = Deno.stdout
        this.#buffer = []
    }

    #getc(): string {
        let c = this.#buffer.shift()
        while (!c) {
            const buff = new Uint8Array(1024)
            const decoder = new TextDecoder()
            this.#input.readSync(buff)
            this.#buffer = decoder.decode(buff).split('')
            c = this.#buffer.shift()
        }
        return c
    }

    putString(str: string): void {
        this.#output.writeSync(new TextEncoder().encode(str))
    }

    unputString(_str: string): void {
        return
    }

    getChar(): string {
        this.putString(': ')
        return this.#getc()
    }

    ungetChar(char: string): void {
        this.#buffer.unshift(char)
    }

    getDigit(): bigint {
        this.putString('(0-9): ')
        let c = this.#getc()
        while ('0' > c || c > '9') {
            this.putString('(0-9): ')
            c = this.#getc()
        }
        return BigInt(c)
    }

    ungetDigit(d: bigint): void {
        this.#buffer.unshift(`${d}`)
    }
}

export class DebugIO implements GridIO {
    #output: string[]
    #input: Deno.ReaderSync
    #buffer: string[]

    constructor() {
        this.#output = []
        this.#input = Deno.stdin
        this.#buffer = []
    }


    #getc(): string {
        let c = this.#buffer.shift()
        while (!c) {
            const buff = new Uint8Array(1024)
            const decoder = new TextDecoder()
            this.#input.readSync(buff)
            this.#buffer = decoder.decode(buff).trim().split('')
            c = this.#buffer.shift()
        }
        return c
    }

    #pop(): string {
        return this.#output.pop() || ''
    }

    #push(str: string) {
        this.#output.push(str)
    }

    putString(str: string): void {
        let line = this.#pop()
        if (str === '\n') {
            this.#push(line)
            line = ''
        } else {
            line += str
        }
        this.#push(line)
    }

    unputString(str: string): void {
        if (str === '\n')
            this.#output.pop()
        else {
            const lastIdx = this.#output.length - 1
            const lastStr = this.#output[lastIdx]
            console.log('lastStr', lastStr)
            this.#output[lastIdx] = lastStr.slice(0, lastStr.length - str.length)
            console.log('at lastIdx', this.#output[lastIdx])
        }
    }

    getChar(): string {
        Deno.stdout.writeSync(new TextEncoder().encode('Input a char: '))
        return this.#getc()
    }

    ungetChar(char: string): void {
        this.#buffer.unshift(char)
    }

    getDigit(): bigint {
        Deno.stdout.writeSync(new TextEncoder().encode('Input a digit (0-9): '))
        let c = this.#getc()
        while ('0' > c || c > '9') {
            Deno.stdout.writeSync(new TextEncoder().encode('(0-9): '))
            c = this.#getc()
        }
        return BigInt(c)
    }

    ungetDigit(d: bigint): void {
        this.#buffer.unshift(`${d}`)
    }

    tail(len = 3): string[] {
        if (this.#output.length < len) {
            return this.#output
        }
        const end = this.#output.length
        const start = end - len
        return this.#output.slice(start, end)
    }
}
