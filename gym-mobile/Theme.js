// Theme.js - Sistema de temas para React Native
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const themes = {
  dark: {
    name: 'dark',
    accentColor: '#fbe379',
    accentHover: '#edd66e',
    bgMainDark: '#121212',
    bgCardDark: '#1e1e24',
    inputBgDark: '#2b2b36',
    borderDark: '#3a3a45',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0b0',
    textOnAccent: '#121212',
    successColor: '#4cd964',
    dangerColor: '#ff4d4d',
    warningColor: '#ffbd2e',
  },
  light: {
    name: 'light',
    accentColor: '#fbe379',
    accentHover: '#edd66e',
    bgMainDark: '#ecf0f3',
    bgCardDark: '#f7f9fa',
    inputBgDark: '#e1e4e8',
    borderDark: '#cfd2d6',
    textPrimary: '#2b303b',
    textSecondary: '#626c7a',
    textOnAccent: '#121212',
    successColor: '#4cd964',
    dangerColor: '#ff4d4d',
    warningColor: '#ffbd2e',
  },
  forest: {
    name: 'forest',
    accentColor: '#68d391',
    accentHover: '#48bb78',
    bgMainDark: '#111c18',
    bgCardDark: '#1a2a24',
    inputBgDark: '#23362f',
    borderDark: '#344e43',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    textOnAccent: '#0f1c18',
    successColor: '#4cd964',
    dangerColor: '#ff4d4d',
    warningColor: '#ffbd2e',
  },
  nebula: {
    name: 'nebula',
    accentColor: '#38bdf8',
    accentHover: '#0ea5e9',
    bgMainDark: '#0f172a',
    bgCardDark: '#1e293b',
    inputBgDark: '#334155',
    borderDark: '#475569',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textOnAccent: '#0f172a',
    successColor: '#4cd964',
    dangerColor: '#ff4d4d',
    warningColor: '#ffbd2e',
  },
};

// Estilos globales adaptados a React Native
export const globalStyles = (theme) => ({
  // CONTENEDORES
  container: {
    flex: 1,
    backgroundColor: theme.bgMainDark,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.bgMainDark,
  },

  // CARDS
  card: {
    backgroundColor: theme.bgCardDark,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.borderDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  // BOTONES
  primaryButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.accentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  primaryButtonText: {
    color: theme.textOnAccent,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.borderDark,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },

  outlineButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // INPUTS
  input: {
    backgroundColor: theme.inputBgDark,
    borderWidth: 1,
    borderColor: theme.borderDark,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: theme.textPrimary,
    fontSize: 15,
    marginBottom: 15,
  },

  inputLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputFocused: {
    borderColor: theme.accentColor,
    borderWidth: 2,
  },

  // TEXTO
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 10,
  },

  heading2: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },

  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 6,
  },

  bodyText: {
    fontSize: 15,
    color: theme.textPrimary,
    lineHeight: 22,
  },

  secondaryText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },

  // BADGES
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  badgeSuccess: {
    backgroundColor: `${theme.successColor}20`,
  },

  badgeWarning: {
    backgroundColor: `${theme.warningColor}20`,
  },

  badgeDanger: {
    backgroundColor: `${theme.dangerColor}20`,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // AVATAR
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.bgCardDark,
    borderWidth: 2,
    borderColor: theme.accentColor,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },

  // STATS
  statCard: {
    backgroundColor: theme.bgCardDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.borderDark,
    marginBottom: 15,
  },

  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    marginVertical: 8,
  },

  statLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bgMainDark,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.textSecondary,
  },

  // EMPTY STATE
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyStateText: {
    fontSize: 18,
    color: theme.textPrimary,
    marginTop: 20,
    fontWeight: '600',
  },

  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // DIMENSIONES RESPONSIVAS
  screenWidth: width,
  screenHeight: height,
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 768,
  isLargeDevice: width >= 768,
});

// Espaciado consistente
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Tamaños de fuente
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

// Radios de borde
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};