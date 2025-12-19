import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const lineCountCache = new Map<string, number>();
const fileSizeCache = new Map<string, number>();
const decorationCache = new Map<string, vscode.FileDecoration>();
const folderLineCountCache = new Map<string, number>();

let fileWatcher: { dispose: () => void } | undefined;
let debounceTimer: NodeJS.Timeout | undefined;
let isInitializing = false;

const DEFAULT_CONFIG = {
  sizeLimit: 5000000,
  batchSize: 200,
  debounceDelay: 300,
  initialScanDelay: 5000,
  estimationFactor: 50,
  maxFolderFiles: 10000,
};

const SKIPPED_FOLDERS = [
  'node_modules', '.git', 'dist', 'build', 'out', 'bin', 'obj',
  '.vscode', '.idea', '.vs', 'vendor', 'coverage', '.next', '.nuxt',
  'public/assets', 'static/assets', 'target', '.sass-cache', '.cache',
];

const SKIP_EXTENSIONS = [
  '.exe', '.dll', '.obj', '.bin', '.jpg', '.jpeg', '.png', '.gif',
  '.mp3', '.mp4', '.zip', '.gz', '.tar', '.pdf', '.class', '.pyc',
  '.pyd', '.so', '.dylib', '.o', '.a', '.lib', '.woff', '.woff2',
  '.ttf', '.eot', '.svg', '.ico', '.bmp', '.tiff', '.webp',
];

const CODE_FILE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.less',
  '.go', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.rs',
  '.json', '.yaml', '.yml', '.xml', '.md', '.txt',
];

const CODE_GLOB = `**/*.{${CODE_FILE_EXTENSIONS.map((ext) => ext.slice(1)).join(',')}}`;
const EXCLUDE_GLOB = '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/out/**,**/.vscode/**,**/bin/**,**/obj/**,**/.idea/**,**/.vs/**,**/vendor/**,**/coverage/**}';

async function countLines(filePath: string): Promise<number> {
  try {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      return 0;
    }

    const cachedSize = fileSizeCache.get(filePath);
    const cachedCount = lineCountCache.get(filePath);
    if (cachedSize === stats.size && cachedCount !== undefined) {
      return cachedCount;
    }

    fileSizeCache.set(filePath, stats.size);

    if (stats.size === 0) {
      lineCountCache.set(filePath, 0);
      return 0;
    }

    if (stats.size > DEFAULT_CONFIG.sizeLimit) {
      const estimate = Math.floor(stats.size / DEFAULT_CONFIG.estimationFactor);
      lineCountCache.set(filePath, estimate);
      return estimate;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (SKIP_EXTENSIONS.includes(ext)) {
      lineCountCache.set(filePath, 0);
      return 0;
    }

    try {
      const count = await countLinesWithReadStream(filePath);
      lineCountCache.set(filePath, count);
      return count;
    } catch (error) {
      console.error(`LineLens: error reading file ${filePath}`, error);
      return 0;
    }
  } catch (error) {
    lineCountCache.delete(filePath);
    fileSizeCache.delete(filePath);
    console.error(`LineLens: error accessing ${filePath}`, error);
    return 0;
  }
}

async function countLinesWithReadStream(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath, {
      encoding: 'utf8',
      highWaterMark: 128 * 1024,
    });

    let lineCount = 0;
    let sawData = false;
    let lastChar = '\n';

    readStream.on('data', (chunk: string) => {
      sawData = true;
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === '\n') {
          lineCount++;
        }
      }
      lastChar = chunk[chunk.length - 1] ?? lastChar;
    });

    readStream.on('end', () => {
      if (sawData && lastChar !== '\n') {
        lineCount++;
      }
      resolve(lineCount);
    });

    readStream.on('error', (err) => {
      reject(err);
    });
  });
}

