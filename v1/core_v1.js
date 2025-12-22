/**
* 최소 기능 FP 유틸 모음.
*
* 목표
* - point-free 스타일을 돕는 함수들 제공
* - 런타임에서 함수 타입을 빠르게 검증(useFunction)
* - 예외를 던지지 않고 흐름을 멈추고 싶을 때 Either 사용
*
* 정책
* - pipe/compose: 단항 파이프. 중간에 예외가 나면 즉시 중단(fail-fast)되고 예외는 그대로 전파됨.
* - tap: 이펙트(부수효과) 실행용. 하나가 실패해도 로그만 남기고 나머지는 계속 실행(best-effort).
*
* @param {Object} dependencies - 외부 의존성 (예: { log: console.log })
*/
const $f = (dependencies = {}) => {
    const log = dependencies.log || console.log;
    // --- 내부 유틸 ---
    const typeCheck = (type, msg = '') => (value) => {
        if (typeof value !== type) {
            const got = typeof value;
            const shown = String(value);
            throw new Error(msg || `[타입 체크 오류] ${type} 기대, ${got} 받음: ${shown}`);
        }
        return value;
    };
    const typeChecker = {
        "function": typeCheck('function')
    };
    // 런타임에서 "함수"인지 보장한다. 함수가 아니면 즉시 예외를 던진다.
    const useFunction = f => typeChecker['function'](f);

    // --- 공개 유틸 ---
    /**
    * 커링 유틸.
    * fn.length(선언된 파라미터 개수)를 기준으로 커링한다.
    * 명시적으로 arity(인자 개수)를 지정할 수도 있다.
    *
    * @param {Function} f - 커링할 함수
    * @param {number} [arity=f.length] - 명시적 인자 개수 (옵션)
    */
    const curry = (f, arity = f.length) => {
        useFunction(f);
        return function _curry(...args) {
            if (args.length >= arity) {
                return f(...args);
            }
            return (...next) => _curry(...args, ...next);
        };
    };
    /**
    * 좌→우 함수 합성(단항 파이프).
    *
    * 동작
    * - pipe()는 항등 함수(identity)를 반환한다.
    * - 파이프를 "만드는 시점"에 함수들을 1회 검증한다.
    * - 실행 중 예외가 발생하면 즉시 중단되고 예외가 호출자에게 전파된다(fail-fast).
    *
    * @param {...Function} fs - 연결할 함수들
    */
    const pipe = (...fs) => {
        if (fs.length === 0) return x => x;
        fs.forEach(useFunction);
        return x => fs.reduce((acc, f) => f(acc), x);
    };
    /**
    * Kleisli Composition (Monadic Pipe).
    * Either를 반환하는 함수들을 연결할 때 사용한다.
    * 
    * a -> Either(b), b -> Either(c) 를 연결하여 a -> Either(c)를 만든다.
    * 자동으로 flatMap으로 연결된다.
    *
    * @param {...Function} fs - Either를 반환하는 함수들
    */
    const pipeK = (...fs) => {
        if (fs.length === 0) return either.from;
        fs.forEach(useFunction);
        return x => fs.reduce((m, f) => m.flatMap(f), either.from(x));
    };
    /**
    * 우→좌 함수 합성(단항 파이프).
    * 의미는 pipe와 같고, 적용 순서만 반대다.
    *
    * @param {...Function} fs - 합성할 함수들
    */
    const compose = (...fs) => pipe(...fs.slice().reverse());
    /**
    * 값은 그대로 두고, 부수효과만 실행한다.
    *
    * 동작
    * - tap을 "만드는 시점"에 이펙트 함수들을 1회 검증한다.
    * - 이펙트는 순서대로 실행한다.
    * - 하나가 실패(throw)해도 로그만 남기고 다음 이펙트를 계속 실행한다(best-effort).
    * - 항상 원래 값을 그대로 반환한다.
    *
    * @param {...Function} fs - 이펙트 함수들
    */
    const tap = (...fs) => {
        fs.forEach(useFunction);
        return x => {
            fs.forEach(f => {
                try {
                    f(x);
                } catch (e) {
                    log(e);
                }
            });
            return x;
        };
    };
    /**
    * Either: 성공/실패를 값으로 다루기 위한 컨테이너.
    *
    * - Right(value): 성공 경로
    * - Left(value): 실패 경로
    *
    * 중요한 정책
    * - Left에는 "어떤 값이든" 담을 수 있다(반드시 Error일 필요 없음).
    * - 다만 이 라이브러리 내부에서는, 예외(throw)를 잡았을 때 보통 Error 인스턴스를 Left에 담아서 사용한다.
    */
    const either = (() => {
        class Left {
            constructor(value) {
                this.value = value;
            }
            // Functor: 실패 경로는 map을 무시
            map() {
                return this;
            }
            // Monad: 실패 경로는 flatMap을 무시
            flatMap() {
                return this;
            }
            // Filter: 이미 실패 상태이므로 filter 무시
            filter() {
                return this;
            }
            // Recover: 기본값 반환
            getOrElse(v) {
                return v;
            }
            // Applicative: 실패 상태에서도 다른 실패를 만나면 에러를 합친다(Validation)
            ap(v) {
                if (v instanceof Left) {
                    // 양쪽 다 Left이고, 내부 값이 concat 가능하면 합친다
                    if (this.value && typeof this.value.concat === 'function' &&
                        v.value && typeof v.value.concat === 'function') {
                        return new Left(this.value.concat(v.value));
                    }
                    // 합칠 수 없으면 기존처럼 유지 (또는 마지막 에러로 교체? 보통은 유지)
                    return this;
                }
                return this;
            }
            toString() {
                return `Left(${String(this.value)})`;
            }
        }
        class Right {
            constructor(value) {
                this.value = value;
            }
            // Functor: 값을 함수로 변환(예외는 Left로 캡처)
            map(f) {
                return attempt(f)(this.value);
            }
            // Applicative: Right 안의 값을 함수로 보고 적용(예외는 Left로 캡처)
            ap(v) {
                if (v instanceof Left) {
                    return v;
                } else if (v instanceof Right) {
                    return attempt(this.value)(v.value);
                } else {
                    return attempt(this.value)(v);
                }
            }
            // Monad: Either를 반환하는 안전한 연산을 체이닝
            flatMap(f) {
                try {
                    const v = useFunction(f)(this.value);
                    if (v instanceof Right) {
                        return v;
                    } else if (v instanceof Left) {
                        return v;
                    } else {
                        throw new Error(`[flatMap 오류] ${String(v)} 는 Right 또는 Left 인스턴스를 반환해야 합니다`);
                    }
                } catch (e) {
                    return left(e);
                }
            }
            // Filter: 조건이 false면 실패(Left)로 전환
            filter(f) {
                try {
                    if (useFunction(f)(this.value) === true) {
                        return this;
                    } else {
                        return left(new Error(`[filter 오류] ${String(this.value)} 가 조건(predicate)을 만족하지 않습니다`));
                    }
                } catch (e) {
                    return left(e);
                }
            }
            // Recover: 성공 값 반환
            getOrElse() {
                return this.value;
            }
            toString() {
                return `Right(${String(this.value)})`;
            }
        }
        const left = e => new Left(e);
        const right = x => new Right(x);
        /**
        * 함수를 Either로 감싸 실행한다.
        *
        * - 정상 반환: Right(result)
        * - 예외 발생: Left(thrownValue)
        *
        * 참고
        * - f는 래퍼를 "만드는 시점"에 1회 검증한다(재사용 호출 시 매번 검증하지 않음).
        */
        const attempt = f => {
            useFunction(f);
            return (...args) => {
                try {
                    return right(f(...args));
                } catch (e) {
                    return left(e);
                }
            };
        };
        // Lifts a value directly into Right
        const from = x => {
            if (x instanceof Left || x instanceof Right) {
                return x;
            }
            return right(x);
        };
        /**
        * null/undefined를 허용하지 않는 lift.
        *
        * - x가 이미 Left/Right면 그대로 반환한다.
        * - x가 null/undefined면 Left(onError())를 반환한다.
        * - 그 외에는 Right(x)를 반환한다.
        *
        * onError는 함수(thunk)로 받아서, 에러 생성이 필요할 때만 호출한다.
        */
        const fromNullable = (x, onError = () => new Error('[Either.fromNullable 오류] null/undefined는 Right로 감쌀 수 없습니다')) => {
            if (x instanceof Left || x instanceof Right) {
                return x;
            }
            if (typeof x === 'undefined' || x === null) {
                return left(useFunction(onError)());
            }
            return right(x);
        };
        /**
        * 조건 검사 헬퍼.
        * predicate가 참이면 Right(value), 거짓이면 Left([errorMsg])를 반환한다.
        * 에러를 배열로 감싸는 이유는 Applicative Validation(에러 수집)을 위해서다.
        */
        const validate = (predicate, errorMsg) => x =>
            useFunction(predicate)(x) ? right(x) : left([errorMsg]);

        /**
        * Traversable: [Either(a), Either(b)] -> Either([a, b])
        * 배열 안에 있는 Either들을 뒤집어서, Either 안에 배열을 넣는다.
        * 하나라도 실패(Left)하면 전체가 실패(Left)가 된다.
        */
        const sequence = (list) => {
            const arr = Array.isArray(list) ? list : [list];
            let acc = [];
            for (const e of arr) {
                if (e instanceof Left) {
                    return e; // Fail-Fast (첫 번째 에러 반환)
                    // 만약 모든 에러를 모으고 싶다면 여기서 ap 로직처럼 concat 해야 함.
                    // 현재 sequence는 Fail-Fast 정책을 따름.
                } else if (e instanceof Right) {
                    acc.push(e.value);
                } else {
                    // Either가 아닌 값이 섞여있으면? -> 그냥 값으로 취급(Right로 간주)
                    acc.push(e);
                }
            }
            return right(acc);
        };

        /**
        * Validate All: [Either(a), Either(b)] -> Either([a, b])
        * sequence와 비슷하지만, 실패 시 멈추지 않고 모든 에러를 수집한다(Accumulate).
        * 내부적으로 ap를 사용하여 Left.concat을 유도한다.
        */
        const validateAll = (list) => {
            const arr = Array.isArray(list) ? list : [list];
            // 초기값: Right([])
            const init = right([]);

            // reduce로 ap 체이닝: applicative validation
            return arr.reduce((acc, curr) => {
                // acc: Right([...]) or Left([errs])
                // curr: Right(val) or Left([err])
                // acc와 curr를 합쳐서 새로운 배열을 만드는 함수를 lift
                return from(a => c => [...a, c])
                    .ap(acc)
                    .ap(curr);
            }, init);
        };

        return {
            from,
            fromNullable,
            validate,
            sequence,
            validateAll,
            left,
            right
        };
    })();

    const monoid = (() => {
        const of = {
            sum: {
                check: a => typeof a === 'number',
                concat: (a, b) => a + b,
                empty: 0
            },
            product: {
                check: a => typeof a === 'number',
                concat: (a, b) => a * b,
                empty: 1
            },
            string: {
                check: a => typeof a === 'string',
                concat: (a, b) => a + b,
                empty: ""
            },
            array: {
                check: a => Array.isArray(a),
                concat: (a, b) => a.concat(b),
                empty: []
            },
            object: {
                check: a => typeof a === 'object' && a !== null,
                concat: (a, b) => ({ ...a, ...b }),
                empty: {}
            },
            // 논리 연산 (Boolean)
            any: { // OR
                check: a => typeof a === 'boolean',
                concat: (a, b) => a || b,
                empty: false
            },
            all: { // AND
                check: a => typeof a === 'boolean',
                concat: (a, b) => a && b,
                empty: true
            },
            // 비교 연산 (Number)
            max: {
                check: a => typeof a === 'number',
                concat: (a, b) => Math.max(a, b),
                empty: -Infinity
            },
            min: {
                check: a => typeof a === 'number',
                concat: (a, b) => Math.min(a, b),
                empty: Infinity
            }
        };
        const fold = M => {
            if (M.check === undefined || M.concat === undefined || M.empty === undefined) {
                throw new Error('모노이드는 check, concat과 empty를 가진 객체여야 합니다');
            }
            return list => {
                const arr = Array.isArray(list) ? list : [list];
                if (arr.length === 0) return M.empty;
                if (!arr.every(M.check)) {
                    throw new Error('모노이드는 동일한 타입의 값들만 합칠 수 있습니다');
                }
                return arr.reduce(M.concat, M.empty);
            };
        };

        const safeFold = M => {
            // M 유효성 체크
            if (M.check === undefined || M.concat === undefined || M.empty === undefined) {
                return () => either.left(new Error('유효하지 않은 모노이드 정의입니다'));
            }
            return list => {
                const arr = Array.isArray(list) ? list : [list];
                if (arr.length === 0) return either.right(M.empty);

                // 타입 검사 실패 시 Left 반환
                const invalid = arr.find(x => !M.check(x));
                if (invalid !== undefined) {
                    return either.left(new Error(`[safeFold 오류] 타입 불일치 값 발견: ${String(invalid)}`));
                }

                return either.right(arr.reduce(M.concat, M.empty));
            };
        };

        return {
            of,
            fold,
            safeFold
        };
    })();
    return {
        pipe,
        pipeK,
        compose,
        tap,
        either,
        curry,
        monoid
    };
};
if (typeof module !== 'undefined') module.exports = $f;
