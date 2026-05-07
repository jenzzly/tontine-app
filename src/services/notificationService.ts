import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotificationReceived: async (notification) => {
    console.log('Notification received:', notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
  handleNotificationActionPress: async (response) => {
    console.log('Notification action pressed:', response);
  },
});

export const notificationService = {
  // Request notification permissions
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Get Expo push token
  async getExpoPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  // Schedule a local notification
  async scheduleLocalNotification(title: string, body: string, data?: any, trigger?: Date | number) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger || null,
      });
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  // Send immediate local notification
  async sendLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  },

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  // Save notification to Firestore
  async saveNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: 'contribution' | 'loan' | 'reminder' | 'system';
  }) {
    try {
      await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...notificationData,
        isRead: false,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string) {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
      );
      const querySnapshot = await getDocs(q);
      const notifications: any[] = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        });
      });

      return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all user notifications as read
  async markAllNotificationsAsRead(userId: string) {
    try {
      const notifications = await this.getUserNotifications(userId);
      await Promise.all(
        notifications
          .filter(n => !n.isRead)
          .map(n => this.markNotificationAsRead(n.id))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  // Send contribution reminder notification
  async sendContributionReminder(memberId: string, memberName: string, amount: number) {
    const title = 'Contribution Reminder';
    const body = `${memberName}, please remember to contribute ${amount.toLocaleString()} FCFA`;
    
    // Send local notification
    await this.sendLocalNotification(title, body, { type: 'contribution', memberId });
    
    // Save to Firestore (if user ID is available)
    // This would require mapping memberId to userId
  },

  // Send loan approval notification
  async sendLoanApprovalNotification(memberName: string, amount: number, approved: boolean) {
    const title = approved ? 'Loan Approved' : 'Loan Rejected';
    const body = approved 
      ? `Your loan request of ${amount.toLocaleString()} FCFA has been approved`
      : `Your loan request of ${amount.toLocaleString()} FCFA has been rejected`;
    
    await this.sendLocalNotification(title, body, { type: 'loan', approved });
  },

  // Send overdue loan notification
  async sendOverdueLoanNotification(memberName: string, amount: number, dueDate: Date) {
    const title = 'Overdue Loan Alert';
    const body = `${memberName}, your loan of ${amount.toLocaleString()} FCFA is overdue since ${dueDate.toLocaleDateString()}`;
    
    await this.sendLocalNotification(title, body, { type: 'reminder' });
  },

  // Setup notification listener
  setupNotificationListener(onNotificationReceived?: (notification: any) => void) {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in app:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  },
};
