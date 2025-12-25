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

/**
 * Factory function to create the FP library instance
 * @param {Object} options - Configuration options
 * @param {Function} options.log - Custom logger function (default: console.log)
 * @returns {Object} The FP library with func, either, monoid, and free modules
 */
const funFpJs = (options = {}) => {
    const log = typeof options.log === 'function' ? options.log : console.log;

    // Initialize modules with dependencies
    const core = $core({ log });
    const either = $either({ $core: core });
    const monoid = $monoid({ $core: core, $either: either });
    const free = $free({ $core: core });
    const extra = $extra({ $core: core, $either: either });

    return {
        ...core,
        ...either,
        ...monoid,
        ...free,
        ...extra,
    };
};

// Export factory function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = funFpJs;
}
