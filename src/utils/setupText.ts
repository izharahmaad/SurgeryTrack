import React from 'react';
import { Text, TextInput } from 'react-native';
import { FONTS } from '@/constants';

// @ts-ignore
const oldTextRender = Text.render;
// @ts-ignore
Text.render = function (...args) {
  const origin = oldTextRender.call(this, ...args);
  return React.cloneElement(origin, {
    style: [{ fontFamily: FONTS.regular }, origin.props.style],
  });
};

// @ts-ignore
const oldInputRender = TextInput.render;
// @ts-ignore
TextInput.render = function (...args) {
  const origin = oldInputRender.call(this, ...args);
  return React.cloneElement(origin, {
    style: [{ fontFamily: FONTS.regular }, origin.props.style],
  });
};