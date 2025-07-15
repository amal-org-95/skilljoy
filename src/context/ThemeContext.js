import React, { createContext, useContext, useState } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import PropTypes from 'prop-types'; // <-- تمت إضافته

const ThemeContext = createContext();

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(prev => !prev);

  const theme = isDark ? MD3DarkTheme : MD3LightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired, // <-- تم حل التحذير هنا
};
