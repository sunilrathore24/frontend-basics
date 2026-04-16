const fs = require('fs');
const path = require('path');

/**
 * FileScanner - Discovers and categorizes markdown files from content/ directories
 *
 * content/sailpoint/   → sailpoint tab
 * content/architect/   → architect tab
 * content/frontend/    → other frontend tab
 */
class FileScanner {
  scanWorkspace(workspaceRoot) {
    const sailpointDir    = path.join(workspaceRoot, 'content', 'sailpoint');
    const architectDir    = path.join(workspaceRoot, 'content', 'architect');
    const frontendDir     = path.join(workspaceRoot, 'content', 'frontend');
    const systemDesignDir = path.join(workspaceRoot, 'content', 'system-design');
    const feroDir         = path.join(workspaceRoot, 'content', 'fero');

    return {
      sailpoint:    this._scan(sailpointDir, workspaceRoot),
      architect:    this._sortNumerically(this._scan(architectDir, workspaceRoot)),
      other:        this._sortAlphabetically(this._scan(frontendDir, workspaceRoot)),
      systemdesign: this._sortNumerically(this._scan(systemDesignDir, workspaceRoot)),
      fero:         this._sortAlphabetically(this._scan(feroDir, workspaceRoot)),
    };
  }

  _scan(dirPath, workspaceRoot) {
    if (!fs.existsSync(dirPath)) {
      console.warn(`Warning: directory not found: ${dirPath}`);
      return [];
    }
    try {
      return fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(e => e.isFile() && e.name.endsWith('.md'))
        .map(e => path.relative(workspaceRoot, path.join(dirPath, e.name)));
    } catch (err) {
      console.warn(`Warning: could not read ${dirPath}: ${err.message}`);
      return [];
    }
  }

  _sortNumerically(files) {
    return files.sort((a, b) => {
      const na = parseInt((path.basename(a).match(/^(\d+)/) || [0, 0])[1], 10);
      const nb = parseInt((path.basename(b).match(/^(\d+)/) || [0, 0])[1], 10);
      return na - nb || path.basename(a).localeCompare(path.basename(b));
    });
  }

  _sortAlphabetically(files) {
    return files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
  }
}

module.exports = FileScanner;
