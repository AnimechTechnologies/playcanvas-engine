/**
 * @private
 * @function
 * @name pc.hashCode
 * @description Calculates simple hash value of a string. Designed for performance, not perfect.
 * @param {string} str - String.
 * @returns {number} Hash value.
 */
function hashCode(str) {
    var hash = 0;
    for (var i = 0, len = str.length; i < len; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        // Convert to 32bit integer
        hash |= 0;
    }
    return hash;
}

/**
 * @private
 * @function
 * @name pc.objectHashCode
 * @description Calculates simple hash value of an object. Object key order is ignored.
 * @param {string} object - Object to hash.
 * @param {string[]} ignoreKeys - Object keys to exclude from hash.
 * @returns {number} Hash value.
 */
function objectHashCode(object, ignoreKeys) {
    function getSortedObject(object) {
        return Object.keys(object)
            .sort()
            .reduce(function (acc, key) {
                if (Array.isArray(object[key])){
                    acc[key] = object[key].map(getSortedObject);
                } else if (typeof object[key] === 'object'){
                    acc[key] = getSortedObject(object[key]);
                } else {
                    acc[key] = object[key];
                }
                return acc;
            }, {});
    }

    var sortedObject = getSortedObject(object);

    if (ignoreKeys) {
        ignoreKeys.forEach(function (key) {
            delete sortedObject[key];
        });
    }

    var objectString = JSON.stringify(sortedObject, function (_, value) {
        return value === undefined ? "undefined" : value;
    });

    return hashCode(objectString);
}

export { hashCode, objectHashCode };
