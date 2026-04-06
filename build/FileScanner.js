const fs = require('fs');
const path = require('path');

/**
 * FileScanner - Discovers and categorizes markdown files from the workspace
 * 
 * Scans the workspace directory structure and categorizes markdown files into:
 * - sailpoint: Files from sailpoint/ folder
 * - architect: Files from detailed_architect_level/ folder (sorted numerically)
 * - other: Root-level markdown files (sorted alphabetically)
 */
class FileScanner {
  /**
   * Scans workspace and returns categorized file paths
   * @param {string} workspaceRoot - Root directory path
   * @returns {Object} Categorized file paths
   */
  scanWorkspace(workspaceRoot) {
    const sailpointDir = path.join(workspaceRoot, 'sailpoint');
    const architectDir = path.join(workspaceRoot, 'detailed_architect_level');
    
    // Scan each category
    const sailpointFiles = this._scanDirectory(sailpointDir, workspaceRoot);
    const architectFiles = this._scanDirectory(architectDir, workspaceRoot);
    const otherFiles = this._scanRootDirectory(workspaceRoot, [sailpointDir, architectDir]);
    
    // Sort architect files numerically by prefix (01, 02, 03...)
    const sortedArchitectFiles = this._sortArchitectFiles(architectFiles);
    
    // Sort other files alphabetically
    const sortedOtherFiles = this._sortAlphabetically(otherFiles);
    
    return {
      sailpoint: sailpointFiles,
      architect: sortedArchitectFiles,
      other: sortedOtherFiles
    };
  }
  
  /**
   * Scans a directory for markdown files
   * @param {string} dirPath - Directory to scan
   * @param {string} workspaceRoot - Workspace root for relative paths
   * @returns {string[]} Array of relative file paths
   * @private
   */
  _scanDirectory(dirPath, workspaceRoot) {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const mdFiles = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
        .map(entry => path.relative(workspaceRoot, path.join(dirPath, entry.name)));
      
      return mdFiles;
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dirPath}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Scans root directory for markdown files, excluding specified directories
   * @param {string} workspaceRoot - Root directory to scan
   * @param {string[]} excludeDirs - Directories to exclude
   * @returns {string[]} Array of relative file paths
   * @private
   */
  _scanRootDirectory(workspaceRoot, excludeDirs) {
    try {
      const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });
      const mdFiles = entries
        .filter(entry => {
          if (!entry.isFile() || !entry.name.endsWith('.md')) {
            return false;
          }
          
          // Exclude files from sailpoint and architect directories
          const fullPath = path.join(workspaceRoot, entry.name);
          return !excludeDirs.some(excludeDir => fullPath.startsWith(excludeDir));
        })
        .map(entry => entry.name);
      
      return mdFiles;
    } catch (error) {
      console.warn(`Warning: Could not read root directory ${workspaceRoot}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Sorts architect files numerically by prefix (01, 02, 03...)
   * @param {string[]} files - Array of file paths
   * @returns {string[]} Sorted array
   * @private
   */
  _sortArchitectFiles(files) {
    return files.sort((a, b) => {
      // Extract filename from path
      const filenameA = path.basename(a);
      const filenameB = path.basename(b);
      
      // Extract numerical prefix (e.g., "01" from "01_FILENAME.md")
      const prefixA = filenameA.match(/^(\d+)/);
      const prefixB = filenameB.match(/^(\d+)/);
      
      // If both have numerical prefixes, sort numerically
      if (prefixA && prefixB) {
        return parseInt(prefixA[1], 10) - parseInt(prefixB[1], 10);
      }
      
      // Fallback to alphabetical sorting
      return filenameA.localeCompare(filenameB);
    });
  }
  
  /**
   * Sorts files alphabetically by filename
   * @param {string[]} files - Array of file paths
   * @returns {string[]} Sorted array
   * @private
   */
  _sortAlphabetically(files) {
    return files.sort((a, b) => {
      const filenameA = path.basename(a);
      const filenameB = path.basename(b);
      return filenameA.localeCompare(filenameB);
    });
  }
}

module.exports = FileScanner;
