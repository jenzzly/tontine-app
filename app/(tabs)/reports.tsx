import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/context/AuthContext';
import { reportService } from '@/services/reportService';
import { memberService } from '@/services/memberService';
import { contributionService } from '@/services/contributionService';
import { loanService } from '@/services/loanService';
import { colors, spacing, fontSize, borderRadius } from '@/utils/theme';
import { FileText, Download, PieChart, DollarSign, Users, TrendingUp } from 'lucide-react-native';

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadReportData();
    }, [])
  );

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [members, contributions, loans] = await Promise.all([
        memberService.getAllMembers(),
        contributionService.getAllContributions(),
        loanService.getAllLoans(),
      ]);

      const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
      const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
      const completedLoans = loans.filter(l => l.status === 'completed');
      const overdueLoans = loans.filter(l => l.status === 'overdue');
      const totalLoanBalance = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
      const totalPenalties = overdueLoans.reduce((sum, l) => sum + l.penalty, 0);

      setReportData({
        totalMembers: members.filter(m => m.isActive).length,
        totalContributions,
        activeLoansCount: activeLoans.length,
        completedLoansCount: completedLoans.length,
        overdueLoansCount: overdueLoans.length,
        totalLoanBalance,
        totalPenalties,
        availableBalance: totalContributions - totalLoanBalance,
        memberContributions: members.map(m => ({
          name: m.fullName,
          contributed: m.totalContributed,
          borrowed: m.totalBorrowed,
          balance: m.loanBalance,
        })),
        loans: activeLoans.map(l => ({
          member: l.memberName,
          amount: l.amount,
          remaining: l.remainingBalance,
          status: l.status,
          dueDate: new Date(l.dueDate).toLocaleDateString(),
        })),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportData) return;

    setGeneratingPdf(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
              h1 { color: #4F46E5; }
              h2 { color: #374151; margin-top: 20px; }
              .stat { display: inline-block; margin: 10px; padding: 15px; background: #F3F4F6; border-radius: 8px; }
              .stat-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
              .stat-label { font-size: 12px; color: #6B7280; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
              th { background: #F9FAFB; font-weight: 600; }
              .footer { margin-top: 30px; text-align: center; color: #9CA3AF; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>SCDT Tontine Report</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            
            <h2>Summary</h2>
            <div class="stat"><div class="stat-value">${reportData.totalMembers}</div><div class="stat-label">Active Members</div></div>
            <div class="stat"><div class="stat-value">${reportData.totalContributions.toLocaleString()}</div><div class="stat-label">Total Contributions (FCFA)</div></div>
            <div class="stat"><div class="stat-value">${reportData.availableBalance.toLocaleString()}</div><div class="stat-label">Available Balance (FCFA)</div></div>
            <div class="stat"><div class="stat-value">${reportData.activeLoansCount}</div><div class="stat-label">Active Loans</div></div>
            <div class="stat"><div class="stat-value">${reportData.overdueLoansCount}</div><div class="stat-label">Overdue Loans</div></div>
            
            <h2>Member Contributions</h2>
            <table>
              <tr><th>Name</th><th>Contributed</th><th>Borrowed</th><th>Balance</th></tr>
              ${reportData.memberContributions.map((m: any) => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.contributed.toLocaleString()}</td>
                  <td>${m.borrowed.toLocaleString()}</td>
                  <td>${m.balance.toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
            
            <h2>Active Loans</h2>
            ${reportData.loans.length > 0 ? `
              <table>
                <tr><th>Member</th><th>Amount</th><th>Remaining</th><th>Status</th><th>Due Date</th></tr>
                ${reportData.loans.map((l: any) => `
                  <tr>
                    <td>${l.member}</td>
                    <td>${l.amount.toLocaleString()}</td>
                    <td>${l.remaining.toLocaleString()}</td>
                    <td>${l.status.toUpperCase()}</td>
                    <td>${l.dueDate}</td>
                  </tr>
                `).join('')}
              </table>
            ` : '<p>No active loans</p>'}
            
            <div class="footer">
              <p>SCDT Tontine Management System</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const canViewReports = user?.role === 'admin' || user?.role === 'management';

  if (!canViewReports) {
    return (
      <View style={styles.container}>
        <View style={styles.restrictedContainer}>
          <FileText size={64} color={colors.textLight} />
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedText}>
            Only Admin and Management Team can view reports.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!reportData) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <FileText size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>SCDT Tontine Summary</Text>
      </View>

      <TouchableOpacity
        style={[styles.exportButton, generatingPdf && styles.exportButtonDisabled]}
        onPress={generatePDF}
        disabled={generatingPdf}
      >
        <Download size={20} color={colors.white} />
        <Text style={styles.exportButtonText}>
          {generatingPdf ? 'Generating...' : 'Export PDF'}
        </Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Users size={24} color={colors.primary} />
          <Text style={styles.statValue}>{reportData.totalMembers}</Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </View>

        <View style={styles.statCard}>
          <DollarSign size={24} color={colors.success} />
          <Text style={styles.statValue}>{reportData.totalContributions.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Contributions</Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={24} color={colors.warning} />
          <Text style={styles.statValue}>{reportData.activeLoansCount}</Text>
          <Text style={styles.statLabel}>Active Loans</Text>
        </View>

        <View style={styles.statCard}>
          <PieChart size={24} color={colors.info} />
          <Text style={styles.statValue}>{reportData.availableBalance.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Available Balance</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member Contributions</Text>
        {reportData.memberContributions.map((member: any, index: number) => (
          <View key={index} style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
            </View>
            <View style={styles.memberStats}>
              <Text style={styles.memberStat}>
                Contributed: {member.contributed.toLocaleString()}
              </Text>
              <Text style={styles.memberStat}>
                Borrowed: {member.borrowed.toLocaleString()}
              </Text>
              <Text style={[styles.memberStat, member.balance > 0 && styles.dangerText]}>
                Balance: {member.balance.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {reportData.overdueLoansCount > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerText]}>
            Overdue Loans: {reportData.overdueLoansCount}
          </Text>
          <Text style={styles.warningText}>
            Total Penalties: {reportData.totalPenalties.toLocaleString()} FCFA
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  exportButtonDisabled: { opacity: 0.6 },
  exportButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, marginTop: spacing.sm },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  section: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text },
  memberStats: { alignItems: 'flex-end' },
  memberStat: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  dangerText: { color: colors.danger },
  warningText: { fontSize: fontSize.sm, color: colors.warning },
  restrictedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  restrictedTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text, marginTop: spacing.md },
  restrictedText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.md },
});
