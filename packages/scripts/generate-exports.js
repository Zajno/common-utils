const fs = require('fs');
const path = require('path');

// Path to your src folder and package.json file
const SRC_DIR = path.resolve(process.cwd(), 'src');
const PACKAGE_JSON_PATH = path.resolve(process.cwd(), 'dist/package.json');

// Utility to check if a file exists
const fileExists = (filePath) => fs.existsSync(filePath);

// Function to update package.json with exports
function updatePackageJsonWithExports() {
    // Load the existing package.json
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));

    // Ensure exports field exists
    if (!packageJson.exports) {
        packageJson.exports = {
            "./*": {
                "types": "./types/*.d.ts",
                "import": "./esm/*.js",
                "require": "./cjs/*.js",
                "default": "./esm/*.js"
            }
        };
    }

    const processDirectory = (currentPath, parentFolder) => {
        // console.log('Scanning folder:', currentPath);
        const folders = fs.readdirSync(currentPath, { withFileTypes: true });
        folders.forEach((folder) => {
            if (!folder.isDirectory()) {
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
                packageJson.exports[`./${relativePath}`] = {
                    "types": `./types/${relativePath}/index.d.ts`,
                    "import": `./esm/${relativePath}/index.js`,
                    "require": `./cjs/${relativePath}/index.js`,
                    "default": `./cjs/${relativePath}/index.js`,
                };
            } else {
                // console.log('--- No index.ts/.js found in', currentPath, '=>', relativePath);
            }

            processDirectory(folderPath, relativePath);
        });
    };

    // Read the src directory
    processDirectory(SRC_DIR, '');

    // Write the updated package.json back to the file
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log('package.json updated successfully with exports.');

    // additionally, write package.json files to each subfolder with corresponding type
    fs.writeFileSync(path.resolve(process.cwd(), 'dist/cjs/package.json'), JSON.stringify({ "type": "commonjs" }, null, 2), 'utf8');
    fs.writeFileSync(path.resolve(process.cwd(), 'dist/esm/package.json'), JSON.stringify({ "type": "module" }, null, 2), 'utf8');
}

// Run the update function
updatePackageJsonWithExports();
