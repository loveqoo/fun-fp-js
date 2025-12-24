const funFpJs = require('../all_in_one.js');
const { extra } = funFpJs({ log: () => { } });
const { template } = extra;

const { assertEquals } = require('./utils.js');

console.log('Testing template with spaces in keys...');

const data = { a: { b: 'success' } };

try {
    assertEquals(template('{{ a.b }}', data), 'success', 'Normal key should work');
    assertEquals(template('{{a.b}}', data), 'success', 'Key without spaces should work');

    console.log('Testing with spaces...');
    const resultWithSpaces = template('{{  a.b  }}', data);
    console.log(`  Result for "{{  a.b  }}": "${resultWithSpaces}"`);
    assertEquals(resultWithSpaces, 'success', 'Key with spaces should work');

    const resultWithNestedSpaces = template('{{ a . b }}', data);
    console.log(`  Result for "{{ a . b }}": "${resultWithNestedSpaces}"`);
    assertEquals(resultWithNestedSpaces, 'success', 'Nested key components with spaces should work');

    console.log('✅ template spaces test passed');
} catch (e) {
    console.log('❌ template spaces test failed:', e.message);
}
