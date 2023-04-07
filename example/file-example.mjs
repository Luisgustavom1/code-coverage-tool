export function calc(a, b) {
    if (a >= 9 && a <= 10) {
        return a + b;
    } 

    if (a === 3) {
        return a;
    }

    if (b === 7) {
        return b;
    }

    return (a + b) / 2  
}