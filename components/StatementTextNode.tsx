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
  statementType: string;
  statementName: string;
  isParsed: boolean;
  timestamp: number;
};

export class StatementTextNode extends TextNode {
  __statementType: string;
  __statementName: string;
  __isParsed: boolean;
  __timestamp: number;

  constructor(
    text: string,
    statementType: string = "",
    statementName: string = "",
    isParsed: boolean = false,
    timestamp: number = Date.now(),
    key?: NodeKey
  ) {
    super(text, key);
    this.__statementType = statementType;
    this.__statementName = statementName;
    this.__isParsed = isParsed;
    this.__timestamp = timestamp;
  }

  static getType(): string {
    return "statement-text";
  }

  static clone(node: StatementTextNode): StatementTextNode {
    return new StatementTextNode(
      node.__text,
      node.__statementType,
      node.__statementName,
      node.__isParsed,
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
    if (
      prevNode.__statementType !== this.__statementType ||
      prevNode.__statementName !== this.__statementName ||
      prevNode.__isParsed !== this.__isParsed
    ) {
      this.updateDOMStyles(dom);
      return true;
    }
    return isUpdated;
  }

  updateDOMStyles(dom: HTMLElement): void {
    // Only apply background styling if the node is marked as parsed
    if (this.__isParsed) {
      dom.style.backgroundColor = "rgba(0, 255, 0, 0.1)"; // Faint green background
      dom.style.color = "#2563eb"; // Blue text for parsed statements
    } else {
      dom.style.backgroundColor = "";
      dom.style.color = "";
    }
  }

  setStatementType(statementType: string): void {
    const self = this.getWritable();
    self.__statementType = statementType;
  }

  setStatementName(statementName: string): void {
    const self = this.getWritable();
    self.__statementName = statementName;
  }

  setIsParsed(isParsed: boolean): void {
    const self = this.getWritable();
    self.__isParsed = isParsed;
  }

  setTimestamp(timestamp: number): void {
    const self = this.getWritable();
    self.__timestamp = timestamp;
  }

  getStatementType(): string {
    return this.__statementType;
  }

  getStatementName(): string {
    return this.__statementName;
  }

  getIsParsed(): boolean {
    return this.__isParsed;
  }

  getTimestamp(): number {
    return this.__timestamp;
  }

  exportJSON(): SerializedStatementTextNode {
    const baseJSON = super.exportJSON() as SerializedTextNode;
    return {
      ...baseJSON,
      type: "statement-text",
      statementType: this.__statementType,
      statementName: this.__statementName,
      isParsed: this.__isParsed,
      timestamp: this.__timestamp,
    };
  }

  static importJSON(
    serializedNode: SerializedStatementTextNode
  ): StatementTextNode {
    const node = $createStatementTextNode(
      serializedNode.text,
      serializedNode.statementType,
      serializedNode.statementName,
      serializedNode.isParsed,
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
  statementType: string = "",
  statementName: string = "",
  isParsed: boolean = false,
  timestamp: number = Date.now()
): StatementTextNode {
  return $applyNodeReplacement(
    new StatementTextNode(
      text,
      statementType,
      statementName,
      isParsed,
      timestamp
    )
  );
}

export function $isStatementTextNode(
  node: LexicalNode | null | undefined
): node is StatementTextNode {
  return node instanceof StatementTextNode;
}
