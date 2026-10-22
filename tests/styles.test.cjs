const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const sass = require('sass');
const postcss = require('postcss');

function declarations(css) {
    const result = [];
    postcss.parse(css).walkDecls((declaration) => {
        result.push([
            declaration.parent.selector.replace(/="([a-z]+)"/g, '=$1'),
            declaration.prop,
            declaration.value,
            declaration.important || false
        ]);
    });
    return result;
}

test('Dart Sass preserves the distributed scroll style declarations', async () => {
    const compiled = (await postcss([require('autoprefixer')({ cascade: false })]).process(
        sass.compile('src/locomotive-scroll.scss').css, { from: undefined })).css;
    const distributed = fs.readFileSync('dist/locomotive-scroll.css', 'utf8');
    assert.deepEqual(declarations(compiled), declarations(distributed));
});

test('documentation aspect ratios compile to standalone CSS selectors', () => {
    const compiled = sass.compile('docs/src/styles/main.scss', { loadPaths: ['.'] }).css;
    const rules = [];
    postcss.parse(compiled).walkRules((rule) => rules.push(rule));
    assert.equal(rules.some((rule) => rule.selector.startsWith('&')), false);
    for (const [ratio, expected] of [['2\\:1', '50%'], ['4\\:3', '75%'], ['16\\:9', '56.25%']]) {
        const rule = rules.find((entry) => entry.selector === `.u-${ratio}::before`);
        assert.ok(rule, `missing ratio selector ${ratio}`);
        assert.ok(rule.nodes.some((entry) => entry.prop === 'padding-bottom' && entry.value === expected));
    }
});
