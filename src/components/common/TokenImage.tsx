import {
  HorizontalFlex,
  LoadingIcon,
  Typography,
} from '@avalabs/react-components';
import { useEffect, useState } from 'react';
import { useTheme } from 'styled-components';

const TOKEN_IMAGE_BORDER_RADIUS = '50%';
const TOKEN_IMAGE_DFEAULT_SIZE = '32px';

const getTokenIconInitials = (name: string) => {
  const names = name?.split(' ');
  const initials =
    names.length > 1
      ? names[0].substring(0, 1) + names[names.length - 1].substring(0, 1)
      : names[0].substring(0, 1);

  return initials;
};

export function TokenIcon({
  src,
  children,
  width,
  height,
  name,
  ...rest
}: {
  src?: string;
  children?: any;
  width?: string;
  height?: string;
  name?: string;
  [x: string]: any;
}) {
  const theme = useTheme();
  const [state, setState] = useState<{ success?: boolean; error?: boolean }>();

  useEffect(() => {
    new Promise((resolve, reject) => {
      if (!src) {
        reject('no source value');
        return;
      }

      const img = document.createElement('img');
      img.onerror = (err) => {
        reject(err);
      };
      img.onload = () => {
        resolve(img);
      };
      img.src = src;
    })
      .then(() => {
        setState({ success: true });
      })
      .catch(() => {
        setState({ error: true });
      });
  }, [name, src]);

  if (!state) {
    return (
      <HorizontalFlex
        justify={'center'}
        align={'center'}
        radius={TOKEN_IMAGE_BORDER_RADIUS}
        background={`${theme.colors.disabled}CC`}
        width={width || TOKEN_IMAGE_DFEAULT_SIZE}
        height={height || TOKEN_IMAGE_DFEAULT_SIZE}
        style={{ flexShrink: 0 }}
        {...rest}
      >
        <LoadingIcon height={'5px'} />
      </HorizontalFlex>
    );
  }

  if (state.success) {
    return (
      <HorizontalFlex
        as="img"
        src={src}
        width={width || TOKEN_IMAGE_DFEAULT_SIZE}
        height={height || TOKEN_IMAGE_DFEAULT_SIZE}
        radius={TOKEN_IMAGE_BORDER_RADIUS}
        style={{ flexShrink: 0 }}
        {...rest}
      />
    );
  }

  if (state.error) {
    const logoText = name ? getTokenIconInitials(name) : '';
    return (
      /** Children here is so that a custom fallback element can be used */
      children ?? (
        <HorizontalFlex
          radius={TOKEN_IMAGE_BORDER_RADIUS}
          background={`${theme.colors.disabled}CC`}
          width={width || TOKEN_IMAGE_DFEAULT_SIZE}
          height={height || TOKEN_IMAGE_DFEAULT_SIZE}
          style={{ flexShrink: 0 }}
          justify="center"
          align="center"
          {...rest}
        >
          <Typography align="center" size={12}>
            {logoText}
          </Typography>
        </HorizontalFlex>
      )
    );
  }
}
