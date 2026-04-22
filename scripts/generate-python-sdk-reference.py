#!/usr/bin/env python3
from __future__ import annotations

import argparse
import ast
import subprocess
import shutil
import tempfile
from pathlib import Path


COMMON_CONSTANTS = [
    "DEFAULT_TEMPLATE_NAME",
    "DEFAULT_CODE_INTERPRETER_TEMPLATE_NAME",
    "DEFAULT_DESKTOP_TEMPLATE_NAME",
    "DEFAULT_VCPU",
    "DEFAULT_MEMORY_MIB",
    "DEFAULT_TIMEOUT_MIN",
]

COMMON_ENV_VARS = [
    "LEAP0_API_KEY_ENV",
    "LEAP0_BASE_URL_ENV",
    "LEAP0_SANDBOX_DOMAIN_ENV",
    "LEAP0_SDK_OTEL_ENABLED_ENV",
    "OTEL_EXPORTER_OTLP_ENDPOINT_ENV",
    "OTEL_EXPORTER_OTLP_HEADERS_ENV",
]

SYNC_MODULES = [
    ("leap0/_sync/client.py", ["Leap0Client"]),
    ("leap0/_sync/sandbox.py", ["SandboxesClient", "Sandbox"]),
    ("leap0/_sync/snapshots.py", ["SnapshotsClient"]),
    ("leap0/_sync/templates.py", ["TemplatesClient"]),
    ("leap0/_sync/filesystem.py", ["FilesystemClient"]),
    ("leap0/_sync/git.py", ["GitClient"]),
    ("leap0/_sync/process.py", ["ProcessClient"]),
    ("leap0/_sync/pty.py", ["PtyClient"]),
    ("leap0/_sync/lsp.py", ["LspClient"]),
    ("leap0/_sync/ssh.py", ["SshClient"]),
    ("leap0/_sync/code_interpreter.py", ["CodeInterpreterClient"]),
    ("leap0/_sync/desktop.py", ["DesktopClient"]),
]

ASYNC_MODULES = [
    ("leap0/_async/client.py", ["AsyncLeap0Client"]),
    ("leap0/_async/sandbox.py", ["AsyncSandboxesClient", "AsyncSandbox"]),
    ("leap0/_async/snapshots.py", ["AsyncSnapshotsClient"]),
    ("leap0/_async/templates.py", ["AsyncTemplatesClient"]),
    ("leap0/_async/filesystem.py", ["AsyncFilesystemClient"]),
    ("leap0/_async/git.py", ["AsyncGitClient"]),
    ("leap0/_async/process.py", ["AsyncProcessClient"]),
    ("leap0/_async/pty.py", ["AsyncPtyClient"]),
    ("leap0/_async/lsp.py", ["AsyncLspClient"]),
    ("leap0/_async/ssh.py", ["AsyncSshClient"]),
    ("leap0/_async/code_interpreter.py", ["AsyncCodeInterpreterClient"]),
    ("leap0/_async/desktop.py", ["AsyncDesktopClient"]),
]

ERROR_CLASSES = [
    "Leap0Error",
    "Leap0NotFoundError",
    "Leap0PermissionError",
    "Leap0ConflictError",
    "Leap0RateLimitError",
    "Leap0TimeoutError",
    "Leap0WebSocketError",
]

GITHUB_REPO = "https://github.com/leap0-dev/leap0-python.git"
GITHUB_REF = "main"
GITHUB_BASE = "https://github.com/leap0-dev/leap0-python/blob/main"


def md_escape(text: str) -> str:
    return text.replace("<", "\\<")


def slugify(name: str) -> str:
    chars: list[str] = []
    for index, char in enumerate(name):
        if index and char.isupper() and (name[index - 1].islower() or (index + 1 < len(name) and name[index + 1].islower())):
            chars.append("-")
        chars.append(char.lower())
    return "".join(chars)


SECTION_HEADERS = ("Args:", "Returns:", "Raises:")


def is_section_header(line: str) -> bool:
    return line.lstrip() in SECTION_HEADERS


def normalize_section_lines(lines: list[str]) -> list[str]:
    non_empty = [line for line in lines if line.strip()]
    if not non_empty:
        return []

    indent = min(len(line) - len(line.lstrip()) for line in non_empty)
    return [line[indent:].rstrip() for line in lines]


