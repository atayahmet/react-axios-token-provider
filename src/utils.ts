import get from '@util-funcs/object-get';
import { AxiosResponse } from 'axios';
import { IPathVariants, Keys } from './types';

export const mergePathVariants = (baseVariants: IPathVariants, variants: IPathVariants): IPathVariants => {
  const keys = Object.keys(baseVariants) as Keys[];
  let paths = {};

  while (keys.length > 0) {
    const key = keys.shift();

    if (!key || !(key in baseVariants)) {
      continue;
    }

    const prevPaths = baseVariants[key] || [];
    const customPaths = variants[key] || [];
    const uniquePaths = new Set([...prevPaths, ...customPaths]);
    paths = { ...paths, [key]: [...uniquePaths] };
  }

  return paths;
};

export const prepareTokens = (pathVariants: IPathVariants, response: AxiosResponse) => {
  const keys = Object.keys(pathVariants);
  let tokens = {};

  while (keys.length > 0) {
    const key = keys.shift() || '';
    const variants = get(key, pathVariants, []);

    for (const variant of variants) {
      const result = get(variant, response);

      if (result) {
        tokens = { ...tokens, [key]: result };
        break;
      }
    }
  }

  return tokens;
};
