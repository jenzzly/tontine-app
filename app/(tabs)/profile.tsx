import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { colors, spacing, fontSize, borderRadius } from '@/utils/theme';
import { User, LogOut, Mail, Phone, Shield, Edit2, Save, X } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = async () => {
    try {
      await updateUser({ fullName, phone });
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCancel = () => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: '#DCD6FF', text: '#4F46E5' };
      case 'management':
        return { bg: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: '#D1FAE5', text: '#059669' };
    }
  };

  const roleColors = getRoleBadgeColor(user?.role || 'member');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <User size={48} color={colors.primary} />
        </View>
        <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
          <Text style={[styles.roleText, { color: roleColors.text }]}>
            {user?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Account Information</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
              <Edit2 size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleCancel} style={styles.actionButton}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
                <Save size={18} color={colors.success} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <View style={styles.fieldIcon}>
            <Mail size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.fieldIcon}>
            <Phone size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Phone</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.phone || 'Not provided'}</Text>
            )}
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.fieldIcon}>
            <Shield size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.fullName || 'Not provided'}</Text>
            )}
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.fieldIcon}>
            <Shield size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Role</Text>
            <Text style={styles.fieldValue}>{user?.role.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.permissionsCard}>
        <Text style={styles.cardTitle}>Your Permissions</Text>
        {user?.role === 'admin' && (
          <>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ Manage all members</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ Record and delete contributions</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ Approve/reject loans</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ View all reports</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ Export reports (PDF/CSV)</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ System settings</Text>
            </View>
          </>
        )}
        {user?.role === 'management' && (
          <>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ View all members</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ Record contributions</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ Approve/reject loans</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ View and export reports</Text>
            </View>
          </>
        )}
        {user?.role === 'member' && (
          <>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ View own contributions</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ Request loans</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionText}>✓ View own loan status</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SCDT Tontine Management System</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  avatarSection: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  roleText: { fontSize: fontSize.xs, fontWeight: '600' },
  card: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  editButton: { padding: spacing.sm },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { padding: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 2 },
  fieldValue: { fontSize: fontSize.sm, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 40,
  },
  permissionsCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  permissionItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  permissionText: { fontSize: fontSize.sm, color: colors.text },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  logoutText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '600' },
  footer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  footerText: { fontSize: fontSize.sm, color: colors.textSecondary },
  footerVersion: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs },
});
