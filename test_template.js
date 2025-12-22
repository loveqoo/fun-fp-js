const fp = require('./index.js')();
const { template } = fp;

const data = {
    user: {
        name: 'Anthony',
        age: 30,
        settings: {
            theme: 'dark'
        }
    },
    items: ['apple', 'banana'],
    status: false,
    count: 0,
    empty: ''
};

console.log('--- Template Function Tests ---');

// 1. Simple key
console.log('Test 1 (Simple key):',
    template('Hello, {{user.name}}!', data) === 'Hello, Anthony!' ? 'PASS' : 'FAIL');

// 2. Nested key
console.log('Test 2 (Nested key):',
    template('Theme is {{user.settings.theme}}.', data) === 'Theme is dark.' ? 'PASS' : 'FAIL');

// 3. Falsy values (0, false, "")
console.log('Test 3 (Falsy - false):',
    template('Status: {{status}}', data) === 'Status: false' ? 'PASS' : 'FAIL');
console.log('Test 4 (Falsy - 0):',
    template('Count: {{count}}', data) === 'Count: 0' ? 'PASS' : 'FAIL');
console.log('Test 5 (Falsy - empty string):',
    template('Empty: "{{empty}}"', data) === 'Empty: ""' ? 'PASS' : 'FAIL');

// 4. Missing key (Fallback)
console.log('Test 6 (Missing key):',
    template('Missing: {{missing}}', data) === 'Missing: {{missing}}' ? 'PASS' : 'FAIL');
console.log('Test 7 (Missing nested key):',
    template('Missing nested: {{user.none.value}}', data) === 'Missing nested: {{user.none.value}}' ? 'PASS' : 'FAIL');

// 5. Multiple replacements
console.log('Test 8 (Multiple):',
    template('{{user.name}} is {{user.age}} years old.', data) === 'Anthony is 30 years old.' ? 'PASS' : 'FAIL');

console.log('-------------------------------');
