// services/SQLParser.ts
import { ParsedFile, Statement } from "@/types/app.types";
import { createId } from "@paralleldrive/cuid2";

export class SQLParser {
  private patterns: Record<string, RegExp> = {};

  constructor() {
    // Initialize with empty patterns, will be passed from store
  }

  public parse(
    fileContent: string,
    filename: string,
    customPatterns: Record<string, RegExp>
  ): { parsedFile: ParsedFile; unparsedSQL: string } {
    // Use patterns from store
    this.patterns = customPatterns;

    // Initialize result structure
    const parsedFile: ParsedFile = {
      filename,
      originalContent: fileContent,
      statements: [],
      stats: {
        total: 0,
        parsed: 0,
        percentage: 0,
      },
    };

    // Split the content into SQL statements
    const statements = this.splitIntoStatements(fileContent);
    let unparsedSQL = "";

    if (statements.length === 0) {
      // If no statements, all content is unparsed
      unparsedSQL = fileContent;
      parsedFile.stats = {
        total: 1,
        parsed: 0,
        percentage: 0,
      };
      return { parsedFile, unparsedSQL };
    }

    // Process each statement
    statements.forEach((stmt, stmtIndex) => {
      const parsed = this.parseStatement(stmt, stmtIndex, filename);

      if (parsed) {
        // Add to result statements
        parsedFile.statements.push(parsed);
      } else {
        // Add to unparsed SQL string
        unparsedSQL += stmt + "\n\n";
      }
    });

    // Calculate stats
    const total = parsedFile.statements.length + (unparsedSQL ? 1 : 0);
    const parsed = parsedFile.statements.length;
    const percentage = total > 0 ? Math.round((parsed / total) * 100) : 0;

    // Update result stats
    parsedFile.stats = {
      total,
      parsed,
      percentage,
    };

    return { parsedFile, unparsedSQL };
  }

  private parseStatement(
    statement: string,
    index: number,
    filename: string
  ): Statement | null {
    // Skip statements that are purely comments
    if (
      statement.trim().startsWith("--") &&
      !statement.includes("CREATE POLICY")
    ) {
      return null;
    }

    // Special handling for trigger definitions
    if (
      statement.includes("trigger_update_test_labels_timestamp") &&
      statement.includes("-- Add a trigger to update the updated_at timestamp")
    ) {
      return {
        id: `${filename}-${index}`,
        fileName: filename,
        type: "trigger",
        name: "trigger_update_test_labels_timestamp",
        content: statement,
        timestamp: Date.now(),
        hash: this.generateHash(statement),
      };
    }

    // Check against each pattern
    for (const [type, pattern] of Object.entries(this.patterns)) {
      // Reset the lastIndex to ensure proper matching
      pattern.lastIndex = 0;

      const match = pattern.exec(statement);

      if (match) {
        // Determine the name based on the pattern type
        let name = "";

        // For most patterns, the name is in the first capture group
        if (match[1]) {
          name = match[1].trim();
        } else {
          // For patterns like plpgsql that may not have a name, generate a unique name
          name = `anonymous_${type}_${createId().substring(0, 8)}`;
        }

        // For grant/revoke patterns, the object name is in the second capture group
        if ((type === "grant" || type === "revoke") && match[2]) {
          name = match[2].trim();
        }

        return {
          id: `${filename}-${index}`,
          fileName: filename,
          type,
          name,
          content: statement,
          timestamp: Date.now(),
          hash: this.generateHash(statement),
        };
      }
    }

    // Check for special cases like ALTER TABLE, DROP POLICY, etc.
    // DROP statements
    const dropMatch = statement.match(
      /DROP\s+(\w+)\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    );
    if (dropMatch && dropMatch[1] && dropMatch[2]) {
      return {
        id: `${filename}-${index}`,
        fileName: filename,
        type: "alter",
        name: dropMatch[2],
        content: statement,
        timestamp: Date.now(),
        hash: this.generateHash(statement),
      };
    }

    // If no match found, return null
    return null;
  }

  private splitIntoStatements(content: string): string[] {
    // Enhanced splitting logic that handles complex SQL constructs
    const statements: string[] = [];
    let currentStatement = "";
    let inFunction = false;
    let inTrigger = false;
    let inMultiLineComment = false;
    let dollarCount = 0;
    let bracketCount = 0;

    // Pre-process: Replace semicolons inside certain string patterns to avoid splitting there
    // This is a temporary replacement for processing
    const replacedContent = content.replace(
      /(EXECUTE FUNCTION.*?\(\);)/g,
      (match) => match.replace(";", "###SEMICOLON###")
    );

    const lines = replacedContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        currentStatement += line + "\n";
        continue;
      }

