const $func = require('../modules/func.js');
const { assertEquals } = require('./utils.js');
const { fp: f } = $func({ log: () => { } });

console.log('Testing predicate with async functions...');

const asyncTrue = async () => true;
const p = f.predicate(asyncTrue, false);

const result = p();
console.log('Result for async predicate:', result);

try {
    assertEquals(result, false, 'Async predicate should return fallback (false) instead of Boolean(Promise) === true');
    console.log('✅ Async predicate protection test passed');
} catch (e) {
    console.log('❌ Async predicate protection test failed:', e.message);
    process.exit(1);
}
