import * as assert from 'assert';
import * as childProcess from 'child_process';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execFile = promisify(childProcess.execFile);

suite('Report analysis', () => {
  test('does not follow a directory symlink while building the tree', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'graphy-report-test-'));
    const workspace = path.join(fixture, 'workspace');
    const loop = path.join(workspace, 'loop');
    const source = path.join(workspace, 'source.txt');
    const fileLink = path.join(workspace, 'linked.txt');
    const pythonScript = path.join(__dirname, '..', '..', 'server', 'main.py');

    await fs.mkdir(workspace);
    await fs.symlink('.', loop, 'dir');
    await fs.writeFile(source, 'outside the report through a link');
    await fs.symlink(source, fileLink, 'file');

    try {
      const { stdout } = await execFile('python3', [pythonScript, workspace]);
      const result = JSON.parse(stdout) as {
        files: string[];
        directories: string[];
        structure_tree: Record<string, unknown>;
      };

      assert.deepStrictEqual(result.files, [source]);
      assert.deepStrictEqual(result.directories, []);
      assert.deepStrictEqual(result.structure_tree, { 'source.txt': 'source.txt' });
    } finally {
      await fs.rm(fixture, { recursive: true, force: true });
    }
  });
});
