// services/SQLParser.ts
import { ParsedFile, Statement } from "@/types/app.types";
import { createId } from "@paralleldrive/cuid2";

export class SQLParser {
  private patterns: Record<string, RegExp[]> = {};

  constructor() {}

  public parse(
    fileContent: string,
    filename: string,
    customPatterns: Record<string, RegExp[]>
  ): { parsedFile: ParsedFile; unparsedSQL: string } {
    this.patterns = customPatterns;

    const allLines = fileContent.split("\n").filter((line) => line.trim());
    const totalLines = allLines.length;

    const parsedFile: ParsedFile = {
      filename,
      originalContent: fileContent,
      statements: [],
      stats: {
        total: totalLines,
        parsed: 0,
        percentage: 0,
      },
    };

    const timestampMatch = filename.match(/_(\d{14})_/);
    const fileTimestamp = timestampMatch
      ? this.parseTimestamp(timestampMatch[1])
      : Date.now();

    const statements = this.splitIntoStatements(fileContent);
    let unparsedSQL = "";

    if (statements.length === 0) {
      unparsedSQL = fileContent;
      parsedFile.stats = {
        total: totalLines,
        parsed: 0,
        percentage: 0,
      };
      return { parsedFile, unparsedSQL };
    }

    let parsedLines = 0;

    statements.forEach((stmt, stmtIndex) => {
      const parsed = this.parseStatement(
        stmt,
        stmtIndex,
        filename,
        fileTimestamp
      );

      if (parsed) {
        parsedFile.statements.push(parsed);
        parsedLines += stmt.split("\n").filter((line) => line.trim()).length;
      } else {
        unparsedSQL += stmt + "\n\n";
      }
    });

    const parsed = parsedLines;
    const total = totalLines;
    const percentage = total > 0 ? Math.round((parsed / total) * 100) : 0;

    parsedFile.stats = {
      total,
      parsed,
      percentage,
    };

    return { parsedFile, unparsedSQL };
  }

  private parseTimestamp(timestamp: string): number {
    try {
      const year = parseInt(timestamp.substring(0, 4));
      const month = parseInt(timestamp.substring(4, 6)) - 1;
      const day = parseInt(timestamp.substring(6, 8));
      const hour = parseInt(timestamp.substring(8, 10));
      const minute = parseInt(timestamp.substring(10, 12));
      const second = parseInt(timestamp.substring(12, 14));

      return new Date(year, month, day, hour, minute, second).getTime();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return Date.now();
    }
  }

