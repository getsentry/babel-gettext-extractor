function splitReferenceLine(reference) {
  const index = reference.lastIndexOf(':');
  if (index === -1 || index === reference.length - 1) {
    return { path: reference.toLowerCase(), lineNumber: 0 };
  }

  const lineNumber = parseInt(reference.substring(index + 1), 10);
  if (Number.isNaN(lineNumber)) {
    return { path: reference.toLowerCase(), lineNumber: 0 };
  }

  return {
    path: reference.substring(0, index).toLowerCase(),
    lineNumber,
  };
}

function compareReferenceLines(a, b) {
  const refA = splitReferenceLine(a);
  const refB = splitReferenceLine(b);
  if (refA.path < refB.path) {
    return -1;
  }
  if (refA.path > refB.path) {
    return 1;
  }
  if (refA.lineNumber < refB.lineNumber) {
    return -1;
  }
  if (refA.lineNumber > refB.lineNumber) {
    return 1;
  }

  return 0;
}

/*
 * Sorts the object keys by the file reference.
 * There's no guarantee of key iteration in order prior to es6
 * but in practice it tends to work out.
 */
function sortObjectKeysByRef(unordered) {
  const ordered = {};
  Object.keys(unordered).sort((a, b) => {
    const refALines = unordered[a].comments.reference.split('\n');
    const refBLines = unordered[b].comments.reference.split('\n');

    let line = 0;
    while (line < refALines.length && line < refBLines.length) {
      const result = compareReferenceLines(refALines[line], refBLines[line]);
      if (result !== 0) {
        return result;
      }
      line += 1;
    }

    if (line < refALines.length) {
      return -1;
    }
    if (line < refBLines.length) {
      return 1;
    }

    return 0;
  }).forEach(function(key) {
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
  compareReferenceLines: compareReferenceLines,
};
