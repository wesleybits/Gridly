# Gridly

This is something close to an implementation of a hypothetical programming
language featured in one of HackerRank's technical aptitude exams. It is a
dialect of Befunge called Grid. The exam itself was weirdly super-fun. I wanted
to play around some more with the language.

Like Befunge, Grid is a stack-based programming language featuring
single-character operations and 2-dimensional execution flow. The Grid machine
consists of a cursor, a cursor velocity, a stack, an execution mode, and the
source-code itself splayed onto an infinite 2-dimensional character array. The
cursor sits in the grid on top of operation to execute. The cursor velocity
determines how the cursor will be updated on the next step. The stack is the
stack and is the machine's active memory. The execution mode is either NORMAL or
TEXT; NORMAL being the mode where grid cells are executed, and TEXT simply
encodes the current grid cell into an integer to push onto the stack. The grid
is where your source gets loaded, and is theoretically infinite.

Like Befunge, Grid only handles integer mathematics.

The differences from Befunge is in how Grid handles conditional branching.
Befunge's conditional branching operators, '`_`' and '`|`', are replaced with
'`←`', '`↑`', '`→`', '`↓`' for finer control over execution direction. Grid
also ignores any character that isn't an opcode. Other than that, the languages
are the same.

# Language Description

The grid executor has four major components: the grid itself containing the
program, the cursor, the cursor velocity, the execution mode, and the stack.

The grid has a top and left boundary, but is functionally infinite downwards and
rightwards.

The cursor sits on the grid between the previous executed command, and the next
command to be executed.

The cursor velocity determines in which direction the cursor is reading, either
left, up, right, or down.

The execution mode determines what the machine will do when the cursor reads
something. The modes are 'NORMAL' and 'TEXT'.

 - In 'NORMAL' mode the machine will try to execute commands the cursor reads.

 - In 'TEXT' mode, provided a '"' isn't read, will push the character code of
   whatever the cursor reads onto the stack.

The stack is the central data structure of the grid machine. Most of the
commands in Grid manipulate the stack in some way. Popping from the empty stack
will always yield a 0.

Once loaded, the grid machine sets the following default state:
 - Cursor is on the top-left.
 - Cursor is reading to the right
 - Execution mode is 'NORMAL'
 - The stack is empty
 - The program sources occupy the top-left corner of the grid.

## Commands

Grid uses single-character operations, they are:

### Execution Mode Control
- `"`: In both modes, a `"` will toggle between 'NORMAL' and 'TEXT'.

### Movement Control
- `<`, `^`, `>`, `v`: unconditionally change velocity to move to the left, up,
  right, or down, respectively.
- `←`, `↑`, `→`, `↓`: conditionally change velocity to the left, up, right, or
  down, respectively. A number is popped off the stack, and if it is not zero,
  then velocity is changed in the direction the arrow is pointing, otherwise it
  is changed in the opposite direction.
- `#`: Causes the cursor to hop over the next command.

### Stack Control
- `0`-`9`: This pushes a single-digit integer to the stack
- `:`: This duplicates the integer on the top of the stack
- `\`: This swaps the top two integers of the stack
- `$`: This discards the top integer on the stack

### Arithmetic
- `+`, `-`, `*`, `/`, `%`: This will pop two integers (a, b) from the stack, and
  perform appropriate operation between b and a:
  - `+`: `51+` is `5 + 1`
  - `-`: `51-` is `5 - 1`
  - `*`: `51*` is `5 * 1`
  - `/`: `51/` is `5 / 1`
  - `%`: `51%` is `5 % 1`

### Logic
- `!`: Not operator. Pop a number off the stack, push a 1 if zero, otherwise
  push a 0.
- `\``: Greater than operator. Pop two numbers off the stack. If the second
  number is greater than the first number, push a 1, otherwise push a 0.

### I/O
- `.`: Pop a number off the stack and print it, putting a space after it.
- `,`: Pop a number off the stack and print the character it encodes:
  - `52*,` prints a line break.
  - `84*,` prints a space.
- `&`: prompts a user to input a digit. Once an appropriate digit is entered, it
  is pushed onto the stack.
- `~`: prompts the user to input a character. Once the character is entered, the
  integer that encodes it is pushed onto the stack.

### Memory Access and Reflection

The grid itself can be read from and manipulated. It's not unreasonable to use
the grid as a sort of cache, or encode data structures onto it, or have the
program manipulate itself.

- `g`: Pop two integers from the stack, the first being the 'y' coordinate, and
  the second being the 'x' coordinate, and uses these coordinates to get a
  character from the grid. The integer that encodes it is pushed onto the stack.
- `p`: Pop three integers from the stack, a 'y' coordinate, an 'x' coordinate,
  and some value 'v'. The coordinates are used to write the character that 'v'
  encodes onto the grid.

### Exiting
- `@`: Exits Grid, the top of the stack is the exit code.
