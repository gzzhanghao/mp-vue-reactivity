import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import swc from '@rollup/plugin-swc';
import { defineConfig } from 'rollup';

/**
 * @return {import('rollup').RollupOptions}
 */
function getConfig(config) {
  const postfix = config.dev ? '' : '.prod';
  return {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/index.esm${postfix}.js`,
        format: 'esm',
      },
      {
        file: `dist/index.cjs${postfix}.js`,
        format: 'cjs',
      },
    ],
    external: ['@vue/reactivity'],
    plugins: [
      swc(),
      replace({
        preventAssignment: true,
        values: {
          __DEV__: config.dev,
        },
      }),
      nodeResolve({
        extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
      }),
    ],
  };
}

export default defineConfig(
  [
    {
      dev: true,
    },
    {
      dev: false,
    },
  ].map(getConfig),
);
