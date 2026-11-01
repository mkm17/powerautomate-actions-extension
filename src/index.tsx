import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Mode } from './models';
import { initializeIcons } from '@fluentui/react';

initializeIcons();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App isRecording={false}
      isPowerAutomatePage={false}
      isRecordingPage={false}
      hasActionsOnPageToCopy={false}
      actions={[]}
      myClipboardActions={[]}
      currentMode={Mode.Requests}
      myCopiedActionsV3={[]}
      favoriteActions={[]} />
  </React.StrictMode>
);
