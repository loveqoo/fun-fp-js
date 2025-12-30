const $extra = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { either } = dependencies.$either;
    const path = keyStr => data => keyStr.split('.').map(k => k.trim()).reduce(
        (acc, key) => acc.flatMap(obj => either.fromNullable(obj[key])),
        either.fromNullable(data)
    );
    const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g,
        (match, keyStr) => path(keyStr)(data).fold(_ => match, core.identity));

    return {
        extra: {
            path,
            template,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $extra;
