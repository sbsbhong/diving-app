const { transformFileSync } = require('@babel/core') as typeof import('@babel/core');

describe('mobile Babel config', () => {
  test('transforms react-stately files used by gluestack Menu', () => {
    expect(() => {
      transformFileSync('../../node_modules/react-stately/dist/private/color/Color.cjs', {
        babelrc: false,
        configFile: './babel.config.js',
      });
    }).not.toThrow();
  });
});
