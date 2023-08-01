export type AccessHook = {
    read(): void,
    write(): void
}
export type BoundryHooks = {
    top: AccessHook,
    bottom: AccessHook,
    left: AccessHook,
    right: AccessHook
}

export const defaultHooks: BoundryHooks = {
    top: {
        read(): void {
            console.log('FATAL','cannot read past top of grid')
            Deno.exit(1)
        },
        write(): void {
            console.log('FATAL', 'cannot write past top of grid')
            Deno.exit(1)
        }
    },
    bottom: {
        read(): void {
            console.log('WARN', 'reading below bottom-most character')
        },
        write(): void {
            return
        }
    },
    left: {
        read(): void {
            console.log('FATAL', 'cannot read past left of grid')
            Deno.exit(1)
        },
        write(): void {
            console.log('FATAL', 'cannot write past left of grid')
            Deno.exit(1)
        }
    },
    right: {
        read(): void {
            console.log('WARN', 'reading right of right-most character')
        },
        write(): void {
            return
        }
    }
}
