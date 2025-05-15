// services/StatementManager.ts
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
   * Orders statements by type priority and execution dependencies
   */
  static orderForExecution(statements: Statement[]): Statement[] {
    // Define type priority (based on the OBJECT_TYPE_ORDER in the original script)
    const typePriority: Record<string, number> = {
      EXTENSION: 1, // Extensions first
      TYPE: 2, // Then types
      TABLE: 3, // Then tables
      VIEW: 4, // Then views
      FUNCTION: 5, // Then functions
      TRIGGER: 6, // Then triggers that might use functions
      INDEX: 7, // Then indexes
      CONSTRAINT: 8, // Then constraints
      POLICY: 9, // Then policies
      COMMENT: 10, // Then comments
      GRANT: 11, // Then grants
      REVOKE: 12, // Then revokes
      ALTER: 13, // Then alters
      PLPGSQL: 14, // Then any PL/pgSQL blocks
      CUSTOM: 99, // Custom statements last
    };

    return [...statements].sort((a, b) => {
      // First sort by type priority
      const aPriority = typePriority[a.type] || 999;
      const bPriority = typePriority[b.type] || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // If same type, sort by name
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
          statement.content.toLowerCase().includes(searchLower) ||
          statement.type.toLowerCase().includes(searchLower)
      );
    }

    // Apply latest only filter
    if (filters.latestOnly) {
      filtered = this.getLatestVersions(filtered);
    }

    return filtered;
  }

  /**
   * Generates SQL from statements with proper ordering and grouping
   */
  static generateSQL(statements: Statement[]): string {
    // Get latest version and order for execution
    const latest = this.getLatestVersions(statements);
    const ordered = this.orderForExecution(latest);

    // Group statements by type for better readability
    const groupedByType: Record<string, Statement[]> = {};

    ordered.forEach((stmt) => {
      if (!groupedByType[stmt.type]) {
        groupedByType[stmt.type] = [];
      }
      groupedByType[stmt.type].push(stmt);
    });

    // Generate SQL with comments
    let generatedSQL = "-- Consolidated SQL Migration\n";
    generatedSQL += `-- Generated on ${new Date().toISOString()}\n\n`;

    // Add count summary of all objects
    generatedSQL += `-- Object counts:\n`;
    let totalObjects = 0;

    Object.entries(groupedByType).forEach(([type, stmts]) => {
      generatedSQL += `-- ${type}: ${stmts.length}\n`;
      totalObjects += stmts.length;
    });

    generatedSQL += `-- Total objects: ${totalObjects}\n\n`;

    // Add objects by type
    Object.entries(groupedByType).forEach(([type, stmts]) => {
      generatedSQL += `-- ============================================\n`;
      generatedSQL += `-- Type: ${type} (${stmts.length} objects)\n`;
      generatedSQL += `-- ============================================\n\n`;

      stmts.forEach((stmt) => {
        // Add metadata as comments
        generatedSQL += `-- From: ${stmt.fileName}\n`;
        generatedSQL += `-- Object: ${stmt.name}\n`;

        // Add the SQL content
        generatedSQL += `${stmt.content}\n\n`;
      });

      generatedSQL += "\n";
    });

    return generatedSQL;
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
      return (
        contentLower.includes(` ${objectNameLower} `) ||
        contentLower.includes(` ${objectNameLower}(`) ||
        contentLower.includes(` ${objectNameLower}.`) ||
        contentLower.includes(`(${objectNameLower}`) ||
        contentLower.includes(` on ${objectNameLower}`) ||
        contentLower.includes(` on public.${objectNameLower}`)
      );
    });
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
