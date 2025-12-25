const $extra = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { either } = dependencies.$either;
    const template = (message, data) => message.replace(/\{\{([^}]+)\}\}/g,
        (match, key) => key.split('.').reduce((acc, prop) =>
            acc.flatMap(obj => either.fromNullable(obj[prop.trim()])),
            either.fromNullable(data)
        ).fold(_ => match, core.identity));
    return {
        extra: {
            template,
        },
    };
};
if (typeof module !== 'undefined' && module.exports) module.exports = $extra;
