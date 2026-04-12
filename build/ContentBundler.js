/**
 * ContentBundler - Aggregates processed documents into JavaScript data structure
 * 
 * Takes all processed documents organized by category and generates a JavaScript
 * constant that can be embedded in the final HTML output. Handles special character
 * escaping to ensure the generated JavaScript is valid and safe.
 */
class ContentBundler {
  /**
   * Bundles all processed documents into JavaScript module
   * @param {Object} documents - Categorized documents
   * @param {Array} documents.sailpoint - Sailpoint category documents
   * @param {Array} documents.architect - Architect category documents
   * @param {Array} documents.other - Other category documents
   * @returns {string} JavaScript code defining SITE_CONTENT constant
   */
  bundle(documents) {
    // Validate input structure
    if (!documents || typeof documents !== 'object') {
      throw new Error('Documents must be an object with category arrays');
    }
    
    // Ensure all required categories exist
    const bundledData = {
      sailpoint: documents.sailpoint || [],
      architect: documents.architect || [],
      other: documents.other || [],
      systemdesign: documents.systemdesign || []
    };
    
    // Convert to JSON string with proper formatting
    const jsonString = JSON.stringify(bundledData, null, 2);
    
    // Generate JavaScript constant declaration
    const jsCode = `const SITE_CONTENT = ${jsonString};`;
    
    return jsCode;
  }
}

module.exports = ContentBundler;
