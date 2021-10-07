const { serializeOptions } = require('./child-process');

describe('child-process', () => {
  describe('#serializeOptions', () => {
    it('converts option object to string', () => {
      expect(
        serializeOptions({
          repo: null,
          checkout: true,
          branch: 'mine',
        }),
      ).toBe('--checkout --branch=mine');
    });
  });
});
