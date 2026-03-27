import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

import { ConfigProvider } from 'antd';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';

const ThemedApp: React.FC = () => {
  const { themeColor } = useThemeContext();
  return (
    <ConfigProvider theme={{ token: { colorPrimary: themeColor } }}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
};

export default App;
