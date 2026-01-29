import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

const textStyle = tva({
  base: 'text-typography-900',
  variants: {
    size: {
      '2xs': 'text-2xs',
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
    weight: {
      thin: 'font-thin',
      extralight: 'font-extralight',
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
      black: 'font-black',
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'normal',
  },
});

type ITextProps = RNTextProps &
  VariantProps<typeof textStyle> & {
    className?: string;
  };

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, ITextProps>(
  function Text({ className, size = 'md', weight = 'normal', ...props }, ref) {
    return (
      <RNText
        ref={ref}
        {...props}
        className={textStyle({ size, weight, class: className })}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text };

