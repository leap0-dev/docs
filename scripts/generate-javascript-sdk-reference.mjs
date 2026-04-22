#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = resolve(__dirname, "..");
const OUTPUT_ROOT = join(DOCS_ROOT, "content/docs/(javascript-sdk)/reference/javascript-sdk");
const GITHUB_REPO = "https://github.com/leap0-dev/leap0-js.git";
const GITHUB_REF = "main";
const GITHUB_BASE = "https://github.com/leap0-dev/leap0-js/blob/main";

const CLASS_PAGES = [
  ["src/client/index.ts", "core", ["Leap0Client"]],
  ["src/client/sandbox.ts", "core", ["Sandbox"]],
  ["src/services/sandboxes.ts", "services", ["SandboxesClient"]],
  ["src/services/snapshots.ts", "services", ["SnapshotsClient"]],
  ["src/services/templates.ts", "services", ["TemplatesClient"]],
  ["src/services/filesystem.ts", "services", ["FilesystemClient"]],
  ["src/services/git.ts", "services", ["GitClient"]],
  ["src/services/process.ts", "services", ["ProcessClient"]],
  ["src/services/pty.ts", "services", ["PtyConnection", "PtyClient"]],
  ["src/services/lsp.ts", "services", ["LspClient"]],
  ["src/services/ssh.ts", "services", ["SshClient"]],
  ["src/services/code-interpreter.ts", "services", ["CodeInterpreterClient"]],
  ["src/services/desktop.ts", "services", ["DesktopClient"]],
];

const ERROR_CLASSES = [
  "Leap0Error",
  "Leap0PermissionError",
  "Leap0NotFoundError",
  "Leap0ConflictError",
  "Leap0RateLimitError",
  "Leap0TimeoutError",
  "Leap0WebSocketError",
];

