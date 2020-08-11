const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs')
const localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat)

const MarkdownIt = require('markdown-it'),
    md = new MarkdownIt();
const { render } = require('mustache');
const findAllFiles = (dir) => fs
    .readdirSync(dir)
    .reduce(
        (files, file) =>
            fs.statSync(path.join(dir, file)).isDirectory()
                ? files.concat(findAllFiles(path.join(dir, file)))
                : files.concat(path.join(dir, file)),
        []
    );

const sourceMarkdownDirectory = '/docs';
const compileDirectory = '/public'

const markdownFiles = findAllFiles(__dirname + sourceMarkdownDirectory).filter(file => file.endsWith('.md')).map(file => file.replace(__dirname, ''));

const renderFileAndFormat = (filePath) => {
    const content = md.render(fs.readFileSync(__dirname + filePath, {
        encoding: "utf-8"
    }));

    return render(fs.readFileSync(__dirname + '/templates/layout.html', { encoding: 'utf-8' }), {
        title: 'Important information for a crisis in one spot',
        description: 'Life is hard, and when bad things happen it can be difficult to know where to move next. This is a collection of resources that might make deciding what to do a little easier.',
        content,
        updatedAt: dayjs(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })).format('LLL')
    })
}

const remapFilesToPaths = (file) => {
    return file.toLowerCase().replace('readme', '');
}

for (let key in markdownFiles) {
    // Could be /docs/code-of-conduct.md
    const filePath = markdownFiles[key];


    // code-of-conduct
    const routeNameForFile = path.basename(filePath).replace('.md', '').replace(sourceMarkdownDirectory, '');
    const nameForUrl = filePath.replace('.md', '').replace(sourceMarkdownDirectory, '');
    // code-of-conduct

    const output = renderFileAndFormat(filePath);

    const outputDirectory = remapFilesToPaths(nameForUrl);

    if (!fs.existsSync(__dirname + compileDirectory + outputDirectory)) {
        fs.mkdirSync(__dirname + compileDirectory + outputDirectory)
    }

    fs.writeFileSync(__dirname + compileDirectory + outputDirectory + '/index.html', output)
}

console.log('Built the documentation!');