def parse_section_entries(lines: list[str]) -> list[str]:
    normalized = normalize_section_lines(lines)
    entries: list[str] = []
    current: list[str] = []

    for line in normalized:
        stripped = line.strip()
        if not stripped:
            if current:
                entries.append(" ".join(current))
                current = []
            continue

        if line == stripped and current:
            entries.append(" ".join(current))
            current = [stripped]
            continue

        if not current:
            current = [stripped]
            continue

        current.append(stripped)

    if current:
        entries.append(" ".join(current))

    return entries


def default_param_description(name: str) -> str:
    defaults = {
        "sandbox": "Sandbox ID or object.",
        "path": "Path used by this operation.",
        "path_to_project": "Project path inside the sandbox.",
        "http_timeout": "Optional HTTP request timeout in seconds for this SDK call.",
        "files": "Files used by this operation.",
        "language_id": "Language identifier for the LSP operation.",
        "uri": "Document URI.",
        "text": "Full document text.",
        "version": "Document version number.",
        "line": "Zero-based line number.",
        "character": "Zero-based character offset.",
        "remote": 'Remote name (default ``"origin"``).',
        "branch": "Branch name.",
        "set_upstream": "Set upstream tracking.",
        "username": "Auth username.",
        "password": "Auth password or token.",
        "message": "Commit message.",
        "author": "Author name.",
        "email": "Author email.",
        "allow_empty": "Allow creating an empty commit.",
        "context_lines": "Number of context lines to include.",
        "target": "Branch, tag, or commit to compare against.",
        "create": "Create the branch if it does not exist.",
        "name": "Name used by this operation.",
        "max_count": "Maximum number of results to return.",
        "start_timestamp": "Start timestamp filter.",
        "end_timestamp": "End timestamp filter.",
        "checkout": "Switch to the new branch immediately.",
        "base_branch": "Base branch or revision.",
        "url": "Repository URL.",
        "commit_id": "Specific commit to use for this operation.",
        "depth": "Shallow clone depth.",
        "branch_type": 'Filter by ``"local"``, ``"remote"``, or ``"all"``.',
        "contains": "Only include branches containing this commit SHA.",
        "not_contains": "Exclude branches containing this commit SHA.",
        "rebase": "Rebase instead of merge.",
    }
    return defaults.get(name, "Parameter for this operation.")


def normalize_arg_entries(entries: list[str], parameters: list[str]) -> list[str]:
    by_name: dict[str, str] = {}
    for entry in entries:
        name, _, description = entry.partition(":")
        param_name = name.strip()
        if param_name not in parameters or param_name in by_name:
            continue
        by_name[param_name] = description.strip() or default_param_description(param_name)

    normalized: list[str] = []
    for param_name in parameters:
        description = by_name.get(param_name, default_param_description(param_name))
        normalized.append(f"{param_name}: {description}")
    return normalized


def normalize_return_entries(entries: list[str], return_type: str) -> list[str]:
    if not entries:
        return [f"{return_type}: Result returned by this operation."] if return_type else []

    normalized: list[str] = []
    for entry in entries:
        entry_type, _, description = entry.partition(":")
        if return_type and entry_type.strip() == "object" and description.strip() == "Result returned by this operation.":
            normalized.append(f"{return_type}: Result returned by this operation.")
            continue
        if entry not in normalized:
            normalized.append(entry)
    return normalized


def split_docstring_sections(docstring: str) -> tuple[str, list[tuple[str, list[str]]]]:
    if not docstring:
        return "", []

    lines = docstring.splitlines()
    description: list[str] = []
    ordered_sections: list[str] = []
    section_entries: dict[str, list[str]] = {}
    index = 0

    while index < len(lines):
        line = lines[index]
        header = line.lstrip()
        if header in SECTION_HEADERS:
            section_name = header[:-1]
            if section_name not in section_entries:
                ordered_sections.append(section_name)
                section_entries[section_name] = []

            index += 1
            section_lines: list[str] = []
            while index < len(lines):
                current = lines[index]
                if is_section_header(current):
                    break

                section_lines.append(current)
                index += 1

            section_entries[section_name].extend(parse_section_entries(section_lines))
            continue

        description.append(line)
        index += 1

    while description and not description[-1].strip():
        description.pop()

    sections = [(section_name, section_entries[section_name]) for section_name in ordered_sections if section_entries[section_name]]
    return "\n".join(description).strip(), sections


