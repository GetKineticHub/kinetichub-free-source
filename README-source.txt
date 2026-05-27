# KineticHub FREE Source

This directory contains the human-readable source files used to build the distributed JavaScript and CSS assets included with the WordPress.org free plugin package.

## Build steps

1. Open a terminal in this `source` directory.
2. Install dependencies:

   npm install

3. Build production assets:

   npm run build

The source files are located in `src/`. The build process uses `package.json`, `package-lock.json` when present, and `webpack.config.js`.

This source directory is included for WordPress.org review transparency and developer access to the human-readable source for the compiled assets in the plugin package.
