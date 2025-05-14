// Do not delete this comment: Filename: @/types/app.types.ts
// File type extended from the standard File interface
export interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath: string;
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream;
  text(): Promise<string>;
}

// SQL Statement types
export type StatementType =
  | "CREATE_TABLE"
  | "ALTER_TABLE"
  | "CREATE_INDEX"
  | "DROP_TABLE"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "CUSTOM";

// A parsed SQL statement
export interface Statement {
  id: string;
  fileName: string;
  type: string;
  name: string;
  content: string;
  timestamp: number;
  hash: string;
}

// Section of SQL that could not be automatically parsed
export interface UnparsedSection {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  parsed: boolean;
}

// The result of parsing a SQL file
export interface ParsedFile {
  filename: string;
  originalContent: string;
  statements: Statement[];
  unparsedSections: UnparsedSection[];
  stats: {
    total: number;
    parsed: number;
    percentage: number;
  };
}

// Selection in the SQL editor
export interface Selection {
  text: string;
  startOffset: number;
  endOffset: number;
}

// Filter criteria for statements
export interface Filter {
  types: string[];
  latestOnly: boolean;
  searchTerm: string;
}

// Progress tracking for file uploads
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Context for parsing SQL files
export interface ParseContext {
  parseResults: ParsedFile[];
  isProcessing: boolean;
  uploadProgress: Record<string, UploadProgress>;
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
  parseFiles: () => Promise<void>;
  updateParseResults: (results: ParsedFile[]) => void;
}

// Context for managing statements
export interface StatementContext {
  statements: Statement[];
  filteredStatements: Statement[];
  filters: Filter;
  setFilters: (filters: Filter) => void;
  addStatement: (statement: Statement) => void;
  updateStatement: (id: string, statement: Partial<Statement>) => void;
  removeStatement: (id: string) => void;
  generateSQL: () => string;
}

// UI state management context
export interface UIContext {
  currentView: "upload" | "report" | "manual" | "statements" | "export";
  setCurrentView: (
    view: "upload" | "report" | "manual" | "statements" | "export"
  ) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}
