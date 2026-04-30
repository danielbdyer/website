// Conventional Commits — keeps commit messages structurally
// consistent so future agents (and tools like changelog generators)
// can read the history. Type list keeps the project's actual register;
// `voice` is added to type list because some commits change copy
// without changing behavior, and `feat:` would be a lie.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'voice',
        'tooling',
      ],
    ],
    // Subject sentence-case is fine; the body and footer earn the
    // discipline.
    'subject-case': [0],
    // Header max length — soft 100, hard 120. Long single-line
    // subjects are sometimes the right call here; we don't ratchet.
    'header-max-length': [1, 'always', 120],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
