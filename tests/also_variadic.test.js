const $func = require('../modules/func.js');
const { assertEquals } = require('./utils.js');
const { fp: f } = $func({ log: () => { } });

console.log('Testing "also" with multiple function arguments...');

let count1 = 0;
let count2 = 0;

const spy1 = () => { count1++; };
const spy2 = () => { count2++; };

const data = { val: 42 };

// Now variadic also: x => (...fs) => tap(...fs)(x)
const result = f.also(data)(spy1, spy2);

console.log('  Count 1:', count1);
console.log('  Count 2:', count2);
console.log('  Result:', JSON.stringify(result));

try {
    assertEquals(count1, 1, 'First function should be executed');
    assertEquals(count2, 1, 'Second function should be executed (variadic!)');
    assertEquals(result.val, 42, 'Original data should be returned');
    console.log('✅ confirmed: "also" now handles variadic functions!');
} catch (e) {
    console.log('❌ also test result was unexpected:', e.message);
    process.exit(1);
}
