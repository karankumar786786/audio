/**
 * Utility to convert snake_case keys to camelCase.
 * Handles nested objects and arrays.
 */
export function toCamelCase<T>(obj: any): T {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamelCase(v)) as any;
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z0-9])/gi, ($1) => {
                return $1.toUpperCase().replace('-', '').replace('_', '');
            });
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
}
