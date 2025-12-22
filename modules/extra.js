const $extra = (dependencies = {}) => {
    const { identity } = dependencies.$func;
    const { fromNullable } = dependencies.$either;
    const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g,
        (match, key) => key.split('.').reduce((acc, prop) =>
            acc.flatMap(obj => fromNullable(obj[prop])),
            fromNullable(data)
        ).fold(_ => match, identity));
    return {
        template
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $extra;
