/**
 * Wasil Rider - Complete App with Authentication
 * Demo Mode - Works without backend
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Theme colors (Maroon)
const colors = {
  primary: '#800020',
  primaryLight: '#A33447',
  black: '#000000',
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F6F6F6',
  text: '#000000',
  textLight: '#757575',
  textMuted: '#9E9E9E',
  border: '#E8E8E8',
  success: '#4CAF50',
  error: '#F44336',
};

const typography = { xs: 11, sm: 13, md: 14, base: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 30 };
const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40 };

// Button Component
const Button = ({ title, variant = 'primary', onPress, disabled, loading }) => {
  const buttonStyle = variant === 'dark' ? styles.buttonDark : variant === 'outline' ? styles.buttonOutline : styles.buttonPrimary;
  return (
    <TouchableOpacity style={[styles.button, buttonStyle, disabled && styles.buttonDisabled]} onPress={onPress} activeOpacity={0.8} disabled={disabled || loading}>
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.buttonText, variant === 'outline' && styles.buttonTextOutline]}>{title}</Text>}
    </TouchableOpacity>
  );
};

// Welcome Screen
const WelcomeScreen = ({ onGetStarted, onSignIn }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setTimeout(() => { Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, 200);
    setTimeout(() => { Animated.spring(buttonSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start(); }, 400);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.backgroundTop}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.languageButton}><Text style={styles.languageText}>EN</Text></TouchableOpacity>
        </View>
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoBox}><Text style={styles.logoText}>W</Text></View>
          </Animated.View>
          <Animated.Text style={[styles.brandName, { opacity: logoOpacity }]}>Wasil</Animated.Text>
        </View>
        <Animated.View style={[styles.contentSection, { opacity: contentOpacity }]}>
          <Text style={styles.headline}>Move with ease</Text>
          <Text style={styles.subheadline}>Request a ride, hop in, and go.</Text>
          <View style={styles.features}>
            <View style={styles.featureItem}><View style={styles.featureIcon}><Text style={styles.featureEmoji}>🚗</Text></View><View style={styles.featureText}><Text style={styles.featureTitle}>Reliable rides</Text><Text style={styles.featureDesc}>Professional drivers at your service</Text></View></View>
            <View style={styles.featureItem}><View style={styles.featureIcon}><Text style={styles.featureEmoji}>💰</Text></View><View style={styles.featureText}><Text style={styles.featureTitle}>Transparent pricing</Text><Text style={styles.featureDesc}>Know your fare before you ride</Text></View></View>
            <View style={styles.featureItem}><View style={styles.featureIcon}><Text style={styles.featureEmoji}>🔒</Text></View><View style={styles.featureText}><Text style={styles.featureTitle}>Safe journeys</Text><Text style={styles.featureDesc}>24/7 safety features & support</Text></View></View>
          </View>
        </Animated.View>
        <Animated.View style={[styles.bottomSection, { transform: [{ translateY: buttonSlide }] }]}>
          <Button title="Get started" variant="dark" onPress={onGetStarted} />
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={onSignIn}><Text style={styles.loginLink}>Sign in</Text></TouchableOpacity>
          </View>
          <Text style={styles.termsText}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

// Phone Input Screen
const PhoneInputScreen = ({ onBack, onSubmit }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (phone.length < 9) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    onSubmit(phone);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}><Text style={styles.backText}>←</Text></TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.authContent}>
          <Text style={styles.authTitle}>Enter your phone number</Text>
          <Text style={styles.authSubtitle}>We'll send you a verification code</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}><Text style={styles.flag}>🇸🇸</Text><Text style={styles.countryCodeText}>+211</Text></View>
            <TextInput style={styles.phoneInput} placeholder="9XX XXX XXX" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={9} autoFocus />
          </View>
          <Text style={styles.noteText}>📱 Demo mode: Enter any 9-digit number</Text>
        </View>
        <View style={styles.authBottom}>
          <Button title="Continue" variant="dark" onPress={handleSubmit} disabled={phone.length < 9} loading={loading} />
        </View>
      </SafeAreaView>
    </View>
  );
};

// OTP Screen
const OTPScreen = ({ phone, onBack, onVerify }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => { setTimer(t => t > 0 ? t - 1 : 0); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''));
    }
  };

  const verifyOtp = async (code) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    // Demo: Accept any 6-digit code
    if (code.length === 6) {
      onVerify(code);
    } else {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}><Text style={styles.backText}>←</Text></TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.authContent}>
          <Text style={styles.authTitle}>Verify your number</Text>
          <Text style={styles.authSubtitle}>Enter the 6-digit code sent to +211 {phone}</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, i) => (
              <TextInput key={i} ref={ref => inputRefs.current[i] = ref} style={[styles.otpInput, digit && styles.otpInputFilled]} maxLength={1} keyboardType="number-pad" value={digit} onChangeText={v => handleOtpChange(v, i)} onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !digit && i > 0) inputRefs.current[i - 1]?.focus(); }} />
            ))}
          </View>
          <Text style={styles.noteText}>💡 Demo: Enter any 6 digits (e.g., 123456)</Text>
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.resendTimer}>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={() => setTimer(30)}><Text style={styles.resendLink}>Resend code</Text></TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// Profile Setup Screen
const ProfileSetupScreen = ({ phone, onComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim()) { Alert.alert('Required', 'Please enter your first name'); return; }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = { phone: `+211${phone}`, firstName: firstName.trim(), lastName: lastName.trim(), createdAt: new Date().toISOString() };
    await AsyncStorage.setItem('wasil_user', JSON.stringify(user));
    setLoading(false);
    onComplete(user);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authHeader}>
          <View style={{ width: 40 }} />
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.authContent}>
          <View style={styles.avatarPlaceholder}><Text style={styles.avatarEmoji}>👤</Text></View>
          <Text style={styles.authTitle}>Complete your profile</Text>
          <Text style={styles.authSubtitle}>Tell us your name to personalize your experience</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput style={styles.textInput} placeholder="Enter your first name" placeholderTextColor={colors.textMuted} value={firstName} onChangeText={setFirstName} autoFocus />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name (Optional)</Text>
            <TextInput style={styles.textInput} placeholder="Enter your last name" placeholderTextColor={colors.textMuted} value={lastName} onChangeText={setLastName} />
          </View>
        </View>
        <View style={styles.authBottom}>
          <Button title="Complete Setup" variant="dark" onPress={handleComplete} disabled={!firstName.trim()} loading={loading} />
        </View>
      </SafeAreaView>
    </View>
  );
};

// Home Screen
const HomeScreen = ({ user, onLogout }) => {
  const [selectedRide, setSelectedRide] = useState('standard');
  const [searching, setSearching] = useState(false);
  
  const rideTypes = [
    { id: 'boda_boda', name: 'Wasil Boda', icon: '🏍️', desc: 'Motorcycle • Fast & affordable', price: '500 SSP', color: '#FF6B6B' },
    { id: 'standard', name: 'Wasil X', icon: '🚗', desc: 'Affordable everyday rides', price: '1,000 SSP', color: '#800020' },
    { id: 'premium', name: 'Wasil Select', icon: '🚙', desc: 'Premium rides with top drivers', price: '2,000 SSP', color: '#C9A227' },
  ];

  const handleConfirm = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      Alert.alert('🎉 Demo Mode', `Ride confirmed!\n\nIn a real scenario, a ${rideTypes.find(r => r.id === selectedRide)?.name} driver would be on the way.\n\nBackend services need to be running for actual ride matching.`);
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.homeHeader}>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>☰</Text></TouchableOpacity>
          <Text style={styles.homeTitle}>Hi, {user?.firstName || 'Rider'}! 👋</Text>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}><Text style={styles.logoutText}>🚪</Text></TouchableOpacity>
        </View>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Juba, South Sudan</Text>
          <View style={styles.locationInputs}>
            <View style={styles.locationInput}><Text style={styles.dotGreen}>●</Text><Text style={styles.locationText}>📍 Current Location</Text></View>
            <View style={styles.locationInput}><Text style={styles.dotRed}>●</Text><Text style={styles.locationText}>🎯 Where to?</Text></View>
          </View>
        </View>
        
        {searching ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.searchingText}>Finding your driver...</Text>
            <Text style={styles.searchingSubtext}>This usually takes 1-3 minutes</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Choose a ride</Text>
            <ScrollView style={styles.rideList}>
              {rideTypes.map((type) => (
                <TouchableOpacity key={type.id} style={[styles.rideCard, selectedRide === type.id && styles.rideCardSelected]} onPress={() => setSelectedRide(type.id)}>
                  <View style={[styles.rideIcon, { backgroundColor: type.color + '20' }]}><Text style={styles.rideEmoji}>{type.icon}</Text></View>
                  <View style={styles.rideInfo}><Text style={styles.rideName}>{type.name}</Text><Text style={styles.rideDesc}>{type.desc}</Text></View>
                  <Text style={[styles.ridePrice, { color: type.color }]}>{type.price}</Text>
                  {selectedRide === type.id && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.confirmSection}>
              <Button title={`Confirm ${rideTypes.find(r => r.id === selectedRide)?.name}`} variant="dark" onPress={handleConfirm} />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
};

// Main App
export default function App() {
  const [screen, setScreen] = useState('loading');
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('wasil_user');
      if (userData) {
        setUser(JSON.parse(userData));
        setScreen('home');
      } else {
        setScreen('welcome');
      }
    } catch (e) {
      setScreen('welcome');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('wasil_user');
    setUser(null);
    setScreen('welcome');
  };

  if (screen === 'loading') {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ marginTop: 16, color: colors.textLight }}>Loading...</Text></View>;
  }
  if (screen === 'home') return <HomeScreen user={user} onLogout={handleLogout} />;
  if (screen === 'profile') return <ProfileSetupScreen phone={phone} onComplete={(u) => { setUser(u); setScreen('home'); }} />;
  if (screen === 'otp') return <OTPScreen phone={phone} onBack={() => setScreen('phone')} onVerify={() => setScreen('profile')} />;
  if (screen === 'phone') return <PhoneInputScreen onBack={() => setScreen('welcome')} onSubmit={(p) => { setPhone(p); setScreen('otp'); }} />;
  return <WelcomeScreen onGetStarted={() => setScreen('phone')} onSignIn={() => setScreen('phone')} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  safeArea: { flex: 1 },
  backgroundTop: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.4, overflow: 'hidden' },
  patternCircle1: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: colors.primary + '08' },
  patternCircle2: { position: 'absolute', top: 50, left: -100, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.primary + '05' },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  languageButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: 20 },
  languageText: { fontSize: typography.sm, fontWeight: '600', color: colors.text },
  logoSection: { alignItems: 'center', marginTop: spacing['3xl'], marginBottom: spacing['2xl'] },
  logoContainer: { marginBottom: spacing.md },
  logoBox: { width: 80, height: 80, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logoText: { fontSize: 48, fontWeight: '700', color: colors.white },
  brandName: { fontSize: typography['3xl'], fontWeight: '700', color: colors.text, letterSpacing: -1 },
  contentSection: { flex: 1, paddingHorizontal: spacing.xl },
  headline: { fontSize: typography['3xl'], fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subheadline: { fontSize: typography.lg, color: colors.textLight, textAlign: 'center', marginBottom: spacing['2xl'] },
  features: { marginTop: spacing.lg },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  featureIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: spacing.base },
  featureEmoji: { fontSize: 24 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: typography.base, fontWeight: '600', color: colors.text, marginBottom: 2 },
  featureDesc: { fontSize: typography.sm, color: colors.textLight },
  bottomSection: { paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.base },
  loginText: { fontSize: typography.md, color: colors.textLight, marginRight: spacing.xs },
  loginLink: { fontSize: typography.md, fontWeight: '600', color: colors.primary },
  termsText: { fontSize: typography.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  button: { alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingVertical: spacing.base, paddingHorizontal: spacing.xl, width: '100%', minHeight: 52 },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonDark: { backgroundColor: colors.black },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: typography.base, fontWeight: '600' },
  buttonTextOutline: { color: colors.text },
  // Auth screens
  authHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: colors.text },
  authContent: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing['2xl'] },
  authTitle: { fontSize: typography['2xl'], fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  authSubtitle: { fontSize: typography.base, color: colors.textLight, marginBottom: spacing['2xl'] },
  authBottom: { paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, marginBottom: spacing.base },
  countryCode: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, borderRightWidth: 1, borderRightColor: colors.border },
  flag: { fontSize: 20, marginRight: spacing.xs },
  countryCodeText: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  phoneInput: { flex: 1, paddingHorizontal: spacing.base, paddingVertical: spacing.base, fontSize: typography.lg, color: colors.text },
  noteText: { fontSize: typography.sm, color: colors.success, textAlign: 'center', marginTop: spacing.base },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  otpInput: { width: 48, height: 56, borderWidth: 1, borderColor: colors.border, borderRadius: 12, textAlign: 'center', fontSize: typography.xl, fontWeight: '700', color: colors.text, backgroundColor: colors.surface },
  otpInputFilled: { borderColor: colors.primary, backgroundColor: colors.white },
  resendContainer: { alignItems: 'center', marginTop: spacing.lg },
  resendTimer: { fontSize: typography.sm, color: colors.textMuted },
  resendLink: { fontSize: typography.sm, color: colors.primary, fontWeight: '600' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: spacing.lg },
  avatarEmoji: { fontSize: 50 },
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: { fontSize: typography.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.base, paddingVertical: spacing.base, fontSize: typography.base, color: colors.text, backgroundColor: colors.surface },
  // Home
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  menuButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 20, color: colors.text },
  homeTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.text },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  logoutText: { fontSize: 18 },
  mapPlaceholder: { height: 180, backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: spacing.base },
  mapIcon: { fontSize: 36, marginBottom: spacing.xs },
  mapText: { fontSize: typography.base, fontWeight: '600', color: colors.text },
  locationInputs: { width: '100%', marginTop: spacing.md },
  locationInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.xs },
  dotGreen: { color: colors.success, fontSize: 12, marginRight: spacing.sm },
  dotRed: { color: colors.error, fontSize: 12, marginRight: spacing.sm },
  locationText: { fontSize: typography.sm, color: colors.textLight },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  rideList: { flex: 1, paddingHorizontal: spacing.lg },
  rideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: spacing.base, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  rideCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  rideIcon: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.base },
  rideEmoji: { fontSize: 28 },
  rideInfo: { flex: 1 },
  rideName: { fontSize: typography.lg, fontWeight: '600', color: colors.text },
  rideDesc: { fontSize: typography.sm, color: colors.textLight, marginTop: 2 },
  ridePrice: { fontSize: typography.lg, fontWeight: '700' },
  checkMark: { fontSize: 20, color: colors.primary, marginLeft: spacing.sm },
  confirmSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'], paddingTop: spacing.base },
  searchingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchingText: { fontSize: typography.xl, fontWeight: '700', color: colors.text, marginTop: spacing.lg },
  searchingSubtext: { fontSize: typography.base, color: colors.textLight, marginTop: spacing.sm },
});
