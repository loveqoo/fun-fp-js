const $extra = (dependencies = {}) => {
    const { core } = dependencies.$core;
    const { either } = dependencies.$either;

    // path('user.address.city')(obj) => Either - 문자열 경로로 중첩 속성 접근
    const path = keyStr => data => keyStr.split('.').map(k => k.trim()).reduce(
        (acc, key) => acc.flatMap(obj => either.fromNullable(obj[key])),
        either.fromNullable(data)
    );

    // template: path를 재사용
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
