Notes from YT course:
https://www.youtube.com/watch?v=d56mG7DezGs

Create config file:

```
tsc -—init
```
Basic parameters:
```
target: “ES2016”
rootDir: ‘./src’ //path to ts source
outDir: // ts compiler output directory

strict: true // Must enable the below manually if set to true
noImplicitAny: false 
noUnusedParameters: //
noImplicitReturns: //
noUnusedLocals: //
strictNullChecks: // defaults to true
``

Fundamentals

TS types (additional to JS types):
any, unknown, never, enum, tuple

Inference:
```
let sales = 132_456; //No annotation needed
let name = 'Johannes'; //No annotation needed
```

Any:
```
let lavel; //becomes any automatically
```

Arrays:
```
let numbers: number[];
let numbers = [1, 2, 3]; //Number inferred
```

Tuple:
```
let user: [user, string] = [1, 'Weber'];

```

Enum:

Group constants.
```
const small = 1;
const medium = 2;
const large = 3;

const enum Size { Small = 1, Medium = 2, Large = 3 }
let mySize: Size = Size.Medium;
```

Functions:

Should annotate return even though compiler infers.
```
function calculateTax(income: number, taxYear = 2022): number {
    return 0;
}
```

Objects:
```
let employee = { id: 1 } // Compiler infers object shape

let employee: {
    id: number,
    name: string
} = { id: 1, name: 'Weber' }

// Make a param it readonly
let employee: {
    readonly id: number, //readonly
    name: string,
    retire: (date: Date) => void //method
} = { 
    id: 1, 
    name: 'Weber',
    retire: (date: Date) => {
        console.log(date);
    }
}
```

Advanced Types

Type Alias
```
type Employee = {
    readonly id: number, //readonly
    name: string,
    retire: (date: Date) => void //method
}

let employee: Employee = {
    ...
}
```

Union Types

```
function kgToLbs(weight: number | string): number {
    // Narrowing
    if (typeof weight === 'number') {
        // Compiler knows that weight is a number
        return weight * 2.2;
    } else {
        // Compiler knows that weight is string
        return parseInt(weight) @ 2.2;
    }
}
```

Intersection
```
type Draggable = {
    drag: () => void,
}

type Resizable = {
    resize: () => void
}

type UIWidget = Draggable & Resizable;

let textBox: UIWidget = {
    // need to implement both drag and resize
    drag: () => {},
    resize: () => {},
}
```

Literal types
```
type Qty = 50 | 100;
let qty: Qty = 100;

type Metric = 'cm' | 'inch';
let metric: Metric = 'cm';
```

Nullable types
TSC compiler prevents calling a funntions with null when it can't be called with null; use union type on function annotation to allow null.

```
function greet(name: string | null) {
    if (name) {
        console.log(name toUpperCase());
    } else {
        console.log('Hola!');
    }
}


type Customer = {
    birthday: Date
}

function getCustomer(id:number): Customer | null {
    return id === 0 ? null : { birthday: new Date() }
}

let customer = getCustomer(0);

// Optional property access operator
console.log(customer?.birtday);

// Optional element access operator
// customers?.[0]

// Optional call operator
let log: any = null;
log?.('a');
```