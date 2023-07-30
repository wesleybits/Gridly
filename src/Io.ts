
export interface GridIO {
    putString(str: string): void
    getChar(): string
    getDigit(): bigint
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

    getChar(): string {
        this.putString(': ')
        return this.#getc()
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
}
