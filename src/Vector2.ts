export class Vector2 {
#x = 0
#y = 0

    constructor(x: number, y: number) {
        this.#x = x
        this.#y = y
    }

    get x(): number {
        return this.#x
    }

    get y(): number {
        return this.#y
    }

    add(v: Vector2): Vector2 {
        return new Vector2(this.#x + v.x, this.#y + v.y)
    }

    toString(): string {
        return `{x: ${this.#x}, y: ${this.#y}}`
    }
}

export const left: Vector2  = new Vector2(-1, 0)
export const up: Vector2    = new Vector2(0, -1)
export const right: Vector2 = new Vector2(1, 0)
export const down: Vector2  = new Vector2(0, 1)
