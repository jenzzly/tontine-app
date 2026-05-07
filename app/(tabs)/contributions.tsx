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
import { contributionService } from '@/services/contributionService';
import { memberService } from '@/services/memberService';
import { useAuthStore } from '@/context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '@/utils/theme';
import { Contribution, Member } from '@/types';
import { DollarSign, Plus, Search, X, Trash2, Edit2 } from 'lucide-react-native';

export default function ContributionsScreen() {
  const { user } = useAuthStore();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [contribs, membersData] = await Promise.all([
        contributionService.getAllContributions(),
        memberService.getActiveMembers(),
      ]);
      setContributions(contribs);
      setMembers(membersData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = async () => {
    if (!selectedMemberId || !amount) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    try {
      await contributionService.recordContribution({
        memberId: selectedMemberId,
        memberName: member.fullName,
        amount: parseFloat(amount),
        paymentMethod,
        recordedBy: user?.id || '',
        notes: notes || undefined,
      });

      // Update member total
      await memberService.updateMemberContribution(selectedMemberId, parseFloat(amount));

      Alert.alert('Success', 'Contribution recorded successfully');
      resetForm();
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteContribution = (contribution: Contribution) => {
    Alert.alert(
      'Confirm Delete',
      `Delete this contribution of ${contribution.amount.toLocaleString()} FCFA?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contributionService.deleteContribution(contribution.id);
              Alert.alert('Success', 'Contribution deleted');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedMemberId('');
    setAmount('');
    setPaymentMethod('cash');
    setNotes('');
  };

  const filteredContributions = contributions.filter(c =>
    c.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalContributions = filteredContributions.reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const canManage = user?.role === 'admin' || user?.role === 'management';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contributions</Text>
        <Text style={styles.subtitle}>
          Total: {totalContributions.toLocaleString()} FCFA ({filteredContributions.length} records)
        </Text>
      </View>

      {canManage && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Record Contribution</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by member name..."
          placeholderTextColor={colors.textLight}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView style={styles.list}>
        {filteredContributions.map((contribution) => (
          <View key={contribution.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <DollarSign size={20} color={colors.white} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardMember}>{contribution.memberName}</Text>
                <Text style={styles.cardAmount}>{contribution.amount.toLocaleString()} FCFA</Text>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardDetail}>
                Method: {contribution.paymentMethod.toUpperCase()}
              </Text>
              <Text style={styles.cardDetail}>
                Date: {new Date(contribution.date).toLocaleDateString()}
              </Text>
              {contribution.notes && (
                <Text style={styles.cardNote}>Note: {contribution.notes}</Text>
              )}
            </View>
            {canManage && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteContribution(contribution)}
              >
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {filteredContributions.length === 0 && (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No contributions found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Contribution</Text>
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

              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Method *</Text>
                <View style={styles.methodSelect}>
                  {(['cash', 'momo', 'bank_transfer'] as const).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodOption,
                        paymentMethod === method && styles.methodOptionSelected,
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.methodOptionText,
                          paymentMethod === method && styles.methodOptionTextSelected,
                        ]}
                      >
                        {method === 'cash' ? 'Cash' : method === 'momo' ? 'MoMo' : 'Bank Transfer'}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddContribution}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, height: 44, fontSize: fontSize.md, color: colors.text, marginLeft: spacing.sm },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: { flex: 1 },
  cardMember: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardAmount: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.success, marginTop: 2 },
  cardDetails: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  cardDetail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardNote: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  deleteButton: { position: 'absolute', top: spacing.md, right: spacing.md, padding: spacing.xs },
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
  methodSelect: { flexDirection: 'row', gap: spacing.sm },
  methodOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  methodOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodOptionText: { fontSize: fontSize.sm, color: colors.textSecondary },
  methodOptionTextSelected: { color: colors.white, fontWeight: '600' },
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
});
