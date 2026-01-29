#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Find all TypeScript files in components directory
const componentsDir = path.join(__dirname, "packages", "web", "src", "components");

function findTsxFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    if (!fs.existsSync(currentDir)) {
      return;
    }

    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith(".tsx")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function fixErrorHandling(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    let modified = false;

    const fixedLines = lines.map((line, index) => {
      // Pattern 1: } catch {  (missing error parameter)
      if (line.includes("} catch {")) {
        modified = true;
        return line.replace(/} catch \s*{/, "} catch (error: unknown) {");
      }

      // Pattern 2: } catch (err) {  (err instead of error)
      if (/}\s+catch\s*\(\s*err\s*\)\s*{/.test(line)) {
        modified = true;
        return line.replace(/\berr\b/g, "error");
      }

      // Pattern 3: } catch (error) {  (missing type annotation)
      if (/}\s+catch\s*\(\s*error\s*\)\s*{/.test(line) && !line.includes("error: unknown")) {
        modified = true;
        return line.replace(/}\s+catch\s*\(\s*error\s*\)\s*{/, "} catch (error: unknown) {");
      }

      return line;
    });

    if (modified) {
      fs.writeFileSync(filePath, fixedLines.join("\n"));
      console.log(`✓ Fixed error handling in ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
  } catch (e) {
    console.error(`Error processing ${filePath}:`, e.message);
    return false;
  }
}

function main() {
  console.log("🔧 Fixing error handling patterns in components...\n");

  const tsxFiles = findTsxFiles(componentsDir);
  let fixedCount = 0;

  for (const file of tsxFiles) {
    if (fixErrorHandling(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✅ Completed! Fixed error handling in ${fixedCount} files.\n`);
  console.log("Patterns fixed:");
  console.log("  • } catch { → } catch (error: unknown) {");
  console.log("  • (err) → (error: unknown)");
  console.log("  • (error) → (error: unknown)");
}

if (require.main === module) {
  main();
}
