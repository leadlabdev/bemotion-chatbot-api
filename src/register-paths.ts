import { register } from 'tsconfig-paths';

// Registrar os caminhos do tsconfig para resolução em runtime
register({
  baseUrl: '.',
  paths: {
    'src/*': ['./dist/*'], // IMPORTANTE: Aponta para ./dist/* em vez de ./src/*
  },
});
