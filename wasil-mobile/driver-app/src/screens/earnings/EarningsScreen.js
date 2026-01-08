/**
 * Wasil Driver - Earnings Dashboard Screen
 * Beautiful earnings visualization with charts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, CURRENCY } from '@wasil/shared';
import {
  selectTodayEarnings,
  selectTodayRides,
  selectWeeklyEarnings,
  selectMonthlyEarnings,
  selectRideHistory,
  getEarnings,
  getRideHistory,
} from '../../store/slices/driverSlice';

const { width } = Dimensions.get('window');

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

// Sample weekly data for chart
const SAMPLE_WEEKLY_DATA = [
  { day: 'Mon', earnings: 12000 },
  { day: 'Tue', earnings: 15000 },
  { day: 'Wed', earnings: 18000 },
  { day: 'Thu', earnings: 14000 },
  { day: 'Fri', earnings: 22000 },
  { day: 'Sat', earnings: 28000 },
  { day: 'Sun', earnings: 19000 },
];

const EarningsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const todayEarnings = useSelector(selectTodayEarnings);
  const todayRides = useSelector(selectTodayRides);
  const weeklyEarnings = useSelector(selectWeeklyEarnings);
  const monthlyEarnings = useSelector(selectMonthlyEarnings);
  const rideHistory = useSelector(selectRideHistory);

  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [weeklyData, setWeeklyData] = useState(SAMPLE_WEEKLY_DATA);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const chartAnims = useRef(SAMPLE_WEEKLY_DATA.map(() => new Animated.Value(0))).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fetch data
    dispatch(getEarnings());
    dispatch(getRideHistory({ page: 1, refresh: true }));

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate chart bars
    chartAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + index * 100,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || 0} ${CURRENCY.code}`;
  };

  const getEarningsForPeriod = () => {
    switch (selectedPeriod) {
      case 'today':
        return todayEarnings || 0;
      case 'week':
        return weeklyEarnings || 0;
      case 'month':
        return monthlyEarnings || 0;
      default:
        return 0;
    }
  };

  const getMaxEarning = () => {
    return Math.max(...weeklyData.map(d => d.earnings));
  };

  const renderRideItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.rideItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('RideDetail', { ride: item })}
    >
      <View style={styles.rideLeft}>
        <View style={styles.rideIcon}>
          <Text style={styles.rideEmoji}>🚗</Text>
        </View>
        <View style={styles.rideInfo}>
          <Text style={styles.rideRoute} numberOfLines={1}>
            {item.pickup?.address || 'Konyo Konyo'} → {item.dropoff?.address || 'Airport'}
          </Text>
          <Text style={styles.rideTime}>
            {item.completedAt || 'Today, 2:30 PM'} • {item.distance?.toFixed(1) || '5.2'} km
          </Text>
        </View>
      </View>
      <Text style={styles.rideFare}>{formatCurrency(item.fare || item.driverEarnings || 2500)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('earnings.title')}</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Text style={styles.historyIcon}>📊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Earnings Card */}
        <Animated.View
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Period Tabs */}
          <View style={styles.periodTabs}>
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodTab,
                  selectedPeriod === period.id && styles.periodTabActive,
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    selectedPeriod === period.id && styles.periodTabTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Earnings Amount */}
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>{t('earnings.totalEarnings')}</Text>
            <Text style={styles.earningsAmount}>
              {formatCurrency(getEarningsForPeriod())}
            </Text>
            
            {selectedPeriod === 'today' && (
              <View style={styles.earningsStats}>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    🚗 {todayRides || 0} {t('earnings.rides')}
                  </Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    💰 {formatCurrency((todayEarnings || 0) / Math.max(todayRides || 1, 1))}/ride
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Cashout Button */}
          <TouchableOpacity style={styles.cashoutButton}>
            <Text style={styles.cashoutIcon}>💳</Text>
            <Text style={styles.cashoutText}>{t('earnings.cashout')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('earnings.weeklyOverview')}</Text>
          
          <View style={styles.chartContainer}>
            {weeklyData.map((data, index) => {
              const maxEarning = getMaxEarning();
              const heightPercent = (data.earnings / maxEarning) * 100;
              
              return (
                <View key={data.day} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <Animated.View
                      style={[
                        styles.barFill,
                        {
                          height: chartAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${heightPercent}%`],
                          }),
                          backgroundColor: index === new Date().getDay() - 1
                            ? colors.primary
                            : colors.primary + '60',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{data.day}</Text>
                  <Text style={styles.barValue}>
                    {(data.earnings / 1000).toFixed(0)}k
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>6.5 hrs</Text>
            <Text style={styles.statLabel}>{t('earnings.hoursOnline')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statValue}>45 km</Text>
            <Text style={styles.statLabel}>{t('earnings.distanceCovered')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>4.92</Text>
            <Text style={styles.statLabel}>{t('earnings.rating')}</Text>
          </View>
        </View>

        {/* Recent Rides */}
        <View style={styles.ridesSection}>
          <View style={styles.ridesHeader}>
            <Text style={styles.ridesTitle}>{t('earnings.recentRides')}</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {/* Sample rides */}
          {[
            { id: 1, pickup: { address: 'Konyo Konyo Market' }, dropoff: { address: 'Airport' }, fare: 3500, distance: 8.2, completedAt: 'Today, 3:45 PM' },
            { id: 2, pickup: { address: 'University of Juba' }, dropoff: { address: 'Custom Market' }, fare: 2200, distance: 5.1, completedAt: 'Today, 2:15 PM' },
            { id: 3, pickup: { address: 'Juba Teaching Hospital' }, dropoff: { address: 'Gudele' }, fare: 2800, distance: 6.8, completedAt: 'Today, 12:30 PM' },
          ].map((ride, index) => (
            <View key={ride.id}>
              {renderRideItem({ item: ride, index })}
            </View>
          ))}
        </View>

        {/* Tips & Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>💡 {t('earnings.insights')}</Text>
          
          <View style={styles.insightItem}>
            <View style={styles.insightBadge}>
              <Text style={styles.insightBadgeText}>⬆️ 15%</Text>
            </View>
            <Text style={styles.insightText}>
              {t('earnings.insightHigher')}
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightBadge, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[styles.insightBadgeText, { color: colors.secondary }]}>🔥</Text>
            </View>
            <Text style={styles.insightText}>
              {t('earnings.insightPeakHours')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -20,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.white,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 18,
  },

  // Main Card
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    fontWeight: typography.fontWeight.medium,
  },
  periodTabTextActive: {
    color: colors.white,
  },

  // Earnings
  earningsContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  earningsLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  earningsAmount: {
    fontSize: 42,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  earningsStats: {
    flexDirection: 'row',
  },
  statBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.xs,
  },
  statBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Cashout
  cashoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
  },
  cashoutIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  cashoutText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },

  // Chart
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    paddingTop: spacing.lg,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    width: 28,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: borderRadius.md,
  },
  barLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  barValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...shadows.sm,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Rides Section
  ridesSection: {
    marginBottom: spacing.lg,
  },
  ridesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ridesTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  viewAllText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  rideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  rideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rideEmoji: {
    fontSize: 18,
  },
  rideInfo: {
    flex: 1,
  },
  rideRoute: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rideTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  rideFare: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  // Insights
  insightsCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  insightsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  insightBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  insightBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  insightText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
});

export default EarningsScreen;