function formatLineCount(count: number): string {
  if (count >= 1000000) {
    return `${Math.floor(count / 1000000)}M`;
  }
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}K`;
  }
  if (count >= 100) {
    return `${Math.floor(count / 100)}H`;
  }
  return count.toString();
}

function shouldSkipFolder(folderPath: string): boolean {
  for (const folder of SKIPPED_FOLDERS) {
    const folderPattern = `${path.sep}${folder}${path.sep}`;
    const endPattern = `${path.sep}${folder}`;
    if (folderPath.includes(folderPattern) || folderPath.endsWith(endPattern)) {
      return true;
    }
  }
  return false;
}

function shouldSkipFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (SKIP_EXTENSIONS.includes(ext)) {
    return true;
  }

  if (CODE_FILE_EXTENSIONS.includes(ext)) {
    return false;
  }

  const cachedSize = fileSizeCache.get(filePath);
  if (cachedSize && cachedSize > DEFAULT_CONFIG.sizeLimit) {
    return true;
  }

  return true;
}

function invalidateFolderCounts(filePath: string) {
  let current = path.dirname(filePath);
  while (true) {
    folderLineCountCache.delete(current);
    decorationCache.delete(current);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
}

async function countFolderLines(folderPath: string): Promise<number> {
  if (shouldSkipFolder(folderPath)) {
    return 0;
  }

  try {
    const includePattern = new vscode.RelativePattern(folderPath, CODE_GLOB);
    const files = await vscode.workspace.findFiles(
      includePattern,
      EXCLUDE_GLOB,
      DEFAULT_CONFIG.maxFolderFiles,
    );

    let total = 0;
    for (let i = 0; i < files.length; i += DEFAULT_CONFIG.batchSize) {
      const batch = files.slice(i, i + DEFAULT_CONFIG.batchSize);
      const counts = await Promise.all(batch.map((uri) => countLines(uri.fsPath)));
      for (const count of counts) {
        total += count;
      }
    }

    folderLineCountCache.set(folderPath, total);
    return total;
  } catch (error) {
    console.error(`LineLens: error counting folder ${folderPath}`, error);
    return 0;
  }
}

async function initializeDecorations(provider: LineLensDecorationProvider) {
  if (isInitializing) {
    return;
  }
  isInitializing = true;

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    isInitializing = false;
    return;
  }

  vscode.window.showInformationMessage('LineLens is counting lines in your files...');
  vscode.window.setStatusBarMessage('LineLens: Initializing...', 2000);

  setTimeout(async () => {
    for (const folder of workspaceFolders) {
      try {
        const highPriorityPattern = '**/*.{js,jsx,ts,tsx,py,java,c,cpp,cs,go}';
        const lowPriorityPattern = '**/*.{html,css,scss,less,php,rb,rs,json,yaml,yml,xml,md,txt}';

        const highPriorityFiles = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, highPriorityPattern),
          EXCLUDE_GLOB,
          1000,
        );

        await processBatchesWithDelay(highPriorityFiles, provider, 100, 50);

        const lowPriorityFiles = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, lowPriorityPattern),
          EXCLUDE_GLOB,
          5000,
        );

        await processBatchesWithDelay(lowPriorityFiles, provider, DEFAULT_CONFIG.batchSize, 100);
      } catch (error) {
        console.error(`LineLens: error initializing ${folder.uri.fsPath}`, error);
      }
    }

    isInitializing = false;
    vscode.window.showInformationMessage('LineLens is ready!');
  }, DEFAULT_CONFIG.initialScanDelay);
}

async function processBatchesWithDelay(
  files: vscode.Uri[],
  provider: LineLensDecorationProvider,
  batchSize: number,
  delayMs: number,
): Promise<void> {
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    if (i % 1000 === 0 && i > 0) {
      vscode.window.setStatusBarMessage(`LineLens: Processing files (${i}/${files.length})...`, 2000);
    }
    provider.refresh(batch, { invalidate: true });
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

class LineLensDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  private processingQueue = new Map<string, Promise<number>>();
  private folderProcessingQueue = new Map<string, Promise<number>>();
  private lastUpdate = 0;
  private pendingUpdates = new Set<string>();

  async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    if (uri.scheme !== 'file') {
      return undefined;
    }

    const filePath = uri.fsPath;
    const existingDecoration = decorationCache.get(filePath);
    if (existingDecoration) {
      return existingDecoration;
    }

    try {
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        if (shouldSkipFolder(filePath)) {
          return undefined;
        }

        const cachedFolderCount = folderLineCountCache.get(filePath);
        if (cachedFolderCount !== undefined) {
          const formattedCount = formatLineCount(cachedFolderCount);
          const decoration = new vscode.FileDecoration(
            formattedCount,
            `${cachedFolderCount} lines in folder`,
          );
          decorationCache.set(filePath, decoration);
          return decoration;
        }

        let countPromise = this.folderProcessingQueue.get(filePath);
        if (!countPromise) {
          countPromise = countFolderLines(filePath).then((count) => {
            this.folderProcessingQueue.delete(filePath);
            const formattedCount = formatLineCount(count);
            const decoration = new vscode.FileDecoration(
              formattedCount,
              `${count} lines in folder`,
            );
            decorationCache.set(filePath, decoration);
            this.refresh(vscode.Uri.file(filePath), { invalidate: false });
            return count;
          }).catch((err) => {
            console.error(`LineLens: error counting folder ${filePath}`, err);
            this.folderProcessingQueue.delete(filePath);
            return 0;
          });
          this.folderProcessingQueue.set(filePath, countPromise);
        }

        return undefined;
      }

      if (!stat.isFile()) {
        return undefined;
      }

      if (shouldSkipFile(filePath)) {
        return undefined;
      }

      if (stat.size === 0) {
        const zeroDecoration = new vscode.FileDecoration('0', '0 lines');
        decorationCache.set(filePath, zeroDecoration);
        lineCountCache.set(filePath, 0);
        return zeroDecoration;
      }

      const cachedSize = fileSizeCache.get(filePath);
      const cachedCount = lineCountCache.get(filePath);
      if (cachedSize === stat.size && cachedCount !== undefined) {
        const formattedCount = formatLineCount(cachedCount);
        const decoration = new vscode.FileDecoration(
          formattedCount,
          `${cachedCount} lines`,
        );
        decorationCache.set(filePath, decoration);
        return decoration;
      }

      fileSizeCache.set(filePath, stat.size);

      if (stat.size > DEFAULT_CONFIG.sizeLimit) {
        const estimate = Math.floor(stat.size / DEFAULT_CONFIG.estimationFactor);
        lineCountCache.set(filePath, estimate);
        const formattedCount = formatLineCount(estimate);
        const decoration = new vscode.FileDecoration(
          formattedCount,
          `~${estimate} lines (estimated)`,
        );
        decorationCache.set(filePath, decoration);
        return decoration;
      }

      let lineCount = cachedCount;
      if (lineCount === undefined) {
        let countPromise = this.processingQueue.get(filePath);
        if (!countPromise) {
          countPromise = countLines(filePath).then((count) => {
            this.processingQueue.delete(filePath);
            return count;
          }).catch((err) => {
            console.error(`LineLens: error counting lines in ${filePath}`, err);
            this.processingQueue.delete(filePath);
            return 0;
          });
          this.processingQueue.set(filePath, countPromise);
        }
        lineCount = await countPromise;
      }

      const formattedCount = formatLineCount(lineCount);
      const decoration = new vscode.FileDecoration(
        formattedCount,
        `${lineCount} lines`,
      );
      decorationCache.set(filePath, decoration);
      return decoration;
    } catch (error) {
      console.error(`LineLens: error providing decoration for ${filePath}`, error);
      return undefined;
    }
  }

  refresh(resources?: vscode.Uri | vscode.Uri[], options: { invalidate?: boolean } = {}) {
    const invalidate = options.invalidate !== false;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (resources && !Array.isArray(resources)) {
      this.pendingUpdates.add(resources.fsPath);
      if (invalidate) {
        lineCountCache.delete(resources.fsPath);
        decorationCache.delete(resources.fsPath);
        folderLineCountCache.delete(resources.fsPath);
      }
    } else if (Array.isArray(resources)) {
      resources.forEach((uri) => {
        this.pendingUpdates.add(uri.fsPath);
        if (invalidate) {
          lineCountCache.delete(uri.fsPath);
          decorationCache.delete(uri.fsPath);
          folderLineCountCache.delete(uri.fsPath);
        }
      });
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdate;

    if (timeSinceLastUpdate < DEFAULT_CONFIG.debounceDelay && !isInitializing) {
      debounceTimer = setTimeout(() => {
        this.flushUpdates();
      }, DEFAULT_CONFIG.debounceDelay - timeSinceLastUpdate);
    } else {
      this.flushUpdates();
    }
  }

  private flushUpdates() {
    if (this.pendingUpdates.size === 0) {
      this._onDidChangeFileDecorations.fire([]);
      return;
    }

    const updates: vscode.Uri[] = [];
    this.pendingUpdates.forEach((fsPath) => {
      updates.push(vscode.Uri.file(fsPath));
    });

    this.pendingUpdates.clear();
    this.lastUpdate = Date.now();
    this._onDidChangeFileDecorations.fire(updates);
  }
}

function setupFileWatcher(context: vscode.ExtensionContext, provider: LineLensDecorationProvider) {
  if (fileWatcher) {
    fileWatcher.dispose();
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  const watchers: vscode.FileSystemWatcher[] = [];

  for (const folder of workspaceFolders) {
    const highPriorityPattern = new vscode.RelativePattern(
      folder,
      '**/*.{js,jsx,ts,tsx,py,java,c,cpp,cs,go}',
    );

    const watcher = vscode.workspace.createFileSystemWatcher(highPriorityPattern, false, true, false);

    watcher.onDidCreate((uri: vscode.Uri) => {
      if (uri.scheme !== 'file' || shouldSkipFile(uri.fsPath)) {
        return;
      }
      invalidateFolderCounts(uri.fsPath);
      queueUpdate(uri, provider);
      queueUpdate(vscode.Uri.file(path.dirname(uri.fsPath)), provider);
    });

    watcher.onDidDelete((uri: vscode.Uri) => {
      lineCountCache.delete(uri.fsPath);
      decorationCache.delete(uri.fsPath);
      fileSizeCache.delete(uri.fsPath);
      invalidateFolderCounts(uri.fsPath);
      queueUpdate(vscode.Uri.file(path.dirname(uri.fsPath)), provider);
    });

    context.subscriptions.push(watcher);
    watchers.push(watcher);

    const lowPriorityPattern = new vscode.RelativePattern(
      folder,
      '**/*.{html,css,scss,less,php,rb,rs,json,yaml,yml,xml,md,txt}',
    );

    const lowPriorityWatcher = vscode.workspace.createFileSystemWatcher(lowPriorityPattern, false, true, false);

    lowPriorityWatcher.onDidCreate((uri: vscode.Uri) => {
      if (uri.scheme !== 'file' || shouldSkipFile(uri.fsPath)) {
        return;
      }
      invalidateFolderCounts(uri.fsPath);
      queueUpdate(uri, provider, 500);
      queueUpdate(vscode.Uri.file(path.dirname(uri.fsPath)), provider, 500);
    });

    lowPriorityWatcher.onDidDelete((uri: vscode.Uri) => {
      lineCountCache.delete(uri.fsPath);
      decorationCache.delete(uri.fsPath);
      fileSizeCache.delete(uri.fsPath);
      invalidateFolderCounts(uri.fsPath);
      queueUpdate(vscode.Uri.file(path.dirname(uri.fsPath)), provider, 500);
    });

    context.subscriptions.push(lowPriorityWatcher);
    watchers.push(lowPriorityWatcher);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors((editors) => {
      editors.forEach((editor) => {
        const uri = editor.document.uri;
        if (uri.scheme === 'file' && !shouldSkipFile(uri.fsPath)) {
          invalidateFolderCounts(uri.fsPath);
          queueUpdate(uri, provider, 100);
        }
      });
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const uri = document.uri;
      if (uri.scheme === 'file' && !shouldSkipFile(uri.fsPath)) {
        invalidateFolderCounts(uri.fsPath);
        queueUpdate(uri, provider, 150);
        queueUpdate(vscode.Uri.file(path.dirname(uri.fsPath)), provider, 150);
      }
    }),
  );

  fileWatcher = {
    dispose: () => {
      watchers.forEach((w) => w.dispose());
    },
  };
}

function queueUpdate(
  uri: vscode.Uri,
  provider: LineLensDecorationProvider,
  delay: number = DEFAULT_CONFIG.debounceDelay,
) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    provider.refresh(uri, { invalidate: true });
  }, delay);
}

export function registerLineLens(context: vscode.ExtensionContext) {
  const provider = new LineLensDecorationProvider();
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(provider),
  );

  setTimeout(() => {
    setupFileWatcher(context, provider);
    initializeDecorations(provider);
  }, 2000);

  const refreshCommand = vscode.commands.registerCommand('linelens.refresh', async () => {
    lineCountCache.clear();
    fileSizeCache.clear();
    decorationCache.clear();
    folderLineCountCache.clear();
    await initializeDecorations(provider);
  });

  context.subscriptions.push(refreshCommand);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      setTimeout(() => {
        setupFileWatcher(context, provider);
        initializeDecorations(provider);
      }, 5000);
    }),
  );
}

export function disposeLineLens() {
  lineCountCache.clear();
  decorationCache.clear();
  fileSizeCache.clear();
  folderLineCountCache.clear();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (fileWatcher) {
    fileWatcher.dispose();
  }
}
