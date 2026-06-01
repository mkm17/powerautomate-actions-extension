import { useCallback, useState } from "react";
import { Checkbox, Icon, IconButton, TextField, Panel, PanelType, MessageBar, MessageBarType } from "@fluentui/react";
import { IActionModel, Mode } from "../models";

export interface IActionsListProps {
    actions: IActionModel[];
    mode: Mode;
    changeSelectionFunc: (action: IActionModel) => void;
    deleteActionFunc: (action: IActionModel) => void;
    editActionFunc?: (action: IActionModel) => void;
    showButton: boolean;
    toggleFavoriteFunc?: (action: IActionModel) => void;
    searchTerm: string;
    onSearchChange: (searchTerm: string) => void;
}

const ActionsList: React.FC<IActionsListProps> = (props) => {
    const { searchTerm, onSearchChange } = props;
    const [selectedActionForDetails, setSelectedActionForDetails] = useState<IActionModel | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editedUrl, setEditedUrl] = useState('');
    const [editedHeaders, setEditedHeaders] = useState('');
    const [editedBody, setEditedBody] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const getSharePointUrlParts = useCallback((url: string): { dataset: string; uri: string } | null => {
        const vtiSeparator = '/_vti_bin';
        const apiSeparator = '/_api';
        const normalizedUrl = (url || '').trim();

        if (normalizedUrl.indexOf(vtiSeparator) > -1) {
            const urlSplit = normalizedUrl.split(vtiSeparator);
            return { dataset: urlSplit[0], uri: `_vti_bin${urlSplit[1] || ''}` };
        }

        if (normalizedUrl.indexOf(apiSeparator) > -1) {
            const urlSplit = normalizedUrl.split(apiSeparator);
            return { dataset: urlSplit[0], uri: `_api${urlSplit[1] || ''}` };
        }

        return null;
    }, []);

    const parseActionDetails = useCallback((action: IActionModel | null) => {
        if (!action) {
            return {
                parsedBody: null,
                parsedHeaders: null,
                parsedActionData: null,
            };
        }

        let parsedBody: any = null;
        let parsedHeaders: any = null;
        let parsedActionData: any = null;

        try {
            parsedActionData = JSON.parse(action.actionJson);
            const inputs = parsedActionData?.operationDefinition?.inputs;
            parsedBody = inputs?.body ?? inputs?.parameters?.["parameters/body"] ?? inputs?.parameters?.Body ?? action.body;
            parsedHeaders = inputs?.headers ?? inputs?.parameters?.["parameters/headers"] ?? null;
        } catch {
            parsedBody = action.body;
        }

        return {
            parsedBody,
            parsedHeaders,
            parsedActionData,
        };
    }, []);

    const buildUpdatedActionJson = useCallback((action: IActionModel, updatedUrl: string, headers: any, body: any): string => {
        let parsedActionJson: any = null;
        try {
            parsedActionJson = JSON.parse(action.actionJson);
        } catch {
            return action.actionJson;
        }

        const inputs = parsedActionJson?.operationDefinition?.inputs;
        if (!inputs) {
            return JSON.stringify(parsedActionJson);
        }

        if (Object.prototype.hasOwnProperty.call(inputs, 'uri')) {
            inputs.uri = updatedUrl;
        }

        if (Object.prototype.hasOwnProperty.call(inputs, 'headers')) {
            inputs.headers = headers;
        }

        if (Object.prototype.hasOwnProperty.call(inputs, 'body')) {
            if (body === null || typeof body === 'undefined') {
                delete inputs.body;
            } else {
                inputs.body = body;
            }
        }

        if (inputs.parameters) {
            if (Object.prototype.hasOwnProperty.call(inputs.parameters, 'Uri')) {
                inputs.parameters.Uri = updatedUrl;
            }

            if (Object.prototype.hasOwnProperty.call(inputs.parameters, 'parameters/uri')) {
                const sharePointParts = getSharePointUrlParts(updatedUrl);
                if (sharePointParts) {
                    inputs.parameters['dataset'] = sharePointParts.dataset;
                    inputs.parameters['parameters/uri'] = sharePointParts.uri;
                } else {
                    inputs.parameters['parameters/uri'] = updatedUrl;
                }
            }

            if (Object.prototype.hasOwnProperty.call(inputs.parameters, 'parameters/headers')) {
                inputs.parameters['parameters/headers'] = headers;
            }

            if (Object.prototype.hasOwnProperty.call(inputs.parameters, 'parameters/body')) {
                if (body === null || typeof body === 'undefined') {
                    delete inputs.parameters['parameters/body'];
                } else {
                    inputs.parameters['parameters/body'] = body;
                }
            }

            if (Object.prototype.hasOwnProperty.call(inputs.parameters, 'Body')) {
                if (body === null || typeof body === 'undefined') {
                    delete inputs.parameters.Body;
                } else {
                    inputs.parameters.Body = body;
                }
            }
        }

        return JSON.stringify(parsedActionJson);
    }, [getSharePointUrlParts]);

    const startEditingDetails = useCallback((action: IActionModel) => {
        const parsedDetails = parseActionDetails(action);
        setEditedUrl(action.url || '');
        setEditedHeaders(parsedDetails.parsedHeaders ? JSON.stringify(parsedDetails.parsedHeaders, null, 2) : '{}');
        setEditedBody(typeof parsedDetails.parsedBody === 'undefined' || parsedDetails.parsedBody === null ? 'null' : JSON.stringify(parsedDetails.parsedBody, null, 2));
        setValidationError(null);
        setIsEditingDetails(true);
    }, [parseActionDetails]);

    const saveEditedAction = useCallback(() => {
        if (!selectedActionForDetails || !props.editActionFunc) {
            return;
        }

        try {
            const parsedHeaders = JSON.parse(editedHeaders);
            const parsedBody = JSON.parse(editedBody);
            const updatedUrl = editedUrl.trim();

            if (!updatedUrl) {
                setValidationError('URL cannot be empty.');
                return;
            }

            const updatedAction: IActionModel = {
                ...selectedActionForDetails,
                url: updatedUrl,
                body: parsedBody,
                actionJson: buildUpdatedActionJson(selectedActionForDetails, updatedUrl, parsedHeaders, parsedBody),
            };

            props.editActionFunc(updatedAction);
            setSelectedActionForDetails(updatedAction);
            setValidationError(null);
            setIsEditingDetails(false);
        } catch {
            setValidationError('Headers and Body must be valid JSON.');
        }
    }, [selectedActionForDetails, props, editedHeaders, editedBody, editedUrl, buildUpdatedActionJson]);

    const showActionDetails = useCallback((action: IActionModel) => {
        setSelectedActionForDetails(action);
        setIsEditingDetails(false);
        setValidationError(null);
        setIsPanelOpen(true);
    }, []);

    const hideActionDetails = useCallback(() => {
        setIsPanelOpen(false);
        setIsEditingDetails(false);
        setValidationError(null);
        setSelectedActionForDetails(null);
    }, []);

    const renderActionDetails = useCallback(() => {
        if (!selectedActionForDetails) return null;

        const parsedDetails = parseActionDetails(selectedActionForDetails);
        const parsedBody = parsedDetails.parsedBody;
        const parsedHeaders = parsedDetails.parsedHeaders;
        const parsedActionData = parsedDetails.parsedActionData;

        return (
            <Panel
                isOpen={isPanelOpen}
                onDismiss={hideActionDetails}
                type={PanelType.custom}
                customWidth="450px"
                headerText={`Action Details: ${selectedActionForDetails.title}`}
                closeButtonAriaLabel="Close"
                styles={{
                    content: { padding: '20px' }
                }}
            >
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {props.editActionFunc && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginBottom: '8px' }}>
                            {isEditingDetails ? (
                                <>
                                    <IconButton iconProps={{ iconName: 'CheckMark' }} title="Save" onClick={saveEditedAction} />
                                    <IconButton iconProps={{ iconName: 'Cancel' }} title="Cancel" onClick={() => { setIsEditingDetails(false); setValidationError(null); }} />
                                </>
                            ) : (
                                <IconButton iconProps={{ iconName: 'Edit' }} title="Edit" onClick={() => startEditingDetails(selectedActionForDetails)} />
                            )}
                        </div>
                    )}

                    {validationError && (
                        <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
                            {validationError}
                        </MessageBar>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                        <strong>URL:</strong>
                        {isEditingDetails ? (
                            <TextField
                                value={editedUrl}
                                onChange={(event, newValue) => setEditedUrl(newValue || '')}
                                styles={{ root: { marginTop: '5px' } }}
                            />
                        ) : (
                            <div style={{
                                backgroundColor: '#f5f5f5',
                                padding: '8px',
                                marginTop: '5px',
                                borderRadius: '4px',
                                wordBreak: 'break-all',
                                fontFamily: 'monospace',
                                fontSize: '12px'
                            }}>
                                {selectedActionForDetails.url}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>Method:</strong>
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '8px', 
                            marginTop: '5px', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                        }}>
                            {selectedActionForDetails.method}
                        </div>
                    </div>

                    {(isEditingDetails || parsedHeaders) && (
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Headers:</strong>
                            {isEditingDetails ? (
                                <TextField
                                    value={editedHeaders}
                                    multiline={true}
                                    rows={8}
                                    onChange={(event, newValue) => setEditedHeaders(newValue || '')}
                                    styles={{ root: { marginTop: '5px' } }}
                                />
                            ) : (
                                <div style={{
                                    backgroundColor: '#f5f5f5',
                                    padding: '8px',
                                    marginTop: '5px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {JSON.stringify(parsedHeaders, null, 2)}
                                </div>
                            )}
                        </div>
                    )}

                    {(isEditingDetails || typeof parsedBody !== 'undefined') && (
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Body:</strong>
                            {isEditingDetails ? (
                                <TextField
                                    value={editedBody}
                                    multiline={true}
                                    rows={10}
                                    onChange={(event, newValue) => setEditedBody(newValue || '')}
                                    styles={{ root: { marginTop: '5px' } }}
                                />
                            ) : (
                                <div style={{
                                    backgroundColor: '#f5f5f5',
                                    padding: '8px',
                                    marginTop: '5px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    {typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody, null, 2)}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                        <strong>Raw Action JSON:</strong>
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '8px', 
                            marginTop: '5px', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {parsedActionData ? JSON.stringify(parsedActionData, null, 2) : selectedActionForDetails.actionJson}
                        </div>
                    </div>

                    {props.editActionFunc && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '16px' }}>
                            {isEditingDetails ? (
                                <>
                                    <IconButton iconProps={{ iconName: 'CheckMark' }} title="Save" onClick={saveEditedAction} />
                                    <IconButton iconProps={{ iconName: 'Cancel' }} title="Cancel" onClick={() => { setIsEditingDetails(false); setValidationError(null); }} />
                                </>
                            ) : (
                                <IconButton iconProps={{ iconName: 'Edit' }} title="Edit" onClick={() => startEditingDetails(selectedActionForDetails)} />
                            )}
                        </div>
                    )}
                </div>
            </Panel>
        );
    }, [selectedActionForDetails, isPanelOpen, hideActionDetails, parseActionDetails, validationError, isEditingDetails, editedUrl, editedHeaders, editedBody, props.editActionFunc, saveEditedAction, startEditingDetails]);
    const renderAction = useCallback((action: IActionModel) => {
        return <div className='App-Action-Row' title={action.url}>
            {props.showButton ?
                <Icon className='App-Action-Select' iconName='SingleBookmark' onClick={() => { props.changeSelectionFunc(action) }} title="Select Action To Copy"></Icon>
                :
                <Checkbox className='App-Action-Checkbox' checked={action.isSelected} defaultChecked={action.isSelected} onChange={() => { props.changeSelectionFunc(action) }}></Checkbox>}
            <img src={action.icon} className='App-Action-Icon' alt={action.title}></img>
            <span className='App-Action-Element'>{action.title}</span>
            <span className='App-Action-Element'>{action.method}</span>
            <Icon 
                className='App-Action-Info' 
                iconName='Info' 
                onClick={() => { showActionDetails(action) }} 
                title="Show Action Details"
            ></Icon>
            {props.toggleFavoriteFunc && (
                <Icon 
                    className='App-Action-Favorite' 
                    iconName={action.isFavorite ? 'FavoriteStarFill' : 'FavoriteStar'} 
                    onClick={() => { props.toggleFavoriteFunc!(action) }} 
                    title={action.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                ></Icon>
            )}
            <Icon className='App-Action-Delete' iconName='Delete' onClick={() => { props.deleteActionFunc(action) }}></Icon>
        </div>;
    }, [props, showActionDetails])

    const renderActions = useCallback(() => {
        return props.actions && props.actions.length > 0 && props.actions.map((action, index) => 
            <div key={action.id || index}>
                {renderAction(action)}
            </div>
        )
    }, [props.actions, renderAction])

    const renderHeader = useCallback(() => {
        const headerClassName = `App-Action-Header ${props.toggleFavoriteFunc ? 'App-Action-Header--with-favorite' : 'App-Action-Header--without-favorite'}`;
        return (
            <div className={headerClassName}>
            <span>Select</span>
            <span></span>
            <span>Title</span>
            <span>Method</span>
            <span>Info</span>
            {props.toggleFavoriteFunc && <span>Fav</span>}
            <span></span>
        </div>);
    }, [props.toggleFavoriteFunc])

    const renderSearch = useCallback(() => {
        return <div style={{ padding: '10px 20px', backgroundColor: '#f3f2f1' }}>
            <TextField
                placeholder="Search actions by title..."
                value={searchTerm}
                onChange={(event, newValue) => onSearchChange(newValue || '')}
                styles={{
                    root: { width: '100%' },
                    field: { fontSize: '14px' }
                }}
                iconProps={{ iconName: 'Search' }}
            />
        </div>;
    }, [searchTerm, onSearchChange])

    return <>
        <div>{renderHeader()}</div>
        <div>{renderSearch()}</div>
        <div className="App-Actions">{renderActions()}</div>
        {renderActionDetails()}
    </>;
}

export default ActionsList;