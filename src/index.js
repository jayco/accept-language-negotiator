/**
 * accept-language-negotiator
 * Copyright(c) 2016 Jason Glen Jacob
 * MIT Licensed
 */
const WILDCARD = '*';
const DEFAULT_WILDCARD = [{tag: WILDCARD, quality: 1}];
const isType = (data, type) => Object.prototype.toString.call(data) === `[object ${type}]`;
const isObject = (v) => isType(v, 'Object');
const isString = (v) => isType(v, 'String');
const specificitySort = (a, b) => (a.length < b.length);
const tagSort = (a, b) => specificitySort(a.tag, b.tag);
const tagEquality = (a, b) => a.toLowerCase() === b.toLowerCase();
const prefixInTag = (range, tag) => tag.toLowerCase().indexOf(`${range}-`.toLowerCase()) !== -1;
const isWild = (v) => (v === WILDCARD);
const isWildTag = (v) => v.tag === WILDCARD;
const qtyMatch = (a, b) => (a.quality === b.quality);
const gteQty = (a, b) => (a.quality > b.quality);
const rangeSort = (a, b) => ~~((isWildTag(b) || gteQty(b, a)) || (!isWildTag(a) && qtyMatch(a, b) && tagSort(a, b)));

/**
 * Filters range tags that matches in the languagesTagsComparator
 *
 * @param {Array} rangeTags Range tags to work through
 * @param {Number} index Current index of rangeTags
 * @param {Array} array Filter tags are appended to array
 * @param {Function} languagesTagsComparator Compares range tags to language tags
 * @param {Boolean} splitRangeTags Whether to split range tags for comparison
 * @return {Array} The filtered range - language tags.
 */
function filterTags(rangeTags, index, array, languagesTagsComparator, splitRangeTags) {
  if (!rangeTags[index]) return array;
  languagesTagsComparator((splitRangeTags ? rangeTags[index].tag.split('-') : rangeTags[index].tag), 0, array);
  return filterTags(rangeTags, ++index, array, languagesTagsComparator, splitRangeTags);
}

/**
 * Parse a range to form a "quality weights" list.
 *
 * @param {String} range A range string to languagePriorityList
 * @return {Array<Object>} A Language Priority List
 */
export function languagePriorityList(range) {
  function extractTag(rangeTag) {
    const ensureParsedValue = (v) => (v < 1 ? v : 1);
    const extractQuality = (q) => (q ? ensureParsedValue(parseFloat(q.split('q=')[1])) : 1);
    const matches = rangeTag.match(/^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/);
    if (!matches) return undefined;
    return {tag: (matches[2] ? [matches[1], matches[2]].join('-') : matches[1]), quality: extractQuality(matches[3])};
  }

  return isString(range) ? range.split(',').map(extractTag).filter(isObject).sort(rangeSort) : DEFAULT_WILDCARD;
}

/**
 * Basic Filter as described in RFC4647 3.3.1 produces a (potentially empty) set of prioritised language tags
 *
 * RFC4647 3.3.1  Basic Filtering
 *
 * @param {String} range A range string to languagePriorityList
 * @param {Array} languageTags A list of bcp47 locales that are supported
 * @return {Array<String>} returns tags from supportedLanguagesTags that match or all tags if wildcard '*' is given
 */
export function basicFilter(range, languageTags) {
  if (!Array.isArray(languageTags)) return [];
  const list = languagePriorityList(range);
  if (list.length > 0 && isWildTag(list[0])) return languageTags; // RFC4647 wildcard matches all

  function languagesTagsComparator(tag, index, array) {
    if (!languageTags[index]) return array;
    if (tagEquality(tag, languageTags[index]) || prefixInTag(tag, languageTags[index])) {
      if (array.indexOf(languageTags[index]) === -1) array.push(languageTags[index]);
    }
    return languagesTagsComparator(tag, ++index, array);
  }

  return filterTags(list, 0, [], languagesTagsComparator, false);
}

/**
 * Extended Filter as described in RFC4647 3.3.2 produces a (potentially empty) set of prioritised language tags
 *
 * @param {String} range A range string to languagePriorityList
 * @param {Array} languageTags A list of bcp47 locales that are supported
 * @return {Array<String>} returns tags from supportedLanguagesTags that match or all tags if wildcard '*' is given
 */
export function extendedFilter(range, languageTags) {
  if (!Array.isArray(languageTags) || languageTags.length === 0) return [];

  function extendedTagMatch(rangeSubTags, languageSubTags, rIndex, lIndex) {
    if (!rangeSubTags[rIndex]) return true;
    if (!languageSubTags[lIndex] || languageSubTags[lIndex].length === 1) return false;
    if (isWild(rangeSubTags[rIndex])) ++rIndex;
    if (tagEquality(rangeSubTags[rIndex], languageSubTags[lIndex])) ++rIndex;
    return extendedTagMatch(rangeSubTags, languageSubTags, rIndex, ++lIndex);
  }

  function languagesTagsComparator(rangeSubTags, index, array) {
    if (!languageTags[index]) return array;
    if (extendedTagMatch(rangeSubTags, languageTags[index].split('-'), 0, 0)) array.push(languageTags[index]);
    return languagesTagsComparator(rangeSubTags, ++index, array);
  }

  return filterTags(languagePriorityList(range), 0, [], languagesTagsComparator, true);
}

/**
 * Lookup produces a single language tag (RFC4647)
 * @param {String} range A range string to languagePriorityList.
 * @param {Array} languageTags A list of bcp47 locales that are supported
 * @param {String} defaultValue The default to return if no match can be made
 * @return {String} returns an array of objects or wildcard if input is not valid (RFC2616)
 */
export function lookup(range, languageTags, defaultValue) {
  if (arguments.length !== 3) throw new Error('range:String, languageTags:Array, defaultValue:String required!');
  if (!Array.isArray(languageTags) || languageTags.length === 0) return defaultValue;
  const sortedLangTags = languageTags.sort(specificitySort);

  function matchTag(rangeTags, langTags, index, array) {
    if (index >= langTags.length || index >= rangeTags.length) return array;
    if (rangeTags[index].length !== 1) {
      if (!tagEquality(rangeTags[index], langTags[index])) return array;
      array.push(rangeTags[index]);
    }
    return matchTag(rangeTags, langTags, ++index, array);
  }

  function directTagMatch(tag, index, array) {
    if (!languageTags[index]) return array;
    if (tagEquality(tag, languageTags[index])) {
      if (array.indexOf(languageTags[index]) === -1) array.push(languageTags[index]);
    }
    return directTagMatch(tag, ++index, array);
  }

  function languagesTagsComparator(tag, index, array) {
    if (!sortedLangTags[index]) return array;
    const matches = matchTag(tag.split('-'), sortedLangTags[index].split('-'), 0, []).join('-');
    if (matches && array.indexOf(matches) === -1) array.push(matches);
    return languagesTagsComparator(tag, ++index, array);
  }

  const priorityList = languagePriorityList(range);
  const directMatch = filterTags(priorityList, 0, [], directTagMatch, false)[0];
  return directMatch || filterTags(priorityList, 0, [], languagesTagsComparator, false)[0] || defaultValue;
}
