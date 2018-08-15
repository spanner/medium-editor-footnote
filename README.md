# Medium Editor Footnote

[![Build Status](https://travis-ci.org/spanner/medium-editor-footnote.svg)](https://travis-ci.org/spanner/medium-editor-footnote)
[![Coverage Status](https://coveralls.io/repos/spanner/medium-editor-footnote/badge.svg?branch=master)](https://coveralls.io/r/spanner/medium-editor-footnote?branch=master)

Medium Editor Footnote is an extension to add a "footnote" button to [Medium Editor](https://github.com/yabwe/medium-editor).

This is a child of nymag's Medium Editor Phrase, shallowly adapted to manage a pair of reciprocal links instead of their usual `span` tag.
The text that you highlight is wrapped in an `a` tag that anchors to an appended footnote element, which should fall within your contenteditable and can be edited in the usual way. Remove the link and the footnote will disappear, remove the footnote and the link will go. It's all quite lightweight and straightforward.

Presentation is entirely up to your CSS but likely to go something like this:

```css
  a.footnoted {
    color: currentColor;
  }
  a.footnoted:after {
    content: "* ";
    color: red;
  }
  a.footnoted:hover {
    background-color: rgba(252,217,113,0.25);
    cursor: pointer;
  }
  .footnote {
    ...
  }
```


## Installation

```
npm install medium-editor-footnote
```


## Initialization options

Options unique to Medium Editor Footnote:

* `footnoteTagName`: lowercase tag name for the footnote element; default `div`
* `footnoteClassList`: classes applied to each footnote element; default `['footnote']`
* `linkTagName`: lowercase tag name for the footnote link element; default `a`
* `linkClassList`: classes applied to each footnote link element; default `['footnoted']`

Options inherited from Medium Editor's button:

* `name`: name used to reference the button from medium editor, default `'phrase'`
* `aria`: aria label, default `'phrase'`
* `contentDefault`: HTML visible to the user in the toolbar button, default `'ƒ'`
* `classList`: classes added to the button, default `[]`


## Example

In this example, selected text will be turned into a footnote link,
e.g. `preceding citation succeeding` will become `preceding <a class="has-footnote">citation</a> succeeding`.


```html
<div class="editable"></div>

<script type="text/javascript" src="<path_to_medium-editor>/dist/js/medium-editor.js"></script>
<script type="text/javascript" src="<path_to_medium-editor-footnote>/dist/medium-editor-footnote.js"></script>

<script type="text/javascript" charset="utf-8">
  var editor = new MediumEditor('.editable', {
    toolbar: {
      buttons: ['bold', 'italic', 'footnote']
    },
    extensions: {
      footnote: new MediumEditorFootnote({
         name: 'footnote',
         aria: 'footnote',
         contentDefault: '<svg><use xlink:href="#footnote_button"></use></svg>',
         footnoteLinkClassList: ['has-footnote']
      })
    }
  });
</script>
```

## Terminal commands

* `npm install medium-editor-footnote` downloads Medium Editor Footnote.
* `npm test` runs both eslint and karma tests configured by `karma.conf.js`.
* `npm run test-travis` runs eslint and karma configured for Travis CI by `karma.travis.conf.js` to run tests on headless Chrome browser and report code coverage to Coveralls.
* `npm run test-browserstack` runs eslint locally and karma tests on BrowserStack configured by `karma.browserstack.conf.js`. Note: `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` environment variables must be set to run tests on BrowserStack.
* `gulp` compiles the script to `dist/medium-editor-footnote.js` and `dist/medium-editor-footnote.min.js`.


## License

[MIT](https://github.com/spanner/medium-editor-footnote/blob/master/LICENSE)
