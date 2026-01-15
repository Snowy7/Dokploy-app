import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  variant?: 'default' | 'subtle' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevated = false,
  variant = 'default',
}) => {
  const Container = onPress ? TouchableOpacity : View;

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'subtle':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 0,
        };
      case 'bordered':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        };
    }
  };

  return (
    <Container
      style={[
        styles.card,
        getVariantStyles(),
        elevated && styles.elevated,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    overflow: 'hidden',
  },
  elevated: {
    borderColor: theme.colors.border,
  },
});
