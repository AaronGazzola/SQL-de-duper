// services/StatementManager.ts
import { Filter, Statement, StatementGroup } from "@/types/app.types";

export class StatementManager {
  // Group statements by name and type to identify versions of the same object
  static groupByNameAndType(statements: Statement[]): StatementGroup[] {
    const groups: Record<string, StatementGroup> = {};

    statements.forEach((statement) => {
      const key = `${statement.type}:${statement.name}`;

      if (!groups[key]) {
        groups[key] = {
          name: statement.name,
          type: statement.type,
          statements: [],
        };
      }

      groups[key].statements.push(statement);
    });

    // Sort statements within each group by timestamp (newest first)
    Object.values(groups).forEach((group) => {
      group.statements.sort((a, b) => b.timestamp - a.timestamp);
    });

    return Object.values(groups);
  }

  // Filter statements based on user-selected filters
  static filterStatements(
    statements: Statement[],
    filters: Filter
  ): Statement[] {
    let filteredStatements = [...statements];

    // Filter by type
    if (filters.types.length > 0) {
      filteredStatements = filteredStatements.filter((statement) =>
        filters.types.includes(statement.type)
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredStatements = filteredStatements.filter(
        (statement) =>
          statement.name.toLowerCase().includes(searchLower) ||
          statement.content.toLowerCase().includes(searchLower)
      );
    }

    // Filter to only latest version of each object if latestOnly is enabled
    if (filters.latestOnly) {
      const groups = this.groupByNameAndType(filteredStatements);
      filteredStatements = groups.map((group) => group.statements[0]);
    }

    return filteredStatements;
  }

  // Group statements by type
  static groupByType(statements: Statement[]): Record<string, Statement[]> {
    const groupedByType: Record<string, Statement[]> = {};

    statements.forEach((statement) => {
      if (!groupedByType[statement.type]) {
        groupedByType[statement.type] = [];
      }
      groupedByType[statement.type].push(statement);
    });

    return groupedByType;
  }

  // Order statements for execution (e.g., tables before indices)
  static orderForExecution(statements: Statement[]): Statement[] {
    // Define execution order by type
    const typeOrder: Record<string, number> = {
      extension: 1,
      type: 2,
      table: 3,
      function: 4,
      view: 5,
      index: 6,
      trigger: 7,
      constraint: 8,
      policy: 9,
      grant: 10,
      comment: 11,
      alter: 12,
    };

    return [...statements].sort((a, b) => {
      const orderA = typeOrder[a.type] || 100;
      const orderB = typeOrder[b.type] || 100;
      return orderA - orderB;
    });
  }

  // Get only the latest version of each statement
  static getLatestVersions(statements: Statement[]): Statement[] {
    const groups = this.groupByNameAndType(statements);
    return groups.map((group) => group.statements[0]);
  }

  // Generate SQL from filtered statements
  static generateSQL(statements: Statement[]): string {
    let generatedSQL = "-- Generated SQL\n\n";

    // Group by type for organization
    const groupedByType = this.groupByType(statements);

    // Add statements by type in execution order
    const typeOrder = [
      "extension",
      "type",
      "table",
      "function",
      "view",
      "index",
      "trigger",
      "constraint",
      "policy",
      "grant",
      "comment",
      "alter",
    ];

    typeOrder.forEach((type) => {
      if (groupedByType[type] && groupedByType[type].length > 0) {
        generatedSQL += `-- ${type.toUpperCase()} Statements\n`;
        groupedByType[type].forEach((statement) => {
          generatedSQL += `${statement.content}\n\n`;
        });
        generatedSQL += "\n";
      }
    });

    // Add any other types not in the predefined order
    Object.keys(groupedByType).forEach((type) => {
      if (!typeOrder.includes(type)) {
        generatedSQL += `-- ${type.toUpperCase()} Statements\n`;
        groupedByType[type].forEach((statement) => {
          generatedSQL += `${statement.content}\n\n`;
        });
        generatedSQL += "\n";
      }
    });

    return generatedSQL;
  }

  // Find statements that may depend on a given object
  static findDependencies(
    statements: Statement[],
    objectName: string
  ): Statement[] {
    return statements.filter((statement) =>
      statement.content.toLowerCase().includes(objectName.toLowerCase())
    );
  }

  // Find all versions of a statement with the same name and type
  static findVersionsOfStatement(
    statements: Statement[],
    statement: Statement
  ): Statement[] {
    return statements
      .filter((s) => s.name === statement.name && s.type === statement.type)
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first
  }
}

export default StatementManager;
