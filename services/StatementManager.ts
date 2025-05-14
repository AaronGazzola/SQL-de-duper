// Do not delete this comment: Filename: @/services/StatementManager.ts
import { Statement } from "@/types/app.types";

export class StatementManager {
  /**
   * Gets the latest version of each statement by type and name
   */
  static getLatestVersions(statements: Statement[]): Statement[] {
    const latest = new Map<string, Statement>();

    statements.forEach((statement) => {
      const key = `${statement.type}-${statement.name}`;
      if (
        !latest.has(key) ||
        latest.get(key)!.timestamp < statement.timestamp
      ) {
        latest.set(key, statement);
      }
    });

    return Array.from(latest.values());
  }

  /**
   * Orders statements by type priority and name
   */
  static orderForExecution(statements: Statement[]): Statement[] {
    return [...statements].sort((a, b) => {
      // Type priority (CREATE before ALTER before CREATE INDEX, etc.)
      const typePriority: Record<string, number> = {
        CREATE_TABLE: 1,
        ALTER_TABLE: 2,
        CREATE_INDEX: 3,
        DROP_TABLE: 4,
        INSERT: 5,
        UPDATE: 6,
        DELETE: 7,
      };

      const aPriority = typePriority[a.type] || 999;
      const bPriority = typePriority[b.type] || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then sort by name
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Filters statements based on specified criteria
   */
  static filterStatements(
    statements: Statement[],
    filters: {
      types?: string[];
      searchTerm?: string;
      latestOnly?: boolean;
    }
  ): Statement[] {
    let filtered = [...statements];

    // Apply type filters
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter((statement) =>
        filters.types!.includes(statement.type)
      );
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (statement) =>
          statement.name.toLowerCase().includes(searchLower) ||
          statement.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply latest only filter
    if (filters.latestOnly) {
      filtered = this.getLatestVersions(filtered);
    }

    return filtered;
  }

  /**
   * Generates SQL from statements
   */
  static generateSQL(statements: Statement[]): string {
    // Get latest version and order for execution
    const latest = this.getLatestVersions(statements);
    const ordered = this.orderForExecution(latest);

    // Generate SQL with comments
    return ordered
      .map((statement) => {
        return `-- From: ${statement.fileName}\n-- Object: ${statement.name}\n${statement.content}\n`;
      })
      .join("\n");
  }

  /**
   * Finds statements that reference a specific object
   */
  static findDependencies(
    statements: Statement[],
    objectName: string
  ): Statement[] {
    return statements.filter((statement) => {
      const contentLower = statement.content.toLowerCase();
      const objectNameLower = objectName.toLowerCase();

      // Skip if this is the statement defining the object
      if (statement.name.toLowerCase() === objectNameLower) {
        return false;
      }

      // Check for references in the content
      // This is a simplified approach - a real implementation would be more sophisticated
      return (
        contentLower.includes(` ${objectNameLower} `) ||
        contentLower.includes(` ${objectNameLower}(`) ||
        contentLower.includes(` ${objectNameLower}.`) ||
        contentLower.includes(`(${objectNameLower}`)
      );
    });
  }

  /**
   * Creates a dependency graph for optimal execution order
   */
  static createDependencyGraph(statements: Statement[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize with empty dependencies
    statements.forEach((statement) => {
      const key = `${statement.type}-${statement.name}`;
      if (!graph.has(key)) {
        graph.set(key, []);
      }
    });

    // Find dependencies
    statements.forEach((statement) => {
      const dependencies = this.findDependencies(statements, statement.name);

      if (dependencies.length > 0) {
        const key = `${statement.type}-${statement.name}`;
        const deps = dependencies.map((dep) => `${dep.type}-${dep.name}`);
        graph.set(key, deps);
      }
    });

    return graph;
  }

  /**
   * Groups statements by type
   */
  static groupByType(statements: Statement[]): Record<string, Statement[]> {
    const grouped: Record<string, Statement[]> = {};

    statements.forEach((statement) => {
      if (!grouped[statement.type]) {
        grouped[statement.type] = [];
      }
      grouped[statement.type].push(statement);
    });

    return grouped;
  }
}

export default StatementManager;
