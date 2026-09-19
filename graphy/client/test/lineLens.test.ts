import * as assert from 'assert';
import { isCountableFile } from '../linelens/LineLens';

suite('LineLens', () => {
  test('counts extensionless dotfiles in folder totals', () => {
    assert.strictEqual(isCountableFile('.gitignore'), true);
    assert.strictEqual(isCountableFile('.env'), true);
  });

  test('continues to count supported text files and skip binary files', () => {
    assert.strictEqual(isCountableFile('README.md'), true);
    assert.strictEqual(isCountableFile('notes.txt'), true);
    assert.strictEqual(isCountableFile('logo.png'), false);
  });
});
