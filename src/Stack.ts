export class Stack {
    #stack: bigint[]

    constructor(arr: bigint[]) {
        this.#stack = arr
    }

    static fresh(): Stack {
        return new Stack([])
    }

    get array(): bigint[] {
        return [...this.#stack]
    }

    push(n: bigint) {
        this.#stack.push(n)
    }

    pop(): bigint {
        const n = this.#stack.pop()
        if (!n)
            return 0n
        return n
    }

    copy(): Stack {
        return new Stack(this.#stack)
    }

    toString(): string {
        return `[${this.#stack.join(', ')}]`
    }
}
