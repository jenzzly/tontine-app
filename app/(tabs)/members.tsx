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
import { memberService } from '@/services/memberService';
import { colors, spacing, fontSize, borderRadius } from '@/utils/theme';
import { Member } from '@/types';
import { Users, Plus, Search, Edit2, Trash2, X } from 'lucide-react-native';

export default function MembersScreen() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const canManage = user?.role === 'admin' || user?.role === 'management';

  useFocusEffect(
    React.useCallback(() => {
      loadMembers();
    }, [])
  );

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await memberService.getAllMembers();
      setMembers(data.filter(m => m.isActive));
    } catch (error) {
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!fullName || !phone) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await memberService.createMember({
        fullName,
        phone,
        email: email || undefined,
        address: address || undefined,
        joinedDate: new Date(),
        isActive: true,
        totalContributed: 0,
        totalBorrowed: 0,
        loanBalance: 0,
        outstandingBalance: 0,
      });
      
      Alert.alert('Success', 'Member added successfully');
      resetForm();
      loadMembers();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    
    if (!fullName || !phone) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await memberService.updateMember(editingMember.id, {
        fullName,
        phone,
        email: email || undefined,
        address: address || undefined,
      });
      
      Alert.alert('Success', 'Member updated successfully');
      resetForm();
      loadMembers();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteMember = (member: Member) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to deactivate ${member.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await memberService.deleteMember(member.id);
              Alert.alert('Success', 'Member deactivated');
              loadMembers();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFullName(member.fullName);
    setPhone(member.phone);
    setEmail(member.email || '');
    setAddress(member.address || '');
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingMember(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
  };

  const filteredMembers = members.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

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
        <Text style={styles.title}>Members</Text>
        <Text style={styles.subtitle}>{filteredMembers.length} active members</Text>
      </View>

      {canManage && (
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add Member</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
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
        {filteredMembers.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberCard}
            onPress={() => router.push(`/members/${member.id}`)}
          >
            <View style={styles.memberInfo}>
              <View style={styles.avatar}>
                <Users size={24} color={colors.primary} />
              </View>
              <View style={styles.details}>
                <Text style={styles.memberName}>{member.fullName}</Text>
                <Text style={styles.memberPhone}>{member.phone}</Text>
                <View style={styles.stats}>
                  <Text style={styles.stat}>Contributed: {member.totalContributed.toLocaleString()} FCFA</Text>
                  <Text style={styles.stat}>Borrowed: {member.totalBorrowed.toLocaleString()} FCFA</Text>
                </View>
              </View>
            </View>
            
            {canManage && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(member)}
                >
                  <Edit2 size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMember(member)}
                >
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {filteredMembers.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email (optional)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter address (optional)"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={editingMember ? handleUpdateMember : handleAddMember}
              >
                <Text style={styles.saveButtonText}>
                  {editingMember ? 'Update' : 'Save'}
                </Text>
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
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 44, fontSize: fontSize.md, color: colors.text },
  list: { flex: 1, paddingHorizontal: spacing.lg },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  details: { flex: 1 },
  memberName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  memberPhone: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  stat: { fontSize: fontSize.xs, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  editButton: { padding: spacing.sm },
  deleteButton: { padding: spacing.sm },
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
