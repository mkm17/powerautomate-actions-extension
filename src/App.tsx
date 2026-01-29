import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { ActionType, IDataChromeMessage, AppElement, ICommunicationChromeMessage, IInitialState, Mode } from './models';
import { IActionModel } from './models/IActionModel';
import { ISettingsModel } from './models/ISettingsModel';
import { StorageService } from './services/StorageService';
import { ExtensionCommunicationService, PredefinedActionsService } from './services';
import { Icon, MessageBar, MessageBarType, Pivot, PivotItem } from '@fluentui/react';
import ActionsList from './components/ActionsList';
import Settings from './components/Settings';
import PredefinedActionsList from './components/PredefinedActionsList';

function App(initialState?: IInitialState | undefined) {
  const storageService = useMemo(() => { return new StorageService(); }, []);
  const communicationService = useMemo(() => { return new ExtensionCommunicationService(); }, []);
  const predefinedActionsService = useMemo(() => { return new PredefinedActionsService(); }, []);
  const [isRecording, setIsRecording] = useState<boolean>(initialState?.isRecording || false);
  const [isPowerAutomatePage, setIsPowerAutomatePage] = useState<boolean>(initialState?.isPowerAutomatePage || false);
  const [isRecordingPage, setIsRecordingPage] = useState<boolean>(initialState?.isRecordingPage || false);
  const [hasActionsOnPageToCopy, setHasActionsOnPageToCopy] = useState<boolean>(initialState?.hasActionsOnPageToCopy || false);
  const [actions, setActions] = useState<IActionModel[]>(initialState?.actions || []);
  const [myClipboardActions, setMyClipboardActions] = useState<IActionModel[]>(initialState?.myClipboardActions || []);
  const [currentMode, setCurrentMode] = useState<Mode>(initialState?.currentMode || Mode.Requests);
  const [favoriteActions, setFavoriteActions] = useState<IActionModel[]>(initialState?.favoriteActions || []);
  const [predefinedActions, setPredefinedActions] = useState<IActionModel[]>([]);
  const [predefinedActionsLoading, setPredefinedActionsLoading] = useState<boolean>(false);
  const [isV3PowerAutomateEditor, setIsV3PowerAutomateEditor] = useState<boolean>(false);
  const [hoverMessage, setHoverMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isSuccessNotification, setIsSuccessNotification] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<ISettingsModel | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const listenToMessage = (message: ICommunicationChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.to !== AppElement.ReactApp) { return console.log('Incorrect message destination'); }
    switch (message.actionType) {
      case ActionType.ActionUpdated:
        message.message && setActions(message.message);
        break;
      case ActionType.MyClipboardActionsUpdated:
        message.message && setMyClipboardActions(message.message);
        break;
    }
  }

  const getRecordingPageSetting = useCallback(async (isRecordingPageSetting: boolean | null) => {
    if (isRecordingPageSetting !== null) {
      setIsRecordingPage(isRecordingPageSetting);
    } else {
      communicationService.sendRequest({ actionType: ActionType.CheckRecordingPage, message: "Check Recording Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
        setIsRecordingPage(response);
      });
    }
  }, [communicationService]);

  const getClassicPASetting = useCallback(async (isPAEditorPage: boolean | null) => {
    if (isPAEditorPage !== null) {
      setIsPowerAutomatePage(isPAEditorPage);
    } else {
      communicationService.sendRequest({ actionType: ActionType.CheckPowerAutomatePage, message: "Check PowerAutomate Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
        setIsPowerAutomatePage(response)
      });
    }
  }, [communicationService]);

  const getNewPASetting = useCallback(async (isNewPAEditorPage: boolean | null) => {
    if (isNewPAEditorPage !== null) {
      setIsV3PowerAutomateEditor(isNewPAEditorPage);
    } else {
      communicationService.sendRequest({ actionType: ActionType.CheckIsNewPowerAutomateEditorV3, message: "Check If Page is a new Power Automate editor" }, AppElement.ReactApp, AppElement.Content, (response) => {
        setIsV3PowerAutomateEditor(response);
      });
    }
  }, [communicationService]);

  const stopRecordingTimer = useCallback(async () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setRecordingTimeLeft(null);
    
    await storageService.setRecordingStartTime(null);
  }, [storageService]);

  const startRecordingTimer = useCallback(async (maxRecordingTimeMinutes: number, startTime?: number) => {
    const currentStartTime = startTime || Date.now();
    const maxTimeMs = maxRecordingTimeMinutes * 60 * 1000;
    
    if (startTime) {
      const elapsedMs = Date.now() - startTime;
      const remainingMs = maxTimeMs - elapsedMs;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setRecordingTimeLeft(remainingSeconds);
      
      recordingTimerRef.current = setTimeout(() => {
        const message: IDataChromeMessage = { 
          actionType: ActionType.StopRecording, 
          message: "Stop recording - time limit reached" 
        };
        communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
          setIsRecording(response);
          setNotificationMessage(`Recording stopped automatically after ${maxRecordingTimeMinutes} minutes`);
          setIsSuccessNotification(false);
          stopRecordingTimer();
        });
      }, remainingMs);
    } else {
      setRecordingTimeLeft(maxRecordingTimeMinutes * 60);
      
      recordingTimerRef.current = setTimeout(() => {
        const message: IDataChromeMessage = { 
          actionType: ActionType.StopRecording, 
          message: "Stop recording - time limit reached" 
        };
        communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
          setIsRecording(response);
          setNotificationMessage(`Recording stopped automatically after ${maxRecordingTimeMinutes} minutes`);
          setIsSuccessNotification(false);
          stopRecordingTimer();
        });
      }, maxTimeMs);
      
      await storageService.setRecordingStartTime(currentStartTime);
    }

    countdownTimerRef.current = setInterval(() => {
      setRecordingTimeLeft(prevTime => {
        if (prevTime === null || prevTime <= 1) {
          return null;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, [communicationService, stopRecordingTimer, storageService]);

  const sendRecordingStatus = useCallback(async () => {
    if (isRecording) {
      const message: IDataChromeMessage = { 
        actionType: ActionType.StopRecording, 
        message: "Stop recording" 
      };
      communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, async (response) => {
        setIsRecording(response);
        await stopRecordingTimer();
      });
    } else {
      const settings = await storageService.getSettings();
      const message: IDataChromeMessage = { 
        actionType: ActionType.StartRecording, 
        message: "Start recording" 
      };
      
      communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
        setIsRecording(response);
        
        if (response && settings.maximumRecordingTimeMinutes && settings.maximumRecordingTimeMinutes > 0) {
          startRecordingTimer(settings.maximumRecordingTimeMinutes);
        }
      });
    }
  }, [communicationService, isRecording, storageService, stopRecordingTimer, startRecordingTimer]);

  const loadPredefinedActions = useCallback(async (url: string) => {
    if (!url || url.trim() === '') {
      setPredefinedActions([]);
      return;
    }

    setPredefinedActionsLoading(true);
    try {
      const actions = await predefinedActionsService.fetchPredefinedActions(url);
      setPredefinedActions(actions);
    } catch (error) {
      console.error('Failed to load predefined actions:', error);
      setPredefinedActions([]);
    } finally {
      setPredefinedActionsLoading(false);
    }
  }, [predefinedActionsService]);

  const loadAllPredefinedFromSettings = useCallback(async (s: ISettingsModel) => {
    if (!s?.showPredefinedActions) {
      setPredefinedActions([]);
      return;
    }

    setPredefinedActionsLoading(true);
    try {
      const parts: IActionModel[][] = [];
      if (s.loadDefaultPredefinedActions) {
        const defaults = await predefinedActionsService.fetchDefaultPredefinedActions();
        parts.push(defaults);
      }
      if (s.predefinedActionsUrl && s.predefinedActionsUrl.trim() !== '') {
        const fromUrl = await predefinedActionsService.fetchPredefinedActions(s.predefinedActionsUrl);
        parts.push(fromUrl);
      }
      const combined = ([] as IActionModel[]).concat(...parts);
      const deduplicated = predefinedActionsService.deduplicateActions(combined);
      setPredefinedActions(deduplicated);
    } catch (error) {
      console.error('Failed to load predefined actions (defaults/custom):', error);
      setPredefinedActions([]);
    } finally {
      setPredefinedActionsLoading(false);
    }
  }, [predefinedActionsService]);

  const handleSettingsChange = useCallback(async (updatedSettings: ISettingsModel) => {
    setSettings(updatedSettings);
    
    // Reload predefined actions from defaults and/or custom URL
    await loadAllPredefinedFromSettings(updatedSettings);
  }, [loadAllPredefinedFromSettings]);

  const refreshPredefinedActions = useCallback(async () => {
    if (!settings) return;
    setPredefinedActionsLoading(true);
    try {
      await predefinedActionsService.clearCache();
      await loadAllPredefinedFromSettings(settings);
      setNotificationMessage('Predefined actions refreshed successfully');
      setIsSuccessNotification(true);
    } catch (error) {
      console.error('Failed to refresh predefined actions:', error);
      setNotificationMessage('Failed to refresh predefined actions');
      setIsSuccessNotification(false);
    } finally {
      setPredefinedActionsLoading(false);
    }
  }, [settings, predefinedActionsService, loadAllPredefinedFromSettings]);

  const initData = useCallback(async () => {
    const settings = await storageService.getSettings();
    setSettings(settings);

    getRecordingPageSetting(settings.isRecordingPage ?? null);
    getClassicPASetting(settings.isClassicPowerAutomatePage ?? null);
    getNewPASetting(settings.isModernPowerAutomatePage ?? null);

    communicationService.sendRequest({ actionType: ActionType.CheckIfPageHasActionsToCopy, message: "Check If Page has actions to copy" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setHasActionsOnPageToCopy(response)
    });

    storageService.getRecordedActions().then((actions) => {
      setActions(actions);
    });

    storageService.getMyClipboardActions().then((actions) => {
      setMyClipboardActions(actions);
    });

    storageService.getFavoriteActions().then((actions) => {
      setFavoriteActions(actions);
    });

    // Load predefined actions (defaults/custom)
    await loadAllPredefinedFromSettings(settings);

    storageService.getIsRecordingValue().then((isRecording) => {
      setIsRecording(isRecording);
      
      if (isRecording && settings.recordingStartTime && settings.maximumRecordingTimeMinutes) {
        const elapsedMs = Date.now() - settings.recordingStartTime;
        const maxTimeMs = settings.maximumRecordingTimeMinutes * 60 * 1000;
        const remainingMs = maxTimeMs - elapsedMs;
        
        if (remainingMs > 0) {
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          setRecordingTimeLeft(remainingSeconds);
          startRecordingTimer(settings.maximumRecordingTimeMinutes, settings.recordingStartTime);
        } else {
          const message: IDataChromeMessage = { 
            actionType: ActionType.StopRecording, 
            message: "Stop recording - time limit already reached" 
          };
          communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
            setIsRecording(response);
            setNotificationMessage(`Recording was stopped automatically - time limit exceeded`);
            setIsSuccessNotification(false);
            stopRecordingTimer();
          });
        }
      }
    });

    chrome.runtime.onMessage.addListener(listenToMessage);
  }, [communicationService, storageService, getRecordingPageSetting, getClassicPASetting, getNewPASetting, startRecordingTimer, stopRecordingTimer, loadAllPredefinedFromSettings]);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    return () => {
      stopRecordingTimer();
    };
  }, [stopRecordingTimer]);

  const copyAllActionsFromPage = useCallback(() => {
    const message = {
      actionType: ActionType.CopyAllActionsFromPage,
      message: "Copy All Actions From the Page",
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }, [communicationService])

  const clearActionList = useCallback(() => {
    switch (currentMode) {
      case Mode.Requests:
        storageService.clearRecordedActions();
        setActions([]);
        break;
      case Mode.CopiedActions:
        storageService.clearMyClipboardActions();
        setMyClipboardActions([]);
        break;
      case Mode.Favorites:
        storageService.clearFavoriteActions();
        setFavoriteActions([]);
        break;
      case Mode.PredefinedActions:
        setPredefinedActions([]);
        break;
    }
  }, [currentMode, storageService])

  const copyItems = useCallback(() => {
    const selectedActions = currentMode === Mode.Requests ? actions?.filter(a => a.isSelected) :
      currentMode === Mode.CopiedActions ? myClipboardActions?.filter(a => a.isSelected) :
        currentMode === Mode.Favorites ? favoriteActions?.filter(a => a.isSelected) :
          currentMode === Mode.PredefinedActions ? predefinedActions?.filter(a => a.isSelected) :
            [];

    if (!selectedActions || selectedActions.length === 0) {
      setNotificationMessage("No actions selected");
      setIsSuccessNotification(false);
      return;
    }

    const message: IDataChromeMessage = {
      actionType: ActionType.CopyAction,
      message: selectedActions,
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }, [actions, myClipboardActions, favoriteActions, predefinedActions, currentMode, communicationService])

  const deleteAction = useCallback((action: IActionModel, oldActions: IActionModel[], setActionsFunc: (value: React.SetStateAction<IActionModel[]>)
    => void, actionType: ActionType) => {
    const message: IDataChromeMessage = {
      actionType: actionType,
      message: action,
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, (response) => {
      const myArray = [...(oldActions || [])];
      const index = myArray.findIndex((a) => a.id === action.id);
      myArray.splice(index, 1);
      setActionsFunc(myArray);
    });
  }, [communicationService])

  const deleteRecordedAction = useCallback((action: IActionModel) => {
    deleteAction(action, actions, setActions, ActionType.DeleteAction);
  }, [actions, setActions, deleteAction])

  const deleteMyClipboardAction = useCallback((action: IActionModel) => {
    deleteAction(action, myClipboardActions, setMyClipboardActions, ActionType.DeleteMyClipboardAction);
  }, [myClipboardActions, setMyClipboardActions, deleteAction])

  const updateFavoriteStatusInLists = useCallback((actionId: string, isFavorite: boolean) => {
    setActions(prevActions =>
      (prevActions ?? []).map(action =>
        action.id === actionId ? { ...action, isFavorite } : action
      )
    );

    setMyClipboardActions(prevActions =>
      (prevActions ?? []).map(action =>
        action.id === actionId ? { ...action, isFavorite } : action
      )
    );

    setPredefinedActions(prevActions =>
      (prevActions ?? []).map(action =>
        action.id === actionId ? { ...action, isFavorite } : action
      )
    );
  }, [])

  const deleteFavoriteAction = useCallback((action: IActionModel) => {
    storageService.removeFavoriteAction(action).then((updatedFavorites) => {
      setFavoriteActions(updatedFavorites);
      updateFavoriteStatusInLists(action.id, false);
    });
  }, [storageService, updateFavoriteStatusInLists])

  const getMyClipboardActions = useCallback(() => {
    const message: IDataChromeMessage = {
      actionType: ActionType.GetElementsFromMyClipboard,
      message: "Get My Clipboard Actions",
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }, [communicationService])

  const changeSelection = useCallback((action: IActionModel, oldActions: IActionModel[], setActionsFunc: (value: React.SetStateAction<IActionModel[]>) => void) => {
    const allActions = [...(oldActions || [])];
    const index = allActions.findIndex(a => a.id === action.id);
    allActions[index].isSelected = !action.isSelected;
    setActionsFunc(allActions);
  }, [])

  const toggleFavorite = useCallback((action: IActionModel) => {
    if (action.isFavorite) {
      storageService.removeFavoriteAction(action).then((updatedFavorites) => {
        setFavoriteActions(updatedFavorites);
        updateFavoriteStatusInLists(action.id, false);
      });
    } else {
      const favoriteAction = { ...action, isFavorite: true };
      storageService.addFavoriteAction(favoriteAction).then((updatedFavorites) => {
        setFavoriteActions(updatedFavorites);
        updateFavoriteStatusInLists(action.id, true);
      });
    }
  }, [storageService, updateFavoriteStatusInLists])

  const changeSelectionRecordedAction = useCallback((action: IActionModel) => {
    changeSelection(action, actions, setActions);
  }, [actions, changeSelection])

  const changeCopiedActionSelection = useCallback((action: IActionModel) => {
    changeSelection(action, myClipboardActions, setMyClipboardActions);
  }, [changeSelection, myClipboardActions])

  const changeFavoriteActionSelection = useCallback((action: IActionModel) => {
    changeSelection(action, favoriteActions, setFavoriteActions);
  }, [changeSelection, favoriteActions])

  const changePredefinedActionSelection = useCallback((action: IActionModel) => {
    changeSelection(action, predefinedActions, setPredefinedActions);
  }, [changeSelection, predefinedActions])

  const insertSelectedActionsToClipboard = useCallback(() => {
    const selectedActions = currentMode === Mode.Requests ? actions?.filter(a => a.isSelected) :
      currentMode === Mode.CopiedActions ? myClipboardActions?.filter(a => a.isSelected) :
        currentMode === Mode.Favorites ? favoriteActions?.filter(a => a.isSelected) :
          currentMode === Mode.PredefinedActions ? predefinedActions?.filter(a => a.isSelected) :
            [];

    if (!selectedActions || selectedActions.length === 0) {
      setNotificationMessage("No actions selected");
      setIsSuccessNotification(false);
      return;
    }

    communicationService.sendRequest({ actionType: ActionType.SetSelectedActionsIntoClipboardV3, message: selectedActions }, AppElement.ReactApp, AppElement.Content, (response) => {
      navigator.clipboard.writeText(response);
      setNotificationMessage("Actions have been copied - now you can paste them in the Power Automate editor");
      setIsSuccessNotification(true);
    });
  }, [actions, myClipboardActions, favoriteActions, predefinedActions, currentMode, communicationService])

  const filterActionsBySearch = useCallback((actionsToFilter: IActionModel[]) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return actionsToFilter;
    }
    return actionsToFilter?.filter(action =>
      action.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [searchTerm])

  const filteredActions = useMemo(() => filterActionsBySearch(actions), [actions, filterActionsBySearch]);
  const filteredMyClipboardActions = useMemo(() => filterActionsBySearch(myClipboardActions), [myClipboardActions, filterActionsBySearch]);
  const filteredFavoriteActions = useMemo(() => filterActionsBySearch(favoriteActions), [favoriteActions, filterActionsBySearch]);

  const formatTimeLeft = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const renderRecordButton = useCallback(() => {
    const recordingTitle = isRecording 
      ? (recordingTimeLeft ? `Stop Recording (${formatTimeLeft(recordingTimeLeft)} left)` : "Stop Recording")
      : "Start Recording";
    
    const hoverText = isRecording 
      ? (recordingTimeLeft ? `Stop Action Recording (${formatTimeLeft(recordingTimeLeft)} remaining)` : "Stop Action Recording")
      : "Start Action Recording";

    return isRecordingPage && !isPowerAutomatePage && <>{isRecording ?
      <Icon
        className="App-icon"
        iconName='CircleStopSolid'
        title={recordingTitle}
        onClick={sendRecordingStatus}
        onMouseEnter={() => { setHoverMessage(hoverText) }}
        onMouseLeave={() => { setHoverMessage(null) }}>
      </Icon> :
      <Icon
        className="App-icon"
        iconName='Record2'
        title={recordingTitle}
        onClick={sendRecordingStatus}
        onMouseEnter={() => { setHoverMessage(hoverText) }}
        onMouseLeave={() => { setHoverMessage(null) }}>
      </Icon>
    }</>
  }, [isRecording, isRecordingPage, isPowerAutomatePage, sendRecordingStatus, recordingTimeLeft, formatTimeLeft])

  const renderClearButton = useCallback(() => {
    return (isRecordingPage || isPowerAutomatePage || hasActionsOnPageToCopy) && <Icon
      className="App-icon"
      iconName='Clear'
      title="Clear Items"
      onClick={clearActionList}
      onMouseEnter={() => { setHoverMessage("Remove All Items from the Current List") }}
      onMouseLeave={() => { setHoverMessage(null) }}
    ></Icon>;
  }, [clearActionList, isPowerAutomatePage, isRecordingPage, hasActionsOnPageToCopy])

  const renderCopyButton = useCallback(() => {
    return isPowerAutomatePage && !isV3PowerAutomateEditor && <Icon
      className="App-icon"
      iconName='Copy'
      title="Copy Items"
      onClick={copyItems}
      onMouseEnter={() => { setHoverMessage("Copy Items to the 'My Clipboard' Section") }}
      onMouseLeave={() => { setHoverMessage(null) }}
    ></Icon>;
  }, [copyItems, isPowerAutomatePage, isV3PowerAutomateEditor])

  const renderGetClipboardActions = useCallback(() => {
    return isPowerAutomatePage && !isV3PowerAutomateEditor && <Icon
      className="App-icon"
      iconName='DoubleChevronDown12'
      title="Get 'My Clipboard Actions'"
      onClick={getMyClipboardActions}
      onMouseEnter={() => { setHoverMessage("Retrieve Actions from the 'My Clipboard' Section") }}
      onMouseLeave={() => { setHoverMessage(null) }}
    ></Icon>;
  }, [getMyClipboardActions, isPowerAutomatePage, isV3PowerAutomateEditor])

  const renderCopyAllActionsFromPage = useCallback(() => {
    return hasActionsOnPageToCopy && !isPowerAutomatePage && <Icon
      className="App-icon"
      iconName='SetAction'
      title="Copy All Actions from the Page"
      onClick={copyAllActionsFromPage}
      onMouseEnter={() => { setHoverMessage("Copy All Actions from the Page") }}
      onMouseLeave={() => { setHoverMessage(null) }}
    ></Icon>;
  }, [copyAllActionsFromPage, hasActionsOnPageToCopy, isPowerAutomatePage])

  const renderInsertToClipboardV3Button = useCallback(() => {
    return isV3PowerAutomateEditor && <Icon
      className="App-icon"
      iconName='Copy'
      title="Add Selected Actions to Clipboard"
      onClick={insertSelectedActionsToClipboard}
      onMouseEnter={() => { setHoverMessage("Add Selected Actions to Clipboard") }}
      onMouseLeave={() => { setHoverMessage(null) }}
    ></Icon>;
  }, [insertSelectedActionsToClipboard, isV3PowerAutomateEditor])

  const onSettingsChanged = useCallback((newSettings: ISettingsModel) => {
    getRecordingPageSetting(newSettings.isRecordingPage ?? null);
    getClassicPASetting(newSettings.isClassicPowerAutomatePage ?? null);
    getNewPASetting(newSettings.isModernPowerAutomatePage ?? null);
    
    // Handle predefined actions settings change
    handleSettingsChange(newSettings);
  }, [getRecordingPageSetting, getClassicPASetting, getNewPASetting, handleSettingsChange]);

  const renderSettingsButton = useCallback(() => {
    return <Icon
      className="App-icon"
      iconName='Settings'
      title="Settings"
      onClick={() => setShowSettings(!showSettings)}
      onMouseEnter={() => { setHoverMessage("Open Extension Settings") }}
      onMouseLeave={() => { setHoverMessage(null) }}
      styles={{
        root: {
          color: showSettings ? '#0078d4' : 'white',
          backgroundColor: showSettings ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          borderRadius: '4px'
        }
      }}
    ></Icon>;
  }, [showSettings])

  return (
    <div className="App">
      <header className="App-header">
        {renderRecordButton()}
        {renderClearButton()}
        {renderCopyButton()}
        {renderGetClipboardActions()}
        {renderCopyAllActionsFromPage()}
        {renderInsertToClipboardV3Button()}
        <div style={{ marginLeft: 'auto' }}>
          {renderSettingsButton()}
        </div>
      </header>
      {notificationMessage ? <MessageBar
        messageBarType={isSuccessNotification ? MessageBarType.success : MessageBarType.warning}
        isMultiline={false}
        onDismiss={() => setNotificationMessage(null)}
        messageBarIconProps={{ iconName: isSuccessNotification ? 'Completed' : 'Warning' }}
      >{notificationMessage}
      </MessageBar> : <MessageBar
        messageBarType={MessageBarType.info}
        messageBarIconProps={{ iconName: 'Info', styles: { root: { display: !hoverMessage ? 'none' : 'block' } } }}
      >{hoverMessage}
      </MessageBar>}

      {showSettings ? (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <Settings 
            storageService={storageService} 
            onSettingsChange={onSettingsChanged}
            onFavoritesImported={async () => {
              const favorites = await storageService.getFavoriteActions();
              setFavoriteActions(favorites);
            }}
          />
        </div>
      ) : (
        <Pivot onLinkClick={(item: PivotItem | undefined) => {
          switch (item?.props.headerText) {
            case "Recorded Requests":
              setCurrentMode(Mode.Requests);
              break;
            case "Copied Actions":
              setCurrentMode(Mode.CopiedActions);
              break;
            case "Copied Actions in the new editor":
              setCurrentMode(Mode.CopiedActionsV3);
              break;
            case "Favorites":
              setCurrentMode(Mode.Favorites);
              break;
            case "Predefined Actions":
              setCurrentMode(Mode.PredefinedActions);
              break;
          }
        }}>
          {<PivotItem
            headerText="Recorded Requests"
          >
            <ActionsList
              actions={filteredActions}
              mode={Mode.Requests}
              changeSelectionFunc={changeSelectionRecordedAction}
              deleteActionFunc={deleteRecordedAction}
              showButton={false}
              toggleFavoriteFunc={toggleFavorite}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </PivotItem>}
          {<PivotItem
            headerText="Copied Actions"
          >
            <ActionsList
              actions={filteredMyClipboardActions}
              mode={Mode.CopiedActions}
              changeSelectionFunc={changeCopiedActionSelection}
              deleteActionFunc={deleteMyClipboardAction}
              showButton={false}
              toggleFavoriteFunc={toggleFavorite}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </PivotItem>}
          {<PivotItem
            headerText="Favorites"
          >
            <ActionsList
              actions={filteredFavoriteActions}
              mode={Mode.Favorites}
              changeSelectionFunc={changeFavoriteActionSelection}
              deleteActionFunc={deleteFavoriteAction}
              showButton={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </PivotItem>}
          {settings?.showPredefinedActions && (
            <PivotItem headerText="Predefined Actions">
              <PredefinedActionsList 
                actions={predefinedActions}
                isLoading={predefinedActionsLoading}
                onRefresh={refreshPredefinedActions}
                changeSelectionFunc={changePredefinedActionSelection}
                toggleFavoriteFunc={toggleFavorite}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </PivotItem>
          )}
        </Pivot>
      )}
    </div >
  );
}

export default App;
