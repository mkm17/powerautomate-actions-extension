import { useCallback, useEffect, useRef } from 'react';
import { PlaceholderService, Segment } from '../services/PlaceholderService';

export interface IExpressionAwareTextFieldProps {
    value: string;
    placeholderService: PlaceholderService;
    onChange?: (newValue: string) => void;
    readOnly?: boolean;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    ariaLabel?: string;
}

const CHIP_DATA_ATTR = 'data-token-raw';
const CHIP_TYPE_ATTR = 'data-token-type';
const CHIP_CLASS = 'expr-aware-chip';
const CHIP_EDIT_WRAPPER_CLASS = 'expr-aware-chip-edit-wrapper';
const CHIP_EDIT_INPUT_CLASS = 'expr-aware-chip-edit-input';
const CHIP_EDIT_ACCEPT_CLASS = 'expr-aware-chip-accept';
const CHIP_EDIT_CANCEL_CLASS = 'expr-aware-chip-cancel';

const chipContainerStyle: Partial<CSSStyleDeclaration> = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#eef1fb',
    border: '1px solid #c7d1f2',
    borderRadius: '4px',
    padding: '1px 6px',
    color: '#292a73',
    fontWeight: '600',
    fontSize: '12px',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
};

const placeholderChipStyle: Partial<CSSStyleDeclaration> = {
    ...chipContainerStyle,
    backgroundColor: '#fff4ce',
    border: '1px solid #f2d888',
    color: '#5c4813',
    fontFamily: 'monospace',
};

const applyStyle = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
    Object.assign(el.style, style);
};

const setChipDisplayContent = (chip: HTMLElement, raw: string, type: 'placeholder' | 'expression', placeholderService: PlaceholderService) => {
    if (type === 'placeholder') {
        applyStyle(chip, placeholderChipStyle);
        chip.textContent = raw;
    } else {
        applyStyle(chip, chipContainerStyle);
        const { label } = placeholderService.getExpressionDisplayInfo(raw);
        chip.textContent = `⚡ ${label}`;
    }
};

const buildChipElement = (segment: Segment, placeholderService: PlaceholderService): HTMLElement => {
    const chip = document.createElement('span');
    chip.className = CHIP_CLASS;
    chip.setAttribute(CHIP_DATA_ATTR, segment.raw);
    chip.setAttribute(CHIP_TYPE_ATTR, segment.type);
    chip.setAttribute('contenteditable', 'false');
    chip.setAttribute('title', segment.raw);
    chip.setAttribute('tabIndex', '0');
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-label', `Dynamic content: ${segment.raw}. Click to edit.`);

    setChipDisplayContent(chip, segment.raw, segment.type as 'placeholder' | 'expression', placeholderService);

    return chip;
};

const renderSegmentsIntoDom = (
    container: HTMLElement,
    segments: Segment[],
    placeholderService: PlaceholderService
) => {
    container.innerHTML = '';
    for (const segment of segments) {
        if (segment.type === 'text') {
            container.appendChild(document.createTextNode(segment.raw));
        } else {
            container.appendChild(buildChipElement(segment, placeholderService));
        }
    }
};

const domToRawValue = (container: HTMLElement): string => {
    let result = '';
    container.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent ?? '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.classList.contains(CHIP_EDIT_WRAPPER_CLASS)) {
                const input = el.querySelector(`.${CHIP_EDIT_INPUT_CLASS}`);
                result += input?.textContent ?? '';
                return;
            }
            const rawAttr = el.getAttribute(CHIP_DATA_ATTR);
            result += rawAttr !== null ? rawAttr : (el.textContent ?? '');
        }
    });
    return result;
};

const buildIconButton = (className: string, symbol: string, color: string, title: string): HTMLSpanElement => {
    const btn = document.createElement('span');
    btn.className = className;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabIndex', '0');
    btn.setAttribute('title', title);
    btn.setAttribute('aria-label', title);
    btn.textContent = symbol;
    applyStyle(btn, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        fontSize: '11px',
        fontWeight: 'bold',
        lineHeight: '1',
        borderRadius: '3px',
        cursor: 'pointer',
        color,
        backgroundColor: 'rgba(255,255,255,0.6)',
        userSelect: 'none',
    });
    return btn;
};

