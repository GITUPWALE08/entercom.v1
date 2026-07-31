import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Typography } from '../../components/Typography';

export interface VisitorItem {
  id: string;
  name: string;
  type: 'Guest' | 'Delivery' | 'Contractor';
  code: string;
  status: 'Active' | 'Used' | 'Expired';
  time: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'access' | 'visitor' | 'billing' | 'maintenance';
}

export const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentEstate] = useState('Greenfield Estate • Unit 4B');
  const [activeAccessCode, setActiveAccessCode] = useState('ENT-8492');
  const [codeExpiry, setCodeExpiry] = useState('4 hours remaining');
  const [isGenerating, setIsGenerating] = useState(false);

  const [visitors, setVisitors] = useState<VisitorItem[]>([
    {
      id: '1',
      name: 'Sarah Jenkins',
      type: 'Delivery',
      code: 'VIS-9021',
      status: 'Active',
      time: 'Today, 2:30 PM',
    },
    {
      id: '2',
      name: 'David Miller',
      type: 'Guest',
      code: 'VIS-4481',
      status: 'Active',
      time: 'Today, 6:00 PM',
    },
    {
      id: '3',
      name: 'Marcus Vance',
      type: 'Contractor',
      code: 'VIS-1192',
      status: 'Used',
      time: 'Yesterday, 11:00 AM',
    },
  ]);

  const [activities] = useState<ActivityItem[]>([
    {
      id: 'a1',
      title: 'Main Gate Vehicle Entry',
      subtitle: 'License Plate: KCD-492-X',
      time: '10:14 AM',
      type: 'access',
    },
    {
      id: 'a2',
      title: 'Visitor Pass Shared',
      subtitle: 'Pass #VIS-9021 sent to Sarah Jenkins',
      time: '09:30 AM',
      type: 'visitor',
    },
    {
      id: 'a3',
      title: 'Estate Maintenance Fee Paid',
      subtitle: 'Invoice #INV-2026-07 • $150.00',
      time: 'Jul 28',
      type: 'billing',
    },
  ]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleGenerateNewPass = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setActiveAccessCode(`ENT-${randomNum}`);
      setCodeExpiry('6 hours remaining');
      setIsGenerating(false);
      Alert.alert('Pass Generated', `New dynamic access code: ENT-${randomNum}`);
    }, 600);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Your Entercom access code for ${currentEstate} is: ${activeAccessCode}. Valid for the main security gate.`,
      });
    } catch (error) {
      Alert.alert('Share', `Access Code: ${activeAccessCode}`);
    }
  };

  const handlePreApproveVisitor = () => {
    Alert.alert(
      'Pre-Approve Visitor',
      'Select visitor type to generate instant guest pass:',
      [
        {
          text: 'Guest',
          onPress: () => addVisitor('Guest'),
        },
        {
          text: 'Delivery',
          onPress: () => addVisitor('Delivery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const addVisitor = (type: 'Guest' | 'Delivery') => {
    const newVisitor: VisitorItem = {
      id: Date.now().toString(),
      name: type === 'Guest' ? 'New Guest' : 'Express Delivery',
      type,
      code: `VIS-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Active',
      time: 'Today, Just now',
    };
    setVisitors([newVisitor, ...visitors]);
    Alert.alert('Visitor Approved', `Pass code ${newVisitor.code} has been issued.`);
  };

  const handleCallGuard = () => {
    Alert.alert(
      'Gate Intercom',
      'Connecting to Security Main Control Desk...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Desk', onPress: () => console.log('Dialing security desk...') },
      ]
    );
  };

  return (
    <Screen
      statusBarStyle="dark-content"
      backgroundColor="#F8FAFC"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />
      }
    >
      {/* Top Bar / Estate Selector */}
      <View style={styles.topHeader}>
        <View>
          <Typography variant="caption" color="muted">
            MY HOME
          </Typography>
          <TouchableOpacity style={styles.estateSelector} activeOpacity={0.7}>
            <Typography variant="h3" color="default" style={styles.estateName}>
              {currentEstate}
            </Typography>
            <Typography variant="caption" color="primary">
              ▾
            </Typography>
          </TouchableOpacity>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Typography variant="caption" color="success" weight="600">
            Active
          </Typography>
        </View>
      </View>

      {/* Dynamic Hero Section */}
      <Card variant="dark" padding="lg" style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTagContainer}>
            <Typography variant="label" color="accent">
              GATE INTERCOM PASS
            </Typography>
            <Typography variant="caption" color="muted">
              • {codeExpiry}
            </Typography>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Typography variant="caption" color="white">
              ONLINE
            </Typography>
          </View>
        </View>

        <View style={styles.codeContainer}>
          <Typography variant="caption" color="muted" align="center">
            YOUR DYNAMIC GATE CODE
          </Typography>
          <Typography variant="h1" color="white" align="center" style={styles.codeText}>
            {activeAccessCode}
          </Typography>
          <Typography variant="caption" color="muted" align="center">
            Tap guard keypad or scan at gate reader
          </Typography>
        </View>

        <View style={styles.heroActions}>
          <Button
            title="Refresh Code"
            variant="outline"
            size="sm"
            loading={isGenerating}
            onPress={handleGenerateNewPass}
            style={styles.heroBtnOutline}
          />
          <Button
            title="Share Pass"
            variant="primary"
            size="sm"
            onPress={handleShareCode}
            style={styles.heroBtnPrimary}
          />
        </View>
      </Card>

      {/* Quick Action Grid */}
      <View style={styles.sectionHeader}>
        <Typography variant="h3" color="default">
          Quick Actions
        </Typography>
      </View>

      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={handlePreApproveVisitor}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#EFF6FF' }]}>
            <Typography variant="h2" color="primary">
              👤
            </Typography>
          </View>
          <Typography variant="bodyBold" color="default" align="center" style={styles.gridLabel}>
            Pre-approve Visitor
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={handleCallGuard}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#F0FDF4' }]}>
            <Typography variant="h2" color="success">
              📞
            </Typography>
          </View>
          <Typography variant="bodyBold" color="default" align="center" style={styles.gridLabel}>
            Gate Intercom
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Bookings', 'Opening Amenity Reservation...')}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Typography variant="h2" color="accent">
              🏢
            </Typography>
          </View>
          <Typography variant="bodyBold" color="default" align="center" style={styles.gridLabel}>
            Book Amenity
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Maintenance', 'Opening Service Ticket Manager...')}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#FEF3C7' }]}>
            <Typography variant="h2" color="warning">
              🛠️
            </Typography>
          </View>
          <Typography variant="bodyBold" color="default" align="center" style={styles.gridLabel}>
            Service Ticket
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Pre-Approved Visitors Section */}
      <View style={styles.sectionHeader}>
        <Typography variant="h3" color="default">
          Active Visitors ({visitors.filter((v) => v.status === 'Active').length})
        </Typography>
        <TouchableOpacity onPress={handlePreApproveVisitor}>
          <Typography variant="bodyBold" color="primary">
            + New
          </Typography>
        </TouchableOpacity>
      </View>

      {visitors.map((item) => (
        <Card key={item.id} variant="default" padding="md" style={styles.visitorCard}>
          <View style={styles.visitorRow}>
            <View style={styles.visitorInfo}>
              <Typography variant="bodyBold" color="default">
                {item.name}
              </Typography>
              <Typography variant="caption" color="muted">
                {item.type} • {item.time}
              </Typography>
            </View>
            <View style={styles.visitorCodeBadge}>
              <Typography variant="code" color="primary">
                {item.code}
              </Typography>
              <Typography
                variant="caption"
                color={item.status === 'Active' ? 'success' : 'muted'}
                align="right"
              >
                {item.status}
              </Typography>
            </View>
          </View>
        </Card>
      ))}

      {/* Recent Access Activity */}
      <View style={styles.sectionHeader}>
        <Typography variant="h3" color="default">
          Recent Activity
        </Typography>
      </View>

      <Card variant="default" padding="sm">
        {activities.map((act, index) => (
          <View
            key={act.id}
            style={[
              styles.activityRow,
              index < activities.length - 1 && styles.activityBorder,
            ]}
          >
            <View style={styles.activityBullet}>
              <Typography variant="caption">
                {act.type === 'access' ? '🚗' : act.type === 'visitor' ? '🔑' : '💳'}
              </Typography>
            </View>
            <View style={styles.activityContent}>
              <Typography variant="bodyBold" color="default">
                {act.title}
              </Typography>
              <Typography variant="caption" color="muted">
                {act.subtitle}
              </Typography>
            </View>
            <Typography variant="caption" color="muted">
              {act.time}
            </Typography>
          </View>
        ))}
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  estateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  estateName: {
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroCard: {
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  codeContainer: {
    marginVertical: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  codeText: {
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 2,
    marginVertical: 4,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroBtnOutline: {
    flex: 1,
    borderColor: '#475569',
  },
  heroBtnPrimary: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
  },
  gridIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  visitorCard: {
    marginBottom: 10,
  },
  visitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitorInfo: {
    flex: 1,
  },
  visitorCodeBadge: {
    alignItems: 'flex-end',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
});

export default HomeScreen;
