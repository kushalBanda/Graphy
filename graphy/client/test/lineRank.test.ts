import * as assert from 'assert';
import * as vscode from 'vscode';
import { LineRankProvider, LineRankItem } from '../linelens/LineRankProvider';

suite('LineRank', () => {
  test('extension activates and registers the refresh command', async () => {
    const ext = vscode.extensions.getExtension('kushalBanda.graphy');
    assert.ok(ext, 'extension not found');
    await ext!.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('graphy.refreshRank'), 'refresh command not registered');
  });

  test('root items are ranked by line count and end with a Total row', async () => {
    const provider = new LineRankProvider();
    const items = await provider.getChildren();

    assert.ok(items.length > 1, 'expected root entries plus a total row');

    const entries = items.filter((item) => item.kind === 'entry');
    for (let i = 1; i < entries.length; i++) {
      const prevLines = Number(String(entries[i - 1].tooltip).replace(/[^\d]/g, ''));
      const currLines = Number(String(entries[i].tooltip).replace(/[^\d]/g, ''));
      assert.ok(prevLines >= currLines, 'entries are not sorted descending by line count');
    }

    const total = items[items.length - 1];
    assert.strictEqual(total.kind, 'total');
    assert.ok(String(total.description).includes('lines'));
  });

  test('expanding a folder returns a non-empty language breakdown', async () => {
    const provider = new LineRankProvider();
    const items = await provider.getChildren();
    const folder = items.find(
      (item): item is LineRankItem => item.kind === 'entry' && item.isDirectory === true,
    );
    assert.ok(folder, 'expected at least one folder entry at the workspace root');

    const children = await provider.getChildren(folder);
    assert.ok(children.length > 0, 'expected at least one language row');
    assert.ok(children.every((child) => child.kind === 'language'));
  });
});