const ExpressionAwareTextField: React.FC<IExpressionAwareTextFieldProps> = ({
    value,
    placeholderService,
    onChange,
    readOnly,
    multiline,
    rows,
    placeholder,
    ariaLabel,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastCommittedValue = useRef<string>(value);
    const isFocused = useRef<boolean>(false);
    const isEditingChip = useRef<boolean>(false);
    const isEditable = !readOnly && !!onChange;

    useEffect(() => {
        if (!containerRef.current) { return; }
        if (isEditingChip.current) { return; }
        if (isFocused.current && value === lastCommittedValue.current) { return; }
        renderSegmentsIntoDom(containerRef.current, placeholderService.tokenize(value), placeholderService);
        lastCommittedValue.current = value;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, placeholderService]);

    const commit = useCallback(() => {
        if (!containerRef.current || !onChange) { return; }
        const rawValue = domToRawValue(containerRef.current);
        if (rawValue !== lastCommittedValue.current) {
            lastCommittedValue.current = rawValue;
            onChange(rawValue);
        }
    }, [onChange]);

    const handleFocus = useCallback(() => {
        isFocused.current = true;
    }, []);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
        const nextFocusTarget = e.relatedTarget as Node | null;
        const stillInsideContainer = !!nextFocusTarget && containerRef.current?.contains(nextFocusTarget);
        if (stillInsideContainer) { return; }
        if (isEditingChip.current) { return; }
        isFocused.current = false;
        commit();
    }, [commit]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    const restoreChipFromWrapper = useCallback((wrapper: HTMLElement, cancelled: boolean) => {
        const originalRaw = wrapper.getAttribute(CHIP_DATA_ATTR) ?? '';
        const input = wrapper.querySelector(`.${CHIP_EDIT_INPUT_CLASS}`) as HTMLElement | null;
        const editedRaw = input?.textContent ?? '';
        const newRaw = cancelled ? originalRaw : editedRaw;
        const tokenized = placeholderService.tokenize(newRaw);

        const stillSingleToken = tokenized.length === 1 && tokenized[0].type !== 'text';
        if (stillSingleToken) {
            const segment = tokenized[0];
            const chip = buildChipElement(segment, placeholderService);
            wrapper.replaceWith(chip);
        } else {
            const textNode = document.createTextNode(newRaw);
            wrapper.replaceWith(textNode);
        }
        isEditingChip.current = false;
    }, [placeholderService]);

    const settleChipEdit = useCallback((wrapper: HTMLElement, cancelled: boolean) => {
        restoreChipFromWrapper(wrapper, cancelled);
        commit();
    }, [restoreChipFromWrapper, commit]);

    // When the field loses editability from outside (e.g. the parent's own
    // "Cancel" button aborts the whole edit, so onChange becomes undefined
    // or readOnly flips to true), any chip mid-edit must be closed too — as
    // a cancel, without committing, since onChange may already be gone.
    useEffect(() => {
        if (isEditable) { return; }
        if (!isEditingChip.current || !containerRef.current) { return; }
        const wrapper = containerRef.current.querySelector(`.${CHIP_EDIT_WRAPPER_CLASS}`) as HTMLElement | null;
        if (wrapper) {
            restoreChipFromWrapper(wrapper, true);
        } else {
            isEditingChip.current = false;
        }
    }, [isEditable, restoreChipFromWrapper]);

    const enterChipEditMode = useCallback((chip: HTMLElement) => {
        const raw = chip.getAttribute(CHIP_DATA_ATTR) ?? chip.textContent ?? '';
        isEditingChip.current = true;

        const wrapper = document.createElement('span');
        wrapper.className = CHIP_EDIT_WRAPPER_CLASS;
        wrapper.setAttribute(CHIP_DATA_ATTR, raw);
        applyStyle(wrapper, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            verticalAlign: 'middle',
        });

        const input = document.createElement('span');
        input.className = CHIP_EDIT_INPUT_CLASS;
        input.setAttribute('contenteditable', 'true');
        input.textContent = raw;
        applyStyle(input, {
            border: '1px dashed #605e5c',
            borderRadius: '4px',
            padding: '1px 6px',
            fontFamily: 'monospace',
            fontSize: '12px',
            outline: 'none',
        });

        const acceptBtn = buildIconButton(CHIP_EDIT_ACCEPT_CLASS, '✓', '#107c10', 'Accept change');
        const cancelBtn = buildIconButton(CHIP_EDIT_CANCEL_CLASS, '✗', '#a4262c', 'Cancel change');

        wrapper.appendChild(input);
        wrapper.appendChild(acceptBtn);
        wrapper.appendChild(cancelBtn);
        chip.replaceWith(wrapper);

        const range = document.createRange();
        range.selectNodeContents(input);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        input.focus();

        let isCurrentlyValid = true;
        const validate = () => {
            const currentText = input.textContent ?? '';
            const tokenized = placeholderService.tokenize(currentText);
            isCurrentlyValid = tokenized.length === 1 && tokenized[0].type !== 'text';
            if (isCurrentlyValid) {
                input.style.border = '1px dashed #605e5c';
                input.style.backgroundColor = 'transparent';
                acceptBtn.style.opacity = '1';
                acceptBtn.style.cursor = 'pointer';
                acceptBtn.setAttribute('title', 'Accept change');
                acceptBtn.setAttribute('aria-label', 'Accept change');
            } else {
                input.style.border = '2px solid #a4262c';
                input.style.backgroundColor = '#fdf3f4';
                acceptBtn.style.opacity = '0.35';
                acceptBtn.style.cursor = 'not-allowed';
                acceptBtn.setAttribute('title', 'Cannot accept: this breaks the {{ }} / @{ } structure. Fix it or Cancel.');
                acceptBtn.setAttribute('aria-label', 'Cannot accept: this breaks the dynamic content structure. Fix it or Cancel.');
            }
        };
        validate();

        // Native DOM events on a contenteditable span are not always
        // consistent enough to rely on alone (input/keyup can be skipped by
        // some IME/paste paths), so a MutationObserver on the text content is
        // used as the source of truth for re-validating on every change.
        const observer = new MutationObserver(validate);
        observer.observe(input, { characterData: true, childList: true, subtree: true });

        acceptBtn.addEventListener('mousedown', (me) => {
            me.preventDefault();
            if (!isCurrentlyValid) { return; }
            observer.disconnect();
            settleChipEdit(wrapper, false);
        });
        cancelBtn.addEventListener('mousedown', (me) => {
            me.preventDefault();
            observer.disconnect();
            settleChipEdit(wrapper, true);
        });
    }, [settleChipEdit, placeholderService]);

    const findChipTarget = (e: React.SyntheticEvent): HTMLElement | null => {
        const target = e.target as HTMLElement;
        return target.closest(`.${CHIP_CLASS}`) as HTMLElement | null;
    };

    const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const chip = findChipTarget(e);
        if (chip) {
            e.preventDefault();
            enterChipEditMode(chip);
        }
    }, [enterChipEditMode]);

    const handleContainerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        const chip = findChipTarget(e);
        if (chip && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            enterChipEditMode(chip);
        }
    }, [enterChipEditMode]);

    return (
        <div
            ref={containerRef}
            role="textbox"
            aria-label={ariaLabel}
            aria-readonly={!isEditable}
            aria-multiline={multiline}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onFocus={isEditable ? handleFocus : undefined}
            onBlur={isEditable ? handleBlur : undefined}
            onPaste={isEditable ? handlePaste : undefined}
            onClick={isEditable ? handleContainerClick : undefined}
            onKeyDown={isEditable ? handleContainerKeyDown : undefined}
            data-placeholder={placeholder}
            style={{
                border: '1px solid #605e5c',
                borderRadius: 2,
                padding: '6px 8px',
                minHeight: multiline ? (rows ?? 4) * 20 : 32,
                fontFamily: multiline ? 'monospace' : undefined,
                fontSize: multiline ? 12 : 14,
                whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
                overflowX: multiline ? undefined : 'auto',
                overflowWrap: 'break-word',
                lineHeight: 1.6,
                backgroundColor: isEditable ? '#fff' : '#f5f5f5',
                cursor: isEditable ? 'text' : 'default',
                outline: 'none',
            }}
        />
    );
};

export default ExpressionAwareTextField;
