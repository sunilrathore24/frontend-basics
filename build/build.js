#!/usr/bin/env node

/**
 * Main Build Script - Markdown Static Website Generator
 * 
 * Orchestrates the complete build process:
 * 1. Scans workspace for markdown files
 * 2. Processes all markdown files to HTML
 * 3. Bundles content into JavaScript data structure
 * 4. Generates static HTML/CSS/JS output
 */

const FileScanner = require('./FileScanner');
const MarkdownProcessor = require('./MarkdownProcessor');
const ContentBundler = require('./ContentBundler');
const StaticAssetGenerator = require('./StaticAssetGenerator');
const path = require('path');

/**
 * Main build function
 */
async function build() {
  try {
    console.log('🚀 Starting build process...\n');
    
    // Get workspace root (parent directory of build/)
    const workspaceRoot = path.resolve(__dirname, '..');
    console.log(`📁 Workspace: ${workspaceRoot}\n`);
    
    // Step 1: Scan workspace for markdown files
    console.log('📂 Scanning workspace for markdown files...');
    const scanner = new FileScanner();
    const files = scanner.scanWorkspace(workspaceRoot);
    
    console.log(`   ✓ Found ${files.sailpoint.length} Sailpoint files`);
    console.log(`   ✓ Found ${files.architect.length} Architect files`);
    console.log(`   ✓ Found ${files.other.length} Other files`);
    console.log(`   ✓ Found ${files.systemdesign.length} System Design files`);
    console.log(`   ✓ Found ${files.fero.length} Fero files`);
    console.log(`   Total: ${files.sailpoint.length + files.architect.length + files.other.length + files.systemdesign.length + files.fero.length} markdown files\n`);
    
    // Step 2: Process all markdown files
    console.log('📝 Processing markdown files to HTML...');
    const processor = new MarkdownProcessor();
    
    const documents = {
      sailpoint: [],
      architect: [],
      other: [],
      systemdesign: [],
      fero: []
    };
    
    // Process sailpoint files
    let processedCount = 0;
    for (const filePath of files.sailpoint) {
      try {
        const fullPath = path.join(workspaceRoot, filePath);
        const doc = processor.processFile(fullPath, 'sailpoint');
        documents.sailpoint.push(doc);
        processedCount++;
      } catch (error) {
        console.error(`   ✗ Error processing ${filePath}: ${error.message}`);
      }
    }
    
    // Process architect files
    for (const filePath of files.architect) {
      try {
        const fullPath = path.join(workspaceRoot, filePath);
        const doc = processor.processFile(fullPath, 'architect');
        documents.architect.push(doc);
        processedCount++;
      } catch (error) {
        console.error(`   ✗ Error processing ${filePath}: ${error.message}`);
      }
    }
    
    // Process other files
    for (const filePath of files.other) {
      try {
        const fullPath = path.join(workspaceRoot, filePath);
        const doc = processor.processFile(fullPath, 'other');
        documents.other.push(doc);
        processedCount++;
      } catch (error) {
        console.error(`   ✗ Error processing ${filePath}: ${error.message}`);
      }
    }
    
    // Process system design files
    for (const filePath of files.systemdesign) {
      try {
        const fullPath = path.join(workspaceRoot, filePath);
        const doc = processor.processFile(fullPath, 'systemdesign');
        documents.systemdesign.push(doc);
        processedCount++;
      } catch (error) {
        console.error(`   ✗ Error processing ${filePath}: ${error.message}`);
      }
    }
    
    // Process fero files
    for (const filePath of files.fero) {
      try {
        const fullPath = path.join(workspaceRoot, filePath);
        const doc = processor.processFile(fullPath, 'fero');
        documents.fero.push(doc);
        processedCount++;
      } catch (error) {
        console.error(`   ✗ Error processing ${filePath}: ${error.message}`);
      }
    }
    
    console.log(`   ✓ Successfully processed ${processedCount} files\n`);
    
    // Step 3: Bundle content into JavaScript
    console.log('📦 Bundling content...');
    const bundler = new ContentBundler();
    const contentJS = bundler.bundle(documents);
    console.log(`   ✓ Content bundled (${Math.round(contentJS.length / 1024)} KB)\n`);
    
    // Step 4: Generate static assets
    console.log('🎨 Generating static website...');
    const outputDir = path.join(workspaceRoot, 'dist');
    const generator = new StaticAssetGenerator();
    generator.generate(contentJS, outputDir);
    console.log('');
    
    // Build summary
    console.log('✅ Build completed successfully!\n');
    console.log('📊 Build Summary:');
    console.log(`   - Sailpoint documents: ${documents.sailpoint.length}`);
    console.log(`   - Architect documents: ${documents.architect.length}`);
    console.log(`   - Other documents: ${documents.other.length}`);
    console.log(`   - System Design documents: ${documents.systemdesign.length}`);
    console.log(`   - Fero documents: ${documents.fero.length}`);
    console.log(`   - Total documents: ${processedCount}`);
    console.log(`   - Output directory: ${outputDir}\n`);
    console.log('🌐 To view the website, open dist/index.html in a browser');
    
  } catch (error) {
    console.error('\n❌ Build failed with error:');
    console.error(`   ${error.message}`);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run build process
build();
