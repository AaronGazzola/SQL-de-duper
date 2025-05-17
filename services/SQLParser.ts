// services/SQLParser.ts
import { ParsedFile, Statement } from "@/types/app.types";
import { createId } from "@paralleldrive/cuid2";

export class SQLParser {
  // Parse SQL content and identify statements based on regex patterns
  public parse(
    sqlContent: string,
    filename: string,
    patterns: RegExp[]
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

    // Initialize an array to track which lines are parsed
    const parsedLineIndices = new Set<number>();

    // Track which patterns were used
    const usedPatterns: Record<string, string[]> = {};

    // Initialize the unparsed SQL content
    let unparsedSQL = sqlContent;

    // Only process patterns if there are any provided
    if (patterns && patterns.length > 0) {
      // Process each pattern
      patterns.forEach((pattern) => {
        // Create a new regex with the global flag to find all matches
        const regex = new RegExp(
          pattern.source,
          pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"
        );

        const patternType = this.getStatementTypeFromPattern(pattern);

        // Find all matches in the unparsed SQL
        let match;
        const matches: { index: number; match: string; groups: string[] }[] =
          [];

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

            // Mark the matching lines as parsed
            const contentLines = content.split("\n");
            const startLine =
              unparsedSQL.substring(0, matchInfo.index).split("\n").length - 1;

            for (let i = 0; i < contentLines.length; i++) {
              parsedLineIndices.add(startLine + i);
            }

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
            const patternStr = pattern.toString();
            if (!usedPatterns[patternType].includes(patternStr)) {
              usedPatterns[patternType].push(patternStr);
            }

            // Remove the parsed content from unparsedSQL
            unparsedSQL =
              unparsedSQL.substring(0, matchInfo.index) +
              unparsedSQL.substring(matchInfo.index + matchInfo.match.length);
          });
      });

      // Look for block comments in the remaining unparsed SQL,
      // but ONLY if patterns exist and include block comment patterns
      const hasBlockCommentPattern = patterns.some(
        (pattern) =>
          pattern.toString().includes("/\\*") ||
          pattern.toString().includes("\\/\\*")
      );

      if (hasBlockCommentPattern) {
        const commentMatches = Array.from(
          unparsedSQL.matchAll(/\/\*[\s\S]*?\*\//g)
        );

        if (commentMatches.length > 0) {
          // Sort matches in reverse order to avoid index shifting
          commentMatches
            .sort((a, b) => (b.index || 0) - (a.index || 0))
            .forEach((match) => {
              if (match.index === undefined) return;

              const content = match[0];

              // Mark comment lines as parsed
              const startLine =
                unparsedSQL.substring(0, match.index).split("\n").length - 1;
              const commentLines = content.split("\n");

              for (let i = 0; i < commentLines.length; i++) {
                parsedLineIndices.add(startLine + i);
              }

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
      }

      // Only match single-line comments if there are patterns that specifically include them
      const hasSingleLineCommentPattern = patterns.some((pattern) =>
        pattern.toString().includes("--")
      );

      if (hasSingleLineCommentPattern) {
        // Look for single-line comments in the remaining unparsed SQL
        const lineCommentMatches = Array.from(
          unparsedSQL.matchAll(/--.*(?:\r\n|\r|\n|$)/g)
        );

        if (lineCommentMatches.length > 0) {
          // Sort matches in reverse order to avoid index shifting
          lineCommentMatches
            .sort((a, b) => (b.index || 0) - (a.index || 0))
            .forEach((match) => {
              if (match.index === undefined) return;

              const content = match[0];

              // Mark comment lines as parsed
              const startLine =
                unparsedSQL.substring(0, match.index).split("\n").length - 1;
              const commentLines = content.split("\n");

              for (let i = 0; i < commentLines.length; i++) {
                parsedLineIndices.add(startLine + i);
              }

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
      }
    }

    // Update the stats
    parsedFile.stats = {
      total: totalLines,
      parsed: parsedLineIndices.size,
      percentage: Math.round((parsedLineIndices.size / totalLines) * 100) || 0,
    };

    return {
      parsedFile,
      unparsedSQL: unparsedSQL.trim(),
      usedPatterns,
    };
  }

  // Determine the statement type from the pattern
  private getStatementTypeFromPattern(pattern: RegExp): string {
    const regexStr = pattern.toString().toLowerCase();

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
    if (regexStr.includes("enable\\s+row")) return "SECURITY";
    if (regexStr.includes("disable\\s+row")) return "SECURITY";
    if (regexStr.includes("revoke\\s+")) return "REVOKE";
    if (regexStr.includes("drop\\s+view")) return "DROP_VIEW";
    if (regexStr.includes("drop\\s+function")) return "DROP_FUNCTION";
    if (regexStr.includes("drop\\s+policy")) return "DROP_POLICY";
    if (regexStr.includes("drop\\s+trigger")) return "DROP_TRIGGER";
    if (regexStr.includes("drop\\s+type")) return "DROP_TYPE";
    if (regexStr.includes("create\\s+type")) return "CREATE_TYPE";
    if (regexStr.includes("alter\\s+type")) return "ALTER_TYPE";
    if (regexStr.includes("create\\s+extension")) return "CREATE_EXTENSION";
    if (regexStr.includes("comment\\s+on")) return "COMMENT";
    if (regexStr.includes("set\\s+")) return "SET";
    if (regexStr.includes("select\\s+")) return "SELECT";
    if (regexStr.includes("--")) return "COMMENT";
    if (regexStr.includes("/\\*")) return "COMMENT";

    // Default if no specific type is matched
    return "UNKNOWN";
  }
}
