// client/patch.js
const fs = require('fs');
const path = require('path');

const codegenPath = path.join(__dirname, 'node_modules', 'ajv', 'dist', 'compile', 'codegen');
const filePath = path.join(codegenPath, 'index.js');

// Check if the directory and file already exist to avoid errors on re-install
if (!fs.existsSync(filePath)) {
    console.log("Patching 'ajv' for compatibility...");
    try {
        // Create the directory path recursively
        fs.mkdirSync(codegenPath, { recursive: true });
        // Create an empty file
        fs.writeFileSync(filePath, '');
        console.log("Successfully created 'ajv/dist/compile/codegen/index.js'.");
    } catch (error) {
        console.error("Failed to apply 'ajv' patch:", error);
    }
} else {
    console.log("'ajv/dist/compile/codegen/index.js' already exists. Patch not needed.");
}