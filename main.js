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
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var import_language = require("@codemirror/language");

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
var BNF_BUILTIN_RE = new RegExp(
  "[\\u2102\\u210D\\u2115\\u2119\\u211A\\u211D\\u2124\\u{1D538}-\\u{1D56B}\\u{1D7D8}-\\u{1D7E1}]" + META_SUFFIX,
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
  // *** Order matters below: builtin BEFORE keyword BEFORE metavar. ***
  // Double-struck (blackboard bold) characters: ℕ, 𝔹, ℤ, ℝ, ℂ, etc.
  builtin: {
    pattern: BNF_BUILTIN_RE,
    alias: "constant"
  },
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

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tokensToHtml(tokens, parentClasses) {
    let html = '';
    for (const token of tokens) {
        if (typeof token === 'string') {
            if (parentClasses.length > 0 && token.length > 0) {
                html += `<span class="${escapeHtml(parentClasses.join(' '))}">${escapeHtml(token)}</span>`;
            } else {
                html += escapeHtml(token);
            }
        } else {
            let classes = ['token', token.type];
            if (token.alias) {
                if (Array.isArray(token.alias)) classes.push(...token.alias);
                else classes.push(token.alias);
            }
            const allClasses = [...parentClasses, ...classes];
            if (Array.isArray(token.content)) {
                html += tokensToHtml(token.content, allClasses);
            } else if (typeof token.content === 'string') {
                html += `<span class="${escapeHtml(allClasses.join(' '))}">${escapeHtml(token.content)}</span>`;
            } else if (token.content) {
                html += tokensToHtml([token.content], allClasses);
            }
        }
    }
    return html;
}

function extractBnfRuleNames(source) {
    var rules = new Set();
    // Match angle-bracket rules: <name> ::=
    var m;
    var re1 = /<([^<>\r\n]+)>\s*::?=/g;
    while ((m = re1.exec(source)) !== null) {
        rules.add(m[1].trim());
    }
    // Match bare single-letter meta rules: T ::= or E ::=
    var re2 = new RegExp("(?:^|\\n)[ \\t]*(" + META_CLASS + META_SUFFIX + ")(?=[ \\t]*::?=)", "gu");
    while ((m = re2.exec(source)) !== null) {
        rules.add(m[1]);
    }
    return rules;
}

function reclassifyBnfTokens(tokens, ruleNames) {
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (typeof token === 'string') continue;
        if (token.type === 'metavar') {
            var text = typeof token.content === 'string' ? token.content : '';
            if (!ruleNames.has(text)) {
                token.type = 'keyword';
                token.alias = undefined;
            }
        }
        if (Array.isArray(token.content)) {
            reclassifyBnfTokens(token.content, ruleNames);
        } else if (token.content && typeof token.content !== 'string') {
            reclassifyBnfTokens([token.content], ruleNames);
        }
    }
}

function buildDecorations(view) {
    const Prism = window.Prism;
    if (!Prism) return import_view.Decoration.none;

    const docStr = view.state.doc.toString();
    const doc = view.state.doc;
    const decos = [];
    const visibleRanges = view.visibleRanges;

    const ALL_LANGS = [];
    for (const g of GRAMMARS) {
        ALL_LANGS.push(g.id, ...g.aliases);
    }
    const langRegexPart = ALL_LANGS.join("|");
    const regex = new RegExp(`(^|\\n)\`\`\`(${langRegexPart})([ \\t]*\\r?\\n)([\\s\\S]*?)(?:\\n[ \\t]*\`\`\`|$)`, "g");

    let match;
    while ((match = regex.exec(docStr)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        let isVisible = false;
        for (const r of visibleRanges) {
            if (r.from <= end && r.to >= start) {
                isVisible = true;
                break;
            }
        }
        if (!isVisible) continue;

        const langStr = match[2];
        const code = match[4];
        const codeStart = match.index + match[1].length + 3 + langStr.length + match[3].length;

        let entry = null;
        for (const g of GRAMMARS) {
            if (g.id === langStr || g.aliases.includes(langStr)) {
                entry = g;
                break;
            }
        }
        if (!entry) continue;

        const startLine = doc.lineAt(codeStart).number;
        const endLine = Math.min(doc.lineAt(codeStart + code.length).number, doc.lines);
        for (let l = startLine; l <= endLine; l++) {
            const line = doc.line(l);
            const lineDeco = import_view.Decoration.line({ attributes: { class: "language-" + entry.id } });
            decos.push(lineDeco.range(line.from));
        }

        try {
            const tokens = Prism.tokenize(code, entry.grammar);
            if (entry.id === 'bnf') {
                const ruleNames = extractBnfRuleNames(code);
                reclassifyBnfTokens(tokens, ruleNames);
            }

            const flattenTokens = (tArr, offset, parentClasses) => {
                for (const token of tArr) {
                    if (typeof token === 'string') {
                        if (parentClasses.length > 0 && token.length > 0) {
                            const mark = import_view.Decoration.mark({ class: parentClasses.join(" ") });
                            decos.push(mark.range(offset, offset + token.length));
                        }
                        offset += token.length;
                    } else {
                        const tokenLength = token.length;
                        let classes = ['token', token.type];
                        if (token.alias) {
                            if (Array.isArray(token.alias)) {
                                classes.push(...token.alias);
                            } else {
                                classes.push(token.alias);
                            }
                        }
                        const allClasses = [...parentClasses, ...classes];

                        if (Array.isArray(token.content)) {
                            flattenTokens(token.content, offset, allClasses);
                        } else if (typeof token.content === "string") {
                            if (tokenLength > 0) {
                                const mark = import_view.Decoration.mark({ class: allClasses.join(" ") });
                                decos.push(mark.range(offset, offset + tokenLength));
                            }
                        } else if (token.content) {
                            flattenTokens([token.content], offset, allClasses);
                        }
                        offset += tokenLength;
                    }
                }
            };

            flattenTokens(tokens, codeStart, []);
        } catch (e) {
            // ignore
        }
    }

    return import_view.Decoration.set(decos, true);
}

const LIVE_PREVIEW_PLUGIN = import_view.ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = buildDecorations(view);
    }
    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = buildDecorations(update.view);
        }
    }
}, { decorations: v => v.decorations });

var MetalanguageGrammarsPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    /** Languages we registered, so we can remove them cleanly on unload. */
    this.registered = [];
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MetalanguageSettingTab(this.app, this));
    this.updateStyles();
    this.registerPrismGrammars();
    for (const entry of GRAMMARS) {
      for (const lang of [entry.id, ...entry.aliases]) {
        this.registerMarkdownCodeBlockProcessor(
          lang,
          (source, el, ctx) => this.renderBlock(entry, source, el, ctx)
        );
      }
    }
    this.registerEditorExtension(LIVE_PREVIEW_PLUGIN);
  }
  onunload() {
    const styleEl = document.getElementById("metalanguage-custom-styles");
    if (styleEl) styleEl.remove();
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
    if (Prism && Prism.tokenize) {
      const tokens = Prism.tokenize(source, entry.grammar);
      if (entry.id === 'bnf') {
          const ruleNames = extractBnfRuleNames(source);
          reclassifyBnfTokens(tokens, ruleNames);
      }
      code.innerHTML = tokensToHtml(tokens, []);
    } else {
      code.setText(source);
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.updateStyles();
  }
  updateStyles() {
    let styleEl = document.getElementById("metalanguage-custom-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "metalanguage-custom-styles";
      document.head.appendChild(styleEl);
    }
    const s = this.settings;
    const bodyStyles = `
      body {
        ${s.colorEntity ? `--meta-color-entity: ${s.colorEntity};` : ""}
        ${s.colorReference ? `--meta-color-reference: ${s.colorReference};` : ""}
        ${s.colorFaint ? `--meta-color-faint: ${s.colorFaint};` : ""}
        ${s.colorConstant ? `--meta-color-constant: ${s.colorConstant};` : ""}
        ${s.colorNumber ? `--meta-color-number: ${s.colorNumber};` : ""}
        ${s.colorOperatorAlt ? `--meta-color-operator-alt: ${s.colorOperatorAlt};` : ""}
        ${s.colorString ? `--meta-color-string: ${s.colorString};` : ""}
        ${s.colorProse ? `--meta-color-prose: ${s.colorProse};` : ""}
        ${s.colorOperator ? `--meta-color-operator: ${s.colorOperator};` : ""}
        ${s.colorComment ? `--meta-color-comment: ${s.colorComment};` : ""}
        ${s.colorPunctuation ? `--meta-color-punctuation: ${s.colorPunctuation};` : ""}
        ${s.colorMetavar ? `--meta-color-metavar: ${s.colorMetavar};` : ""}
      }
    `;
    styleEl.textContent = bodyStyles;
  }
};

const DEFAULT_SETTINGS = {
  colorEntity: "#a882ff",
  colorReference: "#4d93ff",
  colorFaint: "#6e6e6e",
  colorConstant: "#00b8d4",
  colorNumber: "#ff9100",
  colorOperatorAlt: "#ff5252",
  colorString: "#00e676",
  colorProse: "#ffd600",
  colorOperator: "#ff4081",
  colorComment: "#6e6e6e",
  colorPunctuation: "#6e6e6e",
  colorMetavar: "#4d93ff"
};

class MetalanguageSettingTab extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Metalanguage Grammars Settings" });

    const createColorSetting = (name, desc, key) => {
      new import_obsidian.Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addColorPicker((color) =>
          color
            .setValue(this.plugin.settings[key] || DEFAULT_SETTINGS[key])
            .onChange(async (value) => {
              this.plugin.settings[key] = value;
              await this.plugin.saveSettings();
            })
        )
        .addExtraButton((button) =>
          button
            .setIcon("reset")
            .setTooltip("Restore default")
            .onClick(async () => {
              this.plugin.settings[key] = DEFAULT_SETTINGS[key];
              await this.plugin.saveSettings();
              this.display();
            })
        );
    };

    createColorSetting("Rule Name (Entity)", "Color for LHS rules.", "colorEntity");
    createColorSetting("Rule Reference", "Color for RHS non-terminals.", "colorReference");
    createColorSetting("Faint Elements", "Color for brackets/numbers in certain references.", "colorFaint");
    createColorSetting("Constant / Built-in", "Color for core rules and builtin categories.", "colorConstant");
    createColorSetting("Number", "Color for numeric terminals.", "colorNumber");
    createColorSetting("Operator (Alternative) / Keyword", "Color for quantifiers, pragmas, string prefixes.", "colorOperatorAlt");
    createColorSetting("String", "Color for literal strings.", "colorString");
    createColorSetting("Prose / Special Sequence", "Color for free-form prose and special sequences.", "colorProse");
    createColorSetting("Operator", "Color for assignment, alternation, concatenation.", "colorOperator");
    createColorSetting("Comment", "Color for comments.", "colorComment");
    createColorSetting("Punctuation", "Color for generic punctuation.", "colorPunctuation");
    createColorSetting("Metavariable", "Color for single-letter metavariables (BNF).", "colorMetavar");
  }
}
