import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TouchableOpacity,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

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
          placeholderTextColor={Colors.textMuted}
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
              color={Colors.textSecondary}
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

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    color:        Colors.textSecondary,
    fontSize:     13,
    fontWeight:   '500',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.inputBg,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     Colors.border,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: Colors.error,
  },
  leftIcon: { marginRight: 10 },
  input: {
    flex:       1,
    color:      Colors.text,
    fontSize:   15,
    paddingVertical: 14,
  },
  eyeBtn: { padding: 4 },
  errorText: {
    color:     Colors.error,
    fontSize:  12,
    marginTop: 4,
  },
});
