import {Grid} from './src/Grid.ts'
import {DebugIO} from './src/Io.ts'

let filename = ''
let debug = false

if (Deno.args.length === 2) {
    filename = Deno.args[0]
    debug = Deno.args[1] === 'debug'
} else if (Deno.args.length === 1) {
    filename = Deno.args[0]
} else {
    console.log('Usage:')
    console.log('    $ gridly GRIDFILE [debug]')
    Deno.exit(1)
}

// check to see if we're given an actually existing file...
try {
    await Deno.stat(filename)
} catch (err) {
    if (err instanceof Deno.errors.NotFound) {
        console.log(`File ${filename} is not found`)
        Deno.exit(2)
    } else {
        throw err
    }
}

const grid = await Grid.load(filename)
const debugio = new DebugIO()
if (debug) {
    grid.io = debugio
}

const e = new TextEncoder()
const buf = new Uint8Array(1024)
while (grid.running) {
    if (debug) {
        const g = grid.grid
        g[grid.position.y][grid.position.x] = '☺'

        debugio.tail(3).forEach(row => {
            console.log(row)
        })

        console.log('V:', grid.velocity.toString())
        console.log('S:', grid.stack)
        console.log('Mode:', grid.mode)
        console.log('OPCode:', grid.operator)
        console.log(g.map(r => r.join('')).join('\n'))
        Deno.stdout.writeSync(e.encode('...'))
        Deno.stdin.readSync(buf)
    }
    grid.step()
    if (debug) {
        Deno.stdout.writeSync(e.encode('\n'))
    }
}

Deno.stdout.writeSync(e.encode('\n'))
const exitcode = Number(grid.stack.pop() || 0n)
Deno.exit(exitcode)
