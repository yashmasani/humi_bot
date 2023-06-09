const mockInstallObject = {
  team: { id: 'T012345678', name: 'example-team-name' },
  enterprise: undefined,
  user: { token: undefined, scopes: undefined, id: 'U01234567' },
  tokenType: 'bot',
  isEnterpriseInstall: false,
  appId: 'A01234567',
  authVersion: 'v2',
  bot: {
    scopes: [
      'chat:write',
    ],
    token: 'xoxb-244493-28244493123-as123etsetts',
    userId: 'U012345678',
    id: 'B01234567'
  }
};

module.exports = {
  mockInstallObject
};
