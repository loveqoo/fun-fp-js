const fp = require('../index.js')();
const { extra } = fp;
const { template } = extra;

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

const { logAssert: assert } = require('./utils.js');

console.log('--- Template Function Tests ---');

assert('Test 1 (Simple key)', template('Hello, {{user.name}}!', data), 'Hello, Anthony!');
assert('Test 2 (Nested key)', template('Theme is {{user.settings.theme}}.', data), 'Theme is dark.');
assert('Test 3 (Falsy - false)', template('Status: {{status}}', data), 'Status: false');
assert('Test 4 (Falsy - 0)', template('Count: {{count}}', data), 'Count: 0');
assert('Test 5 (Falsy - empty string)', template('Empty: "{{empty}}"', data), 'Empty: ""');
assert('Test 6 (Missing key)', template('Missing: {{missing}}', data), 'Missing: {{missing}}');
assert('Test 7 (Missing nested key)', template('Missing nested: {{user.none.value}}', data), 'Missing nested: {{user.none.value}}');
assert('Test 8 (Multiple)', template('{{user.name}} is {{user.age}} years old.', data), 'Anthony is 30 years old.');

console.log('-------------------------------');