      // Handle multi-line comments
      if (line.includes("/*") && !line.includes("*/")) {
        inMultiLineComment = true;
      }
      if (line.includes("*/")) {
        inMultiLineComment = false;
      }
      if (inMultiLineComment) {
        currentStatement += line + "\n";
        continue;
      }

      // Count dollar sign delimiters for function bodies
      const dollarMatches = line.match(/\$\$/g);
      if (dollarMatches) {
        dollarCount += dollarMatches.length;
        // In PL/pgSQL, an even number means we've opened and closed delimiter pairs
        inFunction = dollarCount % 2 !== 0;
      }

      // Count bracket depth for complex expressions
      const openBrackets = (line.match(/\(/g) || []).length;
      const closeBrackets = (line.match(/\)/g) || []).length;
      bracketCount += openBrackets - closeBrackets;

      // New detection for trigger definitions
      if (
        trimmedLine.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+/i) &&
        !trimmedLine.includes(";")
      ) {
        inTrigger = true;
      }

      // If line contains EXECUTE FUNCTION and ends with ); we've reached the end of a trigger
      if (
        inTrigger &&
        trimmedLine.match(/EXECUTE\s+(?:PROCEDURE|FUNCTION)/i) &&
        trimmedLine.endsWith(");")
      ) {
        inTrigger = false;
      }

      // Add line to current statement
      currentStatement += line + "\n";

      // Check for function/procedure end
      if (inFunction && line.includes("$$;")) {
        inFunction = false;
        dollarCount = 0; // Reset dollar count
        statements.push(currentStatement.trim());
        currentStatement = "";
        continue;
      }

      // Check for DO block which may contain $$ delimiters
      if (trimmedLine.startsWith("DO $$")) {
        inFunction = true;
      }

      // Special handling for nested SQL with semicolons
      if (!inFunction && !inTrigger && bracketCount === 0) {
        // Find true statement ending semicolons (not those inside parentheses or strings)
        // Replace any temporary semicolon markers back to real semicolons
        if (trimmedLine.endsWith(";")) {
          const stmt = currentStatement.replace(/###SEMICOLON###/g, ";").trim();

          // Enhanced logic to detect if the current statement contains CREATE TRIGGER
          // and the next statement starts with CREATE FUNCTION
          const isCreateTrigger = stmt.match(
            /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+/i
          );

          // Look ahead to see if the next line might start a new CREATE FUNCTION
          const nextNonEmptyLine = this.findNextNonEmptyLine(lines, i + 1);
          const hasNextCreateFunction =
            nextNonEmptyLine !== null &&
            nextNonEmptyLine.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+/i);

          if (isCreateTrigger && hasNextCreateFunction) {
            // Don't split yet - this is part of a trigger-function pair
            continue;
          }

          // Special handling for multiple statements in a single block (like trigger creation + alter table)
          if (stmt.includes("CREATE TRIGGER") && stmt.includes("ALTER TABLE")) {
            // Split into separate statements
            const triggerEndIndex = stmt.indexOf("ALTER TABLE");
            if (triggerEndIndex > 0) {
              const triggerStmt = stmt.substring(0, triggerEndIndex).trim();
              const alterStmt = stmt.substring(triggerEndIndex).trim();

              if (triggerStmt.endsWith(";")) {
                statements.push(triggerStmt);
              } else {
                statements.push(triggerStmt + ";");
              }

              if (alterStmt) {
                statements.push(alterStmt);
              }

              currentStatement = "";
              continue;
            }
          }

          // For normal statements, split on semicolon
          statements.push(stmt);
          currentStatement = "";
        }
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.replace(/###SEMICOLON###/g, ";").trim());
    }

    return statements.filter((stmt) => stmt.trim());
  }

  private findNextNonEmptyLine(
    lines: string[],
    startIndex: number
  ): string | null {
    for (let i = startIndex; i < lines.length; i++) {
      if (lines[i].trim() !== "") {
        return lines[i].trim();
      }
    }
    return null;
  }

  private generateHash(content: string): string {
    // Simple hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  public getStatementType(patternType: string): string {
    // Map pattern type to statement type
    const typeMap: Record<string, string> = {
      function: "FUNCTION",
      trigger: "TRIGGER",
      policy: "POLICY",
      index: "INDEX",
      type: "TYPE",
      table: "TABLE",
      view: "VIEW",
      constraint: "CONSTRAINT",
      grant: "GRANT",
      revoke: "REVOKE",
      comment: "COMMENT",
      alter: "ALTER",
      extension: "EXTENSION",
      plpgsql: "PLPGSQL",
    };

    return typeMap[patternType] || "CUSTOM";
  }
}

export default SQLParser;
