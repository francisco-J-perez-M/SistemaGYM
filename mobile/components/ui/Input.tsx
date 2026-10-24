import React, { useState, useMemo } from 'react';
import {
  View, TextInput, Text, StyleSheet, TouchableOpacity,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColors } from '../../hooks/useColors';

interface Props extends TextInputProps {
  label?:        string;
  error?:        string;
  leftIcon?:     React.ReactNode;
  secure?:       boolean;
  containerStyle?: ViewStyle;
}

export default function Input({
  label, error, leftIcon, secure = false,
  containerStyle, style, ...rest
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => make_styles(colors), [colors]);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}
      <View style={[styles.inputRow, error ? styles.inputError : undefined]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : undefined, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure && !showPass}
          accessibilityLabel={label}
          accessibilityHint={rest.placeholder}
          {...rest}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
            style={styles.eyeBtn}
            accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityRole="button"
          >
            <Ionicons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    color:        colors.textSecondary,
    fontSize:     13,
    fontWeight:   '500',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.inputBg,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: colors.error,
  },
  leftIcon: { marginRight: 10 },
  input: {
    flex:       1,
    color:      colors.text,
    fontSize:   15,
    paddingVertical: 14,
  },
  eyeBtn: { padding: 4 },
  errorText: {
    color:     colors.error,
    fontSize:  12,
    marginTop: 4,
  },
});
}
