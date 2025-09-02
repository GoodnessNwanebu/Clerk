import postcssColorFunctionalNotation from 'postcss-color-functional-notation';
import postcssOKLabFunction from '@csstools/postcss-oklab-function';

export default {
  plugins: [
    postcssColorFunctionalNotation(),
    postcssOKLabFunction(),
    '@tailwindcss/postcss',
    'autoprefixer',
  ],
};
