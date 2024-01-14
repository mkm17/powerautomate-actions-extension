import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { Mode } from './models';
import { ExtensionCommunicationService } from './services';

describe('App', () => {
  let storageServiceMock: any;
  let actionsServiceMock: any;
  let communicationServiceMock: any;

  const mockChrome = {
    storage: {
      local: {
        get: jest.fn().mockImplementation((key) => {
          switch (key) {
            case 'RECORDED_ACTIONS_KEY': return [];
            case 'MY_CLIPBOARD_ACTIONS_KEY': return [];
            case 'IS_RECORDING_KEY': true;
          }
        }
        ),
        set: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn(),
    },
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn()
      }
    },
  };

  beforeEach(() => {
    global['chrome'] = mockChrome as any;

    storageServiceMock = {
      getIsRecordingValue: jest.fn().mockImplementation(() => { return true; }),
      setIsRecordingValue: jest.fn().mockImplementation((value) => { return value; }),
      deleteAction: jest.fn().mockImplementation((message) => { }),
      deleteMyClipboardAction: jest.fn().mockImplementation((message) => { }),
      setNewAction: jest.fn().mockImplementation((value) => { return value; }),
      getActions: jest.fn().mockImplementation(() => { return []; }),
    }

    actionsServiceMock = {
      getTitleFromUrl: jest.fn().mockImplementation((url) => { return 'Example'; }),
      getHttpSharePointActionTemplate: jest.fn(),
      getHttpRequestActionTemplate: jest.fn(),

    };


    jest.mock('./services/StorageService');
    jest.mock('./services/ActionsService');
    communicationServiceMock = jest.mock('./services/ExtensionCommunicationService', () => {
      return jest.fn().mockImplementation(() => ({
        sendRequest: jest.fn(),
      }));
    });

  });

  test('renders App component with default buttons', () => {
    render(<App isRecording={false}
      isPowerAutomatePage={false}
      isSharePointPage={true}
      hasActionsOnPageToCopy={false}
      actions={[]}
      myClipboardActions={[]}
      currentMode={Mode.Requests} 
      myCopiedActionsV3={[]}
      />);

    const clearButton = screen.getByTitle('Clear Items');
    expect(clearButton).toBeInTheDocument();

    const pivotComponent = screen.getByRole('tablist');
    expect(pivotComponent).toBeInTheDocument();

  });

  test('renders App component with correct buttons for SharePointPage', async () => {

    render(<App isRecording={false}
      isPowerAutomatePage={false}
      isSharePointPage={true}
      hasActionsOnPageToCopy={false}
      actions={[]}
      myClipboardActions={[]}
      currentMode={Mode.Requests} 
      myCopiedActionsV3={[]}
      />);

    const recordButton = screen.getByTitle('Start Recording');
    expect(recordButton).toBeInTheDocument();

    const clearButton = screen.getByTitle('Clear Items');
    expect(clearButton).toBeInTheDocument();

    const pivotComponent = screen.getByRole('tablist');
    expect(pivotComponent).toBeInTheDocument();

  });

  test('renders App component with correct buttons for SharePointPage while recording', async () => {

    render(<App isRecording={true}
      isPowerAutomatePage={false}
      isSharePointPage={true}
      hasActionsOnPageToCopy={false}
      actions={[]}
      myClipboardActions={[]}
      currentMode={Mode.Requests} 
      myCopiedActionsV3={[]}
      />);

    const recordButton = screen.getByTitle('Stop Recording');
    expect(recordButton).toBeInTheDocument();

    const clearButton = screen.getByTitle('Clear Items');
    expect(clearButton).toBeInTheDocument();

    const pivotComponent = screen.getByRole('tablist');
    expect(pivotComponent).toBeInTheDocument();

  });

  test('renders App component with correct buttons for Power Automate page', async () => {

    render(<App isRecording={false}
      isPowerAutomatePage={true}
      isSharePointPage={false}
      hasActionsOnPageToCopy={false}
      actions={[]}
      myClipboardActions={[]}
      currentMode={Mode.Requests} 
      myCopiedActionsV3={[]}/>);

    const getMyClipboardActions = screen.getByTitle("Get 'My Clipboard Actions'");
    expect(getMyClipboardActions).toBeInTheDocument();

    const copyItems = screen.getByTitle("Copy Items");
    expect(copyItems).toBeInTheDocument();

    const clearButton = screen.getByTitle('Clear Items');
    expect(clearButton).toBeInTheDocument();

    const pivotComponent = screen.getByRole('tablist');
    expect(pivotComponent).toBeInTheDocument();

  });

  test('renders App component with correct buttons for Blog page', async () => {

    render(<App isRecording={false}
      isPowerAutomatePage={false}
      isSharePointPage={false}
      hasActionsOnPageToCopy={true}
      actions={[]}
      myClipboardActions={[]}
      currentMode={Mode.Requests} 
      myCopiedActionsV3={[]}/>);

    const actionsButton = screen.getByTitle("Copy All Actions From Page");
    expect(actionsButton).toBeInTheDocument();

    const clearButton = screen.getByTitle('Clear Items');
    expect(clearButton).toBeInTheDocument();

    const pivotComponent = screen.getByRole('tablist');
    expect(pivotComponent).toBeInTheDocument();

  });

});