/*
Obsidian plugin: Metalanguage Grammars.
Ported from https://github.com/Alhadis/language-grammars (ISC).
*/

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MetalanguageGrammarsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/grammars/abnf.ts
var CORE_RULES = /\b(?<!-)(?:ALPHA|BIT|CHAR|CRLF|CR|CTL|DIGIT|DQUOTE|HEXDIG|HTAB|LF|LWSP|OCTET|SP|VCHAR|WSP)\b(?!-)/;
var abnf = {
  // ; line comment
  comment: {
    pattern: /;[^\r\n]*/,
    greedy: true
  },
  // Production rule header: `name =` / `name =/` / `name :=`
  // We match the rule name plus the assignment together so the name is
  // classified as an entity rather than falling through to `reference`.
  rule: {
    pattern: /^[ \t]*[A-Za-z][-A-Za-z0-9]*(?=[ \t]*(?:=\/|:?=))/m,
    alias: "entity"
  },
  operator: /=\/|:?=|\//,
  // "literal text" and case-sensitive variant %s"…" / %i"…" (RFC 7405)
  string: [
    {
      pattern: /%[si]?"[^"\r\n]*"/i,
      greedy: true,
      alias: "string-sensitive"
    },
    {
      pattern: /"[^"\r\n]*"/,
      greedy: true
    }
  ],
  // Free-form prose: <description>
  prose: {
    pattern: /<[^>\r\n]*>/,
    alias: "string"
  },
  // Numeric terminals: %d65, %x41, %b1000001, ranges %x30-39, concat %x41.42.43
  terminal: {
    pattern: /%(?:[dD][0-9][0-9.\-]*|[xX][0-9A-Fa-f][0-9A-Fa-f.\-]*|[bB][01][01.\-]*)/,
    inside: {
      punctuation: /^%/,
      "class-name": {
        pattern: /^[dDxXbB]/,
        alias: "keyword"
      },
      number: /[0-9A-Fa-f]+/,
      operator: /[.\-]/
    }
  },
  // Repetition quantifier: `3*5element`, `*element`, `4element`, `1*element`
  number: /\b[0-9]+\b/,
  quantifier: {
    pattern: /\*/,
    alias: "operator"
  },
  // Core predefined rules
  "core-rule": {
    pattern: CORE_RULES,
    alias: "constant"
  },
  // Any other bare identifier is a rule reference
  reference: {
    pattern: /[A-Za-z][-A-Za-z0-9]*/,
    alias: "variable"
  },
  punctuation: /[()\[\]]/
};

// src/grammars/bnf.ts
var META_CLASS = "[A-Za-z\\u0370-\\u03FF\\u2100-\\u214F\\u{1D400}-\\u{1D7FF}]";
var META_SUFFIX = "(?:['\\u2032]|[\\u2080-\\u2089]|_[0-9])*";
var METAVAR_RE = new RegExp(
  `(?<!${META_CLASS})${META_CLASS}${META_SUFFIX}(?!${META_CLASS})`,
  "u"
);
var RULE_META_RE = new RegExp(
  `(^|\\n)[ \\t]*${META_CLASS}${META_SUFFIX}(?=[ \\t]*::?=)`,
  "u"
);
var KEYWORD_RE = new RegExp(
  `${META_CLASS}(?:${META_CLASS}|[0-9_\\-]){1,}`,
  "u"
);
var bnf = {
  // Line comments: `;` (traditional) and `//` (common in modern dialects).
  comment: [
    {
      pattern: /;[^\r\n]*/,
      greedy: true
    },
    {
      pattern: /(^|[^\\])\/\/[^\r\n]*/,
      lookbehind: true,
      greedy: true
    }
  ],
  // Rule header with angle brackets: `<n> ::=`
  "rule-angle": {
    pattern: /<[^<>\r\n]+>(?=[ \t]*::=)/,
    alias: "rule",
    inside: {
      punctuation: /[<>]/,
      "entity-name": {
        pattern: /[^<>]+/,
        alias: "entity"
      }
    }
  },
  // Rule header without angle brackets: `E ::=` (metavariable form).
  "rule-meta": {
    pattern: RULE_META_RE,
    lookbehind: true,
    alias: ["rule", "metavar"]
  },
  // Assignment and alternation operators.
  operator: /::=|:=|\|/,
  // Terminal string literal.
  string: [
    {
      pattern: /"[^"\r\n]*"/,
      greedy: true
    },
    {
      pattern: /'[^'\r\n]*'/,
      greedy: true
    }
  ],
  // Non-terminal reference with angle brackets.
  "non-terminal": {
    pattern: /<[^<>\r\n]+>/,
    alias: "variable",
    inside: {
      punctuation: /[<>]/
    }
  },
  // *** Order matters below: keyword BEFORE metavar. ***
  // Multi-letter bare words (true, false, if, then, else, let, in, …).
  keyword: KEYWORD_RE,
  // Single-letter metavariable reference on the RHS.
  metavar: {
    pattern: METAVAR_RE,
    alias: "variable"
  },
  // Syntactic punctuation used in constructor-style rules:
  // `(`, `)`, `:`, `,`, `=` inside `let (x : T) = E in E`, plus `.` etc.
  punctuation: /[()\[\]{}:,.=]/
};

