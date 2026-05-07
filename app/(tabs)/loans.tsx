import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useAuthStore } from '@/context/AuthContext';
import { loanService } from '@/services/loanService';
import { memberService } from '@/services/memberService';
import { colors, spacing, fontSize, borderRadius } from '@/utils/theme';
import { Loan, Member } from '@/types';
import { DollarSign, Plus, Search, X, Check, XCircle, Clock, AlertTriangle } from 'lucide-react-native';

export default function LoansScreen() {
  const { user } = useAuthStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'overdue'>('all');

  // Form state for new loan
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('5');
  const [durationMonths, setDurationMonths] = useState('3');
  const [notes, setNotes] = useState('');

  // Approval state
  const [approvalReason, setApprovalReason] = useState('');

  const canManage = user?.role === 'admin' || user?.role === 'management';

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [loansData, membersData] = await Promise.all([
        loanService.getAllLoans(),
        memberService.getActiveMembers(),
      ]);
      setLoans(loansData);
      setMembers(membersData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async () => {
    if (!selectedMemberId || !amount) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate) / 100;
    const duration = parseInt(durationMonths);
    const totalRepayment = principal * (1 + rate * duration);
    const monthlyPayment = totalRepayment / duration;

    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + duration);

    try {
      await loanService.createLoanRequest({
        memberId: selectedMemberId,
        memberName: member.fullName,
        amount: principal,
        interestRate: parseFloat(interestRate),
        durationMonths: duration,
        monthlyPayment,
        totalRepayment,
        requestDate: startDate,
        dueDate,
        remainingBalance: totalRepayment,
        paidAmount: 0,
        penalty: 0,
        notes: notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Loan request created successfully');
      resetForm();
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleApproveLoan = async (approved: boolean) => {
    if (!selectedLoan) return;

    try {
      if (approved) {
        await loanService.approveLoan(selectedLoan.id, user?.id || '');
        Alert.alert('Success', 'Loan approved');
      } else {
        await loanService.rejectLoan(selectedLoan.id, user?.id || '', approvalReason || 'Not approved');
        Alert.alert('Success', 'Loan rejected');
      }
      setShowApprovalModal(false);
      setSelectedLoan(null);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const openApprovalModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setApprovalReason('');
    setShowApprovalModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedMemberId('');
    setAmount('');
    setInterestRate('5');
    setDurationMonths('3');
    setNotes('');
  };

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true;
    return loan.status === filter;
  });

  const pendingLoans = loans.filter(l => l.status === 'pending').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#D97706', icon: Clock };
      case 'approved': return { bg: '#DBEAFE', text: '#2563EB', icon: Clock };
      case 'active': return { bg: '#D1FAE5', text: '#059669', icon: Check };
      case 'completed': return { bg: '#E5E7EB', text: '#6B7280', icon: Check };
      case 'overdue': return { bg: '#FEE2E2', text: '#DC2626', icon: AlertTriangle };
      case 'rejected': return { bg: '#FEE2E2', text: '#DC2626', icon: XCircle };
      default: return { bg: '#E5E7EB', text: '#6B7280', icon: Clock };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loans</Text>
        <Text style={styles.subtitle}>
          {pendingLoans > 0 && `${pendingLoans} pending approval • `}
          {filteredLoans.length} total loans
        </Text>
      </View>

      {canManage && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.addButtonText}>New Loan Request</Text>
        </TouchableOpacity>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'active', 'overdue'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.list}>
        {filteredLoans.map((loan) => {
          const statusStyle = getStatusColor(loan.status);
          const StatusIcon = statusStyle.icon;
          
          return (
            <TouchableOpacity
              key={loan.id}
              style={styles.card}
              onPress={() => router.push(`/loans/${loan.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardMember}>{loan.memberName}</Text>
                  <Text style={styles.cardAmount}>{loan.amount.toLocaleString()} FCFA</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <StatusIcon size={14} color={statusStyle.text} />
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {loan.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Interest:</Text>
                  <Text style={styles.detailValue}>{loan.interestRate}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{loan.durationMonths} months</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining:</Text>
                  <Text style={styles.detailValue}>{loan.remainingBalance.toLocaleString()} FCFA</Text>
                </View>
                {loan.penalty > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, styles.dangerText]}>Penalty:</Text>
                    <Text style={[styles.detailValue, styles.dangerText]}>
                      {loan.penalty.toLocaleString()} FCFA
                    </Text>
                  </View>
                )}
              </View>

              {loan.status === 'pending' && canManage && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => openApprovalModal(loan)}
                  >
                    <Check size={16} color={colors.white} />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => openApprovalModal(loan)}
                  >
                    <XCircle size={16} color={colors.white} />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredLoans.length === 0 && (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No loans found</Text>
          </View>
        )}
      </ScrollView>

      {/* New Loan Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Loan Request</Text>
              <TouchableOpacity onPress={resetForm}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Member *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.memberSelect}>
                    {members.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.memberOption,
                          selectedMemberId === member.id && styles.memberOptionSelected,
                        ]}
                        onPress={() => setSelectedMemberId(member.id)}
                      >
                        <Text
                          style={[
                            styles.memberOptionText,
                            selectedMemberId === member.id && styles.memberOptionTextSelected,
                          ]}
                        >
                          {member.fullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount (FCFA) *</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.label}>Interest Rate (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.label}>Duration (Months)</Text>
                  <TextInput
                    style={styles.input}
                    value={durationMonths}
                    onChangeText={setDurationMonths}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleCreateLoan}>
                <Text style={styles.saveButtonText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approval Modal */}
      <Modal visible={showApprovalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedLoan ? `${selectedLoan.memberName}'s Loan` : ''}
              </Text>
              <TouchableOpacity onPress={() => { setShowApprovalModal(false); setSelectedLoan(null); }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedLoan && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Amount:</Text>
                    <Text style={styles.infoValue}>{selectedLoan.amount.toLocaleString()} FCFA</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Repayment:</Text>
                    <Text style={styles.infoValue}>{selectedLoan.totalRepayment.toLocaleString()} FCFA</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Due Date:</Text>
                    <Text style={styles.infoValue}>{new Date(selectedLoan.dueDate).toLocaleDateString()}</Text>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Rejection Reason (if rejecting)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={approvalReason}
                      onChangeText={setApprovalReason}
                      placeholder="Enter reason for rejection..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButtonModal]}
                onPress={() => handleApproveLoan(false)}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.approveButtonModal]}
                onPress={() => handleApproveLoan(true)}
              >
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  addButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  filterScroll: { marginBottom: spacing.md },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.textSecondary },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardMember: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardAmount: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.primary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '600' },
  cardDetails: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  detailLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  detailValue: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text },
  dangerText: { color: colors.danger },
  actionButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  approveButton: { backgroundColor: colors.success },
  rejectButton: { backgroundColor: colors.danger },
  actionButtonText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text },
  modalForm: { padding: spacing.lg },
  formGroup: { marginBottom: spacing.md },
  formRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  formHalf: { flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 48,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  memberSelect: { flexDirection: 'row', gap: spacing.sm },
  memberOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberOptionText: { fontSize: fontSize.sm, color: colors.textSecondary },
  memberOptionTextSelected: { color: colors.white, fontWeight: '600' },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.background },
  cancelButtonText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  saveButton: { backgroundColor: colors.primary },
  saveButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  approveButtonModal: { backgroundColor: colors.success },
  approveText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  rejectButtonModal: { backgroundColor: colors.danger },
  rejectText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
});
