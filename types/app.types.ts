// types/app.types.ts
export interface Statement {
  id: string;
  type: string;
  name: string;
  content: string;
  fileName: string;
  timestamp: number;
  hash: string;
  parsed: boolean;
}

export interface StatementGroup {
  id: string;
  content: Statement;
  versions: Statement[];
}

export interface Filter {
  types: string[];
  latestOnly: boolean;
  searchTerm: string;
  showUnparsed: boolean;
}

export interface ParseResult {
  filename: string;
  timestamp?: number;
  stats: {
    total: number;
    parsed: number;
  };
}

export interface File extends globalThis.File {
  path?: string;
}

export interface StoreState {
  statements: StatementGroup[];
  filters: Filter;
  statementTypes: string[];
  parseResults: ParseResult[];
  totalLines: number;
  parsedLines: number;
  onFilesDrop: (files: File[]) => void;
  setFilters: (filters: Filter) => void;
  resetStore: () => void;
}
