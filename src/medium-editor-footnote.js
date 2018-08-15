(function (root, factory) {
  if (typeof module === 'object') {
    module.exports = factory;
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.MediumEditorFootnote = factory;
  }
}(this, (function (MediumEditor) {
  const placeholderText = 'safariNeedsTextNode!@#$%^()*~',
    placeholderHtml = '<div data-phrase-placeholder="true"></div>',
    placeholderSelector = 'div[data-phrase-placeholder="true"]';

  /**
   * @param {string} html
   * @returns {string}
   */
  function stripPlaceholderText(html) {
    return html.split(placeholderText).join('');
  }

  /**
   * @param {Node} child
   * @returns {number} offset of the child relative to its parentNode
   */
  function getChildOffset(child) {
    var offset = 1, // offset begins at 1
      sibling = child.parentNode.firstChild;

    while (sibling !== child) {
      offset += 1;
      sibling = sibling.nextSibling;
    }
    return offset;
  }

  // This has been quite superficially adapted from the original Medium Editor Phrase,
  // so the footnote link is generally referred to as the 'phrase' below.
  // We add some listeners to maintain the reciprocal link with the footnote element,
  // and a slightly different set of configuration options to set the properties of
  // link and footnote.

  return MediumEditor.extensions.button.extend({
    // default values can be overwritten by options on init
    linkTagName: 'a', // lowercase tagName of the link (phrase) tag
    linkClassList: ['footnoted'], // classes applied to each link (phrase) tag
    footnoteTagName: 'p', // lowercase tagName of the appended footnote element
    footnoteClassList: ['footnote'], // classes applied to each footnote element
    containerTagName: 'div',
    containerClassList: ['footnotes'],
    defaultFootnote: "Your footnote here.",
    name: 'footnote', // name used to reference the button from Medium Editor
    contentDefault: 'ƒ', // html visible to the user in the toolbar button
    aria: 'Footnote Button', // aria label
    classList: [], // classes added to the button

    init: function () {
      MediumEditor.Extension.prototype.init.apply(this, arguments);

      // properties not set in options
      this.lastRemovedFootnote = null;
      this.useQueryState = false; // cannot rely on document.queryCommandState()
      this.linkHasNoClass = this.linkClassList.length === 0;
      this.linkSelector = this.linkTagName + this.linkClassList.reduce((selector, className) => selector + '.' + className, '');
      this.containerSelector = this.containerTagName + this.containerClassList.reduce((selector, className) => selector + '.' + className, '');
      this.button = this.createButton();
      this.on(this.button, 'click', this.handleClick.bind(this));
    },

    /**
     * returns a clone of the selection inside a `div` container
     * @returns {Element}
     */
    cloneSelection: function () {
      var range = MediumEditor.selection.getSelectionRange(this.document),
        container = document.createElement('div');

      container.appendChild(range.cloneContents());
      return container;
    },

    /**
     * check if the node is a footnote link
     * @param {Node} node
     * @returns {boolean}
     */
    isPhraseNode: function (node) {
      return !!(
        node &&
        node.tagName.toLowerCase() === this.linkTagName &&
        (this.linkHasNoClass ? !node.className : this.linkClassList.reduce((hasAll, c) => hasAll && node.classList.contains(c), true))
      );
    },

    /**
     * @param {Element} phrase
     */
    removeFootnoteTags: function (phrase) {
      var footnoteId = phrase.id.replace('link-', '');
      phrase.outerHTML = phrase.innerHTML;
      this.removeFootnote(footnoteId);
    },

    /**
     * @param {string} phrase
     * @returns {string}
     */
    addFootnoteTags: function (phrase) {
      var closingTagsAtStart = '',
        openingTagsAtEnd = '';

      // innerHTML sometimes returns fragments that start or end
      // with tags that we do not want to wrap in the phrase tags.
      // e.g. `a<b>` should become `<span>a</span><b>`
      // e.g. `</b>a` should become `</b><span>a</span>`
      phrase = phrase.replace(/^(<\/[^>]+>)*/, function (match) {
        closingTagsAtStart = match;
        return '';
      }).replace(/(<[^\/>]+>)*$/, function (match) {
        openingTagsAtEnd = match;
        return '';
      });

      footnoteId = this.generateId(phrase);
      openingTag = `<${ this.linkTagName }${ this.linkHasNoClass ? '' : ' class="' + this.linkClassList.join(' ').trim() + '"' } id="link-${footnoteId}" href="#footnote-${footnoteId}">`;
      closingTag = `</${ this.linkTagName }>`;

      // only add phrase tags if there is phrase text
      if (phrase) {
        phrase = openingTag + phrase + closingTag;
      }
      this.addFootnote(footnoteId);
      return closingTagsAtStart + phrase + openingTagsAtEnd;
    },

    /**
     * Generate a short, URL-safe and unique id string for a new footnote.
     * (currently two out of three :)
     * @param {String} phrase
     */
    generateId: function (phrase) {
      var id_base = (phrase.length > 24) ? phrase.substr(0, 24) : phrase;
      return encodeURIComponent(id_base.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    },

    /**
     * Append and return a destination footnote element for the newly created footnote link.
     * @param {String} footnoteId
     * @returns {Node}
     */
    addFootnote: function (footnoteId) {
      var container,
          elementId = "footnote-" + footnoteId,
          footnote = document.getElementById(elementId),
          content = this.lastRemovedFootnote || this.defaultFootnote;
      
      if (!footnote) {
        container = this.base.elements[0].querySelector(this.containerSelector);
        if (!container) {
          container = document.createElement(this.containerTagName);
          container.classList.add(...this.containerClassList);
          this.base.elements[0].appendChild(container);
        }
  
        footnote = document.createElement(this.footnoteTagName);
        footnote.id = elementId;
        footnote.classList.add(...this.footnoteClassList);
        footnote.innerHTML = `<a href="#link-${footnoteId}">${content}</a>`
        this.lastRemovedFootnote = ""
        container.append(footnote);
      }
      return footnote;
    },

    /**
     * Remove the destination footnote element, if any, for the just-removed footnote link.
     * @param {String} footnoteId
     */
    removeFootnote: function (footnoteId) {
      var elementId = "footnote-" + footnoteId,
          footnote = document.getElementById(elementId);
      if (footnote) {
        this.lastRemovedFootnote = footnote.innerHTML;
        footnote.parentNode.removeChild(footnote);
      }
    },

    /**
     * @param {Node} container
     * @returns {Array} Array of phrase elements that are in the container
     */
    getSelectionPhrases: function (container) {
      var selectionPhrases = Array.prototype.slice.call(container.querySelectorAll(this.linkSelector));

      if (this.phraseHasNoClass) {
        selectionPhrases = selectionPhrases.filter(phrase => !phrase.className); // ensure phrases have no className
      }
      return selectionPhrases;
    },

    /**
     * replaces the selection with new html and selects the new html
     * @param {string} html
     * @param {boolean} [shouldSelectHtml]
     */
    replaceSelectionHtml: function (html, shouldSelectHtml) {
      var fragment,
        range = MediumEditor.selection.getSelectionRange(this.document),
        selection = this.document.getSelection();

      // insert html
      range.deleteContents();
      fragment = range.createContextualFragment(html);
      range.insertNode(fragment);

      // remove selection
      selection.removeAllRanges();

      // select html
      if (shouldSelectHtml !== false) {
        if (fragment.firstChild) {
          range.setStartBefore(fragment.firstChild);
          range.setEndAfter(fragment.lastChild);
        }
        selection.addRange(range);
      }
    },

    /**
     * get the innerHTML or textContent
     * @param {Node} node
     * @returns {string}
     */
    getNodeHtml: function (node) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          return node.innerHTML;
        case Node.TEXT_NODE:
          return node.textContent;
        default:
          return node.innerHTML || node.textContent || '';
      }
    },

    /**
     * check if the selection has a phrase as a child or ancestor
     * @returns {boolean}
     */
    isAlreadyApplied: function () {
      return this.hasSelectionPhrase() || !!this.getAncestorPhrase();
    },

    /**
     * this is necessary because safari will only select text nodes
     * @param {Node} node - the placeholder will be inserted before or after this node
     * @param {boolean} after - if true, insert after
     * @returns {Node}
     */
    insertTextNodePlaceholder: function (node, after) {
      return node.parentNode.insertBefore(this.document.createTextNode(placeholderText), after ? node.nextSibling : node);
    },

    /**
     * @param {Node} node - the placeholder will be inserted before this node
     * @returns {Node}
     */
    insertTextNodePlaceholderBefore: function (node) {
      return this.insertTextNodePlaceholder(node);
    },

    /**
     * @param {Node} node - the placeholder will be inserted after this node
     * @returns {Node}
     */
    insertTextNodePlaceholderAfter: function (node) {
      return this.insertTextNodePlaceholder(node, true);
    },

    /**
     * Amended: The original split-phrase doesn't make as much sense with footnotes, which are not often subdivided,
     * so here we simply remove the ancestor footnote element.
     * @param {Element} ancestorPhrase
     * @returns {string}
     */
    removeAncestorPhrase: function (ancestorPhrase) {
      var ancestorPhraseParent = ancestorPhrase.parentNode,
        selectionHtml = this.getNodeHtml(this.cloneSelection()),
        selection = this.document.getSelection(),
        range = this.document.createRange(),
        placeholderEl,
        textNodePlaceholder;
      
      // put a distinctive marker where the selection was
      this.replaceSelectionHtml(placeholderHtml, false);

      // modify containing html in the usual way, with side effect of removing the footnote
      this.removeFootnoteTags(ancestorPhrase);

      // replace selection marker with original selection text
      selection.removeAllRanges();
      placeholderEl = ancestorPhraseParent.querySelector(placeholderSelector);
      // add a text node so that Safari is willing to select
      textNodePlaceholder = this.insertTextNodePlaceholderAfter(placeholderEl);
      // remove placholder
      placeholderEl.parentNode.removeChild(placeholderEl);
      // recreate original selection in its place
      range.selectNode(textNodePlaceholder);
      selection.addRange(range);

      return selectionHtml
    },

    /**
     * @param {Node} node
     * @param {Node} ancestorNode
     * @returns {boolean}
     */
    isLastDescendantTextNode: function (node, ancestorNode) {
      var n, nodeFound,
        isLastDescendant = true,
        walk = this.document.createTreeWalker(ancestorNode, NodeFilter.SHOW_TEXT, null, false);

      while (n = walk.nextNode() && isLastDescendant) {
        if (nodeFound) {
          isLastDescendant = false;
        }
        if (n === node) {
          nodeFound = true;
        }
      }
      return isLastDescendant;
    },

    /**
     * @param {Node} node
     * @param {Node} ancestorNode
     * @returns {boolean}
     */
    isFirstDescendantTextNode: function (node, ancestorNode) {
      var firstDescendantTextNode = this.document.createTreeWalker(ancestorNode, NodeFilter.SHOW_TEXT, null, false).firstChild();

      return node === firstDescendantTextNode;
    },

    /**
     * if the range starts outside of the phrase and ends at the end of the phrase,
     * or starts at the beginning of the phrase and ends outside of the phrase,
     * then we need to make sure that the range contains the entire phrase
     * so that the phrase tags are removed.
     */
    ensurePhraseSelected: function () {
      var selection = this.window.getSelection(),
        range = MediumEditor.selection.getSelectionRange(this.document),
        startContainer = range.startContainer,
        startOffset = range.startOffset,
        endContainer = range.endContainer,
        endOffset = range.endOffset,
        hasMultipleContainersSelected = endContainer !== startContainer,
        hasFullySelectedEndContainer = endContainer.nodeType === Node.TEXT_NODE && endOffset === endContainer.textContent.length,
        hasFullySelectedStartContainer = startContainer.nodeType === Node.TEXT_NODE && startOffset === 0,
        rangeContainingAncestorPhrase = this.document.createRange(),
        containerAncestorPhrase,
        textNodePlaceholder;

      if (hasMultipleContainersSelected) {

        if (hasFullySelectedEndContainer) {
          containerAncestorPhrase = MediumEditor.util.traverseUp(endContainer, this.isPhraseNode.bind(this));
          if (containerAncestorPhrase && this.isLastDescendantTextNode(endContainer, containerAncestorPhrase)) {
            textNodePlaceholder = this.insertTextNodePlaceholderAfter(containerAncestorPhrase);
            rangeContainingAncestorPhrase.setStart(startContainer, startOffset);
            rangeContainingAncestorPhrase.setEnd(textNodePlaceholder.parentNode, getChildOffset(textNodePlaceholder));
          }
        }

        if (hasFullySelectedStartContainer) {
          containerAncestorPhrase = MediumEditor.util.traverseUp(startContainer, this.isPhraseNode.bind(this));
          if (containerAncestorPhrase && this.isFirstDescendantTextNode(startContainer, containerAncestorPhrase)) {
            rangeContainingAncestorPhrase.setStart(this.insertTextNodePlaceholderBefore(containerAncestorPhrase), 0);
            if (!textNodePlaceholder) {
              rangeContainingAncestorPhrase.setEnd(endContainer, endOffset); // only setEnd if it was not already set
            }
          }
        }

        if (!rangeContainingAncestorPhrase.collapsed) { // there is a new range
          selection.removeAllRanges();
          selection.addRange(rangeContainingAncestorPhrase);
        }
      }
    },

    /**
     * get the HTML from the selected range and either add or remove the phrase tags.
     * @returns {string} HTML
     */
    toggleFootnoteTags: function () {
      var container, selectionPhrases, html, footnote_id;

      this.ensurePhraseSelected();
      container = this.cloneSelection();
      selectionPhrases = this.getSelectionPhrases(container);
      html = container.innerHTML;

      if (selectionPhrases.length) { // selection already has phrases, so remove them
        selectionPhrases.forEach(this.removeFootnoteTags, this); // remove phrases while keeping their innerHTML
        html = container.innerHTML;
      } else if (container.textContent) { // no phrases found and has textContent, so add phrase tags
        html = this.addFootnoteTags(html);
      }
      return stripPlaceholderText(html); // placeholderText may have been added by this.ensurePhraseSelected()
    },

    /**
     * traverse down from the selection to find at least one phrase
     * @returns {boolean}
     */
    hasSelectionPhrase: function () {
      return this.getSelectionPhrases(this.cloneSelection()).length > 0;
    },

    /**
     * traverse up from the selection to find the first ancestor phrase
     * @returns {Node|boolean}
     */
    getAncestorPhrase: function () {
      return MediumEditor.util.traverseUp(MediumEditor.selection.getSelectionRange(this.document).startContainer, this.isPhraseNode.bind(this));
    },

    /**
     * when the button is clicked, update the html
     * @param {object} e
     */
    handleClick: function (e) {
      var ancestorPhrase = this.getAncestorPhrase();

      e.preventDefault();
      e.stopPropagation();
      if (!ancestorPhrase || this.hasSelectionPhrase()) {
        this.replaceSelectionHtml(this.toggleFootnoteTags());
      } else {
        this.replaceSelectionHtml(this.removeAncestorPhrase(ancestorPhrase));
      }
      // this.replaceSelectionHtml(!ancestorPhrase || this.hasSelectionPhrase() ? this.toggleFootnoteTags() : this.removeAncestorPhrase(ancestorPhrase));
      this.isAlreadyApplied() ? this.setActive() : this.setInactive(); // update button state
      this.base.checkContentChanged(); // triggers 'editableInput' event
    },
  });
}(typeof require === 'function' ? require('medium-editor') : MediumEditor))));
