
/**
 * Wasil Driver - Earnings Dashboard Screen
 
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
        <View style={styles.rideIconContainer}>
          <View style={styles.locationDot} />
          <View style={styles.locationLine} />
          <View style={[styles.locationDot, styles.locationDotEnd]} />
        </View>
        <View style={styles.rideInfo}>
          <Text style={styles.rideRoute} numberOfLines={1}>
            {item.pickup?.address || 'Konyo Konyo Market'}
          </Text>
          <Text style={styles.rideDestination} numberOfLines={1}>
            {item.dropoff?.address || 'Airport'}
          </Text>
          <Text style={styles.rideTime}>
            {item.completedAt || 'Today, 2:30 PM'} • {item.distance?.toFixed(1) || '5.2'} km
          </Text>
        </View>
      </View>
      <View style={styles.rideRight}>
        <Text style={styles.rideFare}>{formatCurrency(item.fare || item.driverEarnings || 2500)}</Text>
      </View>
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
        <View style={styles.headerRight} />
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
                  <Text style={styles.statBadgeLabel}>Trips</Text>
                  <Text style={styles.statBadgeValue}>{todayRides || 0}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeLabel}>Per Trip</Text>
                  <Text style={styles.statBadgeValue}>
                    {formatCurrency((todayEarnings || 0) / Math.max(todayRides || 1, 1))}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Cashout Button */}
          <TouchableOpacity style={styles.cashoutButton}>
            <View style={styles.cashoutIconContainer}>
              <View style={styles.cardIcon} />
            </View>
            <Text style={styles.cashoutText}>{t('earnings.cashout')}</Text>
            <Text style={styles.cashoutArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('earnings.weeklyOverview')}</Text>
            <Text style={styles.chartSubtitle}>Last 7 days</Text>
          </View>
          
          <View style={styles.chartContainer}>
            {weeklyData.map((data, index) => {
              const maxEarning = getMaxEarning();
              const heightPercent = (data.earnings / maxEarning) * 100;
              const isToday = index === new Date().getDay() - 1;
              
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
                          backgroundColor: isToday ? colors.primary : colors.primary + '40',
                        },
                      ]}
                    >
                      {isToday && <View style={styles.barIndicator} />}
                    </Animated.View>
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelActive]}>
                    {data.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={styles.clockIcon} />
            </View>
            <Text style={styles.statValue}>6.5</Text>
            <Text style={styles.statLabel}>{t('earnings.hoursOnline')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={styles.distanceIcon} />
            </View>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>{t('earnings.distanceCovered')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={styles.starIcon} />
            </View>
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
          <View style={styles.insightsHeader}>
            <View style={styles.insightBulb} />
            <Text style={styles.insightsTitle}>{t('earnings.insights')}</Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={styles.insightIndicator}>
              <View style={styles.trendUpIcon} />
              <Text style={styles.insightPercentage}>15%</Text>
            </View>
            <Text style={styles.insightText}>
              {t('earnings.insightHigher')}
            </Text>
          </View>
          
          <View style={styles.insightDivider} />
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIndicator, { backgroundColor: colors.warning + '15' }]}>
              <View style={styles.fireIcon} />
              <Text style={[styles.insightPercentage, { color: colors.warning }]}>Peak</Text>
            </View>
            <Text style={styles.insightText}>
              {t('earnings.insightPeakHours')}
            </Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: spacing.xl }} />
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
    backgroundColor: '#F8F9FA',
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 40,
  },

  // Main Card
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.lg,
    elevation: 8,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F7',
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.xl,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  periodTabText: {
    fontSize: typography.fontSize.md,
    color: '#6B7280',
    fontWeight: '600',
  },
  periodTabTextActive: {
    color: colors.white,
  },

  // Earnings
  earningsContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    marginBottom: spacing.sm,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.lg,
    letterSpacing: -1,
  },
  earningsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  statBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  statBadgeLabel: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    marginBottom: 2,
    fontWeight: '500',
  },
  statBadgeValue: {
    fontSize: typography.fontSize.md,
    color: '#374151',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },

  // Cashout
  cashoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  cashoutIconContainer: {
    marginRight: spacing.sm,
  },
  cardIcon: {
    width: 20,
    height: 14,
    backgroundColor: colors.white,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  cashoutText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  cashoutArrow: {
    fontSize: 18,
    color: colors.white,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },

  // Chart
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
    elevation: 4,
  },
  chartHeader: {
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    width: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  barIndicator: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  barLabel: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  barLabelActive: {
    color: colors.primary,
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
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...shadows.sm,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clockIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    position: 'relative',
  },
  distanceIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  starIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FCD34D',
    transform: [{ rotate: '35deg' }],
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
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
    paddingHorizontal: spacing.xs,
  },
  ridesTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  rideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
    elevation: 2,
  },
  rideLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  rideIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.md,
    paddingTop: 2,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  locationDotEnd: {
    backgroundColor: '#10B981',
  },
  rideInfo: {
    flex: 1,
  },
  rideRoute: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  rideDestination: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: spacing.xs,
  },
  rideTime: {
    fontSize: typography.fontSize.sm,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  rideRight: {
    alignItems: 'flex-end',
  },
  rideFare: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },

  // Insights
  insightsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  insightBulb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FCD34D',
    marginRight: spacing.sm,
  },
  insightsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#1E40AF',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
  },
  trendUpIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#10B981',
    marginRight: 4,
  },
  fireIcon: {
    width: 10,
    height: 14,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    marginRight: 4,
  },
  insightPercentage: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#10B981',
  },
  insightText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 20,
  },
  insightDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: spacing.md,
  },
});

export default EarningsScreen;
