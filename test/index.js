import assert from 'assert';
import { languagePriorityList, basicFilter, lookup, extendedFilter } from '../src/index';

describe('accept-language-node', () => {
  describe('languagePriorityList', () => {
    it('should be an Function', () => {
      assert(typeof languagePriorityList === 'function', 'should be a Function');
    });

    it('should assign default quality if languagePriorityList quality fails', () => {
      assert.deepStrictEqual(
        languagePriorityList('en;q0.1'),
        [{ tag: 'en', quality: 1 }],
        'expected to languagePriorityList single tag'
      );
    });

    it('should assign default quality if languagePriorityList quality is higher than 1', () => {
      assert.deepStrictEqual(
        languagePriorityList('en;q=undefined'),
        [{ tag: 'en', quality: 1 }],
        'expected to languagePriorityList single tag'
      );
    });

    it('should assign default quality if languagePriorityList quality is higher than 1', () => {
      assert.deepStrictEqual(
        languagePriorityList('en;q=1.1'),
        [{ tag: 'en', quality: 1 }],
        'expected to languagePriorityList single tag'
      );
    });

    it('should return wildcard when given value other than a string', () => {
      assert.deepStrictEqual(languagePriorityList(undefined), [{ tag: '*', quality: 1 }], '* obj expected');
      assert.deepStrictEqual(languagePriorityList(null), [{ tag: '*', quality: 1 }], '* obj expected');
      assert.deepStrictEqual(languagePriorityList(1), [{ tag: '*', quality: 1 }], '* obj expected');
      assert.deepStrictEqual(languagePriorityList(true), [{ tag: '*', quality: 1 }], '* obj expected');
      assert.deepStrictEqual(languagePriorityList({}), [{ tag: '*', quality: 1 }], '* obj expected');
      assert.deepStrictEqual(languagePriorityList([]), [{ tag: '*', quality: 1 }], '* obj expected');
    });

    it('should split range string correctly into objects', () => {
      assert.deepStrictEqual(languagePriorityList('*'), [{ tag: '*', quality: 1 }], 'expected to languagePriorityList');
      assert.deepStrictEqual(
        languagePriorityList('en'),
        [{ tag: 'en', quality: 1 }],
        'expected to languagePriorityList'
      );
      assert.deepStrictEqual(
        languagePriorityList('en-US'),
        [{ tag: 'en-US', quality: 1 }],
        'expected to languagePriorityList'
      );

      assert.deepStrictEqual(
        languagePriorityList('zh-Hant-CN-x-private1-private2'),
        [{ tag: 'zh-Hant-CN-x-private1-private2', quality: 1 }],
        'expected to correctly languagePriorityList private into valid tag objects'
      );

      assert.deepStrictEqual(
        languagePriorityList('en-GB,en-US;q=0.7,fr-CA;q=0.8,en;q=0.5, *'),
        [
          { tag: '*', quality: 1 },
          { tag: 'en-GB', quality: 1 },
          { tag: 'fr-CA', quality: 0.8 },
          { tag: 'en-US', quality: 0.7 },
          { tag: 'en', quality: 0.5 }
        ],
        'expected to correctly languagePriorityList range into valid tag objects'
      );
    });

    it('should return sorted in order quality, tag specificity from high to low', () => {
      assert.deepStrictEqual(
        languagePriorityList('en-GB,en-US;q=0.7,zh-Hant-CN;q=0.8,fr-CA;q=0.8,en;q=0.5'),
        [
          { tag: 'en-GB', quality: 1 },
          { tag: 'zh-Hant-CN', quality: 0.8 },
          { tag: 'fr-CA', quality: 0.8 },
          { tag: 'en-US', quality: 0.7 },
          { tag: 'en', quality: 0.5 }
        ],
        'expected to correctly languagePriorityList range into valid tag objects'
      );
    });

    it('wild card tag should always be sorted to first position', () => {
      assert.deepStrictEqual(
        languagePriorityList('en-GB,en-US;q=0.7,*,zh-Hant-CN;q=0.8,fr-CA;q=0.8,en;q=0.5'),
        [
          { tag: '*', quality: 1 },
          { tag: 'en-GB', quality: 1 },
          { tag: 'zh-Hant-CN', quality: 0.8 },
          { tag: 'fr-CA', quality: 0.8 },
          { tag: 'en-US', quality: 0.7 },
          { tag: 'en', quality: 0.5 }
        ],
        'expected to correctly languagePriorityList range into valid tag objects'
      );

      assert.deepStrictEqual(
        languagePriorityList('*,en-GB,en-US;q=0.7,fr-CA;q=0.8,en;q=0.5'),
        [
          {
            quality: 1,
            tag: '*'
          },
          {
            quality: 1,
            tag: 'en-GB'
          },
          {
            quality: 0.8,
            tag: 'fr-CA'
          },
          {
            quality: 0.7,
            tag: 'en-US'
          },
          {
            quality: 0.5,
            tag: 'en'
          }
        ],
        'expected to correctly languagePriorityList range into valid tag objects'
      );
    });
  });

  describe('basicFilter', () => {
    it('should be an Function', () => {
      assert(typeof basicFilter === 'function', 'should be a Function');
    });

    it('should return an empty array if languageTags are not given', () => {
      assert.deepStrictEqual(basicFilter('en'), [], 'expected empty array to be returned');
    });

    it('should return an empty array if no match is found', () => {
      assert.deepStrictEqual(
        basicFilter('en-GB,en-US;q=0.7,fr-CA;q=0.8,en;q=0.5', ['ru', 'it']),
        [],
        'expected empty array to be returned if no match is made'
      );
    });

    it('should match all when wildcard is present', () => {
      assert.deepStrictEqual(
        basicFilter('*,en-GB,en-US;q=0.7,fr-CA;q=0.8,en;q=0.5, ', ['zh-Hant-CN-x-private1-private2', 'en', 'zh']),
        ['zh-Hant-CN-x-private1-private2', 'en', 'zh'],
        'should return all matches if wild card is present'
      );
    });

    it('should match when priority tag and language tag exactly match', () => {
      assert.deepStrictEqual(
        basicFilter('zh-Hant-CN-x-private1-private2', ['zh-Hant-CN-x-private1-private2']),
        ['zh-Hant-CN-x-private1-private2'],
        'should match'
      );
    });

    it('should match prefix correctly when direct match can not be made', () => {
      assert.deepStrictEqual(
        basicFilter('de-de', ['de-DE', 'de-DE-1996', 'de-Deva', 'de-Latn-DE']),
        ['de-DE', 'de-DE-1996'],
        'should match'
      );
    });

    it('should match all when only language is given in language range', () => {
      assert.deepStrictEqual(
        basicFilter('de', ['de-DE', 'de-DE-1996', 'de-Deva', 'de-Latn-DE']),
        ['de-DE', 'de-DE-1996', 'de-Deva', 'de-Latn-DE'],
        'should match'
      );
    });

    it('should return results in Priority List order', () => {
      assert.deepStrictEqual(
        basicFilter('en-GB,en-US;q=0.7,zh-Hant-CN-x-private1-private2;q=0.8,fr-CA;q=0.8,en;q=0.5', [
          'en-GB',
          'en-US',
          'zh-Hant-CN-x-private1-private2',
          'fr-CA',
          'en'
        ]),
        ['en-GB', 'zh-Hant-CN-x-private1-private2', 'fr-CA', 'en-US', 'en'],
        'should be in order'
      );
    });
  });

  describe('extendedFilter', () => {
    it('should be an Function', () => {
      assert(typeof extendedFilter === 'function', 'should be a Function');
    });

    it('should return an empty array if languageTags are not given', () => {
      assert.deepStrictEqual(extendedFilter('en'), [], 'expected empty array to be returned');
    });

    it('should match extended tag correctly as described in RFC 3.3.2', () => {
      assert.deepStrictEqual(
        extendedFilter('de-*-DE', [
          // testing
          'ru', // should fail
          'de', // should fail
          'de-DE',
          'de-de',
          'de-Latn-DE',
          'de-DE-x-goethe',
          'de-Latn-DE-1996',
          'de-Deva-DE',
          'de-x-DE', // should fail
          'de-Deva' // should fail
        ]),
        ['de-DE', 'de-de', 'de-Latn-DE', 'de-DE-x-goethe', 'de-Latn-DE-1996', 'de-Deva-DE'],
        'expected extended tag to match'
      );
    });
  });

  describe('lookup', () => {
    it('should be an Function', () => {
      assert(typeof lookup === 'function', 'should be a Function');
    });

    it('should throw if correct args are not supplied', () => {
      assert.throws(
        () => lookup('stuff'),
        Error('range:String, languageTags:Array, defaultValue:String required!'),
        'should throw error if arguments are not supplied'
      );
    });

    it('should choose direct match over partial', () => {
      assert.equal(
        lookup('en-GB,en-US;q=0.7,fr-CA;q=0.8,en;q=0.5', ['fr-CA', 'fr-FR', 'fr', 'en', 'ru'], 'en'),
        'fr-CA',
        'expected direct match to be chosen'
      );
    });

    it('should return default if supportedLanguages is not an array', () => {
      assert.strictEqual(
        lookup('en', { en: 'english' }, 'ru'),
        'ru',
        'should return default if languages is not an array'
      );
    });

    it('should return default if supportedLanguages is empty', () => {
      assert.strictEqual(lookup('en', [], 'ru'), 'ru', 'should return default if languages is not an array');
    });

    it('should return default if no match is made', () => {
      assert.strictEqual(
        lookup('zh-Hant-CN-x-private1-private2', ['en', 'en-US'], 'ru'),
        'ru',
        'should return default if languages is not an array'
      );
    });

    it('Should match correctly', () => {
      assert.strictEqual(
        lookup('zh-Hant-CN-x-private1-private2', ['zh-Hant', 'zh'], 'en-US'),
        'zh-Hant',
        'Should match'
      );
      assert.strictEqual(
        lookup('zh-Hant', ['zh', 'zh-Hant-CN-x-private1-private2'], 'en-US'),
        'zh-Hant',
        'Should Match'
      );
      assert.strictEqual(lookup('zh-Hant', ['zh-Hant'], 'en-US'), 'zh-Hant', 'Should Match direct');
    });

    it('Should not match a language tag with greater specificity than the range tag', () => {
      assert.strictEqual(lookup('de-CH', ['de-CH-1996'], 'en-US'), 'de-CH', 'expected correct specificity');
    });

    it('Should not match on singleton', () => {
      assert.strictEqual(
        lookup('zh-Hant-CN-x-blah', ['zh-Hant-CN-x-private1-private2'], 'en-US'),
        'zh-Hant-CN',
        'expected singleton to be truncated on match'
      );
    });
  });
});
