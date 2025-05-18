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
};

export class StatementTextNode extends TextNode {
  __statementType: string;
  __statementName: string;
  __isParsed: boolean;

  constructor(
    text: string,
    statementType: string = "",
    statementName: string = "",
    isParsed: boolean = false,
    key?: NodeKey
  ) {
    super(text, key);
    this.__statementType = statementType;
    this.__statementName = statementName;
    this.__isParsed = isParsed;
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
    // Apply styling based on statement properties
    if (this.__statementType) {
      dom.style.backgroundColor = "rgba(0, 255, 0, 0.1)"; // Faint green background
    } else {
      dom.style.backgroundColor = "";
    }
    if (this.__isParsed) {
      dom.style.color = "#2563eb"; // Blue text for parsed statements
    } else {
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

  getStatementType(): string {
    return this.__statementType;
  }

  getStatementName(): string {
    return this.__statementName;
  }

  getIsParsed(): boolean {
    return this.__isParsed;
  }

  exportJSON(): SerializedStatementTextNode {
    const baseJSON = super.exportJSON() as SerializedTextNode;
    return {
      ...baseJSON,
      type: "statement-text",
      statementType: this.__statementType,
      statementName: this.__statementName,
      isParsed: this.__isParsed,
    };
  }

  static importJSON(
    serializedNode: SerializedStatementTextNode
  ): StatementTextNode {
    const node = $createStatementTextNode(
      serializedNode.text,
      serializedNode.statementType,
      serializedNode.statementName,
      serializedNode.isParsed
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
  isParsed: boolean = false
): StatementTextNode {
  return $applyNodeReplacement(
    new StatementTextNode(text, statementType, statementName, isParsed)
  );
}

export function $isStatementTextNode(
  node: LexicalNode | null | undefined
): node is StatementTextNode {
  return node instanceof StatementTextNode;
}
