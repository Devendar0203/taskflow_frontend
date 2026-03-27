import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEME_COLORS = [
  { name: 'Todoist Red', value: '#dc4c3e' },
  { name: 'Ocean Blue', value: '#1677ff' },
  { name: 'Forest Green', value: '#52c41a' },
  { name: 'Royal Purple', value: '#722ed1' },
  { name: 'Sunset Orange', value: '#fa8c16' },
  { name: 'Cherry Pink', value: '#eb2f96' },
  { name: 'Teal Cyan', value: '#13c2c2' }
];

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColor] = useState<string>(() => {
    return localStorage.getItem('app_theme_color') || THEME_COLORS[0].value;
  });

  useEffect(() => {
    localStorage.setItem('app_theme_color', themeColor);
    document.documentElement.style.setProperty('--primary', themeColor);
    // Simple hue shift for hover state (darken slightly by reducing opacity or using a generic fallback)
    document.documentElement.style.setProperty('--primary-hover', `${themeColor}dd`);
  }, [themeColor]);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
