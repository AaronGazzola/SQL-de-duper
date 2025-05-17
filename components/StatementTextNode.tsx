// components/StatementTextNode.ts
import { Statement } from "@/types/app.types";
import {
  $applyNodeReplacement,
  EditorConfig,
  NodeKey,
  SerializedTextNode,
  TextNode,
} from "lexical";

// Interface for serialized StatementTextNode
export interface SerializedStatementTextNode extends SerializedTextNode {
  type: string;
  statement: Statement | null;
}

// Create a StatementTextNode class by extending TextNode
export class StatementTextNode extends TextNode {
  __statement: Statement | null;

  constructor(text: string, statement: Statement | null = null, key?: NodeKey) {
    super(text, key);
    this.__statement = statement;
  }

  getStatement(): Statement | null {
    return this.__statement;
  }

  setStatement(statement: Statement | null): void {
    const self = this.getWritable();
    self.__statement = statement;
  }

  hasStatement(): boolean {
    return this.__statement !== null;
  }

  static getType(): string {
    return "statement-text";
  }

  static clone(node: StatementTextNode): StatementTextNode {
    return new StatementTextNode(node.__text, node.__statement, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    if (this.__statement) {
      dom.setAttribute("data-statement-type", this.__statement.type);
      dom.setAttribute("data-statement-name", this.__statement.name);
      dom.setAttribute("data-statement-id", this.__statement.id);
      dom.setAttribute(
        "title",
        `${this.__statement.type}: ${this.__statement.name}`
      );
      dom.classList.add("statement-node");
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const hasUpdate = super.updateDOM(prevNode, dom, config);

    const hasStatementChanged =
      (this.__statement !== null && prevNode.__statement === null) ||
      (this.__statement === null && prevNode.__statement !== null) ||
      (this.__statement !== null &&
        prevNode.__statement !== null &&
        (this.__statement.type !== prevNode.__statement.type ||
          this.__statement.name !== prevNode.__statement.name ||
          this.__statement.id !== prevNode.__statement.id));

    if (hasStatementChanged) {
      if (this.__statement) {
        dom.setAttribute("data-statement-type", this.__statement.type);
        dom.setAttribute("data-statement-name", this.__statement.name);
        dom.setAttribute("data-statement-id", this.__statement.id);
        dom.setAttribute(
          "title",
          `${this.__statement.type}: ${this.__statement.name}`
        );
        dom.classList.add("statement-node");
      } else {
        dom.removeAttribute("data-statement-type");
        dom.removeAttribute("data-statement-name");
        dom.removeAttribute("data-statement-id");
        dom.removeAttribute("title");
        dom.classList.remove("statement-node");
      }
      return true;
    }

    return hasUpdate;
  }

  exportJSON(): SerializedStatementTextNode {
    const baseJSON = super.exportJSON() as SerializedTextNode;
    return {
      ...baseJSON,
      type: "statement-text",
      statement: this.__statement,
    };
  }

  static importJSON(
    serializedNode: SerializedStatementTextNode
  ): StatementTextNode {
    const node = $createStatementTextNode(
      serializedNode.text,
      serializedNode.statement
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }
}

// Helper function to create StatementTextNode
export function $createStatementTextNode(
  text: string,
  statement: Statement | null = null
): StatementTextNode {
  return $applyNodeReplacement(new StatementTextNode(text, statement));
}

// Helper function to check if node is StatementTextNode
export function $isStatementTextNode(
  node: TextNode | null | undefined
): node is StatementTextNode {
  return node instanceof StatementTextNode;
}
