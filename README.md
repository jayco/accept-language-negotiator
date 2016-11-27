# Accept Language Negotiator
**RFC4647** compliant accept-language negotiator for parsing HTTP 
Accept-Language header and returning matched lists or language.

**Features:**
- No external dependencies 
- 100% test coverage
- RFC2616 14.4 Accept-Language compliant
    - implements RFC2616 14.4 Accept-Language range quality weights
- RFC4647 compliant
    - implements RFC4647 2.3 priority list
    - implements RFC4647 3.3.1 basic filter
    - implements RFC4647 3.3.2 extended filter
    - implements RFC4647 3.4 lookup

# Usage

## Install
```sh
npm i accept-language-negotiator --save
```

# API

## languagePriorityList(range)

- `range` **String** A single or quality weighted range string

Given a weighted range, wildcard `*` or individual BCP47 compliant 
language return an ordered 'quality weighted' language priority list as 
defined in **RFC4647 2.3. The Language Priority List**.

Where a range is given and range value has no quality, the highest 
quality 1 will be given as described in **RFC2616 14.4 Accept-Language**.

**Note:** If the list fails it will return a wildcard value.

### Example:

```js
import {languagePriorityList} from 'accept-language-node';

// value
languagePriorityList('en-GB');
returns => [{tag: 'en-GB', quality: 1}]

// range
languagePriorityList('en-GB,en-US;q=0.7,fr-CA;q=0.8,en;q=0.5, *');
returns => [
                {tag: '*', quality: 1}, 
                {tag: 'en-GB', quality: 1}, 
                {tag: 'fr-CA', quality: 0.8},
                {tag: 'en-US', quality: 0.7},
                {tag: 'en', quality: 0.5}
           ]

// incorrect input
languagePriorityList(undefined);
languagePriorityList(null);
languagePriorityList(1);
languagePriorityList({});
languagePriorityList([]);
languagePriorityList(true);
returns => [{tag: '*', quality: 1}]
```

## basicFilter(range, languageTags)

- `range` **String** A single or quality weighted range string
- `languageTags` **[String]** Array of supported language strings to filter against 

Basic filtering **compares basic language** ranges to language tags 
returning all matches in best match descending order. 

**Note:** returns an empty array if no matches are found.
   
> **RFC4647 3.3.1** Each basic language range in 
the language priority list is considered in turn, according to priority.
A language range matches a particular language tag if, in a 
case-insensitive comparison, it exactly equals the tag, or if it 
exactly equals a prefix of the tag such that the first character 
following the prefix is "-".

### Example:

```js
import {basicFilter} from 'accept-language-node';

const supportedLanguageTags = [
    'de-DE', 
    'de-DE-1996', 
    'de-Deva', 
    'de-Latn-DE'
    ];
    
basicFilter('de-de', supportedLanguageTags);
returns => ['de-DE', 'de-DE-1996'];
```


### Example:
```js
const supportedLanguageTags = [
    'en-GB', 
    'en-US', 
    'fr-CA', 
    'en'
    ];
    
basicFilter('en-GB,en-US;q=0.7,fr-CA;q=0.8,en;q=0.5', supportedLanguageTags);
returns => [
             'en-GB',
             'fr-CA',
             'en-US',
             'en'
           ]
```

## extendedFilter(range, languageTags)

- `range` **String** A single or quality weighted range string
- `languageTags` **[String]** Array of supported language strings to filter against 

Extended filtering **compares extended language ranges** to language 
tags returning all matches in best match descending order.

**Note:** returns an empty array if no matches are found.

> **RFC4647 3.3.2** Each extended language range in the language priority list is
considered in turn, according to priority.  A language range matches
a particular language tag if each respective list of subtags matches.

### Example:

```js
import {extendedFilter} from 'accept-language-node';

const supportedLanguageTags = [
        'de',
        'de-DE',
        'de-de',
        'de-Latn-DE',
        'de-DE-x-goethe',
        'de-Latn-DE-1996',
        'de-Deva-DE',
        'de-x-DE',
        'de-Deva'
    ];
    
extendedFilter('de-*-DE', supportedLanguageTags);
returns => [
                'de-DE',
                'de-de',
                'de-Latn-DE',
                'de-DE-x-goethe',
                'de-Latn-DE-1996',
                'de-Deva-DE'
            ];
```

## lookup(range, languageTags, defaultValue)

- `range` **String** A single or quality weighted range string
- `languageTags` **[String]** Array of supported language strings to filter against
- `defaultValue` **String** Fallback value if no match can be made

> **RFC4647 3.4** Lookup is used to select the 
single language tag that best matches the language priority list for a 
given request.  When performing lookup, each language range in the 
language priority list is considered in turn, according to priority.
By contrast with filtering, each language range represents the most 
specific tag that is an acceptable match. The first matching tag found, 
according to the user's priority, is considered the closest match and 
is the item returned. For example, if the language range is "de-ch", 
a lookup operation can produce content with the tags "de" or "de-CH" 
but never content with the tag "de-CH-1996".  If no language tag matches
the request, the "default" value is returned.

### Example:

```js
import {lookup} from 'accept-language-node';

const supportedLanguageTags = ['zh-Hant', 'zh';
const defaultLanguage = 'en-US';    

// match
lookup('zh-Hant-CN-x-private1-private2', supportedLanguageTags, defaultLanguage);
returns => 'zh-Hant';

// return default
lookup('ru-RU', supportedLanguageTags, defaultLanguage);
returns => 'en-US';
```

## IETF RFC References
### rfc4647 Specification: [rfc4647](https://www.ietf.org/rfc/rfc4647.txt).
### rfc2616 Specification: [rfc2616](https://www.ietf.org/rfc/rfc2616.txt).