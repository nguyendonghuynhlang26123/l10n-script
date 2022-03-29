//Import & Setups
const fs = require('fs');
const Parser = require('tree-sitter');
const Dart = require('tree-sitter-dart');
const parser = new Parser();
parser.setLanguage(Dart);

// Script config ---------
const ROOT_DIRECTORY = __dirname + '/../tixngo-admintool-flutter-2/lib'; // EDIT ME
const excludeFileNames = ['const.dart'];
const excludeFolders = ['test', 'bloc', 'repositories', 'view_models', 'view_model', 'model'];
const excludeTexts = ['YYYY-MM-DD', 'HH:MM'];
const includeFunctions = ['Widget build(BuildContext context)'];
const articles = ['in', 'on', 'at', 'a', 'an', 'of', 'to', 'the', 'be', 'is', 'are']; //Key has meaning by remove articles
const rules = [
  // Set of rule functions, which return false if violate
  (text) =>
    // Rule#1: only extract string literal that has "normal" character
    !/[`@#$^&*_+\=\[\]{}|<>\/~]/.test(text),
  (text) =>
    // Rule #2: only extract string literal that begin witha a Capital alphabetical letter
    /^[A-Z]/.test(text),
  // (text) =>
  //   // Rule #3: avoid constant!
  //   text.replaceAll('\\n', '') !== text.replaceAll('\\n', '').toUpperCase(),
];
const MODE = 'COPY'; // COPY | REPLACE; Copy means script will copy the content to another location, while replace means it will try to modify the input file
const NUMBERING = false; //Disable Numbering when encounter duplicate
const packageImportStatement = "import 'package:new_admintool/l10n/l10n.dart';"; // EDIT ME
const replacePrefix = 'context.l10n.';
// -----------------------------

// Utils function
// preprocess and camelize keywords
const camelize = (str) => {
  return str
    .replaceAll('_', ' ')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};
const getFirst2Words = (str) => {
  // Extract 2 first meaning words
  const nums = 2;
  const words = str.split(' ');
  let result = [];
  for (let i = 0; i < words.length; i++) {
    if (result.length >= nums) break;

    if (!/[`@#$^&*_!+\-=\[\]{}()|<>\\\/~:'".]/.test(words[i]) && !articles.includes(words[i].toLowerCase())) result.push(words[i]);
  }
  return result.join(' ');
};

/**
 * Recursively loop through all nodes of the source code tree using BFS approach.
 * Then return all string literals that are in that tree in a special data structure
 * That structure is { content, context}
 */
const bfsFindStringLiteralsInTree = (node, context = []) => {
  let data = [];
  const { type, children } = node;

  // Ignore import/export string
  if (type === 'import_or_export') return [];
  else if (type === 'class_definition') context.push(node.firstNamedChild.text);
  else if (type === 'function_body' && includeFunctions.includes(node.previousSibling.text)) {
    const nodes = node.descendantsOfType('string_literal');

    for (let n of nodes) {
      let text = n.text.replaceAll("'", '');
      if (!text || text === ' ' || excludeTexts.includes(text)) continue;

      let isViolated = false;
      if (type) for (const rule of rules) if (!rule(text)) isViolated = true;
      if (isViolated) continue;

      if (node.previousSibling?.type === 'label') context.push(node.previousSibling.firstChild.text);
      data.push({
        content: text,
        context: context,
      });
    }
    return data;
  }

  for (const child of children) {
    data = [...data, ...bfsFindStringLiteralsInTree(child, [...context])];
  }
  return data;
};

// Process single file and return a map key => value
const readFileAndProcess = (rootDirectory, relativePath, fileName) => {
  const sourceCode = fs.readFileSync(`${rootDirectory}/${relativePath}/${fileName}.dart`).toString();
  const tree = parser.parse(sourceCode);
  const data = bfsFindStringLiteralsInTree(tree.rootNode, [fileName]);

  const result = {};
  let newSourceCode = sourceCode;

  // Generate key from context function
  const duplicateCount = {};
  const getKey = (context, content) => {
    //Camelize and join all context
    let key = context.map((l) => camelize(l)).join('_');

    //Add the first 2 words in the content to make it easier to find
    const first2Words = getFirst2Words(content);
    if (first2Words === '' || first2Words.length > 25) key = key;
    else if (first2Words.toUpperCase() === first2Words) key = key + '_' + first2Words.replaceAll(' ', '');
    else key = key + '_' + camelize(first2Words);

    //Add number if duplicated
    if (NUMBERING) {
      if (duplicateCount[key]) {
        duplicateCount[key]++;
        key += duplicateCount[key].toString();
      } else duplicateCount[key] = 1;
    }
    return key;
  };

  if (data && data.length) {
    //1. Replace every string literal in the sourceCode using Data. This will result in new source code content
    for (const stringLiteral of data) {
      // 1a. Generate an appropriate key for this string literal with provided context
      const key = getKey(stringLiteral.context, stringLiteral.content);

      // 1b. Temporary store it for returning data.
      result[key] = stringLiteral.content;

      // 1c. Replace it in the source code.
      // console.debug(`Trying to replace '${stringLiteral.content}' with ${replacePrefix + key} `);
      newSourceCode = newSourceCode.replace(`'${stringLiteral.content}'`, replacePrefix + key);
    }

    // 2. Add importing package
    newSourceCode = packageImportStatement + '\n' + newSourceCode;

    // 3. Export changes to file
    if (MODE === 'REPLACE') fs.writeFileSync(`${rootDirectory}/${relativePath}/${fileName}.dart`, newSourceCode.toString());
    else {
      const directory = `./output/${relativePath}`;
      if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true }); // Try to create directory if needed
      fs.writeFileSync(`${directory}/${fileName}.dart`, newSourceCode.toString());
    }
  }
  return result;
};

const loopThroughAllFilesInDirectory = (rootDirectory, currentPath = '.', outputArb = {}) => {
  const files = fs.readdirSync(`${rootDirectory}/${currentPath}`, { withFileTypes: true });

  for (let f of files) {
    //If this is a directory, recursively jump to it
    if (f.isDirectory() && !excludeFolders.includes(f.name)) outputArb = loopThroughAllFilesInDirectory(rootDirectory, `${currentPath}/${f.name}`, outputArb);
    else {
      const [fileName, fileType] = f.name.split('.');
      if (fileType === 'dart' && !excludeFileNames.includes(f.name)) {
        const arbData = readFileAndProcess(rootDirectory, currentPath, fileName);

        outputArb = { ...outputArb, ...arbData };
      }
    }
  }

  return outputArb;
};

const arb = loopThroughAllFilesInDirectory(ROOT_DIRECTORY, '.', { '@@locale': 'en' });
console.log('log ~ file: index.js ~ line 153 ~ arb', arb);
fs.mkdirSync('./output/l10n/arb', { recursive: true });
fs.writeFileSync('./output/l10n/arb/app_en.arb', JSON.stringify(arb, null, 2));
