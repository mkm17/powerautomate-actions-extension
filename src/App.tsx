import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { ActionType, IDataChromeMessage, AppElement, ICommunicationChromeMessage, IInitialState, Mode } from './models';
import { IActionModel } from './models/IActionModel';
import { StorageService } from './services/StorageService';
import { ExtensionCommunicationService } from './services';
import { Icon, MessageBar, MessageBarType, Pivot, PivotItem } from '@fluentui/react';
import ActionsList from './components/ActionsList';

function App(initialState?: IInitialState | undefined) {
  const storageService = useMemo(() => { return new StorageService(); }, []);
  const communicationService = useMemo(() => { return new ExtensionCommunicationService(); }, []);
  const [isRecording, setIsRecording] = useState<boolean>(initialState?.isRecording || false);
  const [isPowerAutomatePage, setIsPowerAutomatePage] = useState<boolean>(initialState?.isPowerAutomatePage || false);
  const [isRecordingPage, setIsRecordingPage] = useState<boolean>(initialState?.isRecordingPage || false);
  const [hasActionsOnPageToCopy, setHasActionsOnPageToCopy] = useState<boolean>(initialState?.hasActionsOnPageToCopy || false);
  const [actions, setActions] = useState<IActionModel[]>(initialState?.actions || []);
  const [myClipboardActions, setMyClipboardActions] = useState<IActionModel[]>(initialState?.myClipboardActions || []);
  const [currentMode, setCurrentMode] = useState<Mode>(initialState?.currentMode || Mode.Requests);
  const [favoriteActions, setFavoriteActions] = useState<IActionModel[]>(initialState?.favoriteActions || []);
  const [isV3PowerAutomateEditor, setIsV3PowerAutomateEditor] = useState<boolean>(false);
  const [hoverMessage, setHoverMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isSuccessNotification, setIsSuccessNotification] = useState<boolean>(false);

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

  const initData = useCallback(() => {
    communicationService.sendRequest({ actionType: ActionType.CheckRecordingPage, message: "Check Recording Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsRecordingPage(response);
    });
    communicationService.sendRequest({ actionType: ActionType.CheckPowerAutomatePage, message: "Check PowerAutomate Page" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsPowerAutomatePage(response)
    });
    communicationService.sendRequest({ actionType: ActionType.CheckIfPageHasActionsToCopy, message: "Check If Page has actions to copy" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setHasActionsOnPageToCopy(response)
    });
    communicationService.sendRequest({ actionType: ActionType.CheckIsNewPowerAutomateEditorV3, message: "Check If Page is a new Power Automate editor" }, AppElement.ReactApp, AppElement.Content, (response) => {
      setIsV3PowerAutomateEditor(response);
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

    storageService.getIsRecordingValue().then((isRecording) => {
      setIsRecording(isRecording);
    });

    chrome.runtime.onMessage.addListener(listenToMessage);
  }, [communicationService, storageService]);

  useEffect(initData, []);

  const sendRecordingStatus = useCallback(() => {
    const message: IDataChromeMessage = isRecording
      ? { actionType: ActionType.StopRecording, message: "Stop recording" }
      : { actionType: ActionType.StartRecording, message: "Start recording" };
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Background, setIsRecording);
  }, [communicationService, isRecording]);

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
    }
  }, [currentMode, storageService])

  const copyItems = useCallback(() => {
    const selectedActions = currentMode === Mode.Requests ? actions?.filter(a => a.isSelected) : 
                           currentMode === Mode.CopiedActions ? myClipboardActions?.filter(a => a.isSelected) :
                           favoriteActions?.filter(a => a.isSelected);

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
  }, [actions, myClipboardActions, favoriteActions, currentMode, communicationService])

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

  const deleteFavoriteAction = useCallback((action: IActionModel) => {
    storageService.removeFavoriteAction(action).then((updatedFavorites) => {
      setFavoriteActions(updatedFavorites);
      updateFavoriteStatusInLists(action.id, false);
    });
  }, [storageService])

  const getMyClipboardActions = useCallback(() => {
    const message: IDataChromeMessage = {
      actionType: ActionType.GetElementsFromMyClipboard,
      message: "Get My Clipboard Actions",
    }
    communicationService.sendRequest(message, AppElement.ReactApp, AppElement.Content);
  }, [communicationService])

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
  }, [])

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

  const insertSelectedActionsToClipboard = useCallback(() => {
    const selectedActions = currentMode === Mode.Requests ? actions?.filter(a => a.isSelected) : 
                           currentMode === Mode.CopiedActions ? myClipboardActions?.filter(a => a.isSelected) :
                           favoriteActions?.filter(a => a.isSelected);

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
  }, [actions, myClipboardActions, favoriteActions, currentMode, communicationService])

  const renderRecordButton = useCallback(() => {
    return isRecordingPage && !isPowerAutomatePage && <>{isRecording ?
      <Icon
        className="App-icon"
        iconName='CircleStopSolid'
        title="Stop Recording"
        onClick={sendRecordingStatus}
        onMouseEnter={() => { setHoverMessage("Stop Action Recording") }}
        onMouseLeave={() => { setHoverMessage(null) }}>
      </Icon> :
      <Icon
        className="App-icon"
        iconName='Record2'
        title="Start Recording"
        onClick={sendRecordingStatus}
        onMouseEnter={() => { setHoverMessage("Start Action Recording") }}
        onMouseLeave={() => { setHoverMessage(null) }}>
      </Icon>
    }</>
  }, [isRecording, isRecordingPage, isPowerAutomatePage, sendRecordingStatus])

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

  return (
    <div className="App">
      <header className="App-header">
        {renderRecordButton()}
        {renderClearButton()}
        {renderCopyButton()}
        {renderGetClipboardActions()}
        {renderCopyAllActionsFromPage()}
        {renderInsertToClipboardV3Button()}
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
        }
      }}>
        {<PivotItem
          headerText="Recorded Requests"
        >
          <ActionsList
            actions={actions}
            mode={Mode.Requests}
            changeSelectionFunc={changeSelectionRecordedAction}
            deleteActionFunc={deleteRecordedAction}
            showButton={false}
            toggleFavoriteFunc={toggleFavorite}
          />
        </PivotItem>}
        {<PivotItem
          headerText="Copied Actions"
        >
          <ActionsList
            actions={myClipboardActions}
            mode={Mode.CopiedActions}
            changeSelectionFunc={changeCopiedActionSelection}
            deleteActionFunc={deleteMyClipboardAction}
            showButton={false}
            toggleFavoriteFunc={toggleFavorite}
          />
        </PivotItem>}
        {<PivotItem
          headerText="Favorites"
        >
          <ActionsList
            actions={favoriteActions}
            mode={Mode.Favorites}
            changeSelectionFunc={changeFavoriteActionSelection}
            deleteActionFunc={deleteFavoriteAction}
            showButton={false}
          />
        </PivotItem>}
      </Pivot>
    </div >
  );
}

export default App;
