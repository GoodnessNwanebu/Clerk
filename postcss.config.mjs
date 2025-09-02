import postcssColorFunctionalNotation from 'postcss-color-functional-notation';
import postcssOKLabFunction from '@csstools/postcss-oklab-function';

export default {
  plugins: {
    'postcss-color-functional-notation': {},
    '@csstools/postcss-oklab-function': {},
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
  },
};
