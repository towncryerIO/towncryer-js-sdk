module.exports = {
    branches: [
      '+([0-9])?(.{+([0-9]),x}).x',
      'main',
      {
        name: 'develop',
        prerelease: 'beta'
      },
      {
        name: 'feature/*',
        prerelease: 'alpha'
      },
      {
        name: 'fix/*',
        prerelease: 'rc'
      }
    ],
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      '@semantic-release/changelog',
      ['@semantic-release/npm', { 
        npmPublish: false 
      }],
      ['@semantic-release/git', {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }],
      '@semantic-release/github'
    ]
}
