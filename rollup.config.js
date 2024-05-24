import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/ruto.min.js',
            name: 'ruto',
            format: 'umd',
            sourcemap: true,
            plugins: [terser()],
        },
        {
            file: 'dist/ruto.cjs.js',
            format: 'cjs',
            sourcemap: true,
        },
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
        }),
    ],
};
