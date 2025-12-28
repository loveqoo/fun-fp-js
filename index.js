/**
 * Fun FP JS - A Lightweight Functional Programming Library
 * 
 * @example
 * const { func, either, monoid } = require('fun-fp-js')();
 * // or with custom logger
 * const fp = require('fun-fp-js')({ log: myLogger });
 */

const $core = require('./modules/core.js');
const $either = require('./modules/either.js');
const $monoid = require('./modules/monoid.js');
const $free = require('./modules/free.js');
const $extra = require('./modules/extra.js');
const $task = require('./modules/task.js');

/**
 * Factory function to create the FP library instance
 * @param {Object} options - Configuration options
 * @param {Function} options.log - Custom logger function (default: console.log)
 * @returns {Object} The FP library with func, either, monoid, and free modules
 */
const funFpJs = (options = {}) => {
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
    return modules.reduce((acc, { key, factory, deps }) => {
        // Only pick specified dependencies from the accumulated context
        const dependencies = deps.reduce((d, k) => ({ ...d, [k]: acc[k] }), {});
        const result = factory(dependencies);

        return {
            ...acc,
            [key]: result, // Stored for next modules' dependencies
            ...result      // Exposed to the user (core, either, etc.)
        };
    }, context);
};

// Export factory function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = funFpJs;
}
