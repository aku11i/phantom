import { describe, it, mock, before } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';

describe('createRuin', () => {
  let existsSyncMock: any;
  let mkdirSyncMock: any;
  let execSyncMock: any;
  let createRuin: any;

  before(async () => {
    existsSyncMock = mock.fn(() => false);
    mkdirSyncMock = mock.fn();
    execSyncMock = mock.fn((cmd: string) => {
      if (cmd === 'git rev-parse --show-toplevel') {
        return '/test/repo\n';
      }
      if (cmd.startsWith('git worktree add')) {
        return '';
      }
      return '';
    });

    mock.module('node:fs', {
      namedExports: {
        existsSync: existsSyncMock,
        mkdirSync: mkdirSyncMock,
      },
    });

    mock.module('node:child_process', {
      namedExports: {
        execSync: execSyncMock,
      },
    });

    ({ createRuin } = await import('./create.ts'));
  });

  it('should return error when name is not provided', () => {
    const result = createRuin('');
    strictEqual(result.success, false);
    strictEqual(result.message, 'Error: ruin name required');
  });

  it('should create ruin directory when it does not exist', () => {
    existsSyncMock.mock.resetCalls();
    mkdirSyncMock.mock.resetCalls();
    execSyncMock.mock.resetCalls();
    
    existsSyncMock.mock.mockImplementation(() => false);
    execSyncMock.mock.mockImplementation((cmd: string) => {
      if (cmd === 'git rev-parse --show-toplevel') {
        return '/test/repo\n';
      }
      if (cmd.startsWith('git worktree add')) {
        return '';
      }
      return '';
    });

    const result = createRuin('test-ruin');

    strictEqual(result.success, true);
    strictEqual(result.message, 'Created ruin \'test-ruin\' at /test/repo/.git/phantom/ruins/test-ruin');
    strictEqual(result.path, '/test/repo/.git/phantom/ruins/test-ruin');
    
    strictEqual(mkdirSyncMock.mock.calls.length, 1);
    deepStrictEqual(mkdirSyncMock.mock.calls[0].arguments, [
      '/test/repo/.git/phantom/ruins',
      { recursive: true }
    ]);
    
    strictEqual(execSyncMock.mock.calls.length, 2);
    strictEqual(execSyncMock.mock.calls[0].arguments[0], 'git rev-parse --show-toplevel');
    strictEqual(execSyncMock.mock.calls[1].arguments[0], 'git worktree add "/test/repo/.git/phantom/ruins/test-ruin" -b "phantom/ruins/test-ruin" HEAD');
  });

  it('should return error when ruin already exists', () => {
    existsSyncMock.mock.resetCalls();
    mkdirSyncMock.mock.resetCalls();
    execSyncMock.mock.resetCalls();
    
    existsSyncMock.mock.mockImplementation((path: string) => {
      if (path === '/test/repo/.git/phantom/ruins') return true;
      if (path === '/test/repo/.git/phantom/ruins/existing-ruin') return true;
      return false;
    });
    execSyncMock.mock.mockImplementation((cmd: string) => {
      if (cmd === 'git rev-parse --show-toplevel') {
        return '/test/repo\n';
      }
      return '';
    });

    const result = createRuin('existing-ruin');

    strictEqual(result.success, false);
    strictEqual(result.message, 'Error: ruin \'existing-ruin\' already exists');
  });

  it('should handle git command errors', () => {
    existsSyncMock.mock.resetCalls();
    mkdirSyncMock.mock.resetCalls();
    execSyncMock.mock.resetCalls();
    
    execSyncMock.mock.mockImplementation(() => {
      throw new Error('Not a git repository');
    });

    const result = createRuin('test-ruin');

    strictEqual(result.success, false);
    strictEqual(result.message, 'Error creating ruin: Not a git repository');
  });

  it('should not create ruins directory if it already exists', () => {
    existsSyncMock.mock.resetCalls();
    mkdirSyncMock.mock.resetCalls();
    execSyncMock.mock.resetCalls();
    
    existsSyncMock.mock.mockImplementation((path: string) => {
      return path === '/test/repo/.git/phantom/ruins';
    });
    execSyncMock.mock.mockImplementation((cmd: string) => {
      if (cmd === 'git rev-parse --show-toplevel') {
        return '/test/repo\n';
      }
      if (cmd.startsWith('git worktree add')) {
        return '';
      }
      return '';
    });

    const result = createRuin('test-ruin');

    strictEqual(result.success, true);
    strictEqual(mkdirSyncMock.mock.calls.length, 0);
  });
});