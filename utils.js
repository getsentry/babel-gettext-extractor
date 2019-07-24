/*
 * Sorts the object keys by the file reference.
 * There's no guarantee of key iteration in order prior to es6
 * but in practice it tends to work out.
 */
function sortObjectKeysByRef(unordered) {
  const ordered = {};
  Object.keys(unordered)
    .sort((a, b) => {
      const refA = unordered[a].comments.reference.toLowerCase();
      const refB = unordered[b].comments.reference.toLowerCase();
      if (refA < refB) {
        return -1;
      }
      if (refA > refB) {
        return 1;
      }
      return 0;
    })
    .forEach(function(key) {
      ordered[key] = unordered[key];
    });
  return ordered;
}

function stripIndent(str) {
  if (str && str.replace && str.trim) {
    return str.replace(/(?:\n(?:\s*))+/g, ' ').trim();
  }
  return str;
}

module.exports = {
  stripIndent: stripIndent,
  sortObjectKeysByRef: sortObjectKeysByRef,
};
