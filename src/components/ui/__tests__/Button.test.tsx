import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import Button from '../Button';
import { theme } from '../../../styles/theme';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(
      <Button title="Press me" onPress={() => {}} />
    );
    
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Press me" onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('Press me'));
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Press me" onPress={onPressMock} disabled />
    );
    
    fireEvent.press(getByText('Press me'));
    
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Press me" onPress={() => {}} loading />
    );
    
    // Title should not be visible when loading
    expect(queryByText('Press me')).toBeNull();
    expect(getByTestId('button-loading')).toBeTruthy();
  });

  it.each([
    ['sm', 36],
    ['md', 44],
    ['lg', 50],
  ] as const)('uses a fixed height for the %s size', (size, height) => {
    const { getByRole } = render(
      <Button title="Sized button" onPress={() => {}} size={size} />
    );

    expect(StyleSheet.flatten(getByRole('button').props.style)).toMatchObject({
      height,
    });
  });

  it('renders a destructive variant', () => {
    const { getByRole, getByText } = render(
      <Button title="Delete" onPress={() => {}} variant="destructive" />
    );

    expect(StyleSheet.flatten(getByRole('button').props.style)).toMatchObject({
      backgroundColor: theme.colors.error,
    });
    expect(StyleSheet.flatten(getByText('Delete').props.style)).toMatchObject({
      color: theme.colors.onPrimary,
    });
  });

  it('renders optional leading and trailing icons', () => {
    const { getByTestId } = render(
      <Button
        title="Continue"
        onPress={() => {}}
        leadingIcon={<Text testID="leading-icon">Before</Text>}
        trailingIcon={<Text testID="trailing-icon">After</Text>}
      />
    );

    expect(getByTestId('leading-icon')).toBeTruthy();
    expect(getByTestId('trailing-icon')).toBeTruthy();
  });

  it('passes through a custom accessibility label', () => {
    const { getByLabelText } = render(
      <Button
        title="Accept"
        onPress={() => {}}
        accessibilityLabel="Accept invitation"
      />
    );

    expect(getByLabelText('Accept invitation')).toBeTruthy();
  });

  it.each(['outline', 'ghost'] as const)(
    'keeps the disabled %s variant transparent',
    (variant) => {
      const { getByRole } = render(
        <Button
          title="Unavailable"
          onPress={() => {}}
          variant={variant}
          disabled
        />
      );

      expect(StyleSheet.flatten(getByRole('button').props.style)).toMatchObject({
        backgroundColor: 'transparent',
      });
    }
  );

  it('hides icons while loading', () => {
    const { queryByTestId } = render(
      <Button
        title="Continue"
        onPress={() => {}}
        loading
        leadingIcon={<Text testID="leading-icon">Before</Text>}
        trailingIcon={<Text testID="trailing-icon">After</Text>}
      />
    );

    expect(queryByTestId('leading-icon')).toBeNull();
    expect(queryByTestId('trailing-icon')).toBeNull();
  });
});