function slugify(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeComment(comment) {
  if (!comment) return "";
  if (typeof comment === "string") return comment.trim();
  if (Array.isArray(comment)) {
    return comment
      .map((part) => (typeof part === "string" ? part : (part.text ?? "")))
      .join("")
      .trim();
  }
  return String(comment).trim();
}

function cleanParagraph(text) {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function stripExampleFence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:[\w-]+)?\n([\s\S]*?)\n```$/);
  return match ? match[1].trim() : trimmed;
}

function getJsDocParts(node) {
  const blocks = node.jsDoc ?? [];
  const description = blocks
    .map((block) => normalizeComment(block.comment))
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const tags = [];
  for (const block of blocks) {
    for (const tag of block.tags ?? []) {
      const tagName = tag.tagName?.escapedText?.toString() ?? "";
      if (tagName === "internal") continue;
      tags.push({
        tagName,
        name: tag.name?.getText?.(node.getSourceFile()) ?? "",
        comment: normalizeComment(tag.comment),
        type: tag.typeExpression?.type?.getText?.(node.getSourceFile()) ?? "",
      });
    }
  }

  return { description: cleanParagraph(description), tags };
}

function formatTypeParameters(typeParameters, sourceFile) {
  if (!typeParameters?.length) return "";
  return `<${typeParameters.map((param) => param.getText(sourceFile)).join(", ")}>`;
}

function formatParameter(param, sourceFile) {
  let text = param.dotDotDotToken ? "..." : "";
  text += param.name.getText(sourceFile);
  if (param.questionToken) text += "?";
  if (param.type) text += `: ${param.type.getText(sourceFile)}`;
  if (param.initializer) text += ` = ${param.initializer.getText(sourceFile)}`;
  return text;
}

function formatMethodSignature(node, sourceFile) {
  const isAsync = node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);
  const name =
    node.kind === ts.SyntaxKind.Constructor ? "constructor" : node.name.getText(sourceFile);
  const typeParams = formatTypeParameters(node.typeParameters, sourceFile);
  const params = node.parameters.map((param) => formatParameter(param, sourceFile)).join(", ");
  const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : "";
  const prefix = isAsync ? "async " : "";
  return normalizeWhitespace(`${prefix}${name}${typeParams}(${params})${returnType}`);
}

function parseConstants(filePath) {
  const source = readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const constants = [];

  for (const node of sourceFile.statements) {
    if (!ts.isVariableStatement(node)) continue;
    const isExported = node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) continue;

    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      constants.push({
        name: declaration.name.text,
        value: declaration.initializer.getText(sourceFile),
      });
    }
  }

  return constants;
}

function parseClasses(filePath, classNames) {
  const source = readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const wanted = new Set(classNames);
  const classes = new Map();

  for (const node of sourceFile.statements) {
    if (!ts.isClassDeclaration(node) || !node.name || !wanted.has(node.name.text)) continue;

    const { description, tags } = getJsDocParts(node);
    const constructor = node.members.find(
      (member) =>
        ts.isConstructorDeclaration(member) &&
        !member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword),
    );
    const methods = [];

    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member) || !member.name) continue;
      if (
        member.modifiers?.some(
          (modifier) =>
            modifier.kind === ts.SyntaxKind.PrivateKeyword ||
            modifier.kind === ts.SyntaxKind.ProtectedKeyword,
        )
      )
        continue;
      const methodDoc = getJsDocParts(member);
      methods.push({
        name: member.name.getText(sourceFile),
        signature: formatMethodSignature(member, sourceFile),
        description: methodDoc.description,
        tags: methodDoc.tags,
      });
    }

    classes.set(node.name.text, {
      description,
      tags,
      constructorSignature: constructor
        ? formatMethodSignature(constructor, sourceFile).replace(/^constructor/, node.name.text)
        : "",
      extendsName:
        node.heritageClauses
          ?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
          ?.types?.[0]?.getText(sourceFile) ?? "",
      methods,
    });
  }

  return classes;
}

function renderTagSections(lines, tags, { includeParams = true } = {}) {
  const params = [];
  const returns = [];
  const throwsTags = [];
  const examples = [];

  for (const tag of tags) {
    if (includeParams && tag.tagName === "param") {
      params.push(tag);
    } else if (tag.tagName === "returns" || tag.tagName === "return") {
      returns.push(tag);
    } else if (tag.tagName === "throws") {
      throwsTags.push(tag);
    } else if (tag.tagName === "example") {
      examples.push(tag);
    }
  }

  if (params.length > 0) {
    lines.push("#### Parameters", "");
    for (const tag of params) {
      const label = tag.name ? `\`${tag.name}\`` : "Parameter";
      lines.push(`- ${label}: ${tag.comment || ""}`.trim());
    }
    lines.push("");
  }

  if (returns.length > 0) {
    lines.push("#### Returns", "");
    for (const tag of returns) {
      lines.push(`- ${tag.comment || "Returns a value."}`);
    }
    lines.push("");
  }

  if (throwsTags.length > 0) {
    lines.push("#### Throws", "");
    for (const tag of throwsTags) {
      const detail = tag.comment || "Throws an error.";
      lines.push(`- ${tag.type ? `\`${tag.type}\`: ` : ""}${detail}`);
    }
    lines.push("");
  }

  if (examples.length > 0) {
    lines.push("#### Examples", "");
    for (const tag of examples) {
      lines.push("```ts", stripExampleFence(tag.comment || ""), "```", "");
    }
  }
}

function writePage(filePath, lines) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${lines.join("\n").trimEnd()}\n`);
}

function buildIndexPage() {
  writePage(join(OUTPUT_ROOT, "index.mdx"), [
    "---",
    "title: JavaScript SDK Reference",
    "description: Auto-generated reference for the Leap0 JavaScript SDK.",
    "---",
    "",
    "## Overview",
    "",
    "The Leap0 JavaScript SDK is a typed Node.js client for sandbox lifecycle, files, git, process execution, PTY sessions, LSP, SSH, code interpreter, desktop automation, snapshots, and templates.",
    "",
    "## Installation",
    "",
    "```text",
    "npm install leap0",
    "```",
    "",
    "## Runtime",
    "",
    "- Node.js 20.6.0 or newer",
    "- ESM package",
    "",
    "## Getting Started",
    "",
    "```ts",
    'import { Leap0Client } from "leap0";',
    "",
    "const client = new Leap0Client();",
    "const sandbox = await client.sandboxes.create();",
    "console.log(sandbox.id);",
    "```",
    "",
    "Use the sidebar to browse shared defaults, errors, core classes, and service clients.",
  ]);
}

