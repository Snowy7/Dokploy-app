import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ApplicationStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return theme.colors.statusRunning;
      case 'idle':
        return theme.colors.statusIdle;
      case 'error':
        return theme.colors.statusError;
      case 'done':
        return theme.colors.success;
      default:
        return theme.colors.textTertiary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'idle':
        return 'Idle';
      case 'error':
        return 'Error';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  const fontSize = size === 'small' ? theme.fontSize.xs : theme.fontSize.sm;
  const padding = size === 'small' ? theme.spacing.xs : theme.spacing.sm;

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor() + '20', paddingHorizontal: padding, paddingVertical: padding / 2 }]}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <Text style={[styles.text, { color: getStatusColor(), fontSize }]}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.xs,
  },
  text: {
    fontWeight: theme.fontWeight.medium,
  },
});
