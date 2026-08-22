import * as vscode from 'vscode';
import * as path from 'path';
import {
  countLines,
  shouldSkipFolder,
  CODE_GLOB,
  EXCLUDE_GLOB,
  LINE_LENS_CONFIG,
} from './LineLens';

type RankNodeKind = 'entry' | 'language' | 'total';

function formatLineCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export class LineRankItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly kind: RankNodeKind,
    public readonly fsPath?: string,
    public readonly isDirectory?: boolean,
    lineCount: number = 0,
  ) {
    super(label, collapsibleState);

    if (kind === 'entry' && fsPath) {
      this.resourceUri = vscode.Uri.file(fsPath);
      this.description = formatLineCount(lineCount);
      this.tooltip = `${lineCount.toLocaleString()} lines`;
      this.contextValue = isDirectory ? 'lineRankFolder' : 'lineRankFile';
      this.iconPath = isDirectory ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;
      if (!isDirectory) {
        this.command = {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [this.resourceUri],
        };
      }
    } else if (kind === 'language') {
      this.description = formatLineCount(lineCount);
      this.tooltip = `${lineCount.toLocaleString()} lines`;
      this.contextValue = 'lineRankLanguage';
    } else if (kind === 'total') {
      this.description = `${lineCount.toLocaleString()} lines`;
      this.contextValue = 'lineRankTotal';
    }
  }
}

async function countFolderLinesForRank(folderPath: string): Promise<number> {
  const includePattern = new vscode.RelativePattern(folderPath, CODE_GLOB);
  const files = await vscode.workspace.findFiles(includePattern, EXCLUDE_GLOB, LINE_LENS_CONFIG.maxFolderFiles);
  let total = 0;
  for (const file of files) {
    total += await countLines(file.fsPath);
  }
  return total;
}

export class LineRankProvider implements vscode.TreeDataProvider<LineRankItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<LineRankItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LineRankItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: LineRankItem): Promise<LineRankItem[]> {
    if (!element) {
      return this.getRootItems();
    }
    if (element.kind === 'entry' && element.fsPath !== undefined) {
      return this.getLanguageBreakdown(element.fsPath, element.isDirectory ?? false);
    }
    return [];
  }

  private async getRootItems(): Promise<LineRankItem[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const root = workspaceFolders[0];

    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(root.uri);
    } catch (error) {
      console.error('LineRank: error reading workspace root', error);
      return [];
    }

    const ranked: { name: string; fsPath: string; isDirectory: boolean; lines: number }[] = [];

    for (const [name, type] of entries) {
      const fsPath = path.join(root.uri.fsPath, name);
      const isDirectory = type === vscode.FileType.Directory;

      if (isDirectory) {
        if (shouldSkipFolder(fsPath)) {
          continue;
        }
        const lines = await countFolderLinesForRank(fsPath);
        if (lines > 0) {
          ranked.push({ name, fsPath, isDirectory: true, lines });
        }
      } else {
        const lines = await countLines(fsPath);
        if (lines > 0) {
          ranked.push({ name, fsPath, isDirectory: false, lines });
        }
      }
    }

    ranked.sort((a, b) => b.lines - a.lines);

    const items = ranked.map(
      (entry) =>
        new LineRankItem(
          entry.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          'entry',
          entry.fsPath,
          entry.isDirectory,
          entry.lines,
        ),
    );

    const total = ranked.reduce((sum, entry) => sum + entry.lines, 0);
    items.push(
      new LineRankItem('Total', vscode.TreeItemCollapsibleState.None, 'total', undefined, undefined, total),
    );

    return items;
  }

  private async getLanguageBreakdown(fsPath: string, isDirectory: boolean): Promise<LineRankItem[]> {
    const breakdown = new Map<string, number>();

    if (isDirectory) {
      const includePattern = new vscode.RelativePattern(fsPath, CODE_GLOB);
      const files = await vscode.workspace.findFiles(includePattern, EXCLUDE_GLOB, LINE_LENS_CONFIG.maxFolderFiles);
      for (const file of files) {
        const ext = path.extname(file.fsPath).toLowerCase() || '(no ext)';
        const lines = await countLines(file.fsPath);
        breakdown.set(ext, (breakdown.get(ext) ?? 0) + lines);
      }
    } else {
      const ext = path.extname(fsPath).toLowerCase() || '(no ext)';
      const lines = await countLines(fsPath);
      breakdown.set(ext, lines);
    }

    return Array.from(breakdown.entries())
      .filter(([, lines]) => lines > 0)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([ext, lines]) =>
          new LineRankItem(ext, vscode.TreeItemCollapsibleState.None, 'language', undefined, undefined, lines),
      );
  }
}

export function registerLineRank(context: vscode.ExtensionContext): LineRankProvider {
  const provider = new LineRankProvider();

  context.subscriptions.push(vscode.window.registerTreeDataProvider('graphyLineRank', provider));

  context.subscriptions.push(
    vscode.commands.registerCommand('graphy.refreshRank', () => provider.refresh()),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => provider.refresh()),
  );

  return provider;
}
