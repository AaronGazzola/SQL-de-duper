// lib/parse.util.ts
import { FileData, Statement } from "@/types/app.types";
import crypto from "crypto";

// SQL statement types
export const STATEMENT_TYPES = {
  CREATE_TABLE: "CREATE_TABLE",
  ALTER_TABLE: "ALTER_TABLE",
  DROP_TABLE: "DROP_TABLE",
  CREATE_INDEX: "CREATE_INDEX",
  DROP_INDEX: "DROP_INDEX",
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  SELECT: "SELECT",
  OTHER: "OTHER",
  UNPARSED: "UNPARSED",
};

// Parse SQL files
export const parseSqlFile = async (
  file: File
): Promise<{
  statements: Statement[];
  FileData: FileData;
}> => {
  // Check if file name contains a timestamp
  const timestampMatch = file.name.match(/(\d{10,13})/);
  const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

  const text = await file.text();
  const lines = text.split("\n");
  const totalLines = lines.length;

  // Initialize statements array and tracking variables
  const statements: Statement[] = [];
  let currentStatement = "";
  let currentType = "";
  let currentName = "";
  let parsed = 0;

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (line === "" || line.startsWith("--") || line.startsWith("/*")) {
      continue;
    }

    // Add line to current statement
    currentStatement += line + " ";

    // Check if statement is complete (ends with semicolon)
    if (line.endsWith(";")) {
      const statement = currentStatement.trim();

      // Parse statement type and name
      const typeAndName = parseStatementTypeAndName(statement);
      currentType = typeAndName.type;
      currentName = typeAndName.name;

      // Create a hash of the statement for version tracking
      const hash = createHash(statement);

      // Create statement object
      const statementObj: Statement = {
        id: `${file.name}-${hash}`,
        type: currentType,
        name: currentName,
        content: statement,
        fileName: file.name,
        timestamp,
        hash,
        parsed: currentType !== STATEMENT_TYPES.UNPARSED,
      };

      // Add statement to array
      statements.push(statementObj);

      // Reset current statement
      currentStatement = "";
      currentType = "";
      currentName = "";

      // Update parsed count
      if (statementObj.parsed) {
        parsed++;
      }
    }
  }

  // Handle any remaining text as an unparsed statement
  if (currentStatement.trim() !== "") {
    const hash = createHash(currentStatement);
    statements.push({
      id: `${file.name}-${hash}`,
      type: STATEMENT_TYPES.UNPARSED,
      name: "Unparsed Statement",
      content: currentStatement.trim(),
      fileName: file.name,
      timestamp,
      hash,
      parsed: false,
    });
  }

  // Create parse result
  const FileData: FileData = {
    filename: file.name,
    timestamp,
    stats: {
      total: totalLines,
      parsed,
    },
  };

  return { statements, FileData };
};

// Parse statement type and name
const parseStatementTypeAndName = (
  statement: string
): { type: string; name: string } => {
  const upperStatement = statement.toUpperCase();

  // CREATE TABLE
  if (upperStatement.startsWith("CREATE TABLE")) {
    const match = statement.match(
      /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?[`"']?([^`"'(]+)[`"']?/i
    );
    return {
      type: STATEMENT_TYPES.CREATE_TABLE,
      name: match ? match[1].trim() : "Unknown Table",
    };
  }

  // ALTER TABLE
  if (upperStatement.startsWith("ALTER TABLE")) {
    const match = statement.match(/ALTER TABLE\s+[`"']?([^`"']+)[`"']?/i);
    return {
      type: STATEMENT_TYPES.ALTER_TABLE,
      name: match ? match[1].trim() : "Unknown Table",
    };
  }

  // DROP TABLE
  if (upperStatement.startsWith("DROP TABLE")) {
    const match = statement.match(
      /DROP TABLE\s+(?:IF EXISTS\s+)?[`"']?([^`"',;]+)[`"']?/i
    );
    return {
      type: STATEMENT_TYPES.DROP_TABLE,
      name: match ? match[1].trim() : "Unknown Table",
    };
  }

  // CREATE INDEX
  if (
    upperStatement.startsWith("CREATE INDEX") ||
    upperStatement.startsWith("CREATE UNIQUE INDEX")
  ) {
    const match = statement.match(
      /CREATE\s+(?:UNIQUE\s+)?INDEX\s+[`"']?([^`"']+)[`"']?/i
    );
    return {
      type: STATEMENT_TYPES.CREATE_INDEX,
      name: match ? match[1].trim() : "Unknown Index",
    };
  }

  // DROP INDEX
  if (upperStatement.startsWith("DROP INDEX")) {
    const match = statement.match(/DROP INDEX\s+[`"']?([^`"']+)[`"']?/i);
    return {
      type: STATEMENT_TYPES.DROP_INDEX,
      name: match ? match[1].trim() : "Unknown Index",
    };
  }

  // INSERT
  if (upperStatement.startsWith("INSERT INTO")) {
    const match = statement.match(/INSERT INTO\s+[`"']?([^`"'(]+)[`"']?/i);
    return {
      type: STATEMENT_TYPES.INSERT,
      name: match ? match[1].trim() : "Unknown Table",
    };
  }

  // UPDATE
  if (upperStatement.startsWith("UPDATE")) {
    const match = statement.match(/UPDATE\s+[`"']?([^`"']+)[`"']?/i);
    return {
      type: STATEMENT_TYPES.UPDATE,
      name: match ? match[1].trim() : "Unknown Table",
    };
  }

  // DELETE
  if (upperStatement.startsWith("DELETE FROM")) {
    const match = statement.match(/DELETE FROM\s+[`"']?([^`"']+)[`"']?/i);
    return {
      type: STATEMENT_TYPES.DELETE,
      name: match ? match[1].trim() : "Unknown Table",
    };
  }

  // SELECT
  if (upperStatement.startsWith("SELECT")) {
    return {
      type: STATEMENT_TYPES.SELECT,
      name: "Select Query",
    };
  }

  // If no specific type is matched
  return {
    type: STATEMENT_TYPES.OTHER,
    name: "Other Statement",
  };
};

// Create a hash for the statement content
const createHash = (content: string): string => {
  return crypto
    .createHash("md5")
    .update(content.replace(/\s+/g, " ").trim())
    .digest("hex")
    .substring(0, 8);
};
