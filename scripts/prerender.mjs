import React from 'react';
import { renderToString } from 'react-dom/server';
import ts from 'typescript';
import { readFile, writeFile, unlink } from 'node:fs/promises';

const temporary = new URL('./.landing-render.mjs', import.meta.url);
try {
  const source = await readFile(new URL('../src/Landing.tsx', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  await writeFile(temporary, outputText);
  const { default: Landing } = await import(temporary.href);
  const markup = renderToString(React.createElement(Landing, { start() {}, explore() {}, dark: false, toggleTheme() {} }));
  const path = new URL('../dist/index.html', import.meta.url);
  const html = await readFile(path, 'utf8');
  if (!html.includes('<div id="root"></div>')) throw new Error('Missing prerender root');
  await writeFile(path, html.replace('<div id="root"></div>', () => '<div id="root">' + markup + '</div>'));
  console.log('Public landing page prerendered successfully.');
} finally {
  await unlink(temporary).catch(() => {});
}
