import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface StatItem {
  color: string;
  label: string;
  value?: number;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  stats?: StatItem[];
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  stats,
}) => (
  <View style={styles.container}>
    <View style={styles.textContainer}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {stats && stats.length > 0 && (
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statBadge}>
              <View style={[styles.statDot, { backgroundColor: stat.color }]} />
              <Text style={styles.statText}>
                {stat.value !== undefined ? `${stat.value} ${stat.label}` : stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
    {rightAction}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
