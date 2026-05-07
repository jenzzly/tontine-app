import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '@/context/AuthContext';
import { colors, spacing, fontSize, commonStyles } from '@/utils/theme';
import { User, DollarSign, TrendingUp, AlertCircle } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuthStore();

  // Mock data - will be replaced with real data from hooks
  const stats = {
    totalMembers: 15,
    totalContributions: 2500000,
    activeLoans: 3,
    availableBalance: 1800000,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.fullName || 'User'}</Text>
        <Text style={styles.role}>{user?.role.toUpperCase()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <DollarSign size={24} color={colors.white} />
          <Text style={styles.statValue}>{stats.totalContributions.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Contributions (FCFA)</Text>
        </View>

        <View style={[styles.statCard, styles.successCard]}>
          <User size={24} color={colors.white} />
          <Text style={styles.statValue}>{stats.totalMembers}</Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </View>

        <View style={[styles.statCard, styles.warningCard]}>
          <TrendingUp size={24} color={colors.white} />
          <Text style={styles.statValue}>{stats.activeLoans}</Text>
          <Text style={styles.statLabel}>Active Loans</Text>
        </View>

        <View style={[styles.statCard, styles.infoCard]}>
          <DollarSign size={24} color={colors.white} />
          <Text style={styles.statValue}>{stats.availableBalance.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Available Balance (FCFA)</Text>
        </View>
      </View>

      {(user?.role === 'admin' || user?.role === 'management') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Record Contribution</Text>
              <Text style={styles.actionSubtitle}>Add new payment</Text>
            </View>
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Review Loans</Text>
              <Text style={styles.actionSubtitle}>Pending approvals</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    backgroundColor: colors.primary,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.9,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xs,
  },
  role: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: 12,
    ...commonStyles.shadowSm,
  },
  primaryCard: {
    backgroundColor: colors.primary,
  },
  successCard: {
    backgroundColor: colors.success,
  },
  warningCard: {
    backgroundColor: colors.warning,
  },
  infoCard: {
    backgroundColor: colors.info,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    ...commonStyles.shadowSm,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