// src/grammars/ebnf.ts
var ebnf = {
  // (* block comment *)  — nestable in ISO, but flat handling is adequate
  comment: {
    pattern: /\(\*[\s\S]*?\*\)/,
    greedy: true
  },
  // Rule header: `name =`
  rule: {
    pattern: /^[ \t]*[A-Za-z_][A-Za-z0-9_ \t-]*?(?=[ \t]*=(?!=))/m,
    alias: "entity",
    inside: {
      // Trim trailing whitespace so the entity class applies cleanly
      "entity-name": /[A-Za-z_][A-Za-z0-9_-]*(?:[ \t]+[A-Za-z_][A-Za-z0-9_-]*)*/
    }
  },
  // ? special sequence ?
  "special-sequence": {
    pattern: /\?[^?\r\n]*\?/,
    alias: "string"
  },
  // Terminal strings
  string: [
    {
      pattern: /"[^"\r\n]*"/,
      greedy: true
    },
    {
      pattern: /'[^'\r\n]*'/,
      greedy: true
    }
  ],
  number: /\b[0-9]+\b/,
  // Non-terminal / rule reference
  reference: {
    pattern: /[A-Za-z_][A-Za-z0-9_-]*/,
    alias: "variable"
  },
  // Terminator `;` or `.` and the = assignment
  operator: /::=|:=|=|\||,|-|\*|\+|\?|\/|\.|;/,
  punctuation: /[()\[\]{}]/
};

// src/grammars/lbnf.ts
var BUILTIN_CATEGORIES = /\b(?:Integer|Double|Char|String|Ident)\b/;
var PRAGMAS = /\b(?:comment|token|internal|entrypoints|terminator|separator|rules|coercions|position\s+token|layout(?:\s+(?:stop|toplevel))?)\b/;
var lbnf = {
  // LBNF uses line comments `--` (Haskell-style) and block `{- -}`.
  comment: [
    {
      pattern: /\{-[\s\S]*?-\}/,
      greedy: true
    },
    {
      pattern: /--[^\r\n]*/,
      greedy: true
    }
  ],
  // Pragma keywords start reserved directives.
  keyword: PRAGMAS,
  // Terminal string / character literals.
  string: [
    {
      pattern: /"(?:[^"\\\r\n]|\\.)*"/,
      greedy: true
    },
    {
      pattern: /'(?:[^'\\\r\n]|\\.)*'/,
      greedy: true
    }
  ],
  // Rule label — `LabelName .` before the non-terminal. We match the label
  // and consuming dot together so the label reads as an entity.
  label: {
    pattern: /\b[A-Z][A-Za-z0-9_']*(?=[ \t]*\.)/,
    alias: "entity"
  },
  // BNFC built-in category names.
  "builtin-category": {
    pattern: BUILTIN_CATEGORIES,
    alias: "constant"
  },
  // Priority-suffixed nonterminal reference, e.g. `Exp2`.
  "non-terminal": {
    pattern: /\b[A-Z][A-Za-z0-9_']*(?:\s*\d+)?\b/,
    alias: "variable"
  },
  number: /\b[0-9]+\b/,
  // Lower-case identifiers inside token definitions refer to char classes.
  reference: {
    pattern: /\b[a-z][A-Za-z0-9_']*\b/,
    alias: "variable"
  },
  operator: /::=|=|\||\.|;|,/,
  punctuation: /[()\[\]{}]/
};

// src/main.ts
var GRAMMARS = [
  { id: "abnf", aliases: ["rfc5234", "rfc-5234", "rfc7405"], grammar: abnf },
  { id: "bnf", aliases: ["backus-naur"], grammar: bnf },
  { id: "ebnf", aliases: ["iso-ebnf", "iso14977"], grammar: ebnf },
  { id: "lbnf", aliases: ["bnfc", "labelled-bnf"], grammar: lbnf }
];
var MetalanguageGrammarsPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    /** Languages we registered, so we can remove them cleanly on unload. */
    this.registered = [];
  }
  async onload() {
    this.registerPrismGrammars();
    for (const entry of GRAMMARS) {
      for (const lang of [entry.id, ...entry.aliases]) {
        this.registerMarkdownCodeBlockProcessor(
          lang,
          (source, el, ctx) => this.renderBlock(entry, source, el, ctx)
        );
      }
    }
  }
  onunload() {
    const Prism = window.Prism;
    if (!Prism)
      return;
    for (const name of this.registered) {
      try {
        delete Prism.languages[name];
      } catch {
      }
    }
    this.registered = [];
  }
  registerPrismGrammars() {
    const Prism = window.Prism;
    if (!Prism || !Prism.languages)
      return;
    for (const entry of GRAMMARS) {
      Prism.languages[entry.id] = entry.grammar;
      this.registered.push(entry.id);
      for (const alias of entry.aliases) {
        Prism.languages[alias] = entry.grammar;
        this.registered.push(alias);
      }
    }
  }
  /**
   * Render a fenced code block of one of our languages. When Prism is
   * available we let it tokenize; otherwise we emit plain preformatted
   * text so the user at least sees their code.
   */
  renderBlock(entry, source, el, _ctx) {
    const pre = el.createEl("pre", { cls: `language-${entry.id}` });
    const code = pre.createEl("code", { cls: `language-${entry.id}` });
    const Prism = window.Prism;
    if (Prism && Prism.highlight) {
      code.innerHTML = Prism.highlight(source, entry.grammar, entry.id);
    } else {
      code.setText(source);
    }
  }
};
