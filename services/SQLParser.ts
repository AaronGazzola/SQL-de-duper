// Do not delete this comment: Filename: @/services/SQLParser.ts
import { ParsedFile, Statement, UnparsedSection } from "@/types/app.types";

export class SQLParser {
  private patterns: Record<string, RegExp> = {};

  constructor() {
    this.loadCustomPatterns();
    this.initDefaultPatterns();
  }

  private loadCustomPatterns(): void {
    try {
      const storedPatterns = localStorage.getItem("sqlPatterns");
      if (storedPatterns) {
        const patterns = JSON.parse(storedPatterns);

        // Convert stored string patterns to RegExp objects
        Object.entries(patterns).forEach(([key, pattern]) => {
          this.patterns[key] = new RegExp(pattern as string, "gi");
        });
      }
    } catch (error) {
      console.error("Failed to load custom patterns:", error);
    }
  }

  private initDefaultPatterns(): void {
    // Default patterns for common SQL statements
    this.patterns = {
      ...this.patterns,
      createTable: /CREATE\s+TABLE\s+(?:\w+\.)?(\w+)\s*\([\s\S]*?\);/gi,
      alterTable:
        /ALTER\s+TABLE\s+(?:\w+\.)?(\w+)\s+(?:ADD|DROP|MODIFY|ALTER|CHANGE)[\s\S]*?;/gi,
      createIndex:
        /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(?:\w+\.)?(\w+)[\s\S]*?;/gi,
      dropTable: /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:\w+\.)?(\w+);/gi,
      insertInto: /INSERT\s+INTO\s+(?:\w+\.)?(\w+)[\s\S]*?;/gi,
      update: /UPDATE\s+(?:\w+\.)?(\w+)\s+SET[\s\S]*?;/gi,
      delete: /DELETE\s+FROM\s+(?:\w+\.)?(\w+)[\s\S]*?;/gi,
    };
  }

  public parse(fileContent: string, filename: string): ParsedFile {
    // Initialize result structure
    const result: ParsedFile = {
      filename,
      originalContent: fileContent,
      statements: [],
      unparsedSections: [],
      stats: {
        total: 0,
        parsed: 0,
        percentage: 0,
      },
    };

    // Find all statements using patterns
    const allMatches: {
      type: string;
      name: string;
      content: string;
      index: number;
    }[] = [];

    // Try to match each pattern
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      // Reset lastIndex to ensure we start from the beginning
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(fileContent)) !== null) {
        const content = match[0];
        const name = match[1] || `unknown_${Date.now()}`;

        allMatches.push({
          type,
          name,
          content,
          index: match.index,
        });
      }
    });

    // Sort matches by their position in the file
    allMatches.sort((a, b) => a.index - b.index);

    // Create statements from matches
    const statements: Statement[] = allMatches.map((match, index) => ({
      id: `${filename}-${index}`,
      fileName: filename,
      type: this.getStatementType(match.type),
      name: match.name,
      content: match.content,
      timestamp: Date.now(),
      hash: this.generateHash(match.content),
    }));

    // Identify unparsed sections
    let lastMatchEnd = 0;
    const unparsedSections: UnparsedSection[] = [];

    for (const match of allMatches) {
      // If there's content between the end of the last match and the start of this one
      if (match.index > lastMatchEnd) {
        const unparsedContent = fileContent
          .substring(lastMatchEnd, match.index)
          .trim();

        // Only add if there's actual content (not just whitespace)
        if (unparsedContent) {
          unparsedSections.push({
            id: `${filename}-unparsed-${unparsedSections.length}`,
            content: unparsedContent,
            startIndex: lastMatchEnd,
            endIndex: match.index,
            parsed: false,
            fileName: filename,
          });
        }
      }

      lastMatchEnd = match.index + match.content.length;
    }

    // Check if there's unparsed content after the last match
    if (lastMatchEnd < fileContent.length) {
      const unparsedContent = fileContent.substring(lastMatchEnd).trim();

      if (unparsedContent) {
        unparsedSections.push({
          id: `${filename}-unparsed-${unparsedSections.length}`,
          content: unparsedContent,
          startIndex: lastMatchEnd,
          endIndex: fileContent.length,
          parsed: false,
          fileName: filename,
        });
      }
    }

    // Calculate stats
    const total = statements.length + unparsedSections.length;
    const parsed = statements.length;
    const percentage = total > 0 ? Math.round((parsed / total) * 100) : 0;

    // Update result
    result.statements = statements;
    result.unparsedSections = unparsedSections;
    result.stats = {
      total,
      parsed,
      percentage,
    };

    return result;
  }

  private getStatementType(patternType: string): string {
    // Map pattern type to statement type
    const typeMap: Record<string, string> = {
      createTable: "CREATE_TABLE",
      alterTable: "ALTER_TABLE",
      createIndex: "CREATE_INDEX",
      dropTable: "DROP_TABLE",
      insertInto: "INSERT",
      update: "UPDATE",
      delete: "DELETE",
    };

    return typeMap[patternType] || "CUSTOM";
  }

  private generateHash(content: string): string {
    // Simple hash function for demo purposes
    // In a real implementation, use a proper hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  public generateRegexFromSample(
    sql: string,
    type: string,
    name: string
  ): string {
    // This is a simplified version for demo purposes
    // In a real implementation, this would be more sophisticated

    // Escape special regex characters
    const escapedSql = sql.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

    // Replace literals that might vary with wildcards
    const patternString = escapedSql
      .replace(/\b\d+\b/g, "\\d+") // Replace numbers with \d+
      .replace(/\b(['"]).*?\1\b/g, "['\"].*?['\"]") // Replace quoted strings
      .replace(/\b\w+\b/g, (match) => {
        // Don't replace SQL keywords or the table/index name
        const sqlKeywords = [
          "CREATE",
          "TABLE",
          "ALTER",
          "INDEX",
          "DROP",
          "INSERT",
          "UPDATE",
          "DELETE",
        ];
        if (sqlKeywords.includes(match.toUpperCase()) || match === name) {
          return match;
        }
        return "\\w+";
      });

    return patternString;
  }
}

export default SQLParser;
