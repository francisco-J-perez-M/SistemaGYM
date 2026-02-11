// screens/UserDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, globalStyles, spacing, fontSizes, borderRadius } from '../Theme';

const { width } = Dimensions.get('window');

export default function UserDashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  
  const theme = themes[currentTheme];
  const styles = createStyles(theme);

  const [workoutData, setWorkoutData] = useState({
    currentWeek: 0,
    totalWorkouts: 0,
    caloriesBurned: 0,
    streakDays: 0,
    currentWeight: 0,
  });

  const [todayWorkout, setTodayWorkout] = useState({
    type: 'Descanso',
    exercises: [],
  });

  const [weeklyProgress, setWeeklyProgress] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [achievements, setAchievements] = useState([]);
  const [showCheckinSuccess, setShowCheckinSuccess] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchDashboardData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (!storedUser || !token) {
        navigation.replace('Login');
        return;
      }

      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }

      const data = await response.json();
      
      setWorkoutData(data.workoutStats);
      setTodayWorkout(data.todayWorkout);
      setWeeklyProgress(data.weeklyProgress);
      setAchievements(data.achievements);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleCheckin = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowCheckinSuccess(true);
        setTimeout(() => setShowCheckinSuccess(false), 3000);
        fetchDashboardData();
      } else {
        alert(data.message || 'Error al registrar asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar asistencia');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const calculateProgress = () => {
    if (todayWorkout.exercises.length === 0) return 0;
    const completed = todayWorkout.exercises.filter(ex => ex.completed).length;
    return Math.round((completed / todayWorkout.exercises.length) * 100);
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accentColor} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatar}>
            <Ionicons name="person" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.greetingText}>¡Hola!</Text>
            <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.checkinButton}
            onPress={handleCheckin}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.checkinButtonText}>Check-in</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {/* Abrir notificaciones */}}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.textPrimary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accentColor}
            colors={[theme.accentColor]}
          />
        }
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <LinearGradient
            colors={[theme.accentColor + '40', theme.bgCardDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Hoy es día de {todayWorkout.type}</Text>
              <Text style={styles.welcomeSubtitle}>
                Mantén tu racha de {workoutData.streakDays} días
              </Text>
            </View>
            
            {/* Circular Progress */}
            <View style={styles.progressCircle}>
              <View style={styles.progressCircleInner}>
                <Text style={styles.progressText}>{calculateProgress()}%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
            <View style={styles.kpiIcon}>
              <Ionicons name="flame" size={24} color={theme.accentColor} />
            </View>
            <Text style={styles.kpiValue}>{workoutData.streakDays}</Text>
            <Text style={styles.kpiLabel}>Racha (días)</Text>
            <View style={styles.kpiTrend}>
              <Ionicons name="trending-up" size={14} color={theme.successColor} />
              <Text style={[styles.kpiTrendText, { color: theme.successColor }]}>
                {workoutData.streakDays} días
              </Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiIcon}>
              <Ionicons name="fitness" size={24} color={theme.accentColor} />
            </View>
            <Text style={styles.kpiValue}>{workoutData.totalWorkouts}</Text>
            <Text style={styles.kpiLabel}>Entrenamientos</Text>
            <View style={styles.kpiTrend}>
              <Ionicons name="trending-up" size={14} color={theme.successColor} />
              <Text style={[styles.kpiTrendText, { color: theme.successColor }]}>+12%</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiIcon}>
              <Ionicons name="flash" size={24} color={theme.accentColor} />
            </View>
            <Text style={styles.kpiValue}>{workoutData.caloriesBurned}</Text>
            <Text style={styles.kpiLabel}>Calorías</Text>
            <View style={styles.kpiTrend}>
              <Text style={styles.kpiTrendText}>Meta: 3000</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiIcon}>
              <Ionicons name="barbell" size={24} color={theme.accentColor} />
            </View>
            <Text style={styles.kpiValue}>
              {workoutData.currentWeight > 0 ? workoutData.currentWeight.toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.kpiLabel}>Peso (kg)</Text>
            <View style={styles.kpiTrend}>
              <Ionicons name="trending-down" size={14} color={theme.successColor} />
              <Text style={[styles.kpiTrendText, { color: theme.successColor }]}>Progreso</Text>
            </View>
          </View>
        </View>

        {/* Rutina de Hoy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rutina de Hoy</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Ver completa</Text>
            </TouchableOpacity>
          </View>

          {todayWorkout.exercises.length > 0 ? (
            <View style={styles.exerciseList}>
              {todayWorkout.exercises.slice(0, 4).map((exercise, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.exerciseItem,
                    exercise.completed && styles.exerciseItemCompleted,
                  ]}
                >
                  <View style={styles.exerciseCheckbox}>
                    <View
                      style={[
                        styles.checkbox,
                        exercise.completed && styles.checkboxChecked,
                      ]}
                    >
                      {exercise.completed && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.exerciseInfo}>
                    <Text
                      style={[
                        styles.exerciseName,
                        exercise.completed && styles.exerciseNameCompleted,
                      ]}
                    >
                      {exercise.name}
                    </Text>
                    <Text style={styles.exerciseSets}>{exercise.sets}</Text>
                  </View>

                  <TouchableOpacity style={styles.exerciseAction}>
                    <Ionicons name="play-circle-outline" size={24} color={theme.accentColor} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="moon-outline" size={48} color={theme.textSecondary} />
              <Text style={styles.emptyStateText}>Día de descanso</Text>
              <Text style={styles.emptyStateSubtext}>¡Tu cuerpo necesita recuperarse!</Text>
            </View>
          )}
        </View>

        {/* Progreso Semanal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progreso Semanal</Text>
            <View style={styles.progressPercentage}>
              <Ionicons name="trending-up" size={14} color={theme.successColor} />
              <Text style={[styles.progressPercentageText, { color: theme.successColor }]}>
                +{Math.round(weeklyProgress.reduce((a, b) => a + b, 0) / weeklyProgress.length)}%
              </Text>
            </View>
          </View>

          <View style={styles.weeklyChart}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
              const height = weeklyProgress[index] || 0;
              const isToday = index === new Date().getDay() - 1;

              return (
                <View key={day} style={styles.chartBar}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${height}%`,
                        backgroundColor: isToday ? theme.accentColor : theme.accentColor + '70',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.chartLabel,
                      isToday && { color: theme.accentColor, fontWeight: '700' },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Logros */}
        {achievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Logros Recientes</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Success Checkin Notification */}
      {showCheckinSuccess && (
        <Animated.View style={styles.successNotification}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.successText}>¡Check-in registrado exitosamente!</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bgMainDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bgMainDark,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: theme.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: theme.bgCardDark,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderDark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.inputBgDark,
    borderWidth: 2,
    borderColor: theme.accentColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
  },
  userName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.successColor,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  checkinButtonText: {
    color: 'white',
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  headerIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.dangerColor,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  welcomeBanner: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  welcomeGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.inputBgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.bgCardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: theme.accentColor,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    width: (width - spacing.lg * 2 - spacing.xs * 2) / 2,
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    margin: spacing.xs,
    borderWidth: 1,
    borderColor: theme.borderDark,
  },
  kpiCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: theme.accentColor,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.inputBgDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  kpiValue: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: spacing.xs,
  },
  kpiLabel: {
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
    marginBottom: spacing.xs,
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiTrendText: {
    fontSize: fontSizes.xs,
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  sectionLink: {
    fontSize: fontSizes.sm,
    color: theme.accentColor,
    fontWeight: '600',
  },
  exerciseList: {
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.borderDark,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderDark,
  },
  exerciseItemCompleted: {
    opacity: 0.6,
  },
  exerciseCheckbox: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.accentColor,
    borderColor: theme.accentColor,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: spacing.xs,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
  },
  exerciseSets: {
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
  },
  exerciseAction: {
    padding: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.md,
  },
  emptyStateText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
    marginTop: spacing.xs,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    height: 180,
    borderWidth: 1,
    borderColor: theme.borderDark,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: spacing.xs,
  },
  barFill: {
    width: '100%',
    backgroundColor: theme.accentColor,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  chartLabel: {
    fontSize: fontSizes.xs,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  achievementCard: {
    width: 180,
    backgroundColor: theme.bgCardDark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: theme.borderDark,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  achievementTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: spacing.xs,
  },
  achievementDesc: {
    fontSize: fontSizes.sm,
    color: theme.textSecondary,
  },
  successNotification: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    left: spacing.lg,
    backgroundColor: theme.successColor,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  successText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: 'white',
  },
  progressPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercentageText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});