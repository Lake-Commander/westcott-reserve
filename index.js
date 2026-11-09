import { registerRootComponent } from 'expo';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './redux/store';
import App from './App';
import { AppUIConfigProvider } from './components/AppUIConfigProvider';

const AppRedux = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AppUIConfigProvider>
        <App />
      </AppUIConfigProvider>
    </PersistGate>
  </Provider>
);

registerRootComponent(AppRedux);