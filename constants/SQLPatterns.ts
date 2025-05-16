// constants/SQLPatterns.ts
import { SQLPattern } from "@/types/app.types";

// Default regex patterns for SQL statements
const sqlPatterns: SQLPattern[] = [
  // CREATE TABLE patterns
  {
    regex:
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "CREATE TABLE statement",
    createdAt: Date.now(),
  },
  // ALTER TABLE patterns
  {
    regex: /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "ALTER TABLE statement",
    createdAt: Date.now(),
  },
  // CREATE INDEX patterns
  {
    regex:
      /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "CREATE INDEX statement",
    createdAt: Date.now(),
  },
  // DROP TABLE patterns
  {
    regex: /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "DROP TABLE statement",
    createdAt: Date.now(),
  },
  // INSERT patterns
  {
    regex: /INSERT\s+INTO\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "INSERT statement",
    createdAt: Date.now(),
  },
  // UPDATE patterns
  {
    regex: /UPDATE\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "UPDATE statement",
    createdAt: Date.now(),
  },
  // DELETE patterns
  {
    regex: /DELETE\s+FROM\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "DELETE statement",
    createdAt: Date.now(),
  },
  // CREATE FUNCTION patterns
  {
    regex:
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "CREATE FUNCTION statement",
    createdAt: Date.now(),
  },
  // CREATE TRIGGER patterns
  {
    regex: /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "CREATE TRIGGER statement",
    createdAt: Date.now(),
  },
  // CREATE VIEW patterns
  {
    regex: /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "CREATE VIEW statement",
    createdAt: Date.now(),
  },
  // GRANT patterns
  {
    regex:
      /GRANT\s+(?:[a-zA-Z0-9_]+)\s+ON\s+(?:TABLE\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "GRANT statement",
    createdAt: Date.now(),
  },
  // CREATE POLICY patterns
  {
    regex:
      /CREATE\s+POLICY\s+([a-zA-Z0-9_]+)\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi,
    isDefault: true,
    description: "CREATE POLICY statement",
    createdAt: Date.now(),
  },
  // Comment blocks
  {
    regex: /\/\*[\s\S]*?\*\//g,
    isDefault: true,
    description: "Multi-line comment block",
    createdAt: Date.now(),
  },
  // Single line comments
  {
    regex: /--.*(?:\r\n|\r|\n|$)/g,
    isDefault: true,
    description: "Single line comment",
    createdAt: Date.now(),
  },
];

export default sqlPatterns;
