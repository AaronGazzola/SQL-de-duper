// services/SQLParser.ts
import { ParsedFile, SQLPattern, Statement } from "@/types/app.types";
import { createId } from "@paralleldrive/cuid2";

export class SQLParser {
  // Parse SQL content and identify statements based on regex patterns
  public parse(
    sqlContent: string,
    filename: string,
    patterns: SQLPattern[]
  ): {
    parsedFile: ParsedFile;
    unparsedSQL: string;
    usedPatterns: Record<string, string[]>;
  } {
    // Initialize the parsed file structure
    const parsedFile: ParsedFile = {
      filename,
      originalContent: sqlContent,
      statements: [],
      stats: {
        total: 0,
        parsed: 0,
        percentage: 0,
      },
    };

    // Split content into lines for counting
    const lines = sqlContent.split("\n");
    const totalLines = lines.length;

    // Track which patterns were used
    const usedPatterns: Record<string, string[]> = {};

    // Initialize the unparsed SQL content
    let unparsedSQL = sqlContent;
    let parsedLines = 0;

    // Process each pattern
    patterns.forEach((pattern) => {
      // Skip patterns that don't have a valid regex
      if (!pattern.regex) return;

      const patternType = this.getStatementTypeFromPattern(pattern);

      // Create a new regex with the global flag to find all matches
      const regex = new RegExp(
        pattern.regex.source,
        pattern.regex.flags.includes("g")
          ? pattern.regex.flags
          : pattern.regex.flags + "g"
      );

      // Find all matches in the unparsed SQL
      let match;
      const matches: { index: number; match: string; groups: string[] }[] = [];

      while ((match = regex.exec(unparsedSQL)) !== null) {
        // Avoid infinite loops with zero-width matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
          continue;
        }

        // Store the match details
        matches.push({
          index: match.index,
          match: match[0],
          groups: Array.from(match).slice(1),
        });
      }

      // Process matches in reverse order to avoid index shifting
      matches
        .sort((a, b) => b.index - a.index)
        .forEach((matchInfo) => {
          // Extract statement details
          const content = matchInfo.match;
          const name = matchInfo.groups[0] || "unnamed";

          // Count the number of lines in this statement
          const statementLines = content.split("\n").length;
          parsedLines += statementLines;

          // Create a unique ID for the statement
          const id = createId();

          // Extract timestamp from filename if possible
          // Filename format: "20250509033159_add_contracts_to_get_app_data.sql"
          const timestampMatch = filename.match(/^(\d{14})_/);
          const timestamp = timestampMatch
            ? new Date(
                parseInt(timestampMatch[1].substring(0, 4)),
                parseInt(timestampMatch[1].substring(4, 6)) - 1,
                parseInt(timestampMatch[1].substring(6, 8)),
                parseInt(timestampMatch[1].substring(8, 10)),
                parseInt(timestampMatch[1].substring(10, 12)),
                parseInt(timestampMatch[1].substring(12, 14))
              ).getTime()
            : Date.now();

          // Create the statement object
          const statement: Statement = {
            id,
            fileName: filename,
            type: patternType,
            name,
            content,
            timestamp,
          };

          // Add the statement to the parsed file
          parsedFile.statements.push(statement);

          // Track which patterns were used for this type
          if (!usedPatterns[patternType]) {
            usedPatterns[patternType] = [];
          }

          // Add the pattern string if not already tracked
          const patternStr = pattern.regex.toString();
          if (!usedPatterns[patternType].includes(patternStr)) {
            usedPatterns[patternType].push(patternStr);
          }

          // Remove the parsed content from unparsedSQL
          unparsedSQL =
            unparsedSQL.substring(0, matchInfo.index) +
            unparsedSQL.substring(matchInfo.index + matchInfo.match.length);
        });
    });

    // Look for comments in the remaining unparsed SQL
    const commentMatches = Array.from(
      unparsedSQL.matchAll(/\/\*[\s\S]*?\*\/|--.*(?:\r\n|\r|\n|$)/g)
    );

    if (commentMatches.length > 0) {
      // Sort matches in reverse order to avoid index shifting
      commentMatches
        .sort((a, b) => (b.index || 0) - (a.index || 0))
        .forEach((match) => {
          if (match.index === undefined) return;

          const content = match[0];
          const statementLines = content.split("\n").length;
          parsedLines += statementLines;

          // Create a unique ID for the comment
          const id = createId();

          // Create the statement object for the comment
          const statement: Statement = {
            id,
            fileName: filename,
            type: "COMMENT",
            name: "comment",
            content,
            timestamp: Date.now(),
          };

          // Add the comment statement to the parsed file
          parsedFile.statements.push(statement);

          // Remove the parsed comment from unparsedSQL
          unparsedSQL =
            unparsedSQL.substring(0, match.index) +
            unparsedSQL.substring(match.index + match[0].length);
        });
    }

    // Update the stats
    parsedFile.stats = {
      total: totalLines,
      parsed: parsedLines,
      percentage: Math.round((parsedLines / totalLines) * 100) || 0,
    };

    return {
      parsedFile,
      unparsedSQL: unparsedSQL.trim(),
      usedPatterns,
    };
  }

  // Determine the statement type from the pattern
  private getStatementTypeFromPattern(pattern: SQLPattern): string {
    const regexStr = pattern.regex.toString().toLowerCase();

    if (regexStr.includes("create\\s+table")) return "CREATE_TABLE";
    if (regexStr.includes("alter\\s+table")) return "ALTER_TABLE";
    if (regexStr.includes("create\\s+index")) return "CREATE_INDEX";
    if (regexStr.includes("drop\\s+table")) return "DROP_TABLE";
    if (regexStr.includes("insert\\s+into")) return "INSERT";
    if (regexStr.includes("update\\s+")) return "UPDATE";
    if (regexStr.includes("delete\\s+from")) return "DELETE";
    if (regexStr.includes("create\\s+function")) return "FUNCTION";
    if (regexStr.includes("create\\s+trigger")) return "TRIGGER";
    if (regexStr.includes("create\\s+view")) return "VIEW";
    if (regexStr.includes("grant\\s+")) return "GRANT";
    if (regexStr.includes("create\\s+policy")) return "POLICY";

    // If no specific type is matched, use the description if available
    if (pattern.description) {
      const desc = pattern.description.toUpperCase();
      if (desc.includes("TABLE")) return "TABLE";
      if (desc.includes("FUNCTION")) return "FUNCTION";
      if (desc.includes("TRIGGER")) return "TRIGGER";
      if (desc.includes("INDEX")) return "INDEX";
      if (desc.includes("VIEW")) return "VIEW";
      if (desc.includes("GRANT")) return "GRANT";
      if (desc.includes("POLICY")) return "POLICY";
    }

    // Default to CUSTOM if we can't determine a specific type
    return "CUSTOM";
  }
}
