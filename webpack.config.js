/**
 * kinetichub - Modular Webpack Configuration (Enterprise Standard)
 * Standard 2026: Splits chunks for caching, publicPath resolution.
 */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const fs = require('fs');

// Detect FREE build from environment variable set by Node.js script
const isFreeBuild = process.env.FREE_BUILD === 'true';

const blocksDir = path.resolve(process.cwd(), 'src/blocks');
const blockFolders = fs.readdirSync(blocksDir).filter((name) => {
    return fs.lstatSync(path.join(blocksDir, name)).isDirectory();
});

const entries = {
    'admin': path.resolve(process.cwd(), 'src/admin', 'index.js'),
    'core': path.resolve(process.cwd(), 'src/core', 'index.js'),
};

blockFolders.forEach((folder) => {
    const blockPath = path.join(blocksDir, folder);
    const indexJs = path.join(blockPath, 'index.js');
    const viewJs = path.join(blockPath, 'view.js');

    if (fs.existsSync(indexJs)) {
        entries[`blocks/${folder}/index`] = indexJs;
    }
    if (fs.existsSync(viewJs)) {
        entries[`blocks/${folder}/view`] = viewJs;
    }
});

module.exports = {
    ...defaultConfig,
    entry: entries,
    // Disable Source Maps for FREE build to protect intellectual property
    devtool: isFreeBuild ? false : defaultConfig.devtool,
    output: {
        ...defaultConfig.output,
        path: path.resolve(process.cwd(), 'build'),
        // Ensures dynamic imports and caching paths are resolved safely
        publicPath: 'auto', 
    },
    // Vendor chunk extraction to drastically reduce bundle size and leverage browser cache
    optimization: {
        ...defaultConfig.optimization,
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
};