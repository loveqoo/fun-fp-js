/**
 * Fun FP JS - A Lightweight Functional Programming Library
 * 
 * @example
 * const { func, either, monoid } = require('fun-fp-js')();
 * // or with custom logger
 * const fp = require('fun-fp-js')({ log: myLogger });
 */

const $core = require('./v2_modules/core.js');
const $either = require('./v2_modules/either.js');
const $monoid = require('./v2_modules/monoid.js');
const $free = require('./v2_modules/free.js');
const $extra = require('./v2_modules/extra.js');
const $task = require('./v2_modules/task.js');

const cache = new Map();

/**
 * Factory function to create the FP library instance
 * @param {Object} options - Configuration options
 * @param {Function} options.log - Custom logger function (default: console.log)
 * @returns {Object} The FP library with func, either, monoid, and free modules
 */
const funFpJs = (options = {}) => {
    const key = JSON.stringify(options, (k, v) => typeof v === 'function' ? v.toString() : v);
    if (cache.has(key)) return cache.get(key);

    const context = {
        log: typeof options.log === 'function' ? options.log : console.log
    };

    // Define modules with explicit dependency list
    const modules = [
        { key: '$core', factory: $core, deps: ['log'] },
        { key: '$either', factory: $either, deps: ['$core'] },
        { key: '$monoid', factory: $monoid, deps: ['$core', '$either'] },
        { key: '$free', factory: $free, deps: ['$core'] },
        { key: '$extra', factory: $extra, deps: ['$core', '$either'] },
        { key: '$task', factory: $task, deps: ['$core', '$either'] }
    ];

    // Build the library context with strictly filtered dependency injection
    const instance = modules.reduce((acc, { key, factory, deps }) => {
        // Only pick specified dependencies from the accumulated context
        const dependencies = deps.reduce((d, k) => ({ ...d, [k]: acc[k] }), {});
        const result = factory(dependencies);

        return {
            ...acc,
            [key]: result, // Stored for next modules' dependencies
            ...result      // Exposed to the user (core, either, etc.)
        };
    }, context);

    cache.set(key, instance);
    return instance;
};

// Export factory function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = funFpJs;
}
