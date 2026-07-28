import { useCallback, useEffect, useState } from 'react';
import {
    Dialog, DialogType, DialogFooter,
    PrimaryButton, DefaultButton,
    TextField, ComboBox, IComboBox, IComboBoxOption, Checkbox, IconButton,
    Label, Stack, Text, Separator, Icon, TooltipHost
} from '@fluentui/react';
import { IActionModel } from '../models';
import { GlobalPlaceholders, PlaceholderService } from '../services/PlaceholderService';

export interface ICopyWithOptionsModalProps {
    action: IActionModel;
    placeholderService: PlaceholderService;
    onCopy: (filledAction: IActionModel) => void;
    onSaveAsFavorite: (filledAction: IActionModel) => void;
    onDismiss: () => void;
}

const CopyWithOptionsModal: React.FC<ICopyWithOptionsModalProps> = ({
    action,
    placeholderService,
    onCopy,
    onSaveAsFavorite,
    onDismiss
}) => {
    const [globalPlaceholders, setGlobalPlaceholders] = useState<GlobalPlaceholders>({});
    const [values, setValues] = useState<Record<string, string>>({});
    const [expressionValues, setExpressionValues] = useState<Record<string, string>>({});
    const [saveAsFavorite, setSaveAsFavorite] = useState(false);

    const placeholders = placeholderService.extractPlaceholders(action.actionJson);
    const expressions = placeholderService.extractExpressions(action.actionJson);

    useEffect(() => {
        placeholderService.getGlobalPlaceholders().then((globals) => {
            setGlobalPlaceholders(globals);
            setValues(placeholderService.getDefaultValues(placeholders, globals));
        });
        const initialExpressionValues: Record<string, string> = {};
        for (const expression of expressions) {
            initialExpressionValues[expression] = expression;
        }
        setExpressionValues(initialExpressionValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action.id]);

    const handleExpressionChange = useCallback((original: string, value: string) => {
        setExpressionValues((prev) => ({ ...prev, [original]: value }));
    }, []);

    const handleExpressionReset = useCallback((original: string) => {
        setExpressionValues((prev) => ({ ...prev, [original]: original }));
    }, []);

    const handleChange = useCallback((key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleReset = useCallback((key: string) => {
        setValues((prev) => ({ ...prev, [key]: globalPlaceholders[key]?.[0] ?? '' }));
    }, [globalPlaceholders]);

    const getVariantOptions = useCallback((key: string): IComboBoxOption[] => {
        return (globalPlaceholders[key] || []).map((v) => ({ key: v, text: v }));
    }, [globalPlaceholders]);

    const getKnownOptions = useCallback((key: string): IComboBoxOption[] => {
        return placeholderService.getPlaceholderOptions(key, globalPlaceholders).map((o) => ({
            key: o.value,
            text: o.label,
            data: { tooltip: o.tooltip },
        }));
    }, [placeholderService, globalPlaceholders]);

    const handleResetAll = useCallback(() => {
        setValues(placeholderService.getDefaultValues(placeholders, globalPlaceholders));
        const resetExpressionValues: Record<string, string> = {};
        for (const expression of expressions) {
            resetExpressionValues[expression] = expression;
        }
        setExpressionValues(resetExpressionValues);
    }, [globalPlaceholders, placeholders, placeholderService, expressions]);

    const buildFilledAction = useCallback((): IActionModel => {
        const withPlaceholders = placeholderService.substitutePlaceholders(action.actionJson, values);
        const filledJson = placeholderService.substituteExpressions(withPlaceholders, expressionValues);
        return {
            ...action,
            actionJson: filledJson,
            id: `${action.id}-filled-${Date.now()}`,
            isFavorite: false,
            isSelected: false,
        };
    }, [action, placeholderService, values, expressionValues]);

    const handleCopy = useCallback(() => {
        const filled = buildFilledAction();
        if (saveAsFavorite) {
            onSaveAsFavorite(filled);
        }
        onCopy(filled);
    }, [saveAsFavorite, buildFilledAction, onCopy, onSaveAsFavorite]);

    return (
        <Dialog
            hidden={false}
            onDismiss={onDismiss}
            dialogContentProps={{
                type: DialogType.normal,
                title: action.title,
                subText: 'Fill in placeholder values before copying',
            }}
            modalProps={{ isBlocking: true }}
            minWidth={480}
        >
            <Stack tokens={{ childrenGap: 16 }} style={{ marginTop: 8 }}>
                {placeholders.map((key) => {
                    const fieldLocation = placeholderService.getFieldLocation(action.actionJson, `{{${key}}}`);
                    const knownOptions = getKnownOptions(key);
                    const hasKnownOptions = knownOptions.length > 0;
                    const currentValue = values[key] ?? '';
                    const matchedOption = knownOptions.find(o => o.key === currentValue);
                    return (
                        <Stack key={key} tokens={{ childrenGap: 4 }}>
                            <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                    <Label style={{ fontFamily: 'monospace', fontWeight: 600 }}>{`{{${key}}}`}</Label>
                                    {fieldLocation && (
                                        <Text variant="small" style={{ color: '#605e5c', fontStyle: 'italic' }}>{fieldLocation}</Text>
                                    )}
                                </Stack>
                                <IconButton
                                    iconProps={{ iconName: 'Reset' }}
                                    title="Reset to global value"
                                    ariaLabel="Reset"
                                    onClick={() => handleReset(key)}
                                    styles={{ root: { height: 24, width: 24 } }}
                                />
                            </Stack>
                            {hasKnownOptions ? (
                                <ComboBox
                                    allowFreeInput
                                    autoComplete="off"
                                    options={knownOptions}
                                    text={matchedOption ? matchedOption.text : currentValue}
                                    onChange={(_: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
                                        if (option) { handleChange(key, String(option.key)); }
                                    }}
                                    onInputValueChange={(val: string) => handleChange(key, val)}
                                    onRenderOption={(option) => (
                                        <TooltipHost content={(option as any)?.data?.tooltip} styles={{ root: { display: 'inline-block' } }}>
                                            <span>{option?.text}</span>
                                        </TooltipHost>
                                    )}
                                    placeholder={`Select value for ${key}`}
                                    styles={{ root: { width: '100%' } }}
                                />
                            ) : (
                                <ComboBox
                                    allowFreeInput
                                    autoComplete="off"
                                    options={getVariantOptions(key)}
                                    text={currentValue}
                                    onChange={(_: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
                                        if (option) { handleChange(key, String(option.key)); }
                                    }}
                                    onInputValueChange={(val: string) => handleChange(key, val)}
                                    placeholder={`Enter value for ${key}`}
                                    styles={{ root: { width: '100%' } }}
                                />
                            )}
                            {(globalPlaceholders[key]?.length ?? 0) > 0 && (
                                <Text variant="small" style={{ color: '#605e5c' }}>
                                    Saved variants: {globalPlaceholders[key].join(', ')} (managed in Settings)
                                </Text>
                            )}
                        </Stack>
                    );
                })}

                {expressions.length > 0 && (
                    <>
                        <Separator>Expressions</Separator>
                        <Text variant="small" style={{ color: '#605e5c' }}>
                            Dynamic content copied from the flow editor. Edit the references (e.g. step names) if they don't match the target flow.
                        </Text>
                        {expressions.map((expression) => {
                            const { label } = placeholderService.getExpressionDisplayInfo(expression);
                            const fieldLocation = placeholderService.getFieldLocation(action.actionJson, expression);
                            return (
                                <Stack key={expression} tokens={{ childrenGap: 4 }}>
                                    <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                                        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                            <Stack
                                                horizontal
                                                verticalAlign="center"
                                                tokens={{ childrenGap: 6 }}
                                                styles={{
                                                    root: {
                                                        backgroundColor: '#eef1fb',
                                                        border: '1px solid #c7d1f2',
                                                        borderRadius: 4,
                                                        padding: '3px 10px',
                                                    }
                                                }}
                                            >
                                                <Icon iconName="LightningBolt" style={{ color: '#4f52b2', fontSize: 12 }} />
                                                <Text variant="small" style={{ color: '#292a73', fontWeight: 600 }}>{label}</Text>
                                            </Stack>
                                            {fieldLocation && (
                                                <Text variant="small" style={{ color: '#605e5c', fontStyle: 'italic' }}>{fieldLocation}</Text>
                                            )}
                                        </Stack>
                                        <IconButton
                                            iconProps={{ iconName: 'Reset' }}
                                            title="Reset to original"
                                            ariaLabel="Reset"
                                            onClick={() => handleExpressionReset(expression)}
                                            styles={{ root: { height: 24, width: 24 } }}
                                        />
                                    </Stack>
                                    <TextField
                                        value={expressionValues[expression] ?? expression}
                                        onChange={(_e, val) => handleExpressionChange(expression, val ?? '')}
                                        styles={{ root: { width: '100%' }, field: { fontFamily: 'monospace', fontSize: 12 } }}
                                    />
                                </Stack>
                            );
                        })}
                    </>
                )}

                <Separator />

                <Checkbox
                    label="Save filled action to Favorites"
                    checked={saveAsFavorite}
                    onChange={(_, checked) => setSaveAsFavorite(!!checked)}
                />
            </Stack>

            <DialogFooter>
                <DefaultButton text="Reset all" onClick={handleResetAll} style={{ marginRight: 'auto' }} />
                <DefaultButton text="Cancel" onClick={onDismiss} />
                <PrimaryButton text="Copy" onClick={handleCopy} />
            </DialogFooter>
        </Dialog>
    );
};

export default CopyWithOptionsModal;
