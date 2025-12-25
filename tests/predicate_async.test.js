const $core = require('../modules/core.js');
const { assertEquals } = require('./utils.js');
const { core } = $core({ log: () => { } });

console.log('Testing predicate with async functions...');

const asyncTrue = async () => true;
const p = core.predicate(asyncTrue, false);

const result = p();
console.log('Result for async predicate:', result);

try {
    assertEquals(result, false, 'Async predicate should return fallback (false) instead of Boolean(Promise) === true');
    console.log('✅ Async predicate protection test passed');
} catch (e) {
    console.log('❌ Async predicate protection test failed:', e.message);
    process.exit(1);
}
