const fs = require('fs');
const path = require('path');

// Path to your src folder and package.json file
const SRC_DIR = path.resolve(process.cwd(), 'src');
const VERBOSE = process.argv.includes('--verbose');
const SRC_MODE = process.argv.includes('--src');
const PACKAGE_JSON_PATH = path.resolve(process.cwd(), SRC_MODE ? 'package.json' : 'dist/package.json');
const FOLDER_IGNORE_PATTERNS = [/__tests__/, /node_modules/];

// Utility to check if a file exists
const fileExists = (filePath) => fs.existsSync(filePath);

/** @type {Record<string, { path: string, file: string }} */
const ExportsStructure = {
    types: { path: 'types', file: 'index.d.ts' },
    import: { path: 'esm', file: 'index.js' },
    require: { path: 'cjs', file: 'index.js' },
    default: { path: 'cjs', file: 'index.js' }
};
const ExportsStructureEntries = Object.entries(ExportsStructure);
const SrcExport = p => `./src/${p}/index.ts`;

function getExports(relativePath) {
    return Object.fromEntries(
        ExportsStructureEntries
            .map(([key, value]) => [
                key,
                // value(relativePath),
                `./${value.path}/${relativePath}/${value.file}`
            ])
    );
}

// Function to update package.json with exports
function updatePackageJsonWithExports() {
    console.log('Updating package.json with exports', SRC_MODE ? 'for src' : 'for dist', process.argv);

    // Load the existing package.json
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));

    if (!SRC_MODE) {
        // Ensure exports field exists and cleaned
        packageJson.exports = {
            "./*": {
                "types": "./types/*.d.ts",
                "import": "./esm/*.js",
                "require": "./cjs/*.js",
                "default": "./esm/*.js"
            }
        };
    } else {
        packageJson.exports = {
            "./*": "./src/*.ts"
        };
    }

    const processDirectory = (currentPath, parentFolder) => {
        // console.log('Scanning folder:', currentPath);
        const folders = fs.readdirSync(currentPath, { withFileTypes: true });
        folders.forEach((folder) => {
            if (!folder.isDirectory()) {
                return;
            }

            if (FOLDER_IGNORE_PATTERNS.some((pattern) => folder.name.match(pattern))) {
                VERBOSE && console.log('--- Ignoring folder:', folder.name);
                return;
            }

            const folderPath = path.join(currentPath, folder.name);
            const indexTsPath = path.join(folderPath, 'index.ts');
            const indexJsPath = path.join(folderPath, 'index.js');

            const relativePath = parentFolder
                ? (parentFolder + '/' + folder.name)
                : folder.name;

            // Check if the folder has an index.ts or index.js file
            if (fileExists(indexTsPath) || fileExists(indexJsPath)) {



                // console.log('+++ Adding exports for', currentPath, '=>', relativePath);
                // Add an export entry for the folder
                if (SRC_MODE) {
                    packageJson.exports[`./${relativePath}`] = SrcExport(relativePath);
                } else {
                    packageJson.exports[`./${relativePath}`] = getExports(relativePath);
                }
            } else {
                VERBOSE && console.log('--- No index.ts/.js found in', currentPath, '=>', relativePath);
            }

            processDirectory(folderPath, relativePath);
        });
    };

    // Read the src directory
    processDirectory(SRC_DIR, '');

    // Write the updated package.json back to the file
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log('package.json updated successfully with exports.');

    if (!SRC_MODE) {
        // additionally, write package.json files to each subfolder with corresponding type
        fs.writeFileSync(path.resolve(process.cwd(), 'dist/cjs/package.json'), JSON.stringify({ "type": "commonjs" }, null, 2) + '\n', 'utf8');
        fs.writeFileSync(path.resolve(process.cwd(), 'dist/esm/package.json'), JSON.stringify({ "type": "module" }, null, 2) + '\n', 'utf8');
    }
}

// Run the update function
updatePackageJsonWithExports();