class ModuleParser:
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.source = file_path.read_text()
        self.tree = ast.parse(self.source)

    def parse_assignments(self, names: list[str]) -> dict[str, str]:
        values: dict[str, str] = {}
        for node in self.tree.body:
            if not isinstance(node, ast.Assign):
                continue
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id in names:
                    values[target.id] = ast.get_source_segment(self.source, node.value) or ast.unparse(node.value)
        return values

    def class_defs(self) -> dict[str, ast.ClassDef]:
        return {
            node.name: node
            for node in self.tree.body
            if isinstance(node, ast.ClassDef)
        }

    def class_doc(self, node: ast.ClassDef) -> str:
        return ast.get_docstring(node, clean=True) or ""

    def class_base(self, node: ast.ClassDef) -> str:
        if not node.bases:
            return "Exception"
        return ast.unparse(node.bases[0])

    def methods(self, node: ast.ClassDef) -> list[dict[str, object]]:
        methods: list[dict[str, object]] = []
        for child in node.body:
            if not isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            name = child.name
            signature = self.format_signature(child)
            methods.append(
                {
                    "name": name,
                    "signature": signature,
                    "parameters": self.method_parameters(child),
                    "return_type": ast.unparse(child.returns) if child.returns is not None else "",
                    "docstring": ast.get_docstring(child, clean=True) or "",
                }
            )
        return methods

    def method_parameters(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> list[str]:
        args = list(node.args.posonlyargs) + list(node.args.args) + list(node.args.kwonlyargs)
        params = [arg.arg for arg in args if arg.arg not in {"self", "cls"}]
        if node.args.vararg is not None:
            params.append(node.args.vararg.arg)
        if node.args.kwarg is not None:
            params.append(node.args.kwarg.arg)
        return params

    def format_signature(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
        args = node.args
        pieces: list[str] = []

        positional = list(args.posonlyargs) + list(args.args)
        if positional and positional[0].arg in {"self", "cls"}:
            positional = positional[1:]

        positional_defaults = [None] * (len(positional) - len(args.defaults)) + list(args.defaults)

        for arg, default in zip(positional, positional_defaults):
            pieces.append(self.format_arg(arg, default))

        if args.posonlyargs:
            pieces.append("/")

        if args.vararg is not None:
            pieces.append(f"*{self.format_arg(args.vararg, None, include_name_only=True)}")
        elif args.kwonlyargs:
            pieces.append("*")

        for arg, default in zip(args.kwonlyargs, args.kw_defaults):
            pieces.append(self.format_arg(arg, default))

        if args.kwarg is not None:
            pieces.append(f"**{self.format_arg(args.kwarg, None, include_name_only=True)}")

        params = ", ".join(piece for piece in pieces if piece)
        signature = f"{node.name}({params})"
        if node.returns is not None:
            signature += f" -> {ast.unparse(node.returns)}"
        if isinstance(node, ast.AsyncFunctionDef):
            signature = f"async {signature}"
        return signature

    def format_arg(self, arg: ast.arg, default: ast.expr | None, *, include_name_only: bool = False) -> str:
        piece = arg.arg
        if arg.annotation is not None:
            piece += f": {ast.unparse(arg.annotation)}"
        if include_name_only:
            return piece
        if default is not None:
            piece += f" = {ast.unparse(default)}"
        return piece


def write_page(file_path: Path, lines: list[str]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text("\n".join(lines).rstrip() + "\n")


def build_index_page(output_root: Path) -> None:
    write_page(
        output_root / "index.mdx",
        [
            "---",
            "title: Python SDK Reference",
            "description: Auto-generated reference for the Leap0 Python SDK.",
            "---",
            "",
            "## Overview",
            "",
            "The Leap0 Python SDK provides synchronous and asynchronous clients for sandbox lifecycle, files, git, process execution, PTY sessions, LSP, SSH, code interpreter, desktop automation, snapshots, and templates.",
            "",
            "## Installation",
            "",
            "```text",
            "pip install leap0",
            "```",
            "",
            "## Getting Started",
            "",
            "```python",
            "from leap0 import Leap0Client",
            "",
            "client = Leap0Client()",
            "sandbox = client.sandboxes.create()",
            "print(sandbox.id)",
            "```",
            "",
            "Use the sidebar to browse shared defaults, errors, sync clients, and async clients.",
        ],
    )


def build_defaults_page(sdk_root: Path, output_root: Path) -> None:
    config_values = ModuleParser(sdk_root / "leap0/models/config.py").parse_assignments(COMMON_CONSTANTS)
    env_values = ModuleParser(sdk_root / "leap0/constants.py").parse_assignments(COMMON_ENV_VARS)
    lines = [
        "---",
        "title: Defaults",
        "description: Shared defaults and environment variables for the Leap0 Python SDK.",
        "---",
        "",
        "## Default Values",
        "",
    ]
    for name in COMMON_CONSTANTS:
        if name in config_values:
            lines.append(f"- `{name}`: `{md_escape(config_values[name])}`")
    lines.extend(["", "## Environment Variables", ""])
    for name in COMMON_ENV_VARS:
        if name in env_values:
            lines.append(f"- `{name}`: `{md_escape(env_values[name])}`")

    write_page(output_root / "common/defaults.mdx", lines)


def build_errors_page(sdk_root: Path, output_root: Path, github_base: str) -> None:
    parser = ModuleParser(sdk_root / "leap0/models/errors.py")
    classes = parser.class_defs()
    lines = [
        "---",
        "title: Errors",
        "description: Exception types exposed by the Leap0 Python SDK.",
        "---",
        "",
        f"Source: [`leap0/models/errors.py`]({github_base}/leap0/models/errors.py)",
        "",
        "## Exception Hierarchy",
        "",
    ]

    for class_name in ERROR_CLASSES:
        node = classes.get(class_name)
        if node is None:
            continue
        lines.extend([
            f"### `{class_name}`",
            "",
            f"Extends `{md_escape(parser.class_base(node))}`.",
            "",
        ])
        docstring = parser.class_doc(node)
        if docstring:
            lines.extend([md_escape(docstring), ""])

    write_page(output_root / "common/errors.mdx", lines)


def build_class_pages(section: str, modules: list[tuple[str, list[str]]], sdk_root: Path, output_root: Path, github_base: str) -> None:
    for relative_path, class_names in modules:
        parser = ModuleParser(sdk_root / relative_path)
        classes = parser.class_defs()

        for class_name in class_names:
            node = classes.get(class_name)
            if node is None:
                continue

            methods = parser.methods(node)
            init_method = next((method for method in methods if method["name"] == "__init__"), None)
            public_methods = [method for method in methods if not str(method["name"]).startswith("_")]

            lines = [
                "---",
                f"title: {class_name}",
                f"description: Auto-generated reference for {class_name}.",
                "---",
                "",
                f"Source: [`{relative_path}`]({github_base}/{relative_path})",
                "",
            ]

            if init_method is not None:
                lines.extend(["## Signature", "", "```python", md_escape(str(init_method["signature"]).replace("__init__", class_name, 1)), "```", ""])

            class_doc = parser.class_doc(node)
            if class_doc:
                lines.extend(["## Overview", "", md_escape(class_doc), ""])

            if public_methods:
                lines.extend(["## Methods", ""])

            for method in public_methods:
                description, sections = split_docstring_sections(str(method["docstring"]))
                method_parameters = list(method["parameters"])
                return_type = str(method["return_type"])
                lines.extend([f"### `{method['name']}`", "", "```python", md_escape(str(method["signature"])), "```", ""])
                if description:
                    lines.extend([md_escape(description), ""])

                rendered_returns = False
                for section_name, entries in sections:
                    if section_name == "Args":
                        entries = normalize_arg_entries(entries, method_parameters)
                    elif section_name == "Returns":
                        entries = normalize_return_entries(entries, return_type)
                        rendered_returns = True
                    else:
                        entries = list(dict.fromkeys(entries))

                    if not entries:
                        continue

                    lines.extend([f"{section_name}:"])
                    for entry in entries:
                        lines.append(f"    {md_escape(entry)}")
                    lines.append("")

                if return_type and not rendered_returns:
                    lines.extend(["Returns:", f"    {md_escape(return_type)}: Result returned by this operation.", ""])

            write_page(output_root / section / f"{slugify(class_name)}.mdx", lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", required=True)
    args = parser.parse_args()

    output_root = Path(args.output_root)
    with tempfile.TemporaryDirectory(prefix="leap0-python-") as temp_dir:
        sdk_root = Path(temp_dir) / "repo"
        git_bin = shutil.which("git")
        if git_bin is None:
            raise RuntimeError("git executable not found on PATH")

        subprocess.run(
            [git_bin, "clone", "--depth", "1", "--branch", GITHUB_REF, GITHUB_REPO, str(sdk_root)],
            check=True,
        )

        if output_root.exists():
            shutil.rmtree(output_root)

        build_index_page(output_root)
        build_defaults_page(sdk_root, output_root)
        build_errors_page(sdk_root, output_root, GITHUB_BASE)
        build_class_pages("sync", SYNC_MODULES, sdk_root, output_root, GITHUB_BASE)
        build_class_pages("async", ASYNC_MODULES, sdk_root, output_root, GITHUB_BASE)


if __name__ == "__main__":
    main()
