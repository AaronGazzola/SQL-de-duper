// components/StatementTextNode.tsx
"use client";
import {
  $applyNodeReplacement,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  TextNode,
} from "lexical";

export type SerializedStatementTextNode = SerializedTextNode & {
  type: "statement-text";
  statementName: string;
  timestamp: number;
};

export class StatementTextNode extends TextNode {
  __statementName: string;
  __timestamp: number;

  constructor(
    text: string,
    statementName: string = "",
    timestamp: number = Date.now(),
    key?: NodeKey
  ) {
    super(text, key);
    this.__statementName = statementName;
    this.__timestamp = timestamp;
  }

  static getType(): string {
    return "statement-text";
  }

  static clone(node: StatementTextNode): StatementTextNode {
    return new StatementTextNode(
      node.__text,
      node.__statementName,
      node.__timestamp,
      node.__key
    );
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    this.updateDOMStyles(element);
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);
    // Update styles if statement properties have changed
    if (prevNode.__statementName !== this.__statementName) {
      this.updateDOMStyles(dom);
      return true;
    }
    return isUpdated;
  }

  updateDOMStyles(dom: HTMLElement): void {
    // Apply light green background when the node has a name
    if (this.__statementName) {
      dom.style.backgroundColor = "rgba(0, 255, 0, 0.1)"; // Light green background
    } else {
      dom.style.backgroundColor = "";
    }
  }

  setStatementName(statementName: string): void {
    const self = this.getWritable();
    self.__statementName = statementName;
  }

  setTimestamp(timestamp: number): void {
    const self = this.getWritable();
    self.__timestamp = timestamp;
  }

  getStatementName(): string {
    return this.__statementName;
  }

  getTimestamp(): number {
    return this.__timestamp;
  }

  exportJSON(): SerializedStatementTextNode {
    const baseJSON = super.exportJSON() as SerializedTextNode;
    return {
      ...baseJSON,
      type: "statement-text",
      statementName: this.__statementName,
      timestamp: this.__timestamp,
    };
  }

  static importJSON(
    serializedNode: SerializedStatementTextNode
  ): StatementTextNode {
    const node = $createStatementTextNode(
      serializedNode.text,
      serializedNode.statementName,
      serializedNode.timestamp
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }
}

export function $createStatementTextNode(
  text: string,
  statementName: string = "",
  timestamp: number = Date.now()
): StatementTextNode {
  return $applyNodeReplacement(
    new StatementTextNode(text, statementName, timestamp)
  );
}

export function $isStatementTextNode(
  node: LexicalNode | null | undefined
): node is StatementTextNode {
  return node instanceof StatementTextNode;
}