  private parseStatement(
    statement: string,
    index: number,
    filename: string,
    timestamp: number
  ): Statement | null {
    if (
      statement.trim().startsWith("--") &&
      !statement.includes("CREATE POLICY")
    ) {
      return null;
    }

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
        timestamp: timestamp,
        hash: this.generateHash(statement),
      };
    }

    // First, check for RLS statements
    if (statement.includes("ROW LEVEL SECURITY")) {
      const rlsMatch = statement.match(
        /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+(?:ENABLE|DISABLE)\s+ROW\s+LEVEL\s+SECURITY/i
      );
      if (rlsMatch && rlsMatch[1]) {
        return {
          id: `${filename}-${index}`,
          fileName: filename,
          type: "alterRLSPolicy",
          name: rlsMatch[1],
          content: statement,
          timestamp: timestamp,
          hash: this.generateHash(statement),
        };
      }
    }

    // Check against each pattern type
    for (const [type, patternArray] of Object.entries(this.patterns)) {
      // Check each pattern for this type
      for (const pattern of patternArray) {
        pattern.lastIndex = 0;
        const match = pattern.exec(statement);

        if (match) {
          let name = "";

          if (match[1]) {
            name = match[1].trim();
          } else if (match[2]) {
            name = match[2].trim();
          } else {
            name = `anonymous_${type}_${createId().substring(0, 8)}`;
          }

          if ((type === "grant" || type === "revoke") && match[2]) {
            name = match[2].trim();
          }

          return {
            id: `${filename}-${index}`,
            fileName: filename,
            type,
            name,
            content: statement,
            timestamp: timestamp,
            hash: this.generateHash(statement),
          };
        }
      }
    }

    // Fall back to checking for specific statements types
    // DROP statements
    const dropMatch = statement.match(
      /DROP\s+(\w+)\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i
    );
    if (dropMatch && dropMatch[1] && dropMatch[2]) {
      const objectType = dropMatch[1].toLowerCase();
      const objectName = dropMatch[2];

      return {
        id: `${filename}-${index}`,
        fileName: filename,
        type: `drop${objectType.charAt(0).toUpperCase() + objectType.slice(1)}`,
        name: objectName,
        content: statement,
        timestamp: timestamp,
        hash: this.generateHash(statement),
      };
    }

    // ALTER statements that aren't caught by other patterns
    const alterMatch = statement.match(
      /ALTER\s+(\w+)\s+(?:public\.)?([a-zA-Z0-9_]+)/i
    );
    if (alterMatch && alterMatch[1] && alterMatch[2]) {
      return {
        id: `${filename}-${index}`,
        fileName: filename,
        type: "alter",
        name: alterMatch[2],
        content: statement,
        timestamp: timestamp,
        hash: this.generateHash(statement),
      };
    }

    // If we get here and still haven't matched, try one more general pattern for common SQL statements
    const genericMatch = statement.match(
      /(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+(?:OR\s+REPLACE\s+)?(?:\w+\s+)*(?:public\.)?([a-zA-Z0-9_]+)/i
    );
    if (genericMatch && genericMatch[1] && genericMatch[2]) {
      const action = genericMatch[1].toLowerCase();
      const objectName = genericMatch[2];

      return {
        id: `${filename}-${index}`,
        fileName: filename,
        type: action,
        name: objectName,
        content: statement,
        timestamp: timestamp,
        hash: this.generateHash(statement),
      };
    }

    // Check for BEGIN statements often used in SQL blocks
    if (
      statement.trim().startsWith("BEGIN") ||
      statement.trim().startsWith("DO $$")
    ) {
      const name = `sql_block_${createId().substring(0, 8)}`;
      return {
        id: `${filename}-${index}`,
        fileName: filename,
        type: "plpgsql",
        name: name,
        content: statement,
        timestamp: timestamp,
        hash: this.generateHash(statement),
      };
    }

    return null;
  }

  private splitIntoStatements(content: string): string[] {
    const statements: string[] = [];
    let currentStatement = "";
    let inFunction = false;
    let inTrigger = false;
    let inMultiLineComment = false;
    let dollarCount = 0;
    let bracketCount = 0;

    const replacedContent = content.replace(
      /(EXECUTE FUNCTION.*?\(\);)/g,
      (match) => match.replace(";", "###SEMICOLON###")
    );

    const lines = replacedContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        currentStatement += line + "\n";
        continue;
      }

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

      const dollarMatches = line.match(/\$\$/g);
      if (dollarMatches) {
        dollarCount += dollarMatches.length;
        inFunction = dollarCount % 2 !== 0;
      }

      const openBrackets = (line.match(/\(/g) || []).length;
      const closeBrackets = (line.match(/\)/g) || []).length;
      bracketCount += openBrackets - closeBrackets;

      if (
        trimmedLine.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+/i) &&
        !trimmedLine.includes(";")
      ) {
        inTrigger = true;
      }

      if (
        inTrigger &&
        trimmedLine.match(/EXECUTE\s+(?:PROCEDURE|FUNCTION)/i) &&
        trimmedLine.endsWith(");")
      ) {
        inTrigger = false;
      }

      currentStatement += line + "\n";

      if (inFunction && line.includes("$$;")) {
        inFunction = false;
        dollarCount = 0;
        statements.push(currentStatement.trim());
        currentStatement = "";
        continue;
      }

      if (trimmedLine.startsWith("DO $$")) {
        inFunction = true;
      }

      if (!inFunction && !inTrigger && bracketCount === 0) {
        if (trimmedLine.endsWith(";")) {
          const stmt = currentStatement.replace(/###SEMICOLON###/g, ";").trim();

          const isCreateTrigger = stmt.match(
            /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+/i
          );

          const nextNonEmptyLine = this.findNextNonEmptyLine(lines, i + 1);
          const hasNextCreateFunction =
            nextNonEmptyLine !== null &&
            nextNonEmptyLine.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+/i);

          if (isCreateTrigger && hasNextCreateFunction) {
            continue;
          }

          if (stmt.includes("CREATE TRIGGER") && stmt.includes("ALTER TABLE")) {
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

          statements.push(stmt);
          currentStatement = "";
        }
      }
    }

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
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  public getStatementType(patternType: string): string {
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
      alterRLSPolicy: "RLS_POLICY",
      dropTable: "DROP_TABLE",
      dropFunction: "DROP_FUNCTION",
      dropPolicy: "DROP_POLICY",
      dropTrigger: "DROP_TRIGGER",
      dropView: "DROP_VIEW",
      create: "CREATE",
      update: "UPDATE",
      delete: "DELETE",
      insert: "INSERT",
      check: "CHECK_FUNCTION",
      authorize: "AUTHORIZE_FUNCTION",
      custom_access_token_hook: "ACCESS_TOKEN_HOOK",
      milestone: "MILESTONE_FUNCTION",
      contract: "CONTRACT_FUNCTION",
      task: "TASK_FUNCTION",
      invitation: "INVITATION_FUNCTION",
      proposal: "PROPOSAL_FUNCTION",
      payment: "PAYMENT_FUNCTION",
      project: "PROJECT_FUNCTION",
      profile: "PROFILE_FUNCTION",
      app_data: "APP_DATA_FUNCTION",
    };

    return typeMap[patternType] || "CUSTOM";
  }
}