function buildDefaultsPage(sdkRoot) {
  const constants = parseConstants(join(sdkRoot, "src/config/constants.ts"));
  const lines = [
    "---",
    "title: Defaults",
    "description: Shared defaults and environment variables for the Leap0 JavaScript SDK.",
    "---",
    "",
    `Source: [\`src/config/constants.ts\`](${GITHUB_BASE}/src/config/constants.ts)`,
    "",
    "## Constants",
    "",
  ];

  for (const constant of constants) {
    lines.push(`- \`${constant.name}\`: \`${constant.value.replace(/`/g, "\\`")}\``);
  }

  writePage(join(OUTPUT_ROOT, "common/defaults.mdx"), lines);
}

function buildErrorsPage(sdkRoot) {
  const classes = parseClasses(join(sdkRoot, "src/core/errors.ts"), ERROR_CLASSES);
  const lines = [
    "---",
    "title: Errors",
    "description: Error types exposed by the Leap0 JavaScript SDK.",
    "---",
    "",
    `Source: [\`src/core/errors.ts\`](${GITHUB_BASE}/src/core/errors.ts)`,
    "",
    "## Error Hierarchy",
    "",
  ];

  for (const name of ERROR_CLASSES) {
    const cls = classes.get(name);
    if (!cls) continue;
    lines.push(`### \`${name}\``, "");
    if (cls.extendsName) {
      lines.push(`Extends \`${cls.extendsName}\`.`, "");
    }
    if (cls.description) {
      lines.push(cls.description, "");
    }
    renderTagSections(lines, cls.tags, { includeParams: false });
  }

  writePage(join(OUTPUT_ROOT, "common/errors.mdx"), lines);
}

function buildClassPages(sdkRoot) {
  for (const [relativePath, section, classNames] of CLASS_PAGES) {
    const classes = parseClasses(join(sdkRoot, relativePath), classNames);
    for (const className of classNames) {
      const cls = classes.get(className);
      if (!cls) continue;

      const lines = [
        "---",
        `title: ${className}`,
        `description: Auto-generated reference for ${className}.`,
        "---",
        "",
        `Source: [\`${relativePath}\`](${GITHUB_BASE}/${relativePath})`,
        "",
      ];

      if (cls.constructorSignature) {
        lines.push("## Signature", "", "```ts", cls.constructorSignature, "```", "");
      }

      if (cls.description) {
        lines.push("## Overview", "", cls.description, "");
      }

      renderTagSections(lines, cls.tags, { includeParams: false });

      if (cls.methods.length > 0) {
        lines.push("## Methods", "");
      }

      for (const method of cls.methods) {
        lines.push(`### \`${method.name}\``, "", "```ts", method.signature, "```", "");
        if (method.description) {
          lines.push(method.description, "");
        }
        renderTagSections(lines, method.tags);
      }

      writePage(join(OUTPUT_ROOT, section, `${slugify(className)}.mdx`), lines);
    }
  }
}

function fetchSdkFromGitHub() {
  const tempRoot = mkdtempSync(join(tmpdir(), "leap0-js-"));
  const sdkRoot = join(tempRoot, "repo");
  execFileSync("git", ["clone", "--depth", "1", "--branch", GITHUB_REF, GITHUB_REPO, sdkRoot], {
    stdio: "inherit",
  });
  return { tempRoot, sdkRoot };
}

function main() {
  const { tempRoot, sdkRoot } = fetchSdkFromGitHub();
  try {
    rmSync(OUTPUT_ROOT, { recursive: true, force: true });
    buildIndexPage();
    buildDefaultsPage(sdkRoot);
    buildErrorsPage(sdkRoot);
    buildClassPages(sdkRoot);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
